import type { SQLiteDatabase } from 'expo-sqlite';

interface ProgressRow {
  lesson_id: string;
  completed: number;
}

export async function selectProgressMap(
  db: SQLiteDatabase,
  accountId: number,
): Promise<Record<string, boolean>> {
  const rows = await db.getAllAsync<ProgressRow>(
    'SELECT lesson_id, completed FROM module_progress WHERE account_id = ?',
    accountId,
  );
  const map: Record<string, boolean> = {};
  for (const row of rows) {
    map[row.lesson_id] = row.completed === 1;
  }
  return map;
}

export async function markLessonCompleted(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO module_progress (account_id, lesson_id, completed, updated_at) VALUES (?, ?, 1, ?)
     ON CONFLICT(account_id, lesson_id) DO UPDATE SET completed = 1, updated_at = excluded.updated_at`,
    accountId,
    lessonId,
    new Date().toISOString(),
  );
}

export async function countCompletedByUnit(
  db: SQLiteDatabase,
  accountId: number,
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
     WHERE l.unit_id = ? AND p.account_id = ? AND p.completed = 1`,
    unitId,
    accountId,
  );
  return { completed: completedRow?.completed ?? 0, total: totalRow?.total ?? 0 };
}

export async function resetAccountProgress(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM module_progress WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM evaluation_results WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM attempts WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM example_state WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM last_location WHERE account_id = ?', accountId);
  });
}
