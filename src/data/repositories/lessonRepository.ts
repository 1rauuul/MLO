import type { SQLiteDatabase } from 'expo-sqlite';

import type { Complexity, ContentBlock, Lesson, Unit, UnitColor } from '@/models/entities';

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
  content: string;
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

export async function selectUnits(db: SQLiteDatabase): Promise<Unit[]> {
  const rows = await db.getAllAsync<UnitRow>('SELECT * FROM units ORDER BY number');
  return rows.map(mapUnit);
}

export async function selectLessonsByUnit(db: SQLiteDatabase, unitId: string): Promise<Lesson[]> {
  const rows = await db.getAllAsync<LessonRow>(
    'SELECT * FROM lessons WHERE unit_id = ? ORDER BY position',
    unitId,
  );
  return rows.map(mapLesson);
}

export async function selectLesson(db: SQLiteDatabase, id: string): Promise<Lesson | null> {
  const row = await db.getFirstAsync<LessonRow>('SELECT * FROM lessons WHERE id = ?', id);
  return row ? mapLesson(row) : null;
}
