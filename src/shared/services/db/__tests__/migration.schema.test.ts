import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateAndSeed } from '@/shared/services/db/database';
import { SCHEMA_DDL } from '@/shared/services/db/schema';

// Solo Node >= 22.5 trae node:sqlite; en otros entornos se omite.
const { DatabaseSync } = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:sqlite') as typeof import('node:sqlite');
  } catch {
    return { DatabaseSync: null };
  }
})();

jest.mock('expo-crypto', () => ({
  randomUUID: () => '11111111-1111-4111-8111-111111111111',
}));

/**
 * Simula una instalación anterior a v19: no hay temas, grupos ni bibliografía.
 * `SCHEMA_DDL` es el esquema actual, así que se retiran esos añadidos para que
 * la migración recorra el camino real de una base vieja.
 */
function legacyDb(userVersion: number): {
  db: InstanceType<NonNullable<typeof DatabaseSync>>;
  adapter: SQLiteDatabase;
} {
  const db = new DatabaseSync!(':memory:');
  db.exec(SCHEMA_DDL);
  for (const index of [
    'idx_topics_unit',
    'idx_topics_catalog',
    'idx_units_catalog',
    'idx_lessons_catalog',
    'idx_lessons_topic',
    'idx_examples_topic',
    'idx_exercises_topic',
    'idx_evaluations_topic',
    'idx_units_group',
    'idx_topics_group',
    'idx_lessons_group',
    'idx_examples_group',
    'idx_exercises_group',
    'idx_evaluations_group',
    'idx_content_references_scope',
  ]) {
    db.exec(`DROP INDEX IF EXISTS ${index}`);
  }
  db.exec('DROP TABLE content_references');
  db.exec('DROP TABLE evaluation_exercises');
  db.exec('DROP TABLE topics');
  for (const table of ['units', 'lessons']) {
    db.exec(`ALTER TABLE ${table} DROP COLUMN catalog_id`);
    db.exec(`ALTER TABLE ${table} DROP COLUMN archived_at`);
  }
  db.exec('ALTER TABLE evaluations DROP COLUMN archived_at');
  db.exec('ALTER TABLE evaluations DROP COLUMN question_count');
  db.exec('ALTER TABLE evaluations DROP COLUMN exercise_count');
  for (const table of ['lessons', 'examples', 'exercises', 'evaluations']) {
    db.exec(`ALTER TABLE ${table} DROP COLUMN topic_id`);
  }
  for (const table of ['units', 'lessons', 'examples', 'exercises', 'evaluations']) {
    db.exec(`ALTER TABLE ${table} DROP COLUMN group_id`);
  }
  for (const table of ['lessons', 'examples', 'exercises', 'evaluations', 'questions']) {
    db.exec(`ALTER TABLE ${table} DROP COLUMN reference_ids`);
  }
  db.exec(`PRAGMA user_version = ${userVersion}`);

  const adapter = {
    execAsync: async (sql: string) => {
      db.exec(sql);
    },
    runAsync: async (sql: string, ...params: unknown[]) => {
      const result = db.prepare(sql).run(...(params as never[]));
      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    getFirstAsync: async (sql: string, ...params: unknown[]) =>
      db.prepare(sql).get(...(params as never[])) ?? null,
    getAllAsync: async (sql: string, ...params: unknown[]) =>
      db.prepare(sql).all(...(params as never[])),
    withTransactionAsync: async (task: () => Promise<void>) => {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as SQLiteDatabase;

  return { db, adapter };
}

const maybe = DatabaseSync ? it : it.skip;

function expectMigrated(db: InstanceType<NonNullable<typeof DatabaseSync>>): void {
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE name = 'content_references'")
    .get() as { name?: string } | undefined;
  expect(table?.name).toBe('content_references');
  const version = db.prepare('PRAGMA user_version').get() as { user_version: number };
  expect(version.user_version).toBe(21);
  const lessons = db.prepare('PRAGMA table_info(lessons)').all() as { name: string }[];
  expect(lessons.map(column => column.name)).toEqual(
    expect.arrayContaining(['topic_id', 'group_id', 'reference_ids']),
  );
  db.close();
}

describe('migrateAndSeed sobre esquemas antiguos', () => {
  // v4 recorre el paso v5, que recrea `examples` sin las columnas posteriores.
  maybe('una base v4 sin temas ni bibliografía migra completa', async () => {
    const { db, adapter } = legacyDb(4);
    await expect(migrateAndSeed(adapter)).resolves.toBeUndefined();
    expectMigrated(db);
  });

  maybe('una base v5 sin bibliografía migra y adjunta la referencia base', async () => {
    const { db, adapter } = legacyDb(5);

    await expect(migrateAndSeed(adapter)).resolves.toBeUndefined();

    const rows = db
      .prepare("SELECT id FROM content_references WHERE catalog_id = 'base'")
      .all() as { id: string }[];
    expect(rows.length).toBe(1);
    expectMigrated(db);
  });

  maybe('una base v14 sin bibliografía migra sin "no such column"', async () => {
    const { db, adapter } = legacyDb(14);
    await expect(migrateAndSeed(adapter)).resolves.toBeUndefined();
    expectMigrated(db);
  });
});
