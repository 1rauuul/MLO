import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateAndSeed } from './db';
import { seedDatabase } from './seed';

describe('migrateAndSeed', () => {
  test('migra a v8 aplicando el banco de ejercicios sin borrar attempts', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push({ sql, params: [] });
      },
      getFirstAsync: async () => ({ user_version: 6 }),
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    const insertedExerciseIds = statements
      .filter(statement => statement.sql.startsWith('INSERT INTO exercises'))
      .map(statement => statement.params[0]);

    expect(insertedExerciseIds).toEqual(expect.arrayContaining(['cross1.2a', 'fill1.2c', 'ord1.2a']));
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM attempts'))).toBe(false);
    expect(statements.some(statement => statement.sql.includes('CREATE TABLE IF NOT EXISTS last_location'))).toBe(true);
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 9')).toBe(true);
  });

  test('includes the merged exercises in a fresh seed for l1.2', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await seedDatabase(db);

    const lessonExercises = statements
      .filter(statement => statement.sql.startsWith('INSERT INTO exercises') && statement.params[1] === 'l1.2')
      .map(statement => statement.params[0]);

    expect(lessonExercises).toEqual([
      'ord1.2',
      'fill1.2',
      'match1.2',
      'match1.2b',
      'cross1.2',
      'fill1.2b',
      'cross1.2a',
      'fill1.2c',
      'ord1.2a',
    ]);
  });
});
