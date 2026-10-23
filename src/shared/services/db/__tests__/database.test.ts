import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateAndSeed } from '@/shared/services/db/database';
import { applyExerciseBank, seedDatabase } from '@/shared/services/db/seed';

describe('migrateAndSeed', () => {
  test('migra a v8 aplicando el banco de ejercicios sin borrar attempts', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push({ sql, params: [] });
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 6 },
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
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 14')).toBe(true);
  });

  test('instalación nueva siembra directo en la última versión sin ALTERs duplicados', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 0, lessons: 0 } : { user_version: 0 },
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.includes('ALTER TABLE lessons ADD COLUMN content'))).toBe(false);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 14')).toBe(true);
    expect(statements.some(statement => statement.startsWith('INSERT INTO units'))).toBe(true);
    expect(statements.findIndex(statement => statement.startsWith('INSERT INTO units'))).toBeLessThan(
      statements.indexOf('PRAGMA user_version = 14'),
    );
  });

  test('repara un catálogo vacío aunque la versión ya sea la última', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 0, lessons: 0 } : { user_version: 14 },
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.startsWith('INSERT INTO units'))).toBe(true);
    expect(statements.some(statement => statement.startsWith('INSERT INTO questions'))).toBe(true);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 14')).toBe(false);
  });

  test('seedDatabase abre una sola transacción', async () => {
    let depth = 0;
    const db = {
      runAsync: async () => ({ changes: 1, lastInsertRowId: 0 }),
      withTransactionAsync: async (task: () => Promise<void>) => {
        if (depth > 0) {
          throw new Error('nested transaction');
        }
        depth += 1;
        try {
          await task();
        } finally {
          depth -= 1;
        }
      },
    } as unknown as SQLiteDatabase;

    await expect(seedDatabase(db)).resolves.toBeUndefined();
  });

  test('migra desde user_version=4 sin borrar attempts', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 4 },
      getAllAsync: async () => [],
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.startsWith('DELETE FROM attempts'))).toBe(false);
    expect(statements.some(statement => statement.startsWith('DELETE FROM exercises'))).toBe(true);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 14')).toBe(true);
  });

  test('no repite ALTERs si una base v2 ya tiene las columnas actuales', async () => {
    const statements: string[] = [];
    const currentColumns = [
      { name: 'content' },
      { name: 'config' },
      { name: 'type' },
      { name: 'explanation' },
    ];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 2 },
      getAllAsync: async () => currentColumns,
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.startsWith('ALTER TABLE'))).toBe(false);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 14')).toBe(true);
  });

  test('incluye la versión objetivo dentro de cada paso de migración', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 8 },
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
      'PRAGMA user_version = 11',
      'PRAGMA user_version = 12',
      'PRAGMA user_version = 13',
      'PRAGMA user_version = 14',
    ]);
  });

  test('repara tablas faltantes cuando la versión ya está al día', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 14 },
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

    expect(lessonExercises).toEqual(
      expect.arrayContaining([
        'ord1.2',
        'fill1.2',
        'match1.2',
        'match1.2b',
        'cross1.2',
        'fill1.2b',
        'cross1.2a',
        'fill1.2c',
        'ord1.2a',
        'ordn',
        'crossq',
      ]),
    );
  });

  test('siembra en examples cuando el ejercicio del banco trae bloque example', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await applyExerciseBank(db, [
      {
        id: 'match1.2x',
        lessonId: 'l1.2',
        type: 'match',
        prompt: 'Enlaza cada atributo con su descripción',
        instructions: 'Toca un atributo y después su descripción.',
        correctOrder: [],
        config: { pairs: [{ left: 'a', right: 'b' }] },
        explanation: 'explica',
        example: {
          title: 'Atributos del buen software',
          steps: [{ text: 'paso', why: 'porqué' }],
          hints: ['pista'],
        },
      },
    ]);

    const exerciseInserts = statements.filter(statement => statement.sql.startsWith('INSERT INTO exercises'));
    const exampleInserts = statements.filter(statement => statement.sql.startsWith('INSERT INTO examples'));

    expect(exerciseInserts).toHaveLength(1);
    expect(exampleInserts).toHaveLength(1);
    const exampleParams = exampleInserts[0]?.params ?? [];
    expect(exampleParams[0]).toBe('match1.2x');
    expect(exampleParams[3]).toBe('Atributos del buen software');
    expect(JSON.parse(String(exampleParams[5]))).toEqual({ pairs: [{ left: 'a', right: 'b' }] });
    expect(JSON.parse(String(exampleParams[6]))).toEqual([{ text: 'paso', why: 'porqué' }]);
    expect(JSON.parse(String(exampleParams[7]))).toEqual(['pista']);
  });

  test('no siembra en examples si el ejercicio no trae bloque example', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await applyExerciseBank(db, [
      {
        id: 'ord1.2x',
        lessonId: 'l1.2',
        type: 'order',
        prompt: 'Ordena',
        instructions: 'Usa las flechas.',
        correctOrder: ['a', 'b'],
        config: {},
      },
    ]);

    expect(statements.filter(statement => statement.sql.startsWith('INSERT INTO examples'))).toHaveLength(0);
    expect(statements.filter(statement => statement.sql.startsWith('INSERT INTO exercises'))).toHaveLength(1);
  });
});
