import type { SQLiteDatabase } from 'expo-sqlite';

import type { Complexity, Example } from '@/models/entities';

interface ExampleRow {
  id: string;
  lesson_id: string;
  complexity: Complexity;
  title: string;
  scenario: string;
  before_state: string;
  after_state: string;
}

function mapExample(row: ExampleRow): Example {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    complexity: row.complexity,
    title: row.title,
    scenario: row.scenario,
    before: row.before_state,
    after: row.after_state,
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
