import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateAndSeed } from '@/shared/services/db/database';
import { applyExerciseBank, CONTENT_HASH, seedDatabase } from '@/shared/services/db/seed';

jest.mock('expo-crypto', () => ({
  randomUUID: () => '11111111-1111-4111-8111-111111111111',
}));

describe('migrateAndSeed', () => {
  test('migra a v8 aplicando el banco de ejercicios sin borrar attempts', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push({ sql, params: [] });
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 6 },
      getAllAsync: async () => [],
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
    expect(statements.some(statement => statement.sql.includes('CREATE TABLE IF NOT EXISTS class_cache'))).toBe(true);
    expect(statements.some(statement => statement.sql.includes('CREATE TABLE IF NOT EXISTS account_classes'))).toBe(true);
    expect(statements.some(statement => statement.sql.includes('DROP TABLE IF EXISTS account_group'))).toBe(true);
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 20')).toBe(true);
  });

  test('instalación nueva siembra directo en la última versión sin ALTERs duplicados', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 0, lessons: 0 } : { user_version: 0 },
      getAllAsync: async () => [],
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.includes('ALTER TABLE lessons ADD COLUMN content'))).toBe(false);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 20')).toBe(true);
    expect(
      statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS remote_courses')),
    ).toBe(true);
    expect(
      statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS account_courses')),
    ).toBe(true);
    expect(statements.some(statement => statement.startsWith('INSERT INTO units'))).toBe(true);
    expect(statements.findIndex(statement => statement.startsWith('INSERT INTO units'))).toBeLessThan(
      statements.indexOf('PRAGMA user_version = 20'),
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
      getAllAsync: async () => [],
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements.some(statement => statement.startsWith('INSERT INTO units'))).toBe(true);
    expect(statements.some(statement => statement.startsWith('INSERT INTO questions'))).toBe(true);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 20')).toBe(true);
  });

  test('la instalación nueva siembra sin anidar transacciones', async () => {
    let depth = 0;
    const db = {
      execAsync: async () => {},
      getFirstAsync: async () => ({ user_version: 0 }),
      getAllAsync: async () => [],
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

    await expect(migrateAndSeed(db)).resolves.toBeUndefined();
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
    expect(statements.some(statement => statement === 'PRAGMA user_version = 20')).toBe(true);
  });

  test('no repite ALTERs salvo las columnas nuevas de attempts', async () => {
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

    expect(statements.filter(statement => statement.startsWith('ALTER TABLE'))).toEqual([
      expect.stringContaining('ALTER TABLE attempts ADD COLUMN score_correct'),
      expect.stringContaining('ALTER TABLE attempts ADD COLUMN score_total'),
      expect.stringContaining('ALTER TABLE units ADD COLUMN catalog_id'),
      expect.stringContaining('ALTER TABLE units ADD COLUMN archived_at'),
      expect.stringContaining('ALTER TABLE lessons ADD COLUMN catalog_id'),
      expect.stringContaining('ALTER TABLE lessons ADD COLUMN archived_at'),
      expect.stringContaining('ALTER TABLE evaluations ADD COLUMN archived_at'),
      expect.stringContaining('ALTER TABLE evaluations ADD COLUMN question_count'),
      expect.stringContaining('ALTER TABLE evaluations ADD COLUMN exercise_count'),
      expect.stringContaining('ALTER TABLE accounts ADD COLUMN external_key'),
      expect.stringContaining('ALTER TABLE lessons ADD COLUMN topic_id'),
      expect.stringContaining('ALTER TABLE examples ADD COLUMN topic_id'),
      expect.stringContaining('ALTER TABLE exercises ADD COLUMN topic_id'),
      expect.stringContaining('ALTER TABLE evaluations ADD COLUMN topic_id'),
      expect.stringContaining('ALTER TABLE examples ADD COLUMN position'),
      expect.stringContaining('ALTER TABLE exercises ADD COLUMN position'),
      expect.stringContaining('ALTER TABLE evaluations ADD COLUMN position'),
      expect.stringContaining('ALTER TABLE remote_courses ADD COLUMN applied_hash'),
      expect.stringContaining('ALTER TABLE units ADD COLUMN group_id'),
      expect.stringContaining('ALTER TABLE topics ADD COLUMN group_id'),
      expect.stringContaining('ALTER TABLE lessons ADD COLUMN group_id'),
      expect.stringContaining('ALTER TABLE examples ADD COLUMN group_id'),
      expect.stringContaining('ALTER TABLE exercises ADD COLUMN group_id'),
      expect.stringContaining('ALTER TABLE evaluations ADD COLUMN group_id'),
      expect.stringContaining('ALTER TABLE account_classes ADD COLUMN course_catalog_id'),
      expect.stringContaining('ALTER TABLE account_classes ADD COLUMN active'),
      expect.stringContaining('ALTER TABLE class_cache ADD COLUMN course_catalog_id'),
      expect.stringContaining('ALTER TABLE class_cache ADD COLUMN archived'),
      expect.stringContaining('ALTER TABLE class_cache ADD COLUMN release_v3'),
      expect.stringContaining('ALTER TABLE class_cache ADD COLUMN applied_hash'),
    ]);
    expect(statements.some(statement => statement === 'PRAGMA user_version = 20')).toBe(true);
  });

  test('incluye la versión objetivo dentro de cada paso de migración', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 8 },
      getAllAsync: async () => [],
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
      'PRAGMA user_version = 15',
      'PRAGMA user_version = 16',
      'PRAGMA user_version = 17',
      'PRAGMA user_version = 18',
      'PRAGMA user_version = 19',
      'PRAGMA user_version = 20',
    ]);
  });

  test('al cambiar el contenido incluido se reaplican las lecciones remotas del curso base', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async () => {},
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)')
          ? { units: 5, lessons: 24 }
          : sql.includes('FROM meta')
            ? { value: 'hash-viejo' }
            : { user_version: 16 },
      getAllAsync: async () => [],
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(statements).toContain(
      "UPDATE remote_lessons SET applied_hash = NULL WHERE catalog_id = 'base'",
    );
  });

  test('el arranque no hace llamadas de red', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const db = {
      execAsync: async () => {},
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)')
          ? { units: 5, lessons: 24 }
          : sql.includes('FROM meta')
            ? { value: CONTENT_HASH }
            : { user_version: 16 },
      getAllAsync: async () => [],
      runAsync: async () => ({ changes: 1, lastInsertRowId: 0 }),
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  test('repara tablas faltantes cuando la versión ya está al día', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)')
          ? { units: 5, lessons: 24 }
          : sql.includes('FROM meta')
            ? { value: CONTENT_HASH }
            : { user_version: 20 },
      getAllAsync: async () => [],
      runAsync: async () => ({ changes: 1, lastInsertRowId: 0 }),
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(
      statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS last_location')),
    ).toBe(true);
    expect(statements.some(statement => statement.startsWith('PRAGMA user_version'))).toBe(false);
  });

  test('v17 rellena la identidad estable de las cuentas existentes', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push({ sql, params: [] });
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 16 },
      getAllAsync: async (sql: string) =>
        sql.includes('FROM accounts') ? [{ id: 7, external_key: '' }] : [],
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    const backfill = statements.find(statement =>
      statement.sql.startsWith('UPDATE accounts SET external_key'),
    );
    expect(backfill?.params[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(backfill?.params[1]).toBe(7);
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 20')).toBe(true);
  });

  test('v18 crea cursos remotos, siembra el base y conserva el progreso', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push({ sql, params: [] });
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 17 },
      getAllAsync: async () => [],
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(
      statements.some(statement =>
        statement.sql.includes('CREATE TABLE IF NOT EXISTS remote_courses'),
      ),
    ).toBe(true);
    expect(
      statements.some(statement =>
        statement.sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_account_courses_active'),
      ),
    ).toBe(true);

    const base = statements.find(statement =>
      statement.sql.startsWith('INSERT INTO remote_courses'),
    );
    expect(base?.sql).toContain("'base', 'Contenido base', 'published'");
    expect(base?.sql).toContain('0, 1, NULL');
    expect(base?.params).toHaveLength(1);

    const access = statements.find(statement =>
      statement.sql.startsWith('INSERT INTO account_courses'),
    );
    expect(access?.sql).toContain('FROM accounts');
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 20')).toBe(true);

    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM attempts'))).toBe(false);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM module_progress'))).toBe(false);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM lessons'))).toBe(false);
  });

  test('v19 crea topics, topic_id y evaluation_exercises con backfill', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push({ sql, params: [] });
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 25 } : { user_version: 18 },
      getAllAsync: async () => [],
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    expect(
      statements.some(statement => statement.sql.includes('CREATE TABLE IF NOT EXISTS topics')),
    ).toBe(true);
    expect(
      statements.some(statement =>
        statement.sql.includes('CREATE TABLE IF NOT EXISTS evaluation_exercises'),
      ),
    ).toBe(true);
    for (const sql of [
      'ALTER TABLE lessons ADD COLUMN topic_id TEXT',
      'ALTER TABLE examples ADD COLUMN topic_id TEXT',
      'ALTER TABLE exercises ADD COLUMN topic_id TEXT',
      'ALTER TABLE evaluations ADD COLUMN topic_id TEXT',
      'ALTER TABLE examples ADD COLUMN position INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE exercises ADD COLUMN position INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE evaluations ADD COLUMN position INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE remote_courses ADD COLUMN applied_hash TEXT',
    ]) {
      expect(statements.some(statement => statement.sql === sql)).toBe(true);
    }
    for (const table of ['examples', 'exercises', 'evaluations']) {
      expect(
        statements.some(statement => statement.sql === `UPDATE ${table} SET position = rowid`),
      ).toBe(true);
    }

    const backfill = statements.find(statement =>
      statement.sql.startsWith('INSERT INTO topics'),
    );
    expect(backfill?.sql).toContain("'t-' || id");
    expect(backfill?.sql).toContain('FROM lessons WHERE topic_id IS NULL');
    expect(
      statements.some(statement =>
        statement.sql.startsWith("UPDATE lessons SET topic_id = 't-' || id"),
      ),
    ).toBe(true);
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 20')).toBe(true);

    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM attempts'))).toBe(false);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM module_progress'))).toBe(false);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM evaluation_results'))).toBe(false);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM lessons'))).toBe(false);
  });

  test('v20 añade grupo, archivo y membresía activa sin borrar progreso', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push({ sql, params: [] });
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 25 } : { user_version: 19 },
      getAllAsync: async () => [],
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    for (const sql of [
      'ALTER TABLE units ADD COLUMN group_id TEXT',
      'ALTER TABLE topics ADD COLUMN group_id TEXT',
      'ALTER TABLE lessons ADD COLUMN group_id TEXT',
      'ALTER TABLE examples ADD COLUMN group_id TEXT',
      'ALTER TABLE exercises ADD COLUMN group_id TEXT',
      'ALTER TABLE evaluations ADD COLUMN group_id TEXT',
      "ALTER TABLE account_classes ADD COLUMN course_catalog_id TEXT NOT NULL DEFAULT 'base'",
      'ALTER TABLE account_classes ADD COLUMN active INTEGER NOT NULL DEFAULT 1',
      "ALTER TABLE class_cache ADD COLUMN course_catalog_id TEXT NOT NULL DEFAULT 'base'",
      'ALTER TABLE class_cache ADD COLUMN archived INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE class_cache ADD COLUMN release_v3 TEXT',
      'ALTER TABLE class_cache ADD COLUMN applied_hash TEXT',
    ]) {
      expect(statements.some(statement => statement.sql === sql)).toBe(true);
    }
    expect(
      statements.some(statement =>
        statement.sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_account_classes_active_course'),
      ),
    ).toBe(true);
    expect(
      statements.some(statement =>
        statement.sql.startsWith('UPDATE account_classes SET active = 0'),
      ),
    ).toBe(true);
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 20')).toBe(true);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM attempts'))).toBe(false);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM module_progress'))).toBe(false);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM evaluation_results'))).toBe(false);
    expect(statements.some(statement => statement.sql.startsWith('DELETE FROM lessons'))).toBe(false);
  });

  test('el seed actualiza units y lessons sin duplicar filas', async () => {
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
    expect(unitInsert).toContain('ON CONFLICT(id) DO UPDATE SET');
    expect(lessonInsert).toContain('ON CONFLICT(id) DO UPDATE SET');
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

  test('v15 re-mapea los ids del banco y actualiza attempts', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push({ sql, params: [] });
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 14 },
      getAllAsync: async (sql: string) =>
        sql.includes('FROM questions')
          ? [{ id: 'ev1.2-bank-q1', prompt: '¿Cuál es un atributo esencial del buen software?' }]
          : [],
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await migrateAndSeed(db);

    const remap = statements.find(statement => statement.sql.startsWith('UPDATE attempts SET item_id'));
    expect(remap?.params).toEqual(['ev1.2-bank-q01', 'ev1.2-bank-q1']);
    expect(
      statements.some(
        statement =>
          statement.sql === 'DELETE FROM questions WHERE id = ?' &&
          statement.params[0] === 'ev1.2-bank-q1',
      ),
    ).toBe(true);
    expect(statements.some(statement => statement.sql === 'PRAGMA user_version = 20')).toBe(true);
  });

  test('el contenido usa upsert en vez de ignorar conflictos', async () => {
    const statements: string[] = [];
    const db = {
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await seedDatabase(db);

    for (const table of ['units', 'lessons', 'examples', 'exercises', 'evaluations', 'questions']) {
      const insert = statements.find(statement => statement.startsWith(`INSERT INTO ${table}`));
      expect(insert).toContain('ON CONFLICT(id) DO UPDATE SET');
    }
  });

  test('el seed elimina huérfanos solo en las lecciones gestionadas', async () => {
    const statements: { sql: string; params: unknown[] }[] = [];
    const db = {
      runAsync: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await seedDatabase(db);

    const exerciseCleanup = statements.find(statement => statement.sql.startsWith('DELETE FROM exercises'));
    const exampleCleanup = statements.find(statement => statement.sql.startsWith('DELETE FROM examples'));
    const questionCleanup = statements.find(statement => statement.sql.startsWith('DELETE FROM questions'));
    for (const cleanup of [exerciseCleanup, exampleCleanup, questionCleanup]) {
      expect(cleanup?.sql).toContain('NOT IN');
    }
    expect(exerciseCleanup?.params.slice(0, 4)).toEqual(['l1.1', 'l1.2', 'l1.3', 'l1.4']);
    expect(questionCleanup?.params.slice(0, 4)).toEqual(['ev1.1', 'ev1.2', 'ev1.3', 'ev1.4']);
  });

  test('un error durante la migración no marca user_version=15', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (sql: string) => {
        statements.push(sql);
      },
      getFirstAsync: async (sql: string) =>
        sql.includes('COUNT(*)') ? { units: 5, lessons: 24 } : { user_version: 14 },
      getAllAsync: async (sql: string) =>
        sql.includes('FROM questions')
          ? [{ id: 'ev1.2-bank-q1', prompt: '¿Cuál es un atributo esencial del buen software?' }]
          : [],
      runAsync: async (sql: string) => {
        statements.push(sql);
        if (sql.startsWith('UPDATE attempts')) {
          throw new Error('migration failed');
        }
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await expect(migrateAndSeed(db)).rejects.toThrow('migration failed');
    expect(statements.some(statement => statement === 'PRAGMA user_version = 20')).toBe(false);
  });

  test('ejecutar el seed dos veces produce los mismos conteos', async () => {
    const statements: string[] = [];
    const db = {
      runAsync: async (sql: string) => {
        statements.push(sql);
        return { changes: 1, lastInsertRowId: 0 };
      },
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await seedDatabase(db);
    const first = statements.filter(statement => statement.startsWith('INSERT INTO')).length;
    statements.length = 0;
    await seedDatabase(db);
    const second = statements.filter(statement => statement.startsWith('INSERT INTO')).length;

    expect(second).toBe(first);
  });
});
