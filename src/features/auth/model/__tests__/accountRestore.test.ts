import type { ProgressBackup } from '@/features/profile/model/backup.logic';
import {
  restoreAccountState,
  uploadAccountProgress,
} from '@/features/auth/model/accountRestore';
import type { Repositories } from '@/shared/services/data/DataProvider';
import type { Account } from '@/shared/model/entities';
import type { ClassPreviewData } from '@/shared/services/content/remote/validateClassRelease';

jest.mock('@/features/profile/model/progressFingerprint', () => {
  const actual = jest.requireActual(
    '@/features/profile/model/progressFingerprint',
  );
  return {
    ...actual,
    progressFingerprint: jest.fn(async (backup: ProgressBackup) =>
      JSON.stringify(backup.moduleProgress),
    ),
  };
});

const mockFetchClasses = jest.fn();
const mockFetchProgress = jest.fn();
const mockUploadProgress = jest.fn();

jest.mock('@/shared/services/content/studentProgress', () => ({
  fetchRemoteClasses: (...args: unknown[]) => mockFetchClasses(...args),
  fetchRemoteProgress: (...args: unknown[]) => mockFetchProgress(...args),
  uploadRemoteProgress: (...args: unknown[]) => mockUploadProgress(...args),
}));

const account: Account = {
  id: 7,
  username: 'valentina',
  externalKey: '11111111-1111-4111-8111-111111111111',
  email: 'valentina@escuela.mx',
  displayName: 'Valentina Ríos',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const empty: ProgressBackup = {
  version: 5,
  exportedAt: '2026-01-01T00:00:00.000Z',
  student: { externalKey: account.externalKey },
  classes: [],
  moduleProgress: [],
  attempts: [],
  evaluationResults: [],
  exampleState: [],
  lastLocation: null,
};

const withProgress: ProgressBackup = {
  ...empty,
  moduleProgress: [
    {
      lessonId: 'l1',
      completed: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

const preview: ClassPreviewData = {
  schemaVersion: 2,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profe' },
  course: { catalogId: 'curso-1', title: 'Curso' },
  published: null,
};

function makeRepos() {
  return {
    classes: {
      saveAccountClass: jest.fn(async () => {}),
      selectAccountClasses: jest.fn(async () => []),
      removeAccountClass: jest.fn(async () => {}),
    },
    courses: {
      refreshCourseList: jest.fn(async () => false),
      applyStoredContent: jest.fn(async () => ({})),
    },
    content: { refreshClassContent: jest.fn(async () => {}) },
    backup: {
      selectProgressBackup: jest.fn(),
      replaceProgressFromBackup: jest.fn(async () => ({ omitted: 0 })),
    },
    remote: {
      select: jest.fn(),
      updateSync: jest.fn(async () => {}),
    },
  } as unknown as Repositories;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchClasses.mockResolvedValue([
    { code: 'ABC123', joinedAt: '2026-01-01T00:00:00.000Z', preview },
  ]);
});

describe('restoreAccountState', () => {
  it('deja subir cuando el progreso local tiene cambios pendientes', async () => {
    const repos = makeRepos();
    (repos.backup.selectProgressBackup as jest.Mock).mockResolvedValue(withProgress);
    (repos.remote.select as jest.Mock).mockResolvedValue({
      lastUploadedHash: 'otro',
    });

    await expect(restoreAccountState(repos, account)).resolves.toBe('upload');

    expect(mockFetchProgress).not.toHaveBeenCalled();
    expect(repos.classes.saveAccountClass).toHaveBeenCalledWith(
      7,
      'ABC123',
      preview,
      'curso-1',
      'Curso',
    );
    expect(repos.courses.refreshCourseList).toHaveBeenCalled();
    expect(repos.content.refreshClassContent).toHaveBeenCalled();
    expect(repos.courses.applyStoredContent).toHaveBeenCalled();
  });

  it('aplica el progreso remoto sin tocar clases ni identidad', async () => {
    const repos = makeRepos();
    (repos.backup.selectProgressBackup as jest.Mock)
      .mockResolvedValueOnce(empty)
      .mockResolvedValueOnce(withProgress);
    (repos.remote.select as jest.Mock).mockResolvedValue(null);
    mockFetchProgress.mockResolvedValue({
      progress: withProgress,
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    await expect(restoreAccountState(repos, account)).resolves.toBe('restored');

    expect(repos.backup.replaceProgressFromBackup).toHaveBeenCalledWith(7, {
      ...withProgress,
      student: null,
      classes: [],
    });
    expect(repos.remote.updateSync).toHaveBeenCalledWith(7, {
      lastUploadedHash: JSON.stringify(withProgress.moduleProgress),
      lastSyncedAt: '2026-01-02T00:00:00.000Z',
      pendingRestore: false,
      forceRemote: false,
    });
  });

  it('fuerza remoto: limpia el progreso local si la nube está vacía', async () => {
    const repos = makeRepos();
    (repos.backup.selectProgressBackup as jest.Mock)
      .mockResolvedValueOnce(withProgress)
      .mockResolvedValueOnce(empty);
    (repos.remote.select as jest.Mock).mockResolvedValue(null);
    mockFetchProgress.mockResolvedValue(null);

    await expect(
      restoreAccountState(repos, account, { forceRemote: true }),
    ).resolves.toBe('none');

    expect(repos.backup.replaceProgressFromBackup).toHaveBeenCalledWith(7, {
      version: 5,
      exportedAt: expect.any(String),
      student: null,
      classes: [],
      moduleProgress: [],
      attempts: [],
      evaluationResults: [],
      exampleState: [],
      lastLocation: null,
    });
    expect(repos.remote.updateSync).toHaveBeenCalledWith(7, {
      lastUploadedHash: '[]',
      lastSyncedAt: expect.any(String),
      pendingRestore: false,
      forceRemote: false,
    });
  });

  it('desactiva las clases locales que ya no están en la nube', async () => {
    const repos = makeRepos();
    (repos.classes.selectAccountClasses as jest.Mock).mockResolvedValue([
      {
        classId: 'c1',
        classCode: 'ABC123',
        className: 'Grupo A',
        teacherName: 'Profe',
        version: 0,
        joinedAt: '2026-01-01T00:00:00.000Z',
        courseCatalogId: 'curso-1',
      },
      {
        classId: 'c2',
        classCode: 'OLD999',
        className: 'Grupo viejo',
        teacherName: 'Profe',
        version: 0,
        joinedAt: '2026-01-01T00:00:00.000Z',
        courseCatalogId: 'curso-2',
      },
    ]);
    (repos.backup.selectProgressBackup as jest.Mock).mockResolvedValue(empty);
    (repos.remote.select as jest.Mock).mockResolvedValue({
      lastUploadedHash: '[]',
    });
    mockFetchProgress.mockResolvedValue(null);

    await restoreAccountState(repos, account);

    expect(repos.classes.removeAccountClass).toHaveBeenCalledWith(7, 'c2');
    expect(repos.classes.removeAccountClass).not.toHaveBeenCalledWith(7, 'c1');
  });

  it('si falla la descarga de clases no toca el progreso', async () => {
    const repos = makeRepos();
    mockFetchClasses.mockRejectedValue(new Error('sin red'));

    await expect(restoreAccountState(repos, account)).rejects.toThrow('sin red');
    expect(repos.backup.replaceProgressFromBackup).not.toHaveBeenCalled();
    expect(mockFetchProgress).not.toHaveBeenCalled();
  });
});

describe('uploadAccountProgress', () => {
  it('sube el snapshot y guarda la huella', async () => {
    const repos = makeRepos();
    (repos.backup.selectProgressBackup as jest.Mock).mockResolvedValue(withProgress);
    mockUploadProgress.mockResolvedValue('2026-01-03T00:00:00.000Z');

    await expect(uploadAccountProgress(repos, account)).resolves.toBe(
      '2026-01-03T00:00:00.000Z',
    );
    expect(mockUploadProgress).toHaveBeenCalledWith(
      'Valentina Ríos',
      withProgress,
    );
    expect(repos.remote.updateSync).toHaveBeenCalledWith(7, {
      lastUploadedHash: JSON.stringify(withProgress.moduleProgress),
      lastSyncedAt: '2026-01-03T00:00:00.000Z',
      pendingRestore: false,
      forceRemote: false,
    });
  });
});
