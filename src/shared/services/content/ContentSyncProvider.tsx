import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { refreshCatalogs } from '@/shared/services/content/remoteContent';
import { isHybrid } from '@/shared/services/data/dataMode';
import { apiBaseUrl, http } from '@/shared/services/http/client';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Descarga contenido en segundo plano. El arranque no espera a la red: solo
 * deja lecciones validadas en el área de espera para el próximo arranque.
 */
export function ContentSyncProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const lastRefreshRef = useRef(0);

  const run = useCallback(() => {
    if (!isHybrid()) {
      return;
    }
    if (!apiBaseUrl()) {
      if (__DEV__) {
        console.warn('[content] falta EXPO_PUBLIC_API_URL; no se sincroniza');
      }
      return;
    }
    const now = Date.now();
    if (lastRefreshRef.current !== 0 && now - lastRefreshRef.current < REFRESH_INTERVAL_MS) {
      return;
    }
    lastRefreshRef.current = now;
    void refreshCatalogs(db, http).catch(caught => {
      if (__DEV__) {
        console.warn('[content] no se pudo sincronizar', caught);
      }
    });
  }, [db]);

  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => {
    if (!isHybrid()) {
      return;
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        run();
      }
    });
    return () => subscription.remove();
  }, [run]);

  return <>{children}</>;
}
