import type { SQLiteDatabase } from 'expo-sqlite';

import type { Evaluation, EvaluationResult, Question } from '@/models/entities';

interface EvaluationRow {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
}

interface QuestionRow {
  id: string;
  evaluation_id: string;
  order_index: number;
  prompt: string;
  options: string;
  answer: number;
  explanation: string;
}

interface EvaluationResultRow {
  id: number;
  evaluation_id: string;
  score: number;
  correct_count: number;
  total_count: number;
  created_at: string;
  title: string;
}

function mapEvaluation(row: EvaluationRow): Evaluation {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    description: row.description,
  };
}

function mapQuestion(row: QuestionRow): Question {
  let options: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.options);
    if (Array.isArray(parsed)) {
      options = parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    options = [];
  }
  return {
    id: row.id,
    evaluationId: row.evaluation_id,
    orderIndex: row.order_index,
    prompt: row.prompt,
    options,
    answer: row.answer,
    explanation: row.explanation,
  };
}

export async function selectEvaluationByLesson(
  db: SQLiteDatabase,
  lessonId: string,
): Promise<Evaluation | null> {
  const row = await db.getFirstAsync<EvaluationRow>(
    'SELECT * FROM evaluations WHERE lesson_id = ? ORDER BY rowid LIMIT 1',
    lessonId,
  );
  return row ? mapEvaluation(row) : null;
}

export async function selectQuestions(db: SQLiteDatabase, evaluationId: string): Promise<Question[]> {
  const rows = await db.getAllAsync<QuestionRow>(
    'SELECT * FROM questions WHERE evaluation_id = ? ORDER BY order_index',
    evaluationId,
  );
  return rows.map(mapQuestion);
}

export async function insertEvaluationResult(
  db: SQLiteDatabase,
  evaluationId: string,
  score: number,
  correctCount: number,
  totalCount: number,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO evaluation_results (evaluation_id, score, correct_count, total_count, created_at) VALUES (?, ?, ?, ?, ?)',
    evaluationId,
    Math.round(score),
    correctCount,
    totalCount,
    new Date().toISOString(),
  );
}

export async function selectRecentEvaluationResults(
  db: SQLiteDatabase,
  limit = 5,
): Promise<EvaluationResult[]> {
  const rows = await db.getAllAsync<EvaluationResultRow>(
    `SELECT er.id, er.evaluation_id, er.score, er.correct_count, er.total_count, er.created_at, e.title
     FROM evaluation_results er
     JOIN evaluations e ON e.id = er.evaluation_id
     ORDER BY er.created_at DESC
     LIMIT ?`,
    limit,
  );
  return rows.map(row => ({
    id: row.id,
    evaluationId: row.evaluation_id,
    score: row.score,
    correctCount: row.correct_count,
    totalCount: row.total_count,
    createdAt: row.created_at,
  }));
}
