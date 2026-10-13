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
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 10')).toBe(true);
  });

  test('instalación nueva siembra directo en la última versión sin ALTERs duplicados', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async () => ({ user_version: 0 }),
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.includes('ALTER TABLE lessons ADD COLUMN content'))).toBe(false);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 10')).toBe(true);
    expect(statements.some(statement => statement.startsWith('INSERT INTO units'))).toBe(true);
  });

  test('migra desde user_version=4 sin borrar attempts', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async () => ({ user_version: 4 }),
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.startsWith('DELETE FROM attempts'))).toBe(false);
    expect(statements.some(statement => statement.startsWith('DELETE FROM exercises'))).toBe(true);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 10')).toBe(true);
  });

  test('incluye la versión objetivo dentro de cada paso de migración', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async () => ({ user_version: 8 }),
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.filter(statement => statement.startsWith('PRAGMA user_version'))).toEqual([
      'PRAGMA user_version = 9',
      'PRAGMA user_version = 10',
    ]);
  });

  test('repara tablas faltantes cuando la versión ya está al día', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async () => ({ user_version: 10 }),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(
      statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS last_location')),
    ).toBe(true);
    expect(statements.some(statement => statement.startsWith('PRAGMA user_version'))).toBe(false);
  });

  test('el seed es idempotente para units y lessons', async () => {
    const statements: string[] = [];
    const db = {
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await seedDatabase(db);

    const unitInsert = statements.find(statement => statement.startsWith('INSERT INTO units'));
    const lessonInsert = statements.find(statement => statement.startsWith('INSERT INTO lessons'));
    expect(unitInsert).toContain('ON CONFLICT(id) DO NOTHING');
    expect(lessonInsert).toContain('ON CONFLICT(id) DO NOTHING');
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
