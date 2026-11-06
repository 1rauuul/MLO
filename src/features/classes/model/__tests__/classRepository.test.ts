import type { SQLiteDatabase } from 'expo-sqlite';

import {
  extraToExample,
  extraToExercise,
  removeAccountClass,
  saveAccountClass,
  selectAccountClasses,
  selectActiveGroup,
  selectClassMemberships,
  selectExtrasByLesson,
  selectLessonExtras,
  storeClassRelease,
} from '@/features/classes/model/classRepository';

const release = {
  schemaVersion: 2 as const,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  version: 2,
  hash: 'hash-2',
  publishedAt: '2026-10-27T00:00:00.000Z',
  lessons: [
    {
      lessonId: 'l1.2',
      code: '1.2',
      extras: [
        {
          id: 'x-exercise',
          type: 'exercise' as const,
          content: {
            id: 'x-exercise',
            lessonId: 'l1.2',
            type: 'order' as const,
            prompt: 'Ordena',
            instructions: '',
            correctOrder: ['uno', 'dos'],
            config: {},
            explanation: '',
          },
        },
        {
          id: 'x-lesson',
          type: 'lesson' as const,
          content: {
            title: 'Contexto',
            blocks: [{ type: 'p' as const, text: 'Texto extra' }],
          },
        },
      ],
    },
  ],
};

function makeDb(overrides: Record<string, unknown> = {}) {
  const statements: { sql: string; params: unknown[] }[] = [];
  const db = {
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      statements.push({ sql, params });
      return { changes: 1, lastInsertRowId: 0 };
    }),
    withTransactionAsync: async (task: () => Promise<void>) => task(),
    ...overrides,
  } as unknown as SQLiteDatabase;
  return { db, statements };
}

describe('classRepository', () => {
  it('lista solo membresías activas y grupos no archivados', async () => {
    const { db, statements } = makeDb();

    await selectAccountClasses(db, 7);

    expect(statements).toHaveLength(0);
    const sql = String(
      (db as unknown as { getAllAsync: jest.Mock }).getAllAsync.mock.calls[0]?.[0] ?? '',
    );
    expect(sql).toContain('ac.active = 1');
    expect(sql).toContain('COALESCE(c.archived, 0) = 0');
  });

  it('guarda una sola membresía activa por curso y desactiva la anterior', async () => {
    const { db, statements } = makeDb();

    await saveAccountClass(
      db,
      7,
      'ABC123',
      {
        schemaVersion: 2,
        class: { id: 'c2', name: 'Grupo B', teacherName: 'Docente' },
        published: null,
      },
      'base',
    );

    const deactivate = statements.find(statement =>
      statement.sql.startsWith('UPDATE account_classes SET active = 0'),
    );
    expect(deactivate?.params).toEqual([7, 'base', 'c2']);
    const membership = statements.find(statement =>
      statement.sql.startsWith('INSERT INTO account_classes'),
    );
    expect(membership?.sql).toContain('active');
    expect(membership?.params[3]).toBe('base');
  });

  it('salir marca inactiva la membresía sin borrarla', async () => {
    const { db, statements } = makeDb();

    await removeAccountClass(db, 7, 'c1');

    expect(statements).toEqual([
      {
        sql: 'UPDATE account_classes SET active = 0 WHERE account_id = ? AND class_id = ?',
        params: [7, 'c1'],
      },
    ]);
  });

  it('devuelve el grupo activo del curso y descarta archivados', async () => {
    const getAllAsync = jest.fn(async () => []);
    const getFirstAsync = jest.fn(async () => ({ class_id: 'c1' }));
    const { db } = makeDb({ getAllAsync, getFirstAsync });

    await expect(selectActiveGroup(db, 7, 'base')).resolves.toBe('c1');
    expect(String((getFirstAsync.mock.calls as unknown[][])[0]?.[0])).toContain(
      'COALESCE(c.archived, 0) = 0',
    );
  });

  it('selectClassMemberships incluye identidad y curso de cada membresía activa', async () => {
    const getAllAsync = jest.fn(async () => []);
    const { db } = makeDb({ getAllAsync });

    await selectClassMemberships(db);

    expect(String((getAllAsync.mock.calls as unknown[][])[0]?.[0])).toContain('ac.active = 1');
  });

  it('lista las clases de la cuenta con su metadata', async () => {
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [
        {
          class_id: 'c1',
          class_code: 'ABC123',
          class_name: 'Grupo A',
          teacher_name: 'Profesora Ríos',
          version: 2,
          joined_at: '2026-01-01',
        },
      ]),
    });

    await expect(selectAccountClasses(db, 7)).resolves.toEqual([
      {
        classId: 'c1',
        classCode: 'ABC123',
        className: 'Grupo A',
        teacherName: 'Profesora Ríos',
        version: 2,
        joinedAt: '2026-01-01',
      },
    ]);
  });

  it('guarda el release y reemplaza los extras de la clase', async () => {
    const { db, statements } = makeDb();

    await storeClassRelease(db, 'ABC123', release);

    const sql = statements.map(statement => statement.sql);
    expect(sql.some(statement => statement.includes('INSERT INTO class_cache'))).toBe(true);
    expect(sql.some(statement => statement.includes('DELETE FROM class_extras_cache'))).toBe(true);
    expect(sql.filter(statement => statement.includes('INSERT INTO class_extras_cache'))).toHaveLength(2);
    expect(statements.find(statement => statement.sql.includes('INSERT INTO class_cache'))?.params[1]).toBe(
      'ABC123',
    );
  });

  it('deduplica el mismo extra compartido por dos clases y suma sus etiquetas', async () => {
    const exercisePayload = JSON.stringify({
      type: 'order',
      prompt: 'Ordena',
      instructions: '',
      correctOrder: ['uno', 'dos'],
      config: {},
      explanation: '',
    });
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [
        {
          id: 'shared',
          lesson_id: 'l1.2',
          type: 'exercise',
          payload: exercisePayload,
          class_name: 'Grupo A',
          teacher_name: 'Ana',
        },
        {
          id: 'shared',
          lesson_id: 'l1.2',
          type: 'exercise',
          payload: exercisePayload,
          class_name: 'Grupo B',
          teacher_name: 'Ana',
        },
        {
          id: 'only-a',
          lesson_id: 'l1.2',
          type: 'lesson',
          payload: JSON.stringify({
            title: 'Contexto',
            blocks: [{ type: 'p', text: 'Texto' }],
          }),
          class_name: 'Grupo A',
          teacher_name: 'Ana',
        },
      ]),
    });

    const records = await selectExtrasByLesson(db, 7, 'l1.2');
    expect(records).toHaveLength(2);
    const shared = records.find(record => record.id === 'shared');
    expect(shared?.classNames).toEqual(['Grupo A', 'Grupo B']);

    const exercise = extraToExercise(shared!);
    expect(exercise).toEqual(
      expect.objectContaining({
        id: 'shared',
        type: 'order',
        className: 'Grupo A, Grupo B',
      }),
    );
  });

  it('filtra solo los bloques de lección', async () => {
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [
        {
          id: 'lesson',
          lesson_id: 'l1.2',
          type: 'lesson',
          payload: JSON.stringify({
            title: 'Contexto',
            blocks: [{ type: 'p', text: 'Texto' }],
          }),
          class_name: 'Grupo A',
          teacher_name: 'Ana',
        },
        {
          id: 'example',
          lesson_id: 'l1.2',
          type: 'example',
          payload: JSON.stringify({
            type: 'match',
            title: 'Ejemplo',
            prompt: 'Relaciona',
            config: {},
            steps: [{ text: 'Paso', why: 'Porque sí' }],
            hints: [],
            explanation: '',
          }),
          class_name: 'Grupo A',
          teacher_name: 'Ana',
        },
      ]),
    });

    const extras = await selectLessonExtras(db, 7, 'l1.2');
    expect(extras).toEqual([
      expect.objectContaining({ id: 'lesson', title: 'Contexto' }),
    ]);
  });

  it('convierte ejemplos extra conservando la clase', () => {
    const example = extraToExample({
      id: 'example',
      lessonId: 'l1.2',
      type: 'example',
      payload: JSON.stringify({
        type: 'match',
        title: 'Ejemplo',
        prompt: 'Relaciona',
        config: {
          pairs: [
            { left: 'a', right: '1' },
            { left: 'b', right: '2' },
          ],
        },
        steps: [{ text: 'Paso', why: 'Porque sí' }],
        hints: [],
        explanation: '',
      }),
      classNames: ['Grupo A'],
      teacherNames: ['Ana'],
    });

    expect(example).toEqual(
      expect.objectContaining({
        id: 'example',
        title: 'Ejemplo',
        className: 'Grupo A',
      }),
    );
  });
});
