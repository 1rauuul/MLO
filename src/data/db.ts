import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, DROP_ALL_DDL, SCHEMA_DDL } from '@/models/schema';

import { applyContentMigration, applyUnit1Activities, seedDatabase } from './seed';

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
      await applyUnit1Activities(db);
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
