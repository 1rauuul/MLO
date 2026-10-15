import type { SQLiteDatabase } from 'expo-sqlite';

import type { ProgressBackup } from '@/features/profile/model/backup.logic';

interface ProgressRow {
  lesson_id: string;
  completed: number;
  updated_at: string;
}

interface AttemptRow {
  source: 'practice' | 'evaluation';
  item_id: string;
  item_type: string;
  lesson_id: string;
  correct: number;
  created_at: string;
}

interface EvaluationResultRow {
  evaluation_id: string;
  score: number;
  correct_count: number;
  total_count: number;
  created_at: string;
}

export async function selectProgressBackup(db: SQLiteDatabase, accountId: number): Promise<ProgressBackup> {
  const [moduleProgress, attempts, evaluationResults] = await Promise.all([
    db.getAllAsync<ProgressRow>(
      'SELECT lesson_id, completed, updated_at FROM module_progress WHERE account_id = ? ORDER BY lesson_id',
      accountId,
    ),
    db.getAllAsync<AttemptRow>(
      'SELECT source, item_id, item_type, lesson_id, correct, created_at FROM attempts WHERE account_id = ? ORDER BY id',
      accountId,
    ),
    db.getAllAsync<EvaluationResultRow>(
      'SELECT evaluation_id, score, correct_count, total_count, created_at FROM evaluation_results WHERE account_id = ? ORDER BY id',
      accountId,
    ),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    moduleProgress: moduleProgress.map(row => ({
      lessonId: row.lesson_id,
      completed: row.completed === 1,
      updatedAt: row.updated_at,
    })),
    attempts: attempts.map(row => ({
      source: row.source,
      itemId: row.item_id,
      itemType: row.item_type,
      lessonId: row.lesson_id,
      correct: row.correct === 1,
      createdAt: row.created_at,
    })),
    evaluationResults: evaluationResults.map(row => ({
      evaluationId: row.evaluation_id,
      score: row.score,
      correctCount: row.correct_count,
      totalCount: row.total_count,
      createdAt: row.created_at,
    })),
  };
}

export async function replaceProgressFromBackup(
  db: SQLiteDatabase,
  accountId: number,
  backup: ProgressBackup,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM module_progress WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM attempts WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM evaluation_results WHERE account_id = ?', accountId);

    for (const progress of backup.moduleProgress) {
      await db.runAsync(
        'INSERT INTO module_progress (account_id, lesson_id, completed, updated_at) VALUES (?, ?, ?, ?)',
        accountId,
        progress.lessonId,
        progress.completed ? 1 : 0,
        progress.updatedAt,
      );
    }

    for (const attempt of backup.attempts) {
      await db.runAsync(
        'INSERT INTO attempts (account_id, source, item_id, item_type, lesson_id, correct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        accountId,
        attempt.source,
        attempt.itemId,
        attempt.itemType,
        attempt.lessonId,
        attempt.correct ? 1 : 0,
        attempt.createdAt,
      );
    }

    for (const result of backup.evaluationResults) {
      await db.runAsync(
        'INSERT INTO evaluation_results (account_id, evaluation_id, score, correct_count, total_count, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        accountId,
        result.evaluationId,
        result.score,
        result.correctCount,
        result.totalCount,
        result.createdAt,
      );
    }
  });
}
