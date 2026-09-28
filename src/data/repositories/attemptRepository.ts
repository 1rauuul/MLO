import type { SQLiteDatabase } from 'expo-sqlite';

import type { ActivityType, Attempt } from '@/models/entities';

interface AttemptRow {
  id: number;
  account_id: number;
  source: string;
  item_id: string;
  item_type: ActivityType;
  lesson_id: string;
  correct: number;
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
): Promise<void> {
  await db.runAsync(
    'INSERT INTO attempts (account_id, source, item_id, item_type, lesson_id, correct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    accountId,
    source,
    itemId,
    itemType,
    lessonId,
    correct ? 1 : 0,
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
