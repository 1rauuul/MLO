import type { SQLiteDatabase } from 'expo-sqlite';

import {
  countCompletedByUnit,
  markLessonCompleted,
  resetAccountProgress,
  selectCompletionMap,
  selectProgressMap,
} from '@/features/modules/model/progressRepository';

interface Calls {
  runAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  getAllAsync: jest.Mock;
  withTransactionAsync: jest.Mock;
}

function makeDb(overrides: Partial<Calls> = {}) {
  const calls: Calls = {
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 })),
    getFirstAsync: jest.fn(async () => null),
    getAllAsync: jest.fn(async () => []),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
    ...overrides,
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

describe('progressRepository', () => {
  describe('selectProgressMap', () => {
    it('mapea filas a un mapa lessonId -> boolean', async () => {
      const { db, calls } = makeDb({
        getAllAsync: jest.fn(async () => [
          { lesson_id: 'l1.1', completed: 1 },
          { lesson_id: 'l1.2', completed: 0 },
        ]),
      });

      const map = await selectProgressMap(db, 7);

      expect(map).toEqual({ 'l1.1': true, 'l1.2': false });
      expect(calls.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('JOIN lessons'),
        7,
        'base',
      );
    });

    it('devuelve un mapa vacío sin filas', async () => {
      const { db } = makeDb();
      await expect(selectProgressMap(db, 7)).resolves.toEqual({});
    });
  });

  describe('markLessonCompleted', () => {
    it('inserta con upsert y fecha actual', async () => {
      const { db, calls } = makeDb();

      await markLessonCompleted(db, 7, 'l1.3');

      expect(calls.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT(account_id, lesson_id)'),
        7,
        'l1.3',
        expect.any(String),
      );
    });
  });

  describe('countCompletedByUnit', () => {
    it('devuelve completadas y total por unidad', async () => {
      const { db } = makeDb({
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce({ total: 4 })
          .mockResolvedValueOnce({ completed: 2 }),
      });

      await expect(countCompletedByUnit(db, 7, 'u1')).resolves.toEqual({ completed: 2, total: 4 });
    });

    it('soporta totales nulos', async () => {
      const { db } = makeDb();

      await expect(countCompletedByUnit(db, 7, 'u1')).resolves.toEqual({ completed: 0, total: 0 });
    });
  });

  describe('resetAccountProgress', () => {
    it('borra progreso, resultados, intentos y ubicación en una transacción', async () => {
      const { db, calls } = makeDb();

      await resetAccountProgress(db, 7);

      const deleted = calls.runAsync.mock.calls.map(call => call[0] as string);
      expect(deleted).toEqual([
        expect.stringContaining('DELETE FROM module_progress'),
        expect.stringContaining('DELETE FROM evaluation_results'),
        expect.stringContaining('DELETE FROM attempts'),
        expect.stringContaining('DELETE FROM example_state'),
        expect.stringContaining('DELETE FROM last_location'),
      ]);
      expect(calls.withTransactionAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('selectCompletionMap', () => {
    function completionDb(attempt: { score_correct: number; score_total: number }) {
      return makeDb({
        getAllAsync: jest.fn(async (sql: string) => {
          if (sql.includes('FROM module_progress p')) {
            return [{ lesson_id: 'l1.2', completed: 1 }];
          }
          if (sql.includes('FROM example_state')) {
            return [
              {
                lesson_id: 'l1.2',
                payload: JSON.stringify({
                  drawExampleIds: ['e1'],
                  drawExerciseIds: ['e2'],
                  seenExampleIds: ['e1'],
                  exampleIndex: 0,
                }),
              },
            ];
          }
          if (sql.includes('FROM exercises')) {
            return [
              { id: 'e1', lesson_id: 'l1.2' },
              { id: 'e2', lesson_id: 'l1.2' },
            ];
          }
          if (sql.includes('FROM account_classes ac')) {
            return [];
          }
          if (sql.includes('FROM attempts')) {
            return [
              {
                source: 'practice',
                item_id: 'e2',
                lesson_id: 'l1.2',
                ...attempt,
              },
            ];
          }
          if (sql.includes('FROM evaluations e')) {
            return [{ lesson_id: 'l1.2', score: 80 }];
          }
          return [];
        }),
      });
    }

    it('completa cuando se cumplen las cuatro condiciones', async () => {
      const { db } = completionDb({ score_correct: 4, score_total: 5 });

      await expect(selectCompletionMap(db, 7)).resolves.toEqual({ 'l1.2': true });
    });

    it('no completa con menos de 80 en ejercicios', async () => {
      const { db } = completionDb({ score_correct: 79, score_total: 100 });

      await expect(selectCompletionMap(db, 7)).resolves.toEqual({ 'l1.2': false });
    });

    it('ignora las lecciones no leídas y no consulta el resto', async () => {
      const { db, calls } = makeDb({
        getAllAsync: jest.fn(async () => [{ lesson_id: 'l1.2', completed: 0 }]),
      });

      await expect(selectCompletionMap(db, 7)).resolves.toEqual({});
      expect(calls.getAllAsync).toHaveBeenCalledTimes(1);
    });
  });
});
