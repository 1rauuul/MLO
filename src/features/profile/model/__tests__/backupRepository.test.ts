import type { SQLiteDatabase } from 'expo-sqlite';

import { replaceProgressFromBackup, selectProgressBackup } from '@/features/profile/model/backupRepository';

describe('replaceProgressFromBackup', () => {
  it('reemplaza también el sorteo de ejemplos y la ubicación', async () => {
    const runAsync = jest.fn(async (_sql: string, ..._params: unknown[]) => ({
      changes: 1,
      lastInsertRowId: 0,
    }));
    const db = {
      runAsync,
      getAllAsync: async (sql: string) =>
        sql.includes('lessons') ? [{ id: 'l1.2' }] : [{ id: 'ev1.2' }],
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await replaceProgressFromBackup(db, 7, {
      version: 3,
      exportedAt: '2026-10-15T00:00:00.000Z',
      group: null,
      moduleProgress: [],
      attempts: [],
      evaluationResults: [],
      exampleState: [
        {
          lessonId: 'l1.2',
          payload: {
            drawExampleIds: ['a'],
            drawExerciseIds: ['b'],
            seenExampleIds: [],
            exampleIndex: 0,
          },
          updatedAt: '2026-10-15T00:00:00.000Z',
        },
      ],
      lastLocation: {
        unitId: 'u1',
        lessonId: 'l1.2',
        lessonCode: '1.2',
        section: 'exercise',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    });

    const statements = runAsync.mock.calls.map(call => String(call[0]));
    expect(statements.filter(statement => statement.includes('DELETE FROM example_state'))).toHaveLength(1);
    expect(statements.filter(statement => statement.includes('DELETE FROM last_location'))).toHaveLength(1);
    expect(statements.some(statement => statement.includes('INSERT INTO example_state'))).toBe(true);
    expect(statements.some(statement => statement.includes('INSERT INTO last_location'))).toBe(true);
  });
});

describe('selectProgressBackup', () => {
  it('omite filas de lecciones que no existen en el dispositivo', async () => {
    const db = {
      getAllAsync: async () => [],
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 })),
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    const result = await replaceProgressFromBackup(db, 7, {
      version: 3,
      exportedAt: '2026-10-15T00:00:00.000Z',
      group: {
        code: 'abc123',
        catalogId: 'k7f3q',
        name: 'Grupo A',
        groupId: null,
        teacherName: null,
      },
      moduleProgress: [{ lessonId: 'k7f3q-l1.2', completed: true, updatedAt: '2026-01-01' }],
      attempts: [
        {
          source: 'practice',
          itemId: 'k7f3q-ord1',
          itemType: 'order',
          lessonId: 'k7f3q-l1.2',
          correct: true,
          scoreCorrect: 1,
          scoreTotal: 1,
          createdAt: '2026-01-01',
        },
      ],
      evaluationResults: [
        {
          evaluationId: 'k7f3q-ev1.2',
          score: 80,
          correctCount: 8,
          totalCount: 10,
          createdAt: '2026-01-01',
        },
      ],
      exampleState: [],
      lastLocation: null,
    });

    expect(result.omitted).toBe(3);
  });

  it('incluye sorteo, ubicación y puntaje parcial', async () => {
    const db = {
      getAllAsync: jest.fn(async (sql: string) => {
        if (sql.includes('module_progress')) {
          return [{ lesson_id: 'l1.2', completed: 1, updated_at: '2026-01-01' }];
        }
        if (sql.includes('FROM attempts')) {
          return [
            {
              source: 'practice',
              item_id: 'ord1.2',
              item_type: 'order',
              lesson_id: 'l1.2',
              correct: 0,
              score_correct: 3,
              score_total: 4,
              created_at: '2026-01-01',
            },
          ];
        }
        if (sql.includes('example_state')) {
          return [
            {
              lesson_id: 'l1.2',
              payload: JSON.stringify({
                drawExampleIds: ['a'],
                drawExerciseIds: ['b'],
                seenExampleIds: [],
                exampleIndex: 0,
              }),
              updated_at: '2026-01-01',
            },
          ];
        }
        return [];
      }),
      getFirstAsync: jest.fn(async (sql: string) =>
        sql.includes('account_group')
          ? {
              group_id: 'g1',
              group_code: 'abc123',
              catalog_id: 'k7f3q',
              group_name: 'Grupo A',
              teacher_name: 'Profesora Ríos',
            }
          : {
              unit_id: 'u1',
              lesson_id: 'l1.2',
              lesson_code: '1.2',
              section: 'exercise',
              updated_at: '2026-01-01',
            },
      ),
    } as unknown as SQLiteDatabase;

    const backup = await selectProgressBackup(db, 7);

    expect(backup.version).toBe(3);
    expect(backup.group).toEqual({
      code: 'abc123',
      catalogId: 'k7f3q',
      name: 'Grupo A',
      groupId: 'g1',
      teacherName: 'Profesora Ríos',
    });
    expect(backup.attempts[0]).toEqual({
      source: 'practice',
      itemId: 'ord1.2',
      itemType: 'order',
      lessonId: 'l1.2',
      correct: false,
      scoreCorrect: 3,
      scoreTotal: 4,
      createdAt: '2026-01-01',
    });
    expect(backup.exampleState[0]?.payload.drawExerciseIds).toEqual(['b']);
    expect(backup.lastLocation?.unitId).toBe('u1');
  });
});
