import type { SQLiteDatabase } from 'expo-sqlite';

import type { ActivityType, Attempt } from '@/shared/model/entities';

export interface AttemptScore {
  correct: number;
  total: number;
}

interface AttemptRow {
  id: number;
  account_id: number;
  source: string;
  item_id: string;
  item_type: ActivityType;
  lesson_id: string;
  correct: number;
  score_correct: number;
  score_total: number;
  created_at: string;
}

function mapAttempt(row: AttemptRow): Attempt {
  return {
    id: row.id,
    accountId: row.account_id,
    source: row.source === 'evaluation' ? 'evaluation' : 'practice',
    itemId: row.item_id,
    itemType: row.item_type,
    lessonId: row.lesson_id,
    correct: row.correct === 1,
    scoreCorrect: row.score_correct,
    scoreTotal: row.score_total,
    createdAt: row.created_at,
  };
}

export async function insertAttempt(
  db: SQLiteDatabase,
  accountId: number,
  source: 'practice' | 'evaluation',
  itemId: string,
  itemType: ActivityType,
  lessonId: string,
  correct: boolean,
  score: AttemptScore = { correct: correct ? 1 : 0, total: 1 },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO attempts (account_id, source, item_id, item_type, lesson_id, correct, score_correct, score_total, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    accountId,
    source,
    itemId,
    itemType,
    lessonId,
    correct ? 1 : 0,
    score.correct,
    score.total,
    new Date().toISOString(),
  );
}

export async function selectAttemptsByLesson(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
): Promise<Attempt[]> {
  const rows = await db.getAllAsync<AttemptRow>(
    'SELECT * FROM attempts WHERE account_id = ? AND lesson_id = ? ORDER BY id',
    accountId,
    lessonId,
  );
  return rows.map(mapAttempt);
}
