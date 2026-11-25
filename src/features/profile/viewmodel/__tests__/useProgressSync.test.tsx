import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import type { ProgressBackup } from '@/features/profile/model/backup.logic';
import {
  ProgressSyncProvider,
  useProgressSync,
} from '@/features/profile/viewmodel/useProgressSync';
import { HttpError, NetworkError } from '@/shared/services/http/client';

const mockAccount = {
  id: 7,
  username: 'ana',
  externalKey: 'key',
  displayName: 'Ana',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const mockRepos = {
  backup: { selectProgressBackup: jest.fn() },
  remote: { select: jest.fn(), updateSync: jest.fn() },
  classes: {},
  courses: {},
  content: {},
};

const mockRestore = jest.fn();
const mockUpload = jest.fn();
const mockFingerprint = jest.fn();
const mockHasData = jest.fn();

jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({ account: mockAccount, needsRemoteLink: false }),
}));
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => mockRepos,
}));
jest.mock('@/features/auth/model/accountRestore', () => ({
  restoreAccountState: (...args: unknown[]) => mockRestore(...args),
  uploadAccountProgress: (...args: unknown[]) => mockUpload(...args),
}));
jest.mock('@/features/profile/model/progressFingerprint', () => ({
  progressFingerprint: (...args: unknown[]) => mockFingerprint(...args),
  progressHasData: (...args: unknown[]) => mockHasData(...args),
}));

const snapshot: ProgressBackup = {
  version: 5,
  exportedAt: '2026-01-01T00:00:00.000Z',
  student: { externalKey: 'key' },
  classes: [],
  moduleProgress: [],
  attempts: [],
  evaluationResults: [],
  exampleState: [],
  lastLocation: null,
};

const session = {
  accountId: 7,
  token: 'tok',
  expiresAt: '2026-12-24T00:00:00.000Z',
  lastUploadedHash: 'old',
  lastSyncedAt: null as string | null,
  pendingRestore: false,
  forceRemote: false,
  createdAt: '2026-11-24T00:00:00.000Z',
};

function wrapper({ children }: { children: ReactNode }) {
  return <ProgressSyncProvider>{children}</ProgressSyncProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({
    remove: jest.fn(),
  } as never);
  Object.defineProperty(AppState, 'currentState', {
    value: 'active',
    configurable: true,
  });
  mockRepos.backup.selectProgressBackup.mockResolvedValue(snapshot);
  mockRepos.remote.select.mockResolvedValue(session);
  mockFingerprint.mockResolvedValue('new');
  mockHasData.mockReturnValue(true);
  mockUpload.mockResolvedValue('2026-01-02T00:00:00.000Z');
  mockRestore.mockResolvedValue('restored');
});

describe('ProgressSyncProvider', () => {
  it('sube cuando la huella local cambió', async () => {
    const { result } = renderHook(() => useProgressSync(), { wrapper });

    await waitFor(() => expect(mockUpload).toHaveBeenCalled());
    expect(result.current.status).toBe('synced');
    expect(result.current.isLinked).toBe(true);
  });

  it('no sube un progreso vacío sin huella previa', async () => {
    mockRepos.remote.select.mockResolvedValue({
      ...session,
      lastUploadedHash: null,
    });
    mockFingerprint.mockResolvedValue('empty');
    mockHasData.mockReturnValue(false);

    const { result } = renderHook(() => useProgressSync(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('synced'));
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('reintenta la restauración pendiente antes de subir', async () => {
    mockRepos.remote.select.mockResolvedValue({
      ...session,
      pendingRestore: true,
    });

    const { result } = renderHook(() => useProgressSync(), { wrapper });

    await waitFor(() => expect(mockRestore).toHaveBeenCalled());
    expect(mockUpload).not.toHaveBeenCalled();
    expect(result.current.status).toBe('synced');
  });

  it('marca la sesión caducada con 401', async () => {
    mockUpload.mockRejectedValue(new HttpError(401, ''));

    const { result } = renderHook(() => useProgressSync(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('session_expired'));
    expect(result.current.error).toContain('sesión');
  });

  it('marca sin conexión cuando falla la red', async () => {
    mockUpload.mockRejectedValue(new NetworkError());

    const { result } = renderHook(() => useProgressSync(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('offline'));
    expect(result.current.error).toBe('Sin conexión.');
  });

  it('expone syncNow para el reintento manual', async () => {
    const { result } = renderHook(() => useProgressSync(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('synced'));

    await act(async () => {
      await result.current.syncNow();
    });

    expect(mockUpload).toHaveBeenCalled();
  });
});
