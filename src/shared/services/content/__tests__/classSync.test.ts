import type { SQLiteDatabase } from 'expo-sqlite';

import type { HttpClient } from '@/shared/services/http/client';
import { HttpError } from '@/shared/services/http/client';

import {
  archiveClassCache,
  selectClassMemberships,
  selectClassSyncState,
} from '@/features/classes/model/classRepository';
import { applyV3GroupRelease } from '@/shared/services/content/applyV3Content';
import { fetchGroupRelease } from '@/shared/services/content/coursesV3';
import {
  applyStagedClassReleases,
  refreshClassContent,
  refreshClassRelease,
  stageClassRelease,
} from '@/shared/services/content/classSync';

jest.mock('@/features/classes/model/classRepository', () => ({
  selectClassMemberships: jest.fn(),
  selectClassSyncState: jest.fn(),
  archiveClassCache: jest.fn(async () => {}),
}));
jest.mock('@/shared/services/content/applyV3Content', () => ({
  applyV3GroupRelease: jest.fn(async () => {}),
}));
jest.mock('@/shared/services/content/coursesV3', () => ({
  fetchGroupRelease: jest.fn(),
  parseGroupRelease: jest.requireActual('@/shared/services/content/coursesV3').parseGroupRelease,
}));

const db = {} as SQLiteDatabase;
const client = { get: jest.fn(), post: jest.fn(), delete: jest.fn() } as unknown as HttpClient;

const release = {
  schemaVersion: 3 as const,
  kind: 'group' as const,
  catalogId: 'demo',
  groupId: 'class-demo',
  releaseId: 'class-demo-1',
  version: 1,
  publishedAt: '2026-11-06T00:00:00.000Z',
  hash: 'd43b424cc358ee1665a88d2d4bfb71d0f99a76816a7017a969dfc1c238e2cac3',
  courseRef: { version: 1, hash: 'course-hash' },
  group: { name: 'Grupo A', visibility: 'published' as const },
  units: [],
  topics: [],
  lessons: [],
  evaluations: [],
  questions: [],
  exercises: [],
  examples: [],
  additions: [],
  references: [],
  notices: [],
};

const mockFetch = jest.mocked(fetchGroupRelease);
const mockApply = jest.mocked(applyV3GroupRelease);
const mockState = jest.mocked(selectClassSyncState);
const mockArchive = jest.mocked(archiveClassCache);
const mockMemberships = jest.mocked(selectClassMemberships);

beforeEach(() => {
  jest.clearAllMocks();
  mockState.mockResolvedValue(null);
  mockFetch.mockResolvedValue(release);
});

describe('refreshClassRelease v3', () => {
  it('descarga y aplica el release de grupo', async () => {
    await expect(refreshClassRelease(db, client, 'class-demo', 'ABC123', 'key-1', 'demo')).resolves.toBe(
      true,
    );

    expect(mockFetch).toHaveBeenCalledWith(client, 'ABC123', 'key-1', 'demo');
    expect(mockApply).toHaveBeenCalledWith(db, release, 'class-demo');
  });

  it('no reaplica si el hash y el grupo siguen vigentes', async () => {
    mockState.mockResolvedValue({
      version: 1,
      hash: release.hash,
      archived: 0,
      applied_hash: release.hash,
      course_catalog_id: 'demo',
    });

    await expect(refreshClassRelease(db, client, 'class-demo', 'ABC123', 'key-1', 'demo')).resolves.toBe(
      false,
    );

    expect(mockApply).not.toHaveBeenCalled();
  });

  it('un 404 con release v3 previo archiva el grupo sin tocarlo', async () => {
    mockState.mockResolvedValue({
      version: 1,
      hash: release.hash,
      archived: 0,
      applied_hash: release.hash,
      course_catalog_id: 'demo',
    });
    mockFetch.mockRejectedValue(new HttpError(404, ''));

    await expect(refreshClassRelease(db, client, 'class-demo', 'ABC123', 'key-1', 'demo')).resolves.toBe(
      false,
    );

    expect(mockArchive).toHaveBeenCalledWith(db, 'class-demo');
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('un 404 sin release v3 conserva la caché legacy v2', async () => {
    mockState.mockResolvedValue({
      version: 2,
      hash: 'hash-v2',
      archived: 0,
      applied_hash: null,
      course_catalog_id: 'base',
    });
    mockFetch.mockRejectedValue(new HttpError(404, ''));

    await expect(refreshClassRelease(db, client, 'class-demo', 'ABC123', 'key-1', 'base')).resolves.toBe(
      false,
    );

    expect(mockArchive).not.toHaveBeenCalled();
  });

  it('un error de red conserva la copia anterior', async () => {
    mockFetch.mockRejectedValue(new Error('sin red'));

    await expect(
      refreshClassRelease(db, client, 'class-demo', 'ABC123', 'key-1', 'demo'),
    ).rejects.toThrow('sin red');
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockArchive).not.toHaveBeenCalled();
  });
});

describe('refreshClassContent', () => {
  it('sincroniza cada membresía activa sin detenerse por un fallo', async () => {
    mockMemberships.mockResolvedValue([
      {
        accountId: 1,
        studentKey: 'key-1',
        classId: 'class-demo',
        classCode: 'ABC123',
        courseCatalogId: 'base',
      },
      {
        accountId: 1,
        studentKey: 'key-1',
        classId: 'class-2',
        classCode: 'DEF456',
        courseCatalogId: 'base',
      },
    ]);
    mockFetch
      .mockResolvedValueOnce(release)
      .mockRejectedValueOnce(new Error('sin red'));

    await expect(refreshClassContent(db, client)).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockApply).toHaveBeenCalledTimes(1);
  });
});

describe('stageClassRelease y applyStagedClassReleases', () => {
  it('guarda el release sin aplicarlo y detecta el cambio', async () => {
    mockState.mockResolvedValue({
      version: 1,
      hash: 'hash-anterior',
      archived: 0,
      applied_hash: 'hash-anterior',
      course_catalog_id: 'demo',
      release_v3: '{}',
    });
    const runAsync = jest.fn(async (_sql: string, ..._params: unknown[]) => ({
      changes: 1,
      lastInsertRowId: 0,
    }));
    const stageDb = { runAsync } as unknown as SQLiteDatabase;

    await expect(
      stageClassRelease(stageDb, client, 'class-demo', 'ABC123', 'key-1', 'demo'),
    ).resolves.toEqual({ changed: true, initial: false });

    expect(mockApply).not.toHaveBeenCalled();
    const update = runAsync.mock.calls.find(call =>
      String(call[0]).includes('UPDATE class_cache'),
    );
    expect(update?.[2]).toBe(release.version);
    expect(update?.[6]).toContain('"kind":"group"');
  });

  it('no reescribe si el release ya está aplicado', async () => {
    mockState.mockResolvedValue({
      version: 1,
      hash: release.hash,
      archived: 0,
      applied_hash: release.hash,
      course_catalog_id: 'demo',
      release_v3: JSON.stringify(release),
    });
    const runAsync = jest.fn(async (_sql: string, ..._params: unknown[]) => ({
      changes: 1,
      lastInsertRowId: 0,
    }));
    const stageDb = { runAsync } as unknown as SQLiteDatabase;

    await expect(
      stageClassRelease(stageDb, client, 'class-demo', 'ABC123', 'key-1', 'demo'),
    ).resolves.toEqual({ changed: false, initial: false });
    expect(runAsync).not.toHaveBeenCalled();
  });

  it('aplica los releases v3 pendientes de la caché', async () => {
    const getAllAsync = jest.fn(async () => [
      {
        class_id: 'class-demo',
        course_catalog_id: 'demo',
        release_v3: JSON.stringify(release),
      },
    ]);
    const applyDb = { getAllAsync } as unknown as SQLiteDatabase;

    await expect(applyStagedClassReleases(applyDb)).resolves.toEqual({ failed: [] });
    expect(mockApply).toHaveBeenCalledWith(applyDb, release, 'class-demo');
  });
});
