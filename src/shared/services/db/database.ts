import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, DROP_ALL_DDL, SCHEMA_DDL } from '@/shared/services/db/schema';
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
      await saveContentHash(db);
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
    await applyStagedContent(db);
    return;
  }

  if (currentVersion >= DATABASE_VERSION) {
    await db.execAsync(SCHEMA_DDL);
    await seedIfEmpty(db);
    await syncBundledAndRemote(db);
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

  await seedIfEmpty(db);
  await syncBundledAndRemote(db);
}

// Primero el contenido incluido; después lo remoto ya validado, sin red.
async function syncBundledAndRemote(db: SQLiteDatabase): Promise<void> {
  await syncContentIfChanged(db);
  await applyStagedContent(db);
}
