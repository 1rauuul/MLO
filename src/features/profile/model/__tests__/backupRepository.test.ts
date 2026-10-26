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
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await replaceProgressFromBackup(db, 7, {
      version: 2,
      exportedAt: '2026-10-15T00:00:00.000Z',
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
      getFirstAsync: jest.fn(async () => ({
        unit_id: 'u1',
        lesson_id: 'l1.2',
        lesson_code: '1.2',
        section: 'exercise',
        updated_at: '2026-01-01',
      })),
    } as unknown as SQLiteDatabase;

    const backup = await selectProgressBackup(db, 7);

    expect(backup.version).toBe(2);
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
