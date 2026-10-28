import type { SQLiteDatabase } from 'expo-sqlite';

import type { HttpClient } from '@/shared/services/http/client';

import {
  selectClassMemberships,
  selectClassVersion,
  storeClassRelease,
  updateClassMetadata,
} from '@/features/classes/model/classRepository';
import { refreshClassContent, refreshClassRelease } from '@/shared/services/content/classSync';
import { fetchClassPreview, fetchClassRelease } from '@/shared/services/content/remoteContent';

jest.mock('@/features/classes/model/classRepository', () => ({
  selectClassMemberships: jest.fn(),
  selectClassVersion: jest.fn(),
  storeClassRelease: jest.fn(async () => {}),
  updateClassMetadata: jest.fn(async () => {}),
}));
jest.mock('@/shared/services/content/remoteContent', () => ({
  fetchClassPreview: jest.fn(),
  fetchClassRelease: jest.fn(),
}));

const db = {} as SQLiteDatabase;
const client = { get: jest.fn(), post: jest.fn(), delete: jest.fn() } as unknown as HttpClient;

const preview = {
  schemaVersion: 2 as const,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  published: {
    version: 2,
    hash: 'hash-2',
    publishedAt: '2026-10-27T00:00:00.000Z',
  },
};

const release = {
  schemaVersion: 2 as const,
  class: preview.class,
  version: 2,
  hash: 'hash-2',
  publishedAt: '2026-10-27T00:00:00.000Z',
  lessons: [],
};

const mockPreview = jest.mocked(fetchClassPreview);
const mockRelease = jest.mocked(fetchClassRelease);
const mockStored = jest.mocked(selectClassVersion);
const mockStore = jest.mocked(storeClassRelease);
const mockMetadata = jest.mocked(updateClassMetadata);
const mockMemberships = jest.mocked(selectClassMemberships);

beforeEach(() => {
  jest.clearAllMocks();
  mockPreview.mockResolvedValue(preview);
  mockRelease.mockResolvedValue(release);
  mockStored.mockResolvedValue(null);
});

describe('refreshClassRelease', () => {
  it('descarga y guarda cuando cambia la versión', async () => {
    await expect(refreshClassRelease(db, client, 'c1', 'ABC123')).resolves.toBe(true);

    expect(mockMetadata).toHaveBeenCalledWith(db, 'c1', 'ABC123', 'Grupo A', 'Profesora Ríos');
    expect(mockStore).toHaveBeenCalledWith(db, 'ABC123', release);
  });

  it('no descarga si la versión y el hash no cambiaron', async () => {
    mockStored.mockResolvedValue({ version: 2, hash: 'hash-2' });

    await expect(refreshClassRelease(db, client, 'c1', 'ABC123')).resolves.toBe(false);

    expect(mockRelease).not.toHaveBeenCalled();
    expect(mockStore).not.toHaveBeenCalled();
  });

  it('no hace nada si la clase todavía no publicó', async () => {
    mockPreview.mockResolvedValue({ ...preview, published: null });

    await expect(refreshClassRelease(db, client, 'c1', 'ABC123')).resolves.toBe(false);

    expect(mockRelease).not.toHaveBeenCalled();
    expect(mockStore).not.toHaveBeenCalled();
  });

  it('rechaza un release que no coincide con la vista previa', async () => {
    mockRelease.mockResolvedValue({ ...release, hash: 'otro' });

    await expect(refreshClassRelease(db, client, 'c1', 'ABC123')).rejects.toThrow(
      'no coincide con la vista previa',
    );
    expect(mockStore).not.toHaveBeenCalled();
  });
});

describe('refreshClassContent', () => {
  it('sincroniza cada membresía sin detenerse por un fallo', async () => {
    mockMemberships.mockResolvedValue([
      { classId: 'c1', classCode: 'ABC123' },
      { classId: 'c2', classCode: 'DEF456' },
    ]);
    mockPreview
      .mockResolvedValueOnce(preview)
      .mockRejectedValueOnce(new Error('sin red'));
    mockRelease.mockResolvedValue(release);

    await expect(refreshClassContent(db, client)).resolves.toBeUndefined();

    expect(mockPreview).toHaveBeenCalledTimes(2);
    expect(mockStore).toHaveBeenCalledTimes(1);
  });
});
