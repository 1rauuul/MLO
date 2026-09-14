import type { SQLiteDatabase } from 'expo-sqlite';

interface ProgressRow {
  lesson_id: string;
  completed: number;
}

export async function selectProgressMap(db: SQLiteDatabase): Promise<Record<string, boolean>> {
  const rows = await db.getAllAsync<ProgressRow>('SELECT lesson_id, completed FROM module_progress');
  const map: Record<string, boolean> = {};
  for (const row of rows) {
    map[row.lesson_id] = row.completed === 1;
  }
  return map;
}

export async function markLessonCompleted(db: SQLiteDatabase, lessonId: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO module_progress (lesson_id, completed, updated_at) VALUES (?, 1, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET completed = 1, updated_at = excluded.updated_at`,
    lessonId,
    new Date().toISOString(),
  );
}

export async function countCompletedByUnit(
  db: SQLiteDatabase,
  unitId: string,
): Promise<{ completed: number; total: number }> {
  const totalRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM lessons WHERE unit_id = ?',
    unitId,
  );
  const completedRow = await db.getFirstAsync<{ completed: number }>(
    `SELECT COUNT(*) AS completed
     FROM lessons l
     JOIN module_progress p ON p.lesson_id = l.id
     WHERE l.unit_id = ? AND p.completed = 1`,
    unitId,
  );
  return { completed: completedRow?.completed ?? 0, total: totalRow?.total ?? 0 };
}
