import type { SQLiteDatabase } from 'expo-sqlite';

import {
  insertEvaluationResult,
  selectEvaluationByLesson,
  selectEvaluationSummaries,
  selectQuestions,
  selectRecentEvaluationResults,
} from '@/features/evaluations/model/evaluationRepository';

function makeDb(overrides: Record<string, jest.Mock> = {}) {
  const calls = {
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 })),
    getFirstAsync: jest.fn(async () => null),
    getAllAsync: jest.fn(async () => []),
    ...overrides,
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

describe('evaluationRepository', () => {
  it('selectEvaluationByLesson mapea la evaluación', async () => {
    const { db } = makeDb({
      getFirstAsync: jest.fn(async () => ({
        id: 'ev1.2',
        lesson_id: 'l1.2',
        title: 'Evaluación',
        description: 'desc',
      })),
    });

    await expect(selectEvaluationByLesson(db, 'l1.2')).resolves.toEqual({
      id: 'ev1.2',
      lessonId: 'l1.2',
      title: 'Evaluación',
      description: 'desc',
    });
  });

  it('selectEvaluationByLesson devuelve null sin fila', async () => {
    const { db } = makeDb();
    await expect(selectEvaluationByLesson(db, 'l1.2')).resolves.toBeNull();
  });

  it('selectQuestions parsea options y config', async () => {
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [
        {
          id: 'ev1.2-q1',
          evaluation_id: 'ev1.2',
          order_index: 0,
          type: 'mcq',
          config: '{}',
          prompt: '¿Qué es?',
          options: '["a","b"]',
          answer: 1,
          explanation: 'porque',
        },
      ]),
    });

    const questions = await selectQuestions(db, 'ev1.2');

    expect(questions[0]).toEqual({
      id: 'ev1.2-q1',
      evaluationId: 'ev1.2',
      orderIndex: 0,
      type: 'mcq',
      config: {},
      prompt: '¿Qué es?',
      options: ['a', 'b'],
      answer: 1,
      explanation: 'porque',
    });
  });

  it('selectQuestions tolera JSON inválido', async () => {
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [
        {
          id: 'q',
          evaluation_id: 'ev',
          order_index: 0,
          type: 'mcq',
          config: 'x',
          prompt: 'p',
          options: 'x',
          answer: 0,
          explanation: 'e',
        },
      ]),
    });

    const questions = await selectQuestions(db, 'ev');

    expect(questions[0]!.options).toEqual([]);
    expect(questions[0]!.config).toEqual({});
  });

  it('insertEvaluationResult redondea el score', async () => {
    const { db, calls } = makeDb();

    await insertEvaluationResult(db, 7, 'ev1.2', 66.6, 2, 3);

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO evaluation_results'),
      7,
      'ev1.2',
      67,
      2,
      3,
      expect.any(String),
    );
  });

  it('selectRecentEvaluationResults mapea y limita', async () => {
    const { db, calls } = makeDb({
      getAllAsync: jest.fn(async () => [
        {
          id: 1,
          evaluation_id: 'ev1.2',
          score: 80,
          correct_count: 4,
          total_count: 5,
          created_at: '2026-01-01',
        },
      ]),
    });

    await expect(selectRecentEvaluationResults(db, 7, 5)).resolves.toEqual([
      {
        id: 1,
        evaluationId: 'ev1.2',
        score: 80,
        correctCount: 4,
        totalCount: 5,
        createdAt: '2026-01-01',
      },
    ]);
    expect(calls.getAllAsync).toHaveBeenCalledWith(expect.any(String), 7, 5);
  });

  it('selectEvaluationSummaries mapea con joins', async () => {
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [
        {
          id: 'ev1.2',
          lesson_id: 'l1.2',
          title: 'Ev',
          description: 'd',
          lesson_title: 'Lección',
          unit_number: 1,
        },
      ]),
    });

    await expect(selectEvaluationSummaries(db)).resolves.toEqual([
      {
        id: 'ev1.2',
        lessonId: 'l1.2',
        title: 'Ev',
        description: 'd',
        lessonTitle: 'Lección',
        unitNumber: 1,
      },
    ]);
  });
});
