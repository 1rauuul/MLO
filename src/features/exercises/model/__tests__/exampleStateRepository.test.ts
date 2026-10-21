import type { SQLiteDatabase } from 'expo-sqlite';

import {
  EMPTY_EXAMPLE_STATE,
  saveExampleState,
  selectExampleState,
} from '@/features/exercises/model/exampleStateRepository';

describe('exampleStateRepository', () => {
  it('devuelve estado vacío si no hay fila', async () => {
    const db = { getFirstAsync: async () => null } as unknown as SQLiteDatabase;
    await expect(selectExampleState(db, 1, 'l1.2')).resolves.toEqual(EMPTY_EXAMPLE_STATE);
  });

  it('parsea el payload guardado', async () => {
    const payload = JSON.stringify({
      drawExampleIds: ['a', 'b'],
      drawExerciseIds: ['c'],
      seenExampleIds: ['a'],
    });
    const db = { getFirstAsync: async () => ({ payload }) } as unknown as SQLiteDatabase;
    await expect(selectExampleState(db, 1, 'l1.2')).resolves.toEqual({
      drawExampleIds: ['a', 'b'],
      drawExerciseIds: ['c'],
      seenExampleIds: ['a'],
      exampleIndex: 0,
    });
  });

  it('devuelve estado vacío ante payload corrupto', async () => {
    const db = { getFirstAsync: async () => ({ payload: 'not-json' }) } as unknown as SQLiteDatabase;
    await expect(selectExampleState(db, 1, 'l1.2')).resolves.toEqual(EMPTY_EXAMPLE_STATE);
  });

  it('guarda con upsert y JSON serializado', async () => {
    const calls: { sql: string; params: unknown[] }[] = [];
    const db = {
      runAsync: async (sql: string, ...params: unknown[]) => {
        calls.push({ sql, params });
        return { changes: 1, lastInsertRowId: 0 };
      },
    } as unknown as SQLiteDatabase;

    await saveExampleState(db, 1, 'l1.2', {
      drawExampleIds: ['a'],
      drawExerciseIds: ['b'],
      seenExampleIds: [],
      exampleIndex: 0,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.sql).toContain('ON CONFLICT(account_id, lesson_id) DO UPDATE');
    expect(calls[0]?.params[0]).toBe(1);
    expect(calls[0]?.params[1]).toBe('l1.2');
    expect(JSON.parse(String(calls[0]?.params[2]))).toEqual({
      drawExampleIds: ['a'],
      drawExerciseIds: ['b'],
      seenExampleIds: [],
      exampleIndex: 0,
    });
  });
});
