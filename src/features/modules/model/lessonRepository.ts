import type { SQLiteDatabase } from 'expo-sqlite';

import type { Complexity, ContentBlock, Lesson, Topic, Unit, UnitColor } from '@/shared/model/entities';

interface UnitRow {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: Complexity;
  color: UnitColor;
}

interface TopicRow {
  id: string;
  unit_id: string;
  title: string;
  summary: string;
  position: number;
}

interface LessonRow {
  id: string;
  unit_id: string;
  topic_id?: string;
  code: string;
  title: string;
  eyebrow: string;
  body: string;
  code_sample: string;
  context_title: string;
  context_body: string;
  synthesis: string;
  content?: string;
  position: number;
}

function mapUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    color: row.color,
  };
}

function mapLesson(row: LessonRow): Lesson {
  let synthesis: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.synthesis);
    if (Array.isArray(parsed)) {
      synthesis = parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    synthesis = [];
  }
  let content: ContentBlock[] = [];
  try {
    const parsedContent: unknown = JSON.parse(row.content ?? '[]');
    if (Array.isArray(parsedContent)) {
      content = parsedContent as ContentBlock[];
    }
  } catch {
    content = [];
  }
  return {
    id: row.id,
    unitId: row.unit_id,
    topicId: row.topic_id ?? undefined,
    code: row.code,
    title: row.title,
    eyebrow: row.eyebrow,
    body: row.body,
    codeSample: row.code_sample,
    contextTitle: row.context_title,
    contextBody: row.context_body,
    synthesis,
    content,
    position: row.position,
  };
}

export async function selectUnits(
  db: SQLiteDatabase,
  catalogId = 'base',
): Promise<Unit[]> {
  const rows = await db.getAllAsync<UnitRow>(
    'SELECT * FROM units WHERE catalog_id = ? AND archived_at IS NULL ORDER BY number',
    catalogId,
  );
  return rows.map(mapUnit);
}

function mapTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    unitId: row.unit_id,
    title: row.title,
    summary: row.summary,
    position: row.position,
  };
}

export async function selectTopics(
  db: SQLiteDatabase,
  catalogId = 'base',
): Promise<Topic[]> {
  const rows = await db.getAllAsync<TopicRow>(
    `SELECT id, unit_id, title, summary, position FROM topics
     WHERE catalog_id = ? AND archived_at IS NULL
     ORDER BY position, id`,
    catalogId,
  );
  return rows.map(mapTopic);
}

export async function selectTopic(
  db: SQLiteDatabase,
  id: string,
  catalogId = 'base',
): Promise<Topic | null> {
  const row = await db.getFirstAsync<TopicRow>(
    `SELECT id, unit_id, title, summary, position FROM topics
     WHERE id = ? AND catalog_id = ? AND archived_at IS NULL`,
    id,
    catalogId,
  );
  return row ? mapTopic(row) : null;
}

export async function selectLessonsByTopic(
  db: SQLiteDatabase,
  topicId: string,
  catalogId = 'base',
): Promise<Lesson[]> {
  const rows = await db.getAllAsync<LessonRow>(
    `SELECT id, unit_id, topic_id, code, title, eyebrow, body, code_sample, context_title,
            context_body, synthesis, content, position
     FROM lessons
     WHERE topic_id = ? AND catalog_id = ? AND archived_at IS NULL
     ORDER BY position, code, id`,
    topicId,
    catalogId,
  );
  return rows.map(mapLesson);
}

// The catalog only needs metadata; full richContent is loaded by selectLesson.
export async function selectLessons(
  db: SQLiteDatabase,
  catalogId = 'base',
): Promise<Lesson[]> {
  const rows = await db.getAllAsync<LessonRow>(
    `SELECT id, unit_id, code, title, eyebrow, body, code_sample, context_title,
            context_body, synthesis, position
     FROM lessons
     WHERE catalog_id = ? AND archived_at IS NULL
     ORDER BY unit_id, position`,
    catalogId,
  );
  return rows.map(mapLesson);
}

export async function selectLesson(
  db: SQLiteDatabase,
  id: string,
  catalogId = 'base',
): Promise<Lesson | null> {
  const row = await db.getFirstAsync<LessonRow>(
    'SELECT * FROM lessons WHERE id = ? AND catalog_id = ? AND archived_at IS NULL',
    id,
    catalogId,
  );
  return row ? mapLesson(row) : null;
}
