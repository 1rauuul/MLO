import type { SQLiteDatabase } from 'expo-sqlite';

import type { Exercise, ExerciseConfig, ExerciseType } from '@/models/entities';

interface ExerciseRow {
  id: string;
  lesson_id: string;
  type: ExerciseType;
  prompt: string;
  instructions: string;
  correct_order: string;
  config: string;
  explanation: string;
}

function mapExercise(row: ExerciseRow): Exercise {
  let correctOrder: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.correct_order);
    if (Array.isArray(parsed)) {
      correctOrder = parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    correctOrder = [];
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
    lessonId: row.lesson_id,
    type: row.type,
    prompt: row.prompt,
    instructions: row.instructions,
    correctOrder,
    config,
    explanation: row.explanation ?? '',
  };
}

export async function selectExercisesByLesson(db: SQLiteDatabase, lessonId: string): Promise<Exercise[]> {
  const rows = await db.getAllAsync<ExerciseRow>(
    'SELECT * FROM exercises WHERE lesson_id = ? ORDER BY rowid',
    lessonId,
  );
  return rows.map(mapExercise);
}

export async function selectExercise(db: SQLiteDatabase, id: string): Promise<Exercise | null> {
  const row = await db.getFirstAsync<ExerciseRow>('SELECT * FROM exercises WHERE id = ?', id);
  return row ? mapExercise(row) : null;
}

export async function insertResult(
  db: SQLiteDatabase,
  accountId: number,
  exerciseId: string,
  answer: string,
  isCorrect: boolean,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO results (account_id, exercise_id, answer, is_correct, created_at) VALUES (?, ?, ?, ?, ?)',
    accountId,
    exerciseId,
    answer,
    isCorrect ? 1 : 0,
    new Date().toISOString(),
  );
}
