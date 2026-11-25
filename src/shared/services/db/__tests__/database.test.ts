import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateAndSeed } from '@/shared/services/db/database';

jest.mock('expo-crypto', () => ({
  randomUUID: () => '11111111-1111-4111-8111-111111111111',
}));

function makeDb(userVersion: number) {
  const statements: string[] = [];
  const db = {
    execAsync: async (sql: string) => {
      statements.push(sql);
    },
    getFirstAsync: async (sql: string) =>
      sql.includes('PRAGMA user_version') ? { user_version: userVersion } : null,
    getAllAsync: async () => [],
    runAsync: async (sql: string) => {
      statements.push(sql);
      return { changes: 1, lastInsertRowId: 0 };
    },
    withTransactionAsync: async (task: () => Promise<void>) => task(),
  } as unknown as SQLiteDatabase;
  return { db, statements };
}

describe('migrateAndSeed', () => {
  test('instalación nueva crea el esquema vacío, sin contenido empaquetado', async () => {
    const { db, statements } = makeDb(0);

    await migrateAndSeed(db);

    expect(statements.some(statement => statement === 'PRAGMA user_version = 24')).toBe(true);
    expect(statements.some(statement => statement.startsWith('INSERT INTO units'))).toBe(false);
    expect(statements.some(statement => statement.startsWith('INSERT INTO lessons'))).toBe(false);
    expect(statements.some(statement => statement.startsWith('INSERT INTO accounts'))).toBe(false);
  });

  test('v22 conserva contenido, clases y progreso y solo descarta cachés viejas', async () => {
    const { db, statements } = makeDb(21);

    await migrateAndSeed(db);

    const cleanup = statements.join('\n');
    expect(cleanup).toContain('DROP TABLE IF EXISTS remote_lessons');
    expect(cleanup).toContain('DROP TABLE IF EXISTS remote_catalogs');
    expect(cleanup).not.toContain('DELETE FROM module_progress');
    expect(cleanup).not.toContain('DELETE FROM attempts');
    expect(cleanup).not.toContain('DELETE FROM evaluation_results');
    expect(cleanup).not.toContain('DELETE FROM lessons');
    expect(cleanup).not.toContain('DELETE FROM account_classes');
    expect(cleanup).not.toContain('DELETE FROM account_courses');
    expect(cleanup).not.toContain('DELETE FROM remote_courses');
    expect(cleanup).not.toContain('DELETE FROM accounts');
    expect(cleanup).not.toContain('DELETE FROM learner_profile');
    expect(statements.some(statement => statement === 'PRAGMA user_version = 24')).toBe(true);
  });

  test('una base ya en v22 crea la sesión remota y el correo', async () => {
    const { db, statements } = makeDb(22);

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS remote_session'))).toBe(true);
    expect(statements.some(statement => statement.includes('ALTER TABLE accounts ADD COLUMN email'))).toBe(true);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 24')).toBe(true);
    expect(statements.some(statement => statement.startsWith('DELETE FROM'))).toBe(false);
    expect(statements.some(statement => statement.startsWith('INSERT INTO units'))).toBe(false);
  });

  test('una base ya en v23 solo añade el correo', async () => {
    const { db, statements } = makeDb(23);

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.includes('ALTER TABLE accounts ADD COLUMN email'))).toBe(true);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 24')).toBe(true);
    expect(statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS remote_session'))).toBe(false);
  });
});
