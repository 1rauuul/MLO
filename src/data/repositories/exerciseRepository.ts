import type { SQLiteDatabase } from 'expo-sqlite';

import type { Exercise, ExerciseType } from '@/models/entities';

interface ExerciseRow {
  id: string;
  lesson_id: string;
  type: ExerciseType;
  prompt: string;
  instructions: string;
  correct_order: string;
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
  return {
    id: row.id,
    lessonId: row.lesson_id,
    type: row.type,
    prompt: row.prompt,
    instructions: row.instructions,
    correctOrder,
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
  exerciseId: string,
  answer: string,
  isCorrect: boolean,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO results (exercise_id, answer, is_correct, created_at) VALUES (?, ?, ?, ?)',
    exerciseId,
    answer,
    isCorrect ? 1 : 0,
    new Date().toISOString(),
  );
}
