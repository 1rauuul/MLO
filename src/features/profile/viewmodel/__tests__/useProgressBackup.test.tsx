import { act, renderHook } from '@testing-library/react-native';

import { useProgressBackup } from '@/features/profile/viewmodel/useProgressBackup';

const mockPickFile = jest.fn();
const mockRefreshClasses = jest.fn(async () => {});
const mockRefreshClassContent = jest.fn(async () => {});
const mockReplaceProgress = jest.fn(async () => ({ omitted: 0 }));
const mockReloadAccount = jest.fn(async () => {});
const mockJoinClass = jest.fn();
const mockLeaveClass = jest.fn();
let mockCurrentClasses: { classId: string; classCode: string }[] = [];

jest.mock('expo-file-system', () => ({
  File: { pickFileAsync: (...args: unknown[]) => mockPickFile(...args) },
  Paths: { cache: 'cache' },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));
jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({
    account: {
      id: 1,
      externalKey: '11111111-1111-4111-8111-111111111111',
      displayName: 'Ana Alumna',
    },
    reloadAccount: mockReloadAccount,
  }),
}));
jest.mock('@/features/classes/viewmodel/useClasses', () => ({
  useClasses: () => ({ classes: mockCurrentClasses, refresh: mockRefreshClasses }),
}));
jest.mock('@/shared/services/data/dataMode', () => ({
  isHybrid: () => true,
}));
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => ({
    backup: { replaceProgressFromBackup: mockReplaceProgress },
    content: {
      refreshClassContent: mockRefreshClassContent,
      joinClass: mockJoinClass,
      leaveClass: mockLeaveClass,
    },
  }),
}));

const backup = {
  version: 4,
  exportedAt: '2026-10-26T00:00:00.000Z',
  student: { externalKey: '11111111-1111-4111-8111-111111111111' },
  classes: [
    {
      classId: 'c1',
      code: 'ABC123',
      name: 'Grupo A',
      teacherName: 'Docente',
    },
  ],
  moduleProgress: [],
  attempts: [],
  evaluationResults: [],
  exampleState: [],
  lastLocation: null,
};

describe('useProgressBackup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickFile.mockResolvedValue({
      canceled: false,
      result: { text: async () => JSON.stringify(backup) },
    });
    mockReplaceProgress.mockResolvedValue({ omitted: 0 });
    mockRefreshClasses.mockResolvedValue(undefined);
    mockRefreshClassContent.mockResolvedValue(undefined);
    mockReloadAccount.mockResolvedValue(undefined);
    mockJoinClass.mockResolvedValue({});
    mockLeaveClass.mockResolvedValue(undefined);
    mockCurrentClasses = [];
  });

  it('restaura identidad y clases y sincroniza el contenido', async () => {
    const { result } = renderHook(() => useProgressBackup());

    await act(async () => {
      await expect(result.current.importProgress()).resolves.toBe(true);
    });

    expect(mockReplaceProgress).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        student: { externalKey: '11111111-1111-4111-8111-111111111111' },
        classes: [expect.objectContaining({ code: 'ABC123' })],
      }),
    );
    expect(mockReloadAccount).toHaveBeenCalled();
    expect(mockRefreshClasses).toHaveBeenCalled();
    expect(mockRefreshClassContent).toHaveBeenCalled();
  });

  it('migra la identidad temporal a la del respaldo y evita duplicados', async () => {
    const restoredKey = '22222222-2222-4222-8222-222222222222';
    mockCurrentClasses = [{ classId: 'old', classCode: 'OLD234' }];
    mockPickFile.mockResolvedValue({
      canceled: false,
      result: {
        text: async () =>
          JSON.stringify({
            ...backup,
            student: { externalKey: restoredKey },
          }),
      },
    });
    const { result } = renderHook(() => useProgressBackup());

    await act(async () => {
      await expect(result.current.importProgress()).resolves.toBe(true);
    });

    expect(mockJoinClass).toHaveBeenCalledWith('ABC123', restoredKey, 'Ana Alumna');
    expect(mockLeaveClass).toHaveBeenCalledWith(
      'OLD234',
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('importa el progreso aunque no haya clases', async () => {
    mockPickFile.mockResolvedValue({
      canceled: false,
      result: {
        text: async () =>
          JSON.stringify({ ...backup, student: null, classes: [] }),
      },
    });
    const { result } = renderHook(() => useProgressBackup());

    await act(async () => {
      await expect(result.current.importProgress()).resolves.toBe(true);
    });

    expect(mockReplaceProgress).toHaveBeenCalled();
    expect(mockRefreshClassContent).not.toHaveBeenCalled();
  });
});
