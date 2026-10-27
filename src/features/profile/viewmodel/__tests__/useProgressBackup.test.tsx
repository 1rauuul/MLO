import { act, renderHook } from '@testing-library/react-native';

import { useProgressBackup } from '@/features/profile/viewmodel/useProgressBackup';

const mockPickFile = jest.fn();
const mockSelectLessons = jest.fn();
const mockFetchGroup = jest.fn();
const mockRefreshCatalog = jest.fn(async () => true);
const mockApplyStaged = jest.fn(async () => ({ failed: [] as string[] }));
const mockSaveGroup = jest.fn(async () => {});
const mockReplaceProgress = jest.fn(async () => ({ omitted: 0 }));
const mockRefreshActiveCatalog = jest.fn();

jest.mock('expo-file-system', () => ({
  File: { pickFileAsync: (...args: unknown[]) => mockPickFile(...args) },
  Paths: { cache: 'cache' },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));
jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({ account: { id: 1 } }),
}));
jest.mock('@/features/groups/viewmodel/useActiveCatalog', () => ({
  useActiveCatalog: () => ({ refresh: mockRefreshActiveCatalog }),
}));
jest.mock('@/shared/services/data/dataMode', () => ({
  isHybrid: () => true,
}));
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => ({
    backup: { replaceProgressFromBackup: mockReplaceProgress },
    content: {
      fetchGroup: mockFetchGroup,
      refreshCatalog: mockRefreshCatalog,
      applyStagedContent: mockApplyStaged,
    },
    groups: { saveAccountGroup: mockSaveGroup },
    lessons: { selectLessons: mockSelectLessons },
  }),
}));

const backup = {
  version: 3,
  exportedAt: '2026-10-26T00:00:00.000Z',
  group: {
    code: 'ABC123',
    catalogId: 'cat-a',
    name: 'Grupo A',
    groupId: 'g1',
    teacherName: 'Docente',
  },
  moduleProgress: [],
  attempts: [],
  evaluationResults: [],
  exampleState: [],
  lastLocation: null,
};

const serverGroup = {
  code: 'ABC123',
  group: { id: 'g1', name: 'Grupo A', teacherName: 'Docente' },
  catalog: { id: 'cat-b', title: 'Curso B' },
};

describe('useProgressBackup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickFile.mockResolvedValue({
      canceled: false,
      result: { text: async () => JSON.stringify(backup) },
    });
    mockFetchGroup.mockResolvedValue(serverGroup);
    mockReplaceProgress.mockResolvedValue({ omitted: 0 });
    mockRefreshCatalog.mockResolvedValue(true);
    mockApplyStaged.mockResolvedValue({ failed: [] });
    mockSaveGroup.mockResolvedValue(undefined);
  });

  it('descarga el catálogo que devuelve el servidor si el respaldo apunta a otro', async () => {
    mockSelectLessons.mockImplementation(async (catalogId: string) =>
      catalogId === 'cat-a' ? [{ id: 'l1' }] : [],
    );
    const { result } = renderHook(() => useProgressBackup());

    await act(async () => {
      await expect(result.current.importProgress()).resolves.toBe(true);
    });

    expect(mockRefreshCatalog).toHaveBeenCalledWith('cat-b', true);
    expect(mockApplyStaged).toHaveBeenCalledWith('cat-b');
    expect(mockSaveGroup).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ catalogId: 'cat-b' }),
    );
  });

  it('no descarga si el catálogo del servidor ya tiene contenido', async () => {
    mockSelectLessons.mockResolvedValue([{ id: 'l1' }]);
    const { result } = renderHook(() => useProgressBackup());

    await act(async () => {
      await expect(result.current.importProgress()).resolves.toBe(true);
    });

    expect(mockRefreshCatalog).not.toHaveBeenCalled();
    expect(mockSaveGroup).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ catalogId: 'cat-b' }),
    );
  });
});
