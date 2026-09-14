import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, SCHEMA_DDL } from '@/models/schema';

import { seedDatabase } from './seed';

export const DATABASE_NAME = 'mlo.db';

export async function migrateAndSeed(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync(SCHEMA_DDL);
  await seedDatabase(db);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
