import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SQLiteDatabase } from 'expo-sqlite';

import {
  applyStoredV3Content,
  applyV3Release,
} from '@/shared/services/content/applyV3Content';
import { parseCourseManifest } from '@/shared/services/content/coursesV3';

const X03_DIR = join(__dirname, '..', 'remote', '__fixtures__', 'v3', 'x03');
const X02_DIR = join(__dirname, '..', 'remote', '__fixtures__', 'v3', 'x02');

function loadRelease(dir: string, file: string, catalogId: string) {
  const raw = JSON.parse(readFileSync(join(dir, file), 'utf8')) as unknown;
  return parseCourseManifest(raw, catalogId);
}

function makeDb(stored: Record<string, unknown>[] = []) {
  const statements: { sql: string; params: unknown[] }[] = [];
  const db = {
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      statements.push({ sql, params });
      return { changes: 1, lastInsertRowId: 0 };
    }),
    getAllAsync: jest.fn(async (sql: string) => {
      if (sql.includes('FROM remote_courses')) {
        return stored;
      }
      return [];
    }),
    getFirstAsync: jest.fn(async () => null),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  } as unknown as SQLiteDatabase;
  return { db, statements };
}

describe('applyV3Release', () => {
  it('el fixture x03 conserva el hash LF del productor', () => {
    const text = readFileSync(join(X03_DIR, 'manifest-topics.json'))
      .toString('utf8')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n/g, '\n');
    expect(createHash('sha256').update(text, 'utf8').digest('hex')).toBe(
      '17abcf475f6dac8886da1df32388f8a76b7db9c25235bfc2a5404d96dd1c6e69',
    );
  });

  it('aplica el fixture x03 con una unidad, subtema, 2 lecciones y actividades', async () => {
    const release = loadRelease(X03_DIR, 'manifest-topics.json', 'demo');
    const { db, statements } = makeDb();

    await applyV3Release(db, release, 'demo');

    const inserts = (prefix: string) =>
      statements.filter(statement => statement.sql.startsWith(prefix));
    expect(inserts('INSERT INTO units')).toHaveLength(1);
    expect(inserts('INSERT INTO topics')).toHaveLength(1);
    expect(inserts('INSERT INTO lessons')).toHaveLength(2);
    expect(inserts('INSERT INTO examples')).toHaveLength(2);
    expect(inserts('INSERT INTO exercises')).toHaveLength(2);
    expect(inserts('INSERT INTO evaluations')).toHaveLength(2);
    expect(inserts('INSERT INTO questions')).toHaveLength(2);
    expect(inserts('INSERT INTO evaluation_exercises')).toHaveLength(3);

    const lessonTopic = inserts('INSERT INTO lessons').map(statement => statement.params[2]);
    expect(lessonTopic).toEqual(['demo-t1', 'demo-t1']);
    const activityLesson = inserts('INSERT INTO exercises').map(statement => statement.params[1]);
    expect(activityLesson).toEqual(['demo-l1.1', 'demo-l1.1']);
    expect(inserts('INSERT INTO evaluation_exercises').map(statement => statement.params)).toEqual([
      ['demo-ev1', 'demo-ord1'],
      ['demo-ev2', 'demo-ord1'],
      ['demo-ev2', 'demo-fill1'],
    ]);
    expect(inserts('INSERT INTO examples').map(statement => statement.params[10])).toEqual([0, 1]);
    expect(inserts('INSERT INTO exercises').map(statement => statement.params[9])).toEqual([0, 1]);
    expect(inserts('INSERT INTO evaluations').map(statement => statement.params[7])).toEqual([0, 1]);
  });

  it('reaplicar con posiciones cambiadas actualiza el orden sin duplicar', async () => {
    const release = loadRelease(X03_DIR, 'manifest-topics.json', 'demo');
    const { db, statements } = makeDb();

    await applyV3Release(db, release, 'demo');
    const inverted = {
      ...release,
      examples: (release.examples as unknown as Record<string, unknown>[]).map((example, index) => ({
        ...example,
        position: index === 0 ? 10 : 0,
      })),
      exercises: (release.exercises as unknown as Record<string, unknown>[]).map((exercise, index) => ({
        ...exercise,
        position: index === 0 ? 8 : 0,
      })),
      evaluations: (release.evaluations as unknown as Record<string, unknown>[]).map((evaluation, index) => ({
        ...evaluation,
        position: index === 0 ? 6 : 0,
      })),
    };

    await applyV3Release(db, inverted, 'demo');

    const lastRun = statements.filter(statement =>
      statement.sql.startsWith('INSERT INTO examples') ||
      statement.sql.startsWith('INSERT INTO exercises') ||
      statement.sql.startsWith('INSERT INTO evaluations'),
    ).slice(-6);
    expect(lastRun.filter(statement => statement.sql.startsWith('INSERT INTO examples')).map(statement => statement.params[10])).toEqual([10, 0]);
    expect(lastRun.filter(statement => statement.sql.startsWith('INSERT INTO exercises')).map(statement => statement.params[9])).toEqual([8, 0]);
    expect(lastRun.filter(statement => statement.sql.startsWith('INSERT INTO evaluations')).map(statement => statement.params[7])).toEqual([6, 0]);
    expect(
      statements
        .filter(statement => statement.sql.startsWith('INSERT INTO examples'))
        .every(statement => statement.sql.includes('position = excluded.position')),
    ).toBe(true);
  });

  it('una evaluación con exerciseIds vacío queda solo de preguntas', async () => {
    const release = loadRelease(X03_DIR, 'manifest-topics.json', 'demo');
    const { db, statements } = makeDb();
    const onlyQuestions = {
      ...release,
      evaluations: (release.evaluations as unknown as Record<string, unknown>[]).map(
        evaluation =>
          evaluation.id === 'demo-ev2'
            ? { ...evaluation, exerciseIds: [] }
            : evaluation,
      ),
    };

    await applyV3Release(db, onlyQuestions, 'demo');

    const evaluation = statements.find(
      statement =>
        statement.sql.startsWith('INSERT INTO evaluations') &&
        statement.params[0] === 'demo-ev2',
    );
    expect(evaluation?.params[6]).toBe(0);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('INSERT INTO evaluation_exercises') &&
          statement.params[0] === 'demo-ev2',
      ),
    ).toBe(false);
    const deleteSelection = statements.find(
      statement =>
        statement.sql.startsWith('DELETE FROM evaluation_exercises') &&
        statement.params[0] === 'demo-ev2',
    );
    expect(deleteSelection).toBeDefined();
  });

  it('el ejemplo embebido hereda la posición del ejercicio', async () => {
    const release = loadRelease(X03_DIR, 'manifest-topics.json', 'demo');
    const { db, statements } = makeDb();
    const withEmbedded = {
      ...release,
      exercises: (release.exercises as unknown as Record<string, unknown>[]).map((exercise, index) =>
        index === 0
          ? {
              ...exercise,
              position: 7,
              example: {
                title: 'Ejemplo embebido',
                steps: [{ text: 'Paso', why: 'Motivo' }],
                hints: [],
              },
            }
          : exercise,
      ),
    };

    await applyV3Release(db, withEmbedded, 'demo');

    const embedded = statements.find(
      statement =>
        statement.sql.startsWith('INSERT INTO examples') && statement.params[0] === 'demo-ord1',
    );
    expect(embedded?.params[10]).toBe(7);
  });

  it('es idempotente a nivel SQL y actualiza applied_hash', async () => {
    const release = loadRelease(X03_DIR, 'manifest-topics.json', 'demo');
    const { db, statements } = makeDb();

    await applyV3Release(db, release, 'demo');
    const first = statements.length;
    await applyV3Release(db, release, 'demo');

    expect(statements.length).toBe(first * 2);
    for (const prefix of [
      'INSERT INTO units',
      'INSERT INTO topics',
      'INSERT INTO lessons',
      'INSERT INTO examples',
      'INSERT INTO exercises',
      'INSERT INTO evaluations',
      'INSERT INTO questions',
    ]) {
      const upserts = statements.filter(statement => statement.sql.startsWith(prefix));
      expect(upserts.every(statement => statement.sql.includes('ON CONFLICT(id) DO UPDATE'))).toBe(
        true,
      );
    }
    const hashes = statements.filter(statement =>
      statement.sql.startsWith('UPDATE remote_courses SET applied_hash'),
    );
    expect(hashes).toHaveLength(2);
    expect(hashes[0]?.params).toEqual([release.hash, 'demo']);
  });

  it('solo archiva/borra contenido del catálogo aplicado', async () => {
    const release = loadRelease(X03_DIR, 'manifest-topics.json', 'demo');
    const { db, statements } = makeDb();

    await applyV3Release(db, release, 'demo');

    for (const statement of statements) {
      if (statement.sql.startsWith('DELETE FROM examples') || statement.sql.startsWith('DELETE FROM exercises')) {
        expect(statement.params[0]).toBe('demo');
      }
      if (statement.sql.startsWith('UPDATE lessons SET archived_at')) {
        expect(statement.params[1]).toBe('demo');
      }
      if (statement.sql.startsWith('UPDATE topics SET archived_at')) {
        expect(statement.params[1]).toBe('demo');
      }
      if (statement.sql.startsWith('UPDATE units SET archived_at')) {
        expect(statement.params[1]).toBe('demo');
      }
    }
  });

  it('tolera un release v3 vacío sin borrar contenido', async () => {
    const release = loadRelease(X02_DIR, 'manifest-empty.json', 'demo');
    const { db, statements } = makeDb();

    await applyV3Release(db, release, 'demo');

    expect(statements).toHaveLength(1);
    expect(statements[0]?.sql).toBe('UPDATE remote_courses SET applied_hash = ? WHERE catalog_id = ?');
    expect(statements[0]?.params).toEqual([release.hash, 'demo']);
  });
});

describe('applyStoredV3Content', () => {
  it('aplica el manifiesto guardado y salta el que ya tiene applied_hash', async () => {
    const release = loadRelease(X03_DIR, 'manifest-topics.json', 'demo');
    const { db, statements } = makeDb([
      {
        catalog_id: 'demo',
        manifest: JSON.stringify(release),
        hash: release.hash,
        applied_hash: null,
      },
      {
        catalog_id: 'otro',
        manifest: JSON.stringify({ ...release, catalogId: 'otro', hash: 'otro-hash' }),
        hash: 'otro-hash',
        applied_hash: 'otro-hash',
      },
    ]);

    const result = await applyStoredV3Content(db);

    expect(result.failed).toEqual([]);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('UPDATE remote_courses SET applied_hash') &&
          statement.params[1] === 'demo',
      ),
    ).toBe(true);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('UPDATE remote_courses SET applied_hash') &&
          statement.params[1] === 'otro',
      ),
    ).toBe(false);
  });
});
