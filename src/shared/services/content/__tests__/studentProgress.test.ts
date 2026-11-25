import type { ProgressBackup } from '@/features/profile/model/backup.logic';
import type { ClassPreviewData } from '@/shared/services/content/remote/validateClassRelease';
import {
  fetchRemoteClasses,
  fetchRemoteProgress,
  uploadRemoteProgress,
} from '@/shared/services/content/studentProgress';

const mockGet = jest.fn();
const mockPut = jest.fn();

jest.mock('@/shared/services/http/client', () => {
  const actual = jest.requireActual('@/shared/services/http/client');
  return {
    ...actual,
    httpAuth: {
      get: (...args: unknown[]) => mockGet(...args),
      put: (...args: unknown[]) => mockPut(...args),
    },
  };
});

const snapshot: ProgressBackup = {
  version: 5,
  exportedAt: '2026-01-01T00:00:00.000Z',
  student: { externalKey: '11111111-1111-4111-8111-111111111111' },
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
});

describe('studentProgress', () => {
  it('descarga y valida el progreso remoto con Bearer', async () => {
    mockGet.mockResolvedValue({
      progress: snapshot,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const remote = await fetchRemoteProgress();

    expect(mockGet).toHaveBeenCalledWith('/students/me/progress');
    expect(remote?.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(remote?.progress.version).toBe(5);
    expect(remote?.progress.student?.externalKey).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('acepta el progreso como texto de un servidor antiguo', async () => {
    mockGet.mockResolvedValue({
      progress: JSON.stringify(snapshot),
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const remote = await fetchRemoteProgress();
    expect(remote?.progress.version).toBe(5);
  });

  it('sube el progreso con el nombre del alumno', async () => {
    mockPut.mockResolvedValue({ updatedAt: '2026-01-02T00:00:00.000Z' });

    await expect(uploadRemoteProgress('Ana', snapshot)).resolves.toBe(
      '2026-01-02T00:00:00.000Z',
    );
    expect(mockPut).toHaveBeenCalledWith('/students/me/progress', {
      studentName: 'Ana',
      progress: snapshot,
    });
  });

  it('descarga y valida las clases del alumno', async () => {
    mockGet.mockResolvedValue({
      classes: [{ code: 'ABC123', joinedAt: '2026-01-01T00:00:00.000Z', preview }],
    });

    await expect(fetchRemoteClasses()).resolves.toEqual([
      { code: 'ABC123', joinedAt: '2026-01-01T00:00:00.000Z', preview },
    ]);
    expect(mockGet).toHaveBeenCalledWith('/students/me/classes');
  });
});
