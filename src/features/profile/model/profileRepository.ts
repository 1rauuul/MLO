import type { SQLiteDatabase } from 'expo-sqlite';

import type { LearnerProfile, LearningStyle } from '@/shared/model/entities';

interface ProfileRow {
  id: number;
  account_id: number;
  learning_style: LearningStyle;
  dark_mode: number;
  large_text: number;
}

function mapProfile(row: ProfileRow): LearnerProfile {
  return {
    id: row.id,
    accountId: row.account_id,
    learningStyle: row.learning_style,
    darkMode: row.dark_mode === 1,
    largeText: row.large_text === 1,
  };
}

export async function selectProfile(db: SQLiteDatabase, accountId: number): Promise<LearnerProfile | null> {
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT * FROM learner_profile WHERE account_id = ?',
    accountId,
  );
  return row ? mapProfile(row) : null;
}

export async function saveProfile(db: SQLiteDatabase, profile: LearnerProfile): Promise<void> {
  await db.runAsync(
    `INSERT INTO learner_profile (account_id, learning_style, dark_mode, large_text)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(account_id) DO UPDATE SET
       learning_style = excluded.learning_style,
       dark_mode = excluded.dark_mode,
       large_text = excluded.large_text`,
    profile.accountId,
    profile.learningStyle,
    profile.darkMode ? 1 : 0,
    profile.largeText ? 1 : 0,
  );
}

export async function createDefaultProfile(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO learner_profile (account_id, learning_style, dark_mode, large_text)
     VALUES (?, 'Pragmático', 1, 0)
     ON CONFLICT(account_id) DO NOTHING`,
    accountId,
  );
}
