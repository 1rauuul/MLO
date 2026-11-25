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

import {
  restoreAccountState,
  uploadAccountProgress,
} from '@/features/auth/model/accountRestore';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import {
  progressFingerprint,
  progressHasData,
} from '@/features/profile/model/progressFingerprint';
import { useRepositories } from '@/shared/services/data/DataProvider';
import {
  ConfigError,
  HttpError,
  NetworkError,
} from '@/shared/services/http/client';

const SYNC_INTERVAL_MS = 60_000;

export type ProgressSyncStatus =
  | 'unlinked'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'session_expired'
  | 'error';

export interface ProgressSyncValue {
  status: ProgressSyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  isSyncing: boolean;
  isLinked: boolean;
  syncNow: () => Promise<void>;
}

const ProgressSyncContext = createContext<ProgressSyncValue | null>(null);

const noSync: ProgressSyncValue = {
  status: 'unlinked',
  lastSyncedAt: null,
  error: null,
  isSyncing: false,
  isLinked: false,
  syncNow: async () => {},
};

export function useProgressSync(): ProgressSyncValue {
  return useContext(ProgressSyncContext) ?? noSync;
}

function statusForError(error: unknown): {
  status: ProgressSyncStatus;
  message: string;
} {
  if (error instanceof HttpError && error.status === 401) {
    return {
      status: 'session_expired',
      message: 'Tu sesión caducó. Vuelve a iniciar sesión.',
    };
  }
  if (error instanceof NetworkError || error instanceof ConfigError) {
    return { status: 'offline', message: 'Sin conexión.' };
  }
  return { status: 'error', message: 'No se pudo sincronizar el progreso.' };
}

/**
 * Sube el progreso cuando cambia y reintenta la restauración pendiente.
 * La copia local sigue siendo la de trabajo; esto solo la replica en la nube.
 */
export function ProgressSyncProvider({ children }: { children: ReactNode }) {
  const { account, needsRemoteLink } = useAuth();
  const repos = useRepositories();
  const { backup, remote } = repos;
  const [status, setStatus] = useState<ProgressSyncStatus>('unlinked');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const runningRef = useRef(false);
  const expiredRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const refreshSessionState = useCallback(async () => {
    if (!account) {
      setStatus('unlinked');
      setLastSyncedAt(null);
      return null;
    }
    const session = await remote.select(account.id);
    setLastSyncedAt(session?.lastSyncedAt ?? null);
    if (!session) {
      setStatus('unlinked');
    } else if (!session.token) {
      setStatus('session_expired');
    }
    return session;
  }, [account, remote]);

  const syncNow = useCallback(async () => {
    if (!account || needsRemoteLink || runningRef.current || expiredRef.current) {
      return;
    }
    const session = await remote.select(account.id);
    if (!session) {
      setStatus('unlinked');
      return;
    }
    if (!session.token) {
      setStatus('session_expired');
      return;
    }

    runningRef.current = true;
    setIsSyncing(true);
    setStatus('syncing');
    setError(null);
    try {
      if (session.pendingRestore) {
        const action = await restoreAccountState(repos, account, {
          forceRemote: session.forceRemote,
        });
        if (action === 'upload') {
          await uploadAccountProgress(repos, account);
        }
      } else {
        const snapshot = await backup.selectProgressBackup(account.id);
        const fingerprint = await progressFingerprint(snapshot);
        // Un equipo nuevo no debe subir su progreso vacío sobre la nube.
        const shouldUpload =
          fingerprint !== session.lastUploadedHash &&
          (progressHasData(snapshot) || Boolean(session.lastUploadedHash));
        if (shouldUpload) {
          await uploadAccountProgress(repos, account);
        }
      }
      const updated = await refreshSessionState();
      if (mountedRef.current) {
        setStatus('synced');
        setLastSyncedAt(updated?.lastSyncedAt ?? new Date().toISOString());
      }
    } catch (caught) {
      const mapped = statusForError(caught);
      if (mapped.status === 'session_expired') {
        expiredRef.current = true;
      }
      if (mountedRef.current) {
        setStatus(mapped.status);
        setError(mapped.message);
      }
    } finally {
      runningRef.current = false;
      if (mountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [account, backup, needsRemoteLink, refreshSessionState, remote, repos]);

  const reload = useCallback(async () => {
    await refreshSessionState();
    await syncNow();
  }, [refreshSessionState, syncNow]);

  useEffect(() => {
    expiredRef.current = false;
    if (account && !needsRemoteLink) {
      void reload();
    } else {
      setStatus('unlinked');
      setLastSyncedAt(null);
      setError(null);
    }
    // `reload` cambia con la cuenta; no debe reiniciar por cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id, needsRemoteLink]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active' || next === 'background') {
        void syncNow();
      }
    });
    return () => subscription.remove();
  }, [syncNow]);

  useEffect(() => {
    if (!account || needsRemoteLink) {
      return;
    }
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') {
        void syncNow();
      }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [account, needsRemoteLink, syncNow]);

  const value = useMemo<ProgressSyncValue>(
    () => ({
      status,
      lastSyncedAt,
      error,
      isSyncing,
      isLinked: Boolean(account && !needsRemoteLink),
      syncNow,
    }),
    [
      account,
      error,
      isSyncing,
      lastSyncedAt,
      needsRemoteLink,
      status,
      syncNow,
    ],
  );

  return (
    <ProgressSyncContext.Provider value={value}>
      {children}
    </ProgressSyncContext.Provider>
  );
}
