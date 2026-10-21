import type { SQLiteDatabase } from 'expo-sqlite';

export interface ExampleState {
  drawExampleIds: string[];
  drawExerciseIds: string[];
  seenExampleIds: string[];
  exampleIndex: number;
}

export const EMPTY_EXAMPLE_STATE: ExampleState = {
  drawExampleIds: [],
  drawExerciseIds: [],
  seenExampleIds: [],
  exampleIndex: 0,
};

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export async function selectExampleState(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
): Promise<ExampleState> {
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM example_state WHERE account_id = ? AND lesson_id = ?',
    accountId,
    lessonId,
  );
  if (!row) {
    return EMPTY_EXAMPLE_STATE;
  }
  try {
    const parsed = JSON.parse(row.payload) as Record<string, unknown>;
    return {
      drawExampleIds: parseStringArray(parsed.drawExampleIds),
      drawExerciseIds: parseStringArray(parsed.drawExerciseIds),
      seenExampleIds: parseStringArray(parsed.seenExampleIds),
      exampleIndex: typeof parsed.exampleIndex === 'number' ? parsed.exampleIndex : 0,
    };
  } catch {
    return EMPTY_EXAMPLE_STATE;
  }
}

export async function saveExampleState(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
  state: ExampleState,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO example_state (account_id, lesson_id, payload, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(account_id, lesson_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    accountId,
    lessonId,
    JSON.stringify(state),
    new Date().toISOString(),
  );
}
