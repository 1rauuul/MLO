import type { SQLiteDatabase } from 'expo-sqlite';

import type { Complexity, Lesson, Unit, UnitColor } from '@/models/entities';

interface UnitRow {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: Complexity;
  duration: string;
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
  position: number;
}

function mapUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    duration: row.duration,
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
    position: row.position,
  };
}

export async function selectUnits(db: SQLiteDatabase): Promise<Unit[]> {
  const rows = await db.getAllAsync<UnitRow>('SELECT * FROM units ORDER BY number');
  return rows.map(mapUnit);
}

export async function selectUnit(db: SQLiteDatabase, id: string): Promise<Unit | null> {
  const row = await db.getFirstAsync<UnitRow>('SELECT * FROM units WHERE id = ?', id);
  return row ? mapUnit(row) : null;
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

export async function selectAllLessons(db: SQLiteDatabase): Promise<Lesson[]> {
  const rows = await db.getAllAsync<LessonRow>('SELECT * FROM lessons ORDER BY id');
  return rows.map(mapLesson);
}
