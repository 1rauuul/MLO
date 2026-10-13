import type { SQLiteDatabase } from 'expo-sqlite';

import { selectExercisesByLesson } from '@/features/exercises/model/exerciseRepository';

function makeDb(overrides: Record<string, jest.Mock> = {}) {
  const calls = {
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
    ...overrides,
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

const exerciseRow = {
  id: 'ord1.2',
  lesson_id: 'l1.2',
  type: 'order',
  prompt: 'Ordena',
  instructions: 'Instrucciones',
  correct_order: '["A","B"]',
  config: '{"bank":["x"]}',
  explanation: 'porque',
};

describe('exerciseRepository', () => {
  it('selectExercisesByLesson mapea y parsea JSON', async () => {
    const { db, calls } = makeDb({ getAllAsync: jest.fn(async () => [exerciseRow]) });

    const exercises = await selectExercisesByLesson(db, 'l1.2');

    expect(exercises[0]).toEqual({
      id: 'ord1.2',
      lessonId: 'l1.2',
      type: 'order',
      prompt: 'Ordena',
      instructions: 'Instrucciones',
      correctOrder: ['A', 'B'],
      config: { bank: ['x'] },
      explanation: 'porque',
    });
    expect(calls.getAllAsync).toHaveBeenCalledWith(expect.any(String), 'l1.2');
  });

  it('tolera correct_order y config inválidos', async () => {
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [
        { ...exerciseRow, correct_order: 'x', config: 'x', explanation: null },
      ]),
    });

    const exercises = await selectExercisesByLesson(db, 'l1.2');

    expect(exercises[0]!.correctOrder).toEqual([]);
    expect(exercises[0]!.config).toEqual({});
    expect(exercises[0]!.explanation).toBe('');
  });
});
