import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, DROP_ALL_DDL, SCHEMA_DDL } from '@/models/schema';

import {
  applyContentMigration,
  applyUnit1Content,
  applyUnit12ExerciseBank,
  seedDatabase,
} from './seed';

export const DATABASE_NAME = 'mlo.db';

export async function migrateAndSeed(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion < 2) {
    await db.execAsync(DROP_ALL_DDL);
    await db.execAsync(SCHEMA_DDL);
    await seedDatabase(db);
  } else {
    if (currentVersion < 3) {
      await db.execAsync(`ALTER TABLE lessons ADD COLUMN content TEXT NOT NULL DEFAULT '[]'`);
      await applyContentMigration(db);
    }
    if (currentVersion < 4) {
      await db.execAsync(`ALTER TABLE exercises ADD COLUMN config TEXT NOT NULL DEFAULT '{}'`);
    }
    if (currentVersion < 5) {
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
      await applyUnit1Content(db);
    }
    if (currentVersion < 6) {
      await applyUnit1Content(db);
    }
    if (currentVersion < 7) {
      await applyUnit12ExerciseBank(db);
    }
    if (currentVersion < 8) {
      await applyUnit1Content(db, false);
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
