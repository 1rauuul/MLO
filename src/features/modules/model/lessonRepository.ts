import type { SQLiteDatabase } from 'expo-sqlite';

import type { Complexity, ContentBlock, Lesson, Unit, UnitColor } from '@/shared/model/entities';

interface UnitRow {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: Complexity;
  color: UnitColor;
}

interface LessonRow {
  id: string;
  unit_id: string;
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
