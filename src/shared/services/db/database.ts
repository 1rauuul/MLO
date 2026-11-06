import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, DROP_ALL_DDL, SCHEMA_DDL } from '@/shared/services/db/schema';
import {
  applyStoredV3Content,
  backfillLegacyTopics,
} from '@/shared/services/content/applyV3Content';
import { applyStagedContent } from '@/shared/services/content/remote/applyStagedContent';

import {
  applyContentMigration,
  migrateQuestionIds,
  saveContentHash,
  seedDatabase,
  syncContentIfChanged,
  writeContentSync,
  writeSeedDatabase,
} from '@/shared/services/db/seed';

export const DATABASE_NAME = 'mlo.db';

async function hasColumn(db: SQLiteDatabase, table: string, column: string): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some(item => item.name === column);
}

async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ units: number; lessons: number }>(
    'SELECT (SELECT COUNT(*) FROM units) AS units, (SELECT COUNT(*) FROM lessons) AS lessons',
  );
  if (!row || row.units === 0 || row.lessons === 0) {
    await seedDatabase(db);
    await saveContentHash(db);
  }
}

export async function migrateAndSeed(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  // Fresh install: SCHEMA_DDL already contains every column and seedDatabase loads
  // all content, so skip the incremental ALTERs (they would duplicate columns).
  if (currentVersion === 0) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA_DDL);
      await writeSeedDatabase(db);
      await backfillLegacyTopics(db);
      await saveContentHash(db);
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
    await applyStagedContent(db);
    await applyStoredV3Content(db);
    return;
  }

  if (currentVersion >= DATABASE_VERSION) {
    await db.execAsync(SCHEMA_DDL);
    await seedIfEmpty(db);
    await syncBundledAndRemote(db);
    await db.withTransactionAsync(() => backfillLegacyTopics(db));
    await applyStoredV3Content(db);
    return;
  }

  let version = currentVersion;

  if (version < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(DROP_ALL_DDL);
      await db.execAsync(SCHEMA_DDL);
      await writeSeedDatabase(db);
      await db.execAsync('PRAGMA user_version = 2');
    });
    version = 2;
  }

  if (version < 3) {
    const hasContent = await hasColumn(db, 'lessons', 'content');
    await db.withTransactionAsync(async () => {
      if (!hasContent) {
        await db.execAsync(`ALTER TABLE lessons ADD COLUMN content TEXT NOT NULL DEFAULT '[]'`);
      }
      await applyContentMigration(db);
      await db.execAsync('PRAGMA user_version = 3');
    });
    version = 3;
  }

  if (version < 4) {
    const hasConfig = await hasColumn(db, 'exercises', 'config');
    await db.withTransactionAsync(async () => {
      if (!hasConfig) {
        await db.execAsync(`ALTER TABLE exercises ADD COLUMN config TEXT NOT NULL DEFAULT '{}'`);
      }
      await db.execAsync('PRAGMA user_version = 4');
    });
    version = 4;
  }

  if (version < 5) {
    const hasQuestionType = await hasColumn(db, 'questions', 'type');
    const hasQuestionConfig = await hasColumn(db, 'questions', 'config');
    const hasExerciseExplanation = await hasColumn(db, 'exercises', 'explanation');
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
          source TEXT NOT NULL,
          item_id TEXT NOT NULL,
          item_type TEXT NOT NULL,
          lesson_id TEXT NOT NULL,
          correct INTEGER NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_attempts_account_lesson ON attempts(account_id, lesson_id);
        CREATE INDEX IF NOT EXISTS idx_attempts_account_type ON attempts(account_id, item_type);
        DROP TABLE IF EXISTS examples;
        CREATE TABLE examples (
          id TEXT PRIMARY KEY NOT NULL,
          lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          prompt TEXT NOT NULL,
          config TEXT NOT NULL DEFAULT '{}',
          steps TEXT NOT NULL DEFAULT '[]',
          hints TEXT NOT NULL DEFAULT '[]',
          explanation TEXT NOT NULL DEFAULT ''
        );
      `);
      if (!hasQuestionType) {
        await db.execAsync(`ALTER TABLE questions ADD COLUMN type TEXT NOT NULL DEFAULT 'mcq'`);
      }
      if (!hasQuestionConfig) {
        await db.execAsync(`ALTER TABLE questions ADD COLUMN config TEXT NOT NULL DEFAULT '{}'`);
      }
      if (!hasExerciseExplanation) {
        await db.execAsync(`ALTER TABLE exercises ADD COLUMN explanation TEXT NOT NULL DEFAULT ''`);
      }
      await writeContentSync(db);
      await db.execAsync('PRAGMA user_version = 5');
    });
    version = 5;
  }

  if (version < 6) {
    await db.withTransactionAsync(async () => {
      await writeContentSync(db);
      await db.execAsync('PRAGMA user_version = 6');
    });
    version = 6;
  }

  if (version < 7) {
    await db.withTransactionAsync(async () => {
      await writeContentSync(db);
      await db.execAsync('PRAGMA user_version = 7');
    });
    version = 7;
  }

  if (version < 8) {
    await db.withTransactionAsync(async () => {
      await writeContentSync(db);
      await db.execAsync('PRAGMA user_version = 8');
    });
    version = 8;
  }

  if (version < 9) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS last_location (
          account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
          unit_id TEXT,
          lesson_id TEXT,
          lesson_code TEXT,
          section TEXT,
          updated_at TEXT NOT NULL
        );
      `);
      await db.execAsync('PRAGMA user_version = 9');
    });
    version = 9;
  }

  if (version < 10) {
    await db.withTransactionAsync(async () => {
      await writeContentSync(db);
      await db.execAsync('PRAGMA user_version = 10');
    });
    version = 10;
  }

  if (version < 11) {
    await db.withTransactionAsync(async () => {
      await writeContentSync(db);
      await db.execAsync('PRAGMA user_version = 11');
    });
    version = 11;
  }

  if (version < 12) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS example_state (
          account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
          lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
          payload TEXT NOT NULL DEFAULT '{}',
          updated_at TEXT NOT NULL,
          PRIMARY KEY (account_id, lesson_id)
        );
      `);
      await db.execAsync('PRAGMA user_version = 12');
    });
    version = 12;
  }

  if (version < 13) {
    await db.withTransactionAsync(async () => {
      await writeContentSync(db);
      await db.execAsync('PRAGMA user_version = 13');
    });
    version = 13;
  }

  if (version < 14) {
    await db.withTransactionAsync(async () => {
      await writeContentSync(db);
      await db.execAsync('PRAGMA user_version = 14');
    });
    version = 14;
  }

  if (version < 15) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
      if (!(await hasColumn(db, 'attempts', 'score_correct'))) {
        await db.execAsync(`ALTER TABLE attempts ADD COLUMN score_correct INTEGER NOT NULL DEFAULT 0`);
      }
      if (!(await hasColumn(db, 'attempts', 'score_total'))) {
        await db.execAsync(`ALTER TABLE attempts ADD COLUMN score_total INTEGER NOT NULL DEFAULT 1`);
      }
      await migrateQuestionIds(db);
      await writeContentSync(db);
      await saveContentHash(db);
      await db.execAsync('PRAGMA user_version = 15');
    });
    version = 15;
  }

  if (version < 16) {
    await db.withTransactionAsync(async () => {
      if (!(await hasColumn(db, 'units', 'catalog_id'))) {
        await db.execAsync(`ALTER TABLE units ADD COLUMN catalog_id TEXT NOT NULL DEFAULT 'base'`);
      }
      if (!(await hasColumn(db, 'units', 'archived_at'))) {
        await db.execAsync(`ALTER TABLE units ADD COLUMN archived_at TEXT`);
      }
      if (!(await hasColumn(db, 'lessons', 'catalog_id'))) {
        await db.execAsync(`ALTER TABLE lessons ADD COLUMN catalog_id TEXT NOT NULL DEFAULT 'base'`);
      }
      if (!(await hasColumn(db, 'lessons', 'archived_at'))) {
        await db.execAsync(`ALTER TABLE lessons ADD COLUMN archived_at TEXT`);
      }
      if (!(await hasColumn(db, 'evaluations', 'archived_at'))) {
        await db.execAsync(`ALTER TABLE evaluations ADD COLUMN archived_at TEXT`);
      }
      if (!(await hasColumn(db, 'evaluations', 'question_count'))) {
        await db.execAsync(
          `ALTER TABLE evaluations ADD COLUMN question_count INTEGER NOT NULL DEFAULT 10`,
        );
      }
      if (!(await hasColumn(db, 'evaluations', 'exercise_count'))) {
        await db.execAsync(
          `ALTER TABLE evaluations ADD COLUMN exercise_count INTEGER NOT NULL DEFAULT 5`,
        );
      }
      await db.execAsync(SCHEMA_DDL);
      await db.runAsync("DELETE FROM meta WHERE key = 'remote_content_hash'");
      await db.execAsync('PRAGMA user_version = 16');
    });
    version = 16;
  }

  if (version < 17) {
    await db.withTransactionAsync(async () => {
      if (!(await hasColumn(db, 'accounts', 'external_key'))) {
        await db.execAsync(`ALTER TABLE accounts ADD COLUMN external_key TEXT NOT NULL DEFAULT ''`);
      }
      const accounts = await db.getAllAsync<{ id: number; external_key: string }>(
        'SELECT id, external_key FROM accounts',
      );
      for (const account of accounts) {
        if (!account.external_key) {
          await db.runAsync(
            'UPDATE accounts SET external_key = ? WHERE id = ?',
            Crypto.randomUUID(),
            account.id,
          );
        }
      }
      await db.execAsync(SCHEMA_DDL);
      await db.execAsync('DROP TABLE IF EXISTS account_group');
      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_external_key ON accounts(external_key)',
      );
      await db.execAsync('PRAGMA user_version = 17');
    });
    version = 17;
  }

  if (version < 18) {
    await db.withTransactionAsync(async () => {
      const now = new Date().toISOString();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS remote_courses (
          catalog_id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL,
          uses_base INTEGER NOT NULL DEFAULT 0,
          version TEXT NOT NULL DEFAULT '',
          hash TEXT NOT NULL DEFAULT '',
          published_at TEXT,
          empty INTEGER NOT NULL DEFAULT 1,
          is_base INTEGER NOT NULL DEFAULT 0,
          manifest TEXT,
          fetched_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS account_courses (
          account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
          catalog_id TEXT NOT NULL REFERENCES remote_courses(catalog_id) ON DELETE CASCADE,
          active INTEGER NOT NULL DEFAULT 0,
          added_at TEXT NOT NULL,
          PRIMARY KEY (account_id, catalog_id)
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_account_courses_active
          ON account_courses(account_id) WHERE active = 1;
      `);
      // El curso base empaquetado existe desde el primer arranque; las cuentas
      // existentes lo reciben activo sin tocar su progreso.
      await db.runAsync(
        `INSERT INTO remote_courses
           (catalog_id, title, status, uses_base, version, hash, published_at, empty, is_base, manifest, fetched_at)
         VALUES ('base', 'Contenido base', 'published', 0, '', '', NULL, 0, 1, NULL, ?)
         ON CONFLICT(catalog_id) DO NOTHING`,
        now,
      );
      await db.runAsync(
        `INSERT INTO account_courses (account_id, catalog_id, active, added_at)
         SELECT a.id, 'base', 1, ?
         FROM accounts a
         WHERE NOT EXISTS (
           SELECT 1 FROM account_courses ac
           WHERE ac.account_id = a.id AND ac.active = 1
         )`,
        now,
      );
      await db.execAsync('PRAGMA user_version = 18');
    });
    version = 18;
  }

  if (version < 19) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS topics (
          id TEXT PRIMARY KEY NOT NULL,
          unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          summary TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL DEFAULT 0,
          catalog_id TEXT NOT NULL DEFAULT 'base',
          archived_at TEXT
        );
        CREATE TABLE IF NOT EXISTS evaluation_exercises (
          evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
          exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
          PRIMARY KEY (evaluation_id, exercise_id)
        );
      `);
      for (const table of ['lessons', 'examples', 'exercises', 'evaluations']) {
        if (!(await hasColumn(db, table, 'topic_id'))) {
          await db.execAsync(`ALTER TABLE ${table} ADD COLUMN topic_id TEXT`);
        }
      }
      // Conserva el orden v2 actual: rowid era el orden de lectura anterior.
      for (const table of ['examples', 'exercises', 'evaluations']) {
        if (!(await hasColumn(db, table, 'position'))) {
          await db.execAsync(
            `ALTER TABLE ${table} ADD COLUMN position INTEGER NOT NULL DEFAULT 0`,
          );
          await db.runAsync(`UPDATE ${table} SET position = rowid`);
        }
      }
      if (!(await hasColumn(db, 'remote_courses', 'applied_hash'))) {
        await db.execAsync(`ALTER TABLE remote_courses ADD COLUMN applied_hash TEXT`);
      }
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_topics_unit ON topics(unit_id);
        CREATE INDEX IF NOT EXISTS idx_topics_catalog ON topics(catalog_id);
        CREATE INDEX IF NOT EXISTS idx_lessons_topic ON lessons(topic_id);
        CREATE INDEX IF NOT EXISTS idx_examples_topic ON examples(topic_id);
        CREATE INDEX IF NOT EXISTS idx_exercises_topic ON exercises(topic_id);
        CREATE INDEX IF NOT EXISTS idx_evaluations_topic ON evaluations(topic_id);
        CREATE INDEX IF NOT EXISTS idx_evaluation_exercises_exercise ON evaluation_exercises(exercise_id);
      `);
      await backfillLegacyTopics(db);
      await db.execAsync('PRAGMA user_version = 19');
    });
    version = 19;
  }

  if (version < 20) {
    await db.withTransactionAsync(async () => {
      for (const table of ['units', 'topics', 'lessons', 'examples', 'exercises', 'evaluations']) {
        if (!(await hasColumn(db, table, 'group_id'))) {
          await db.execAsync(`ALTER TABLE ${table} ADD COLUMN group_id TEXT`);
        }
      }
      if (!(await hasColumn(db, 'account_classes', 'course_catalog_id'))) {
        await db.execAsync(
          `ALTER TABLE account_classes ADD COLUMN course_catalog_id TEXT NOT NULL DEFAULT 'base'`,
        );
      }
      if (!(await hasColumn(db, 'account_classes', 'active'))) {
        await db.execAsync(
          `ALTER TABLE account_classes ADD COLUMN active INTEGER NOT NULL DEFAULT 1`,
        );
      }
      if (!(await hasColumn(db, 'class_cache', 'course_catalog_id'))) {
        await db.execAsync(
          `ALTER TABLE class_cache ADD COLUMN course_catalog_id TEXT NOT NULL DEFAULT 'base'`,
        );
      }
      if (!(await hasColumn(db, 'class_cache', 'archived'))) {
        await db.execAsync(
          `ALTER TABLE class_cache ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`,
        );
      }
      if (!(await hasColumn(db, 'class_cache', 'release_v3'))) {
        await db.execAsync(`ALTER TABLE class_cache ADD COLUMN release_v3 TEXT`);
      }
      if (!(await hasColumn(db, 'class_cache', 'applied_hash'))) {
        await db.execAsync(`ALTER TABLE class_cache ADD COLUMN applied_hash TEXT`);
      }
      // DEC-06: si una cuenta tenía varias clases activas del mismo curso, se
      // conserva la más reciente y las demás quedan inactivas (sin borrar).
      await db.runAsync(
        `UPDATE account_classes SET active = 0
         WHERE active = 1 AND EXISTS (
           SELECT 1 FROM account_classes other
           WHERE other.account_id = account_classes.account_id
             AND other.course_catalog_id = account_classes.course_catalog_id
             AND other.active = 1
             AND (
               other.joined_at > account_classes.joined_at
               OR (other.joined_at = account_classes.joined_at
                   AND other.rowid > account_classes.rowid)
             )
         )`,
      );
      await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_account_classes_active_course
          ON account_classes(account_id, course_catalog_id) WHERE active = 1;
        CREATE INDEX IF NOT EXISTS idx_units_group ON units(group_id);
        CREATE INDEX IF NOT EXISTS idx_topics_group ON topics(group_id);
        CREATE INDEX IF NOT EXISTS idx_lessons_group ON lessons(group_id);
        CREATE INDEX IF NOT EXISTS idx_examples_group ON examples(group_id);
        CREATE INDEX IF NOT EXISTS idx_exercises_group ON exercises(group_id);
        CREATE INDEX IF NOT EXISTS idx_evaluations_group ON evaluations(group_id);
      `);
      await db.execAsync('PRAGMA user_version = 20');
    });
    version = 20;
  }

  if (version < 21) {
    await db.withTransactionAsync(async () => {
      for (const table of ['lessons', 'examples', 'exercises', 'evaluations', 'questions']) {
        if (!(await hasColumn(db, table, 'reference_ids'))) {
          await db.execAsync(
            `ALTER TABLE ${table} ADD COLUMN reference_ids TEXT NOT NULL DEFAULT '[]'`,
          );
        }
      }
      await db.execAsync(SCHEMA_DDL);
      await db.execAsync('PRAGMA user_version = 21');
    });
    version = 21;
  }

  await seedIfEmpty(db);
  await syncBundledAndRemote(db);
  await db.withTransactionAsync(() => backfillLegacyTopics(db));
  await applyStoredV3Content(db);
}

// Primero el contenido incluido; después lo remoto ya validado, sin red.
async function syncBundledAndRemote(db: SQLiteDatabase): Promise<void> {
  await syncContentIfChanged(db);
  await applyStagedContent(db);
}
