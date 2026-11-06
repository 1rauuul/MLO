import type { SQLiteDatabase } from 'expo-sqlite';

import { validateLessonPayload } from '@/shared/services/content/remote/validateLessonPayload';
import {
  applyLessonPayload,
  BASE_REFERENCE,
  seedDatabase,
} from '@/shared/services/db/seed';
import { lessonFixture } from '@/shared/services/http/fixtures';

interface LessonRow {
  id: string;
  reference_ids: string;
}

function makeDb(seed: LessonRow[]) {
  const statements: { sql: string; params: unknown[] }[] = [];
  const lessons = new Map(seed.map(row => [row.id, { ...row }]));
  const db = {
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      statements.push({ sql, params });
      if (sql.startsWith('UPDATE lessons SET reference_ids')) {
        const row = lessons.get(String(params[1]));
        if (row) {
          row.reference_ids = String(params[0]);
        }
      }
      return { changes: 1, lastInsertRowId: 0 };
    }),
    getAllAsync: jest.fn(async (sql: string) =>
      sql.includes('reference_ids') && sql.includes('FROM lessons')
        ? [...lessons.values()].map(row => ({ ...row }))
        : [],
    ),
    getFirstAsync: jest.fn(async () => null),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  } as unknown as SQLiteDatabase;
  return { db, statements, lessons };
}

function basePayload() {
  return validateLessonPayload(
    {
      ...lessonFixture,
      catalogId: 'base',
      evaluation: null,
      exercises: [],
      examples: [],
      questions: [],
    },
    { catalogId: 'base', lessonId: 'k7f3q-l1.2' },
  );
}

describe('referencia empaquetada del curso base', () => {
  it('el seed crea la referencia y la adjunta a las lecciones base sin duplicar', async () => {
    const { db, statements, lessons } = makeDb([
      { id: 'l1.1', reference_ids: '[]' },
      { id: 'l1.2', reference_ids: JSON.stringify([BASE_REFERENCE.id]) },
    ]);

    await seedDatabase(db);
    await seedDatabase(db);

    const reference = statements.find(statement =>
      statement.sql.startsWith('INSERT INTO content_references'),
    );
    expect(reference?.params).toEqual([BASE_REFERENCE.id, BASE_REFERENCE.text]);

    const appends = statements.filter(
      statement =>
        statement.sql.startsWith('UPDATE lessons SET reference_ids') &&
        statement.params[1] === 'l1.1',
    );
    expect(appends).toHaveLength(1);
    expect(JSON.parse(String(appends[0]?.params[0]))).toEqual([BASE_REFERENCE.id]);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('UPDATE lessons SET reference_ids') &&
          statement.params[1] === 'l1.2',
      ),
    ).toBe(false);
    expect(JSON.parse(lessons.get('l1.2')?.reference_ids ?? '[]')).toEqual([
      BASE_REFERENCE.id,
    ]);
  });

  it('aplicar un payload v2 del catálogo base adjunta la referencia', async () => {
    const { db, statements, lessons } = makeDb([
      { id: 'k7f3q-l1.2', reference_ids: '[]' },
    ]);
    const payload = basePayload();

    await applyLessonPayload(db, payload);
    await applyLessonPayload(db, payload);

    const reference = statements.find(statement =>
      statement.sql.startsWith('INSERT INTO content_references'),
    );
    expect(reference?.params).toEqual([BASE_REFERENCE.id, BASE_REFERENCE.text]);

    const appends = statements.filter(statement =>
      statement.sql.startsWith('UPDATE lessons SET reference_ids'),
    );
    expect(appends).toHaveLength(1);
    expect(JSON.parse(lessons.get('k7f3q-l1.2')?.reference_ids ?? '[]')).toEqual([
      BASE_REFERENCE.id,
    ]);
  });
});
