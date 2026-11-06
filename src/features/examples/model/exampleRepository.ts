import type { SQLiteDatabase } from 'expo-sqlite';

import { extraToExample, selectExtrasByLesson } from '@/features/classes/model/classRepository';
import type { Example, ExerciseConfig, ExerciseType } from '@/shared/model/entities';

interface ExampleRow {
  id: string;
  lesson_id: string;
  topic_id?: string;
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
    topicId: row.topic_id ?? undefined,
    type: row.type,
    title: row.title,
    prompt: row.prompt,
    config: parseConfig(row.config),
    steps: parseSteps(row.steps),
    hints: parseHints(row.hints),
    explanation: row.explanation,
  };
}

export async function selectExamplesByLesson(
  db: SQLiteDatabase,
  lessonId: string,
  groupId: string | null = null,
): Promise<Example[]> {
  const rows = await db.getAllAsync<ExampleRow>(
    `SELECT * FROM examples WHERE lesson_id = ?
       AND (group_id IS NULL${groupId ? ' OR group_id = ?' : ''})
     ORDER BY position, rowid`,
    lessonId,
    ...(groupId ? [groupId] : []),
  );
  return rows.map(mapExample);
}

export async function selectExamplesByTopic(
  db: SQLiteDatabase,
  topicId: string,
  catalogId = 'base',
  groupId: string | null = null,
): Promise<Example[]> {
  const rows = await db.getAllAsync<ExampleRow>(
    `SELECT e.* FROM examples e
     JOIN lessons l ON l.id = e.lesson_id
     WHERE e.topic_id = ? AND l.catalog_id = ? AND l.archived_at IS NULL
       AND (e.group_id IS NULL${groupId ? ' OR e.group_id = ?' : ''})
     ORDER BY e.position, e.rowid`,
    topicId,
    catalogId,
    ...(groupId ? [groupId] : []),
  );
  return rows.map(mapExample);
}

/** Core + ejemplos extra de todas las clases de la cuenta. */
export async function selectExamplesWithExtras(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
  groupId: string | null = null,
): Promise<Example[]> {
  const [core, extras] = await Promise.all([
    selectExamplesByLesson(db, lessonId, groupId),
    selectExtrasByLesson(db, accountId, lessonId),
  ]);
  return [
    ...core,
    ...extras.map(extraToExample).filter((example): example is Example => example !== null),
  ];
}
