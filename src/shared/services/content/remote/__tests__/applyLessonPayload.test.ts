import type { SQLiteDatabase } from 'expo-sqlite';

import { applyLessonPayload } from '@/shared/services/db/seed';
import { applyStagedContent } from '@/shared/services/content/remote/applyStagedContent';
import { validateLessonPayload } from '@/shared/services/content/remote/validateLessonPayload';
import { lessonFixture } from '@/shared/services/http/fixtures';

const payload = validateLessonPayload(lessonFixture, {
  catalogId: 'k7f3q',
  lessonId: 'k7f3q-l1.2',
});

function makeDb() {
  const statements: { sql: string; params: unknown[] }[] = [];
  let failOn: string | null = null;
  const db = {
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      if (failOn && sql.includes(failOn)) {
        throw new Error('foreign key failed');
      }
      statements.push({ sql, params });
      return { changes: 1, lastInsertRowId: 0 };
    }),
    getAllAsync: jest.fn(async (sql: string) => {
      if (sql.includes('FROM remote_lessons')) {
        return [
          {
            catalog_id: 'k7f3q',
            lesson_id: 'k7f3q-l1.2',
            hash: 'lesson-hash',
            payload: JSON.stringify(payload),
          },
        ];
      }
      if (sql.includes('FROM remote_catalogs')) {
        return [{ catalog_id: 'k7f3q' }];
      }
      return [];
    }),
    getFirstAsync: jest.fn(async (sql: string) =>
      sql.includes('remote_catalogs')
        ? { lesson_ids: JSON.stringify(['k7f3q-l1.2']) }
        : null,
    ),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  } as unknown as SQLiteDatabase;
  return { db, statements, fail: (table: string) => (failOn = table) };
}

describe('applyLessonPayload', () => {
  it('aplica la jerarquía en el orden de llaves foráneas', async () => {
    const { db, statements } = makeDb();

    await applyLessonPayload(db, payload);

    const inserts = statements.filter(statement => statement.sql.startsWith('INSERT INTO'));
    const order = inserts.map(statement => statement.sql.split(' ')[2]);
    expect(order[0]).toBe('units');
    expect(order[1]).toBe('lessons');
    expect(order[2]).toBe('evaluations');
    expect(order).toEqual(expect.arrayContaining(['exercises', 'examples', 'questions']));
    const evaluation = inserts.find(statement => statement.sql.startsWith('INSERT INTO evaluations'));
    expect(evaluation?.params.slice(4)).toEqual([10, 5]);
  });

  it('borra ejercicios, ejemplos y preguntas que ya no vienen', async () => {
    const { db, statements } = makeDb();

    await applyLessonPayload(db, payload);

    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('DELETE FROM exercises') && statement.sql.includes('NOT IN'),
      ),
    ).toBe(true);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('DELETE FROM examples') && statement.sql.includes('NOT IN'),
      ),
    ).toBe(true);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('DELETE FROM questions') && statement.sql.includes('NOT IN'),
      ),
    ).toBe(true);
  });

  it('archiva la evaluación cuando la lección publica evaluation null', async () => {
    const { db, statements } = makeDb();

    await applyLessonPayload(db, { ...payload, evaluation: null, questions: [] });

    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('UPDATE evaluations SET archived_at') &&
          statement.params[1] === 'k7f3q-l1.2',
      ),
    ).toBe(true);
    expect(
      statements.some(statement => statement.sql.includes('DELETE FROM questions WHERE evaluation_id IN')),
    ).toBe(true);
  });

  it('rechaza toda la lección si una escritura falla', async () => {
    const { db, fail } = makeDb();
    fail('INSERT INTO exercises');

    await expect(applyLessonPayload(db, payload)).rejects.toThrow('foreign key failed');
  });
});

describe('applyStagedContent', () => {
  it('aplica pendientes, marca applied_hash y archiva sin borrar progreso', async () => {
    const { db, statements } = makeDb();

    const result = await applyStagedContent(db, 'k7f3q');

    expect(result.failed).toEqual([]);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('UPDATE remote_lessons SET applied_hash') &&
          statement.params[0] === 'lesson-hash',
      ),
    ).toBe(true);
    expect(
      statements.some(statement => statement.sql.startsWith('UPDATE lessons SET archived_at')),
    ).toBe(true);
    expect(statements.some(statement => statement.sql.includes('DELETE FROM module_progress'))).toBe(
      false,
    );
  });

  it('archiva las lecciones retiradas también en el curso base', async () => {
    const { db, statements } = makeDb();

    await applyStagedContent(db, 'base');

    expect(
      statements.some(statement => statement.sql.startsWith('UPDATE lessons SET archived_at')),
    ).toBe(true);
  });

  it('devuelve las lecciones que no se pudieron aplicar', async () => {
    const { db, fail } = makeDb();
    fail('INSERT INTO examples');

    const result = await applyStagedContent(db, 'k7f3q');

    expect(result.failed).toEqual(['k7f3q-l1.2']);
  });
});
