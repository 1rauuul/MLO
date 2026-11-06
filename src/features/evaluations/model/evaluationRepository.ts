import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ActivityType,
  Evaluation,
  EvaluationResult,
  Exercise,
  ExerciseConfig,
  Question,
} from '@/shared/model/entities';
import { mapExercise } from '@/features/exercises/model/exerciseRepository';

interface EvaluationRow {
  id: string;
  lesson_id: string;
  topic_id?: string;
  title: string;
  description: string;
  question_count?: number;
  exercise_count?: number;
}

interface QuestionRow {
  id: string;
  evaluation_id: string;
  order_index: number;
  type: ActivityType;
  config: string;
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
}

function mapEvaluation(row: EvaluationRow): Evaluation {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    topicId: row.topic_id ?? undefined,
    title: row.title,
    description: row.description,
    questionCount: row.question_count ?? 10,
    exerciseCount: row.exercise_count ?? 5,
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
  let config: ExerciseConfig = {};
  try {
    const parsedConfig: unknown = JSON.parse(row.config ?? '{}');
    if (parsedConfig && typeof parsedConfig === 'object') {
      config = parsedConfig as ExerciseConfig;
    }
  } catch {
    config = {};
  }
  return {
    id: row.id,
    evaluationId: row.evaluation_id,
    orderIndex: row.order_index,
    type: row.type ?? 'mcq',
    config,
    prompt: row.prompt,
    options,
    answer: row.answer,
    explanation: row.explanation,
  };
}

export async function selectEvaluationByLesson(
  db: SQLiteDatabase,
  lessonId: string,
  groupId: string | null = null,
): Promise<Evaluation | null> {
  const row = await db.getFirstAsync<EvaluationRow>(
    `SELECT * FROM evaluations WHERE lesson_id = ? AND archived_at IS NULL
       AND (group_id IS NULL${groupId ? ' OR group_id = ?' : ''})
     ORDER BY position, rowid LIMIT 1`,
    lessonId,
    ...(groupId ? [groupId] : []),
  );
  return row ? mapEvaluation(row) : null;
}

export async function selectEvaluationById(
  db: SQLiteDatabase,
  evaluationId: string,
  catalogId = 'base',
  groupId: string | null = null,
): Promise<Evaluation | null> {
  const row = await db.getFirstAsync<EvaluationRow>(
    `SELECT e.* FROM evaluations e
     JOIN lessons l ON l.id = e.lesson_id
     WHERE e.id = ? AND l.catalog_id = ? AND e.archived_at IS NULL AND l.archived_at IS NULL
       AND (e.group_id IS NULL${groupId ? ' OR e.group_id = ?' : ''})`,
    evaluationId,
    catalogId,
    ...(groupId ? [groupId] : []),
  );
  return row ? mapEvaluation(row) : null;
}

interface SelectedExerciseRow {
  id: string;
  lesson_id: string;
  topic_id?: string;
  type: Exercise['type'];
  prompt: string;
  instructions: string;
  correct_order: string;
  config: string;
  explanation: string;
}

export async function selectSelectedExercises(
  db: SQLiteDatabase,
  evaluationId: string,
): Promise<Exercise[]> {
  const rows = await db.getAllAsync<SelectedExerciseRow>(
    `SELECT e.* FROM evaluation_exercises ee
     JOIN exercises e ON e.id = ee.exercise_id
     WHERE ee.evaluation_id = ?
     ORDER BY e.position, e.id`,
    evaluationId,
  );
  return rows.map(mapExercise);
}

export async function selectQuestions(db: SQLiteDatabase, evaluationId: string): Promise<Question[]> {
  const rows = await db.getAllAsync<QuestionRow>(
    'SELECT * FROM questions WHERE evaluation_id = ? ORDER BY order_index',
    evaluationId,
  );
  return rows.map(mapQuestion);
}

export async function selectEvaluationsByTopic(
  db: SQLiteDatabase,
  topicId: string,
  catalogId = 'base',
  groupId: string | null = null,
): Promise<Evaluation[]> {
  const rows = await db.getAllAsync<EvaluationRow>(
    `SELECT e.* FROM evaluations e
     JOIN lessons l ON l.id = e.lesson_id
     WHERE e.topic_id = ? AND l.catalog_id = ? AND l.archived_at IS NULL
       AND e.archived_at IS NULL
       AND (e.group_id IS NULL${groupId ? ' OR e.group_id = ?' : ''})
     ORDER BY e.position, e.rowid`,
    topicId,
    catalogId,
    ...(groupId ? [groupId] : []),
  );
  return rows.map(mapEvaluation);
}

export async function selectEvaluationExercises(
  db: SQLiteDatabase,
  evaluationId: string,
): Promise<string[]> {
  const rows = await db.getAllAsync<{ exercise_id: string }>(
    'SELECT exercise_id FROM evaluation_exercises WHERE evaluation_id = ? ORDER BY rowid',
    evaluationId,
  );
  return rows.map(row => row.exercise_id);
}

export async function insertEvaluationResult(
  db: SQLiteDatabase,
  accountId: number,
  evaluationId: string,
  score: number,
  correctCount: number,
  totalCount: number,
): Promise<void> {
  // Cada intento agrega una fila; los resultados anteriores nunca se sobrescriben.
  await db.runAsync(
    'INSERT INTO evaluation_results (account_id, evaluation_id, score, correct_count, total_count, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    accountId,
    evaluationId,
    Math.round(score),
    correctCount,
    totalCount,
    new Date().toISOString(),
  );
}

export async function selectRecentEvaluationResults(
  db: SQLiteDatabase,
  accountId: number,
  limit = 5,
  catalogId = 'base',
): Promise<EvaluationResult[]> {
  const rows = await db.getAllAsync<EvaluationResultRow>(
    `SELECT er.id, er.evaluation_id, er.score, er.correct_count, er.total_count, er.created_at
     FROM evaluation_results er
     WHERE er.account_id = ?
       AND er.evaluation_id IN (
         SELECT e.id FROM evaluations e
         JOIN lessons l ON l.id = e.lesson_id
         WHERE l.catalog_id = ? AND e.archived_at IS NULL AND l.archived_at IS NULL
       )
     ORDER BY er.created_at DESC
     LIMIT ?`,
    accountId,
    catalogId,
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

/** Mejor score por lección; `null` si la evaluación existe pero no hay resultados. */
export async function selectEvaluationScoresByLesson(
  db: SQLiteDatabase,
  accountId: number,
): Promise<Record<string, number | null>> {
  const rows = await db.getAllAsync<{ lesson_id: string; score: number | null }>(
    `SELECT e.lesson_id AS lesson_id, MAX(er.score) AS score
       FROM evaluations e
       LEFT JOIN evaluation_results er ON er.evaluation_id = e.id AND er.account_id = ?
      WHERE e.archived_at IS NULL
      GROUP BY e.lesson_id`,
    accountId,
  );
  const map: Record<string, number | null> = {};
  for (const row of rows) {
    map[row.lesson_id] = row.score;
  }
  return map;
}

export interface EvaluationSummary {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  lessonTitle: string;
  unitNumber: number;
}

interface EvaluationSummaryRow {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  lesson_title: string;
  unit_number: number;
}

export async function selectEvaluationSummaries(
  db: SQLiteDatabase,
  catalogId = 'base',
): Promise<EvaluationSummary[]> {
  const rows = await db.getAllAsync<EvaluationSummaryRow>(
    `SELECT e.id, e.lesson_id, e.title, e.description, l.title AS lesson_title, u.number AS unit_number
     FROM evaluations e
     JOIN lessons l ON l.id = e.lesson_id
     JOIN units u ON u.id = l.unit_id
     WHERE l.catalog_id = ? AND e.archived_at IS NULL AND l.archived_at IS NULL AND u.archived_at IS NULL
     ORDER BY u.number, l.position`,
    catalogId,
  );
  return rows.map(row => ({
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    description: row.description,
    lessonTitle: row.lesson_title,
    unitNumber: row.unit_number,
  }));
}
