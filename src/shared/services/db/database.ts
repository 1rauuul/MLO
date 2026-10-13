import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, DROP_ALL_DDL, SCHEMA_DDL } from '@/shared/services/db/schema';

import {
  applyContentMigration,
  applyUnit1Content,
  applyUnit12ExerciseBank,
  seedDatabase,
} from '@/shared/services/db/seed';

export const DATABASE_NAME = 'mlo.db';

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
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
    await seedDatabase(db);
    return;
  }

  if (currentVersion >= DATABASE_VERSION) {
    await db.execAsync(SCHEMA_DDL);
    return;
  }

  let version = currentVersion;

  if (version < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(DROP_ALL_DDL);
      await db.execAsync(SCHEMA_DDL);
      await db.execAsync('PRAGMA user_version = 2');
    });
    await seedDatabase(db);
    version = 2;
  }

  if (version < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`ALTER TABLE lessons ADD COLUMN content TEXT NOT NULL DEFAULT '[]'`);
      await db.execAsync('PRAGMA user_version = 3');
    });
    await applyContentMigration(db);
    version = 3;
  }

  if (version < 4) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`ALTER TABLE exercises ADD COLUMN config TEXT NOT NULL DEFAULT '{}'`);
      await db.execAsync('PRAGMA user_version = 4');
    });
    version = 4;
  }

  if (version < 5) {
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
        ALTER TABLE questions ADD COLUMN type TEXT NOT NULL DEFAULT 'mcq';
        ALTER TABLE questions ADD COLUMN config TEXT NOT NULL DEFAULT '{}';
        ALTER TABLE exercises ADD COLUMN explanation TEXT NOT NULL DEFAULT '';
      `);
      await db.execAsync('PRAGMA user_version = 5');
    });
    await applyUnit1Content(db, false);
    version = 5;
  }

  if (version < 6) {
    await applyUnit1Content(db, false);
    await db.execAsync('PRAGMA user_version = 6');
    version = 6;
  }

  if (version < 7) {
    await applyUnit12ExerciseBank(db);
    await db.execAsync('PRAGMA user_version = 7');
    version = 7;
  }

  if (version < 8) {
    await applyUnit1Content(db, false);
    await db.execAsync('PRAGMA user_version = 8');
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
    await applyUnit1Content(db, false);
    await applyUnit12ExerciseBank(db);
    await db.execAsync('PRAGMA user_version = 10');
    version = 10;
  }
}
