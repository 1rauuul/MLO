import type { SQLiteDatabase } from 'expo-sqlite';

import type { Example, ExerciseConfig, ExerciseType } from '@/models/entities';

interface ExampleRow {
  id: string;
  lesson_id: string;
  type: ExerciseType;
  title: string;
  prompt: string;
  config: string;
  steps: string;
  hints: string;
  explanation: string;
}

function parseConfig(raw: string): ExerciseConfig {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as ExerciseConfig) : {};
  } catch {
    return {};
  }
}

function parseSteps(raw: string): Example['steps'] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is { text: string; why: string } =>
          !!item && typeof item === 'object' && 'text' in item && 'why' in item,
        )
        .map(item => ({ text: String(item.text), why: String(item.why) }));
    }
  } catch {
    return [];
  }
  return [];
}

function parseHints(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    return [];
  }
  return [];
}

function mapExample(row: ExampleRow): Example {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    type: row.type,
    title: row.title,
    prompt: row.prompt,
    config: parseConfig(row.config),
    steps: parseSteps(row.steps),
    hints: parseHints(row.hints),
    explanation: row.explanation,
  };
}

export async function selectExamplesByLesson(db: SQLiteDatabase, lessonId: string): Promise<Example[]> {
  const rows = await db.getAllAsync<ExampleRow>(
    'SELECT * FROM examples WHERE lesson_id = ? ORDER BY rowid',
    lessonId,
  );
  return rows.map(mapExample);
}

export async function selectExample(db: SQLiteDatabase, id: string): Promise<Example | null> {
  const row = await db.getFirstAsync<ExampleRow>('SELECT * FROM examples WHERE id = ?', id);
  return row ? mapExample(row) : null;
}

export async function selectExampleByLesson(
  db: SQLiteDatabase,
  lessonId: string,
): Promise<Example | null> {
  const row = await db.getFirstAsync<ExampleRow>(
    'SELECT * FROM examples WHERE lesson_id = ? ORDER BY rowid LIMIT 1',
    lessonId,
  );
  return row ? mapExample(row) : null;
}
