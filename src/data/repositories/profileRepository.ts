import type { SQLiteDatabase } from 'expo-sqlite';

import type { LearnerProfile, LearningStyle } from '@/models/entities';

interface ProfileRow {
  id: number;
  learner_name: string;
  learning_style: LearningStyle;
  dark_mode: number;
  large_text: number;
}

export async function selectProfile(db: SQLiteDatabase): Promise<LearnerProfile | null> {
  const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM learner_profile WHERE id = 1');
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    learnerName: row.learner_name,
    learningStyle: row.learning_style,
    darkMode: row.dark_mode === 1,
    largeText: row.large_text === 1,
  };
}

export async function saveProfile(db: SQLiteDatabase, profile: LearnerProfile): Promise<void> {
  await db.runAsync(
    `INSERT INTO learner_profile (id, learner_name, learning_style, dark_mode, large_text)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       learner_name = excluded.learner_name,
       learning_style = excluded.learning_style,
       dark_mode = excluded.dark_mode,
       large_text = excluded.large_text`,
    profile.learnerName,
    profile.learningStyle,
    profile.darkMode ? 1 : 0,
    profile.largeText ? 1 : 0,
  );
}
