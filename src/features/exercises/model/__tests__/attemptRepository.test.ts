import type { SQLiteDatabase } from 'expo-sqlite';

import { insertAttempt, selectAttemptsByLesson } from '@/features/exercises/model/attemptRepository';

function makeDb(overrides: Record<string, jest.Mock> = {}) {
  const calls = {
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 })),
    getAllAsync: jest.fn(async () => []),
    ...overrides,
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

describe('attemptRepository', () => {
  it('insertAttempt guarda correct como entero', async () => {
    const { db, calls } = makeDb();

    await insertAttempt(db, 7, 'practice', 'ord1.2', 'order', 'l1.2', true);

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO attempts'),
      7,
      'practice',
      'ord1.2',
      'order',
      'l1.2',
      1,
      1,
      1,
      expect.any(String),
    );
  });

  it('insertAttempt guarda false como 0', async () => {
    const { db, calls } = makeDb();

    await insertAttempt(db, 7, 'evaluation', 'q1', 'mcq', 'l1.2', false);

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.any(String),
      7,
      'evaluation',
      'q1',
      'mcq',
      'l1.2',
      0,
      0,
      1,
      expect.any(String),
    );
  });

  it('insertAttempt guarda el puntaje parcial', async () => {
    const { db, calls } = makeDb();

    await insertAttempt(db, 7, 'practice', 'ord1.2', 'order', 'l1.2', false, {
      correct: 3,
      total: 4,
    });

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('score_correct'),
      7,
      'practice',
      'ord1.2',
      'order',
      'l1.2',
      0,
      3,
      4,
      expect.any(String),
    );
  });

  it('selectAttemptsByLesson mapea y normaliza source/correct', async () => {
    const { db, calls } = makeDb({
      getAllAsync: jest.fn(async () => [
        {
          id: 1,
          account_id: 7,
          source: 'practice',
          item_id: 'ord1.2',
          item_type: 'order',
          lesson_id: 'l1.2',
          correct: 1,
          score_correct: 1,
          score_total: 1,
          created_at: '2026-01-01',
        },
        {
          id: 2,
          account_id: 7,
          source: 'desconocido',
          item_id: 'q1',
          item_type: 'mcq',
          lesson_id: 'l1.2',
          correct: 0,
          score_correct: 0,
          score_total: 1,
          created_at: '2026-01-02',
        },
      ]),
    });

    const attempts = await selectAttemptsByLesson(db, 7, 'l1.2');

    expect(attempts[0]).toEqual({
      id: 1,
      accountId: 7,
      source: 'practice',
      itemId: 'ord1.2',
      itemType: 'order',
      lessonId: 'l1.2',
      correct: true,
      scoreCorrect: 1,
      scoreTotal: 1,
      createdAt: '2026-01-01',
    });
    expect(attempts[1]!.source).toBe('practice');
    expect(attempts[1]!.correct).toBe(false);
    expect(calls.getAllAsync).toHaveBeenCalledWith(expect.any(String), 7, 'l1.2');
  });
});
