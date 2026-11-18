import { act, renderHook } from '@testing-library/react-native';

import type { ProgressBackup } from '@/features/profile/model/backup.logic';
import type { ClassPreviewData } from '@/shared/services/content/remote/validateClassRelease';
import { useProgressSync } from '@/features/profile/viewmodel/useProgressSync';

const mockSelectProgressBackup = jest.fn();
const mockReplaceProgressFromBackup = jest.fn(async () => ({ omitted: 0 }));
const mockSaveAccountClass = jest.fn(async () => {});
const mockRefreshClassContent = jest.fn(async () => {});
const mockRefreshClasses = jest.fn(async () => {});
const mockRefreshCourses = jest.fn(async () => {});
const mockReloadAccount = jest.fn(async () => {});
const mockFetchProgress = jest.fn();
const mockFetchClasses = jest.fn();
const mockUploadProgress = jest.fn();

jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({
    account: { id: 7, externalKey: 'key', displayName: 'Ana' },
    reloadAccount: mockReloadAccount,
  }),
}));
jest.mock('@/features/classes/viewmodel/useClasses', () => ({
  useClasses: () => ({ refresh: mockRefreshClasses }),
}));
jest.mock('@/features/modules/viewmodel/useCourses', () => ({
  useCourses: () => ({ refresh: mockRefreshCourses }),
}));
jest.mock('@/shared/services/data/dataMode', () => ({ isHybrid: () => true }));
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => ({
    backup: {
      selectProgressBackup: mockSelectProgressBackup,
      replaceProgressFromBackup: mockReplaceProgressFromBackup,
    },
    content: { refreshClassContent: mockRefreshClassContent },
    classes: { saveAccountClass: mockSaveAccountClass },
  }),
}));
jest.mock('@/shared/services/content/studentProgress', () => ({
  fetchRemoteProgress: (...args: unknown[]) => mockFetchProgress(...args),
  fetchRemoteClasses: (...args: unknown[]) => mockFetchClasses(...args),
  uploadRemoteProgress: (...args: unknown[]) => mockUploadProgress(...args),
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

const preview: ClassPreviewData = {
  schemaVersion: 2,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profe' },
  course: { catalogId: 'base', title: 'Curso' },
  published: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSelectProgressBackup.mockResolvedValue(snapshot);
  mockUploadProgress.mockResolvedValue('2026-01-02T00:00:00.000Z');
  mockFetchClasses.mockResolvedValue([]);
});

describe('useProgressSync', () => {
  it('guarda el progreso local en la nube', async () => {
    const { result } = renderHook(() => useProgressSync());

    await act(async () => {
      await result.current.saveProgress();
    });

    expect(mockUploadProgress).toHaveBeenCalledWith('key', 'Ana', snapshot);
    expect(result.current.message).toContain('Progreso guardado');
    expect(result.current.error).toBeNull();
  });

  it('sincroniza el progreso y reconstruye las clases', async () => {
    mockFetchProgress.mockResolvedValue({
      progress: snapshot,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    mockFetchClasses.mockResolvedValue([
      { code: 'ABC123', joinedAt: '2026-01-01T00:00:00.000Z', preview },
    ]);

    const { result } = renderHook(() => useProgressSync());

    await act(async () => {
      await result.current.syncProgress();
    });

    expect(mockReplaceProgressFromBackup).toHaveBeenCalledWith(7, snapshot);
    expect(mockSaveAccountClass).toHaveBeenCalledWith(7, 'ABC123', preview, 'base', 'Curso');
    expect(mockRefreshClassContent).toHaveBeenCalled();
    expect(result.current.message).toBe('Progreso sincronizado.');
  });

  it('avisa cuando no hay progreso guardado en la nube', async () => {
    mockFetchProgress.mockResolvedValue(null);
    const { result } = renderHook(() => useProgressSync());

    await act(async () => {
      await result.current.syncProgress();
    });

    expect(result.current.message).toBe('No hay progreso guardado en la nube.');
    expect(mockReplaceProgressFromBackup).not.toHaveBeenCalled();
  });
});
