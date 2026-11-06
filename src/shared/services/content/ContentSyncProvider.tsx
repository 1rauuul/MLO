import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { stageClassContent } from '@/shared/services/content/classSync';
import { refreshCourseList } from '@/shared/services/content/coursesV3';
import { refreshCatalogs } from '@/shared/services/content/remoteContent';
import {
  applyPendingContent,
  hasPendingContent,
} from '@/shared/services/content/remote/applyStagedContent';
import { isHybrid } from '@/shared/services/data/dataMode';
import { apiBaseUrl, http, httpV3 } from '@/shared/services/http/client';
import {
  isContentUpdatesBlocked,
  useContentUpdatesBlocked,
} from '@/shared/hooks/useContentUpdatesGate';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const UPDATED_NOTICE_MS = 4000;

export interface ContentSyncValue {
  checking: boolean;
  updateAvailable: boolean;
  applying: boolean;
  updated: boolean;
  blocked: boolean;
  checkNow: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
}

const ContentSyncContext = createContext<ContentSyncValue | null>(null);

const noSync: ContentSyncValue = {
  checking: false,
  updateAvailable: false,
  applying: false,
  updated: false,
  blocked: false,
  checkNow: async () => {},
  applyUpdate: async () => {},
  dismissUpdate: () => {},
};

export function useContentSync(): ContentSyncValue {
  return useContext(ContentSyncContext) ?? noSync;
}

/**
 * Comprueba `version`/`hash` al abrir y al volver a primer plano, cada hora con
 * la app activa y a petición manual. Sin SSE ni WebSocket (DEC-09).
 */
export function ContentSyncProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const blocked = useContentUpdatesBlocked();
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [applying, setApplying] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [active, setActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );
  const checkRef = useRef<Promise<void> | null>(null);
  const applyingRef = useRef(false);
  const pendingApplyRef = useRef(false);

  const detect = useCallback(async () => {
    let changed = await hasPendingContent(db).catch(() => false);
    try {
      changed = (await refreshCatalogs(db, http)) || changed;
    } catch (caught) {
      if (__DEV__) {
        console.warn('[content] no se pudo comprobar el catálogo base', caught);
      }
    }
    try {
      changed = (await refreshCourseList(db, httpV3)) || changed;
    } catch (caught) {
      if (__DEV__) {
        console.warn('[content] no se pudo comprobar la lista de cursos', caught);
      }
    }
    try {
      const classes = await stageClassContent(db, httpV3);
      changed = classes.changed || changed;
    } catch (caught) {
      if (__DEV__) {
        console.warn('[content] no se pudo comprobar los grupos', caught);
      }
    }
    return changed;
  }, [db]);

  const checkNow = useCallback(async () => {
    if (!isHybrid()) {
      return;
    }
    if (!apiBaseUrl()) {
      if (__DEV__) {
        console.warn('[content] falta EXPO_PUBLIC_API_URL; no se sincroniza');
      }
      return;
    }
    if (checkRef.current) {
      return checkRef.current;
    }
    const task = (async () => {
      setChecking(true);
      try {
        if (await detect()) {
          setUpdateAvailable(true);
        }
      } catch (caught) {
        if (__DEV__) {
          console.warn('[content] no se pudo sincronizar', caught);
        }
      } finally {
        setChecking(false);
      }
    })();
    checkRef.current = task;
    try {
      await task;
    } finally {
      checkRef.current = null;
    }
  }, [detect]);

  const applyUpdate = useCallback(async () => {
    if (applyingRef.current) {
      return;
    }
    if (isContentUpdatesBlocked()) {
      pendingApplyRef.current = true;
      return;
    }
    applyingRef.current = true;
    setApplying(true);
    try {
      const result = await applyPendingContent(db);
      if (result.failed.length === 0) {
        pendingApplyRef.current = false;
        setUpdateAvailable(false);
        setUpdated(true);
      } else if (__DEV__) {
        console.warn('[content] actualización incompleta', result.failed);
      }
    } catch (caught) {
      if (__DEV__) {
        console.warn('[content] no se pudo aplicar el contenido', caught);
      }
    } finally {
      applyingRef.current = false;
      setApplying(false);
    }
  }, [db]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    void checkNow();
  }, [checkNow]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      const nextActive = next === 'active';
      setActive(nextActive);
      if (nextActive) {
        void checkNow();
      }
    });
    return () => subscription.remove();
  }, [checkNow]);

  useEffect(() => {
    if (!active || !isHybrid()) {
      return;
    }
    const timer = setInterval(() => {
      void checkNow();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, checkNow]);

  useEffect(() => {
    if (!blocked && pendingApplyRef.current) {
      pendingApplyRef.current = false;
      void applyUpdate();
    }
  }, [blocked, applyUpdate]);

  useEffect(() => {
    if (!updated) {
      return;
    }
    const timer = setTimeout(() => setUpdated(false), UPDATED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [updated]);

  const value = useMemo<ContentSyncValue>(
    () => ({
      checking,
      updateAvailable,
      applying,
      updated,
      blocked,
      checkNow,
      applyUpdate,
      dismissUpdate,
    }),
    [checking, updateAvailable, applying, updated, blocked, checkNow, applyUpdate, dismissUpdate],
  );

  return <ContentSyncContext.Provider value={value}>{children}</ContentSyncContext.Provider>;
}
