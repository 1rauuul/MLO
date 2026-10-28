import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SQLiteDatabase } from 'expo-sqlite';

import { applyLessonPayload } from '@/shared/services/db/seed';
import { parseCatalogManifest } from '@/shared/services/content/remoteContent';
import {
  validateLessonPayload,
  type RemoteLessonPayload,
} from '@/shared/services/content/remote/validateLessonPayload';

interface PanelRelease {
  manifest: unknown;
  lessons: unknown[];
}

const file = JSON.parse(
  readFileSync(
    join(__dirname, '..', '__fixtures__', 'panelRelease.json'),
    'utf8',
  ),
) as PanelRelease;

const manifest = parseCatalogManifest(file.manifest, 'base');
const payloads: RemoteLessonPayload[] = manifest.lessons.map(entry => {
  const raw = file.lessons.find(
    item => (item as { lessonId?: string }).lessonId === entry.lessonId,
  );
  if (!raw) throw new Error(`Falta la lección ${entry.lessonId} en el fixture.`);
  return validateLessonPayload(raw, {
    catalogId: 'base',
    lessonId: entry.lessonId,
  });
});

function makeDb() {
  const statements: { sql: string; params: unknown[] }[] = [];
  const db = {
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      statements.push({ sql, params });
      return { changes: 1, lastInsertRowId: 0 };
    }),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  } as unknown as SQLiteDatabase;
  return { db, statements };
}

describe('release del panel', () => {
  it('valida las 25 lecciones y aplica los ejemplos independientes', async () => {
    const { db, statements } = makeDb();

    for (const payload of payloads) {
      await applyLessonPayload(db, payload);
    }

    const independent = new Set(payloads.flatMap(payload => payload.examples.map(item => item.id)));
    expect(independent.size).toBe(3);
    expect([...independent]).toEqual(
      expect.arrayContaining(['exA1.2', 'exA1.3', 'exA1.4']),
    );

    const inserted = statements
      .filter(statement => statement.sql.startsWith('INSERT INTO examples'))
      .map(statement => String(statement.params[0]));

    for (const id of independent) {
      expect(inserted.filter(item => item === id)).toHaveLength(1);
    }
    expect(independent.has('ord1.2')).toBe(false);
  });

  it('mantiene el hash de cada lección igual al del manifest', () => {
    for (const entry of manifest.lessons) {
      const payload = payloads.find(item => item.lessonId === entry.lessonId);
      expect(payload?.hash).toBe(entry.hash);
      expect(payload?.unit.id).toBe(entry.unitId);
    }
  });
});
