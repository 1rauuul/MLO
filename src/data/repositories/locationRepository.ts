import type { SQLiteDatabase } from 'expo-sqlite';

import type { LocationSection } from '@/models/entities';

export interface LocationRecord {
  unitId: string | null;
  lessonId: string | null;
  lessonCode: string | null;
  section: LocationSection | null;
}

interface LocationRow {
  unit_id: string | null;
  lesson_id: string | null;
  lesson_code: string | null;
  section: string | null;
}

function mapLocation(row: LocationRow): LocationRecord {
  return {
    unitId: row.unit_id,
    lessonId: row.lesson_id,
    lessonCode: row.lesson_code,
    section: (row.section as LocationSection | null) ?? null,
  };
}

export async function selectLocation(
  db: SQLiteDatabase,
  accountId: number,
): Promise<LocationRecord | null> {
  const row = await db.getFirstAsync<LocationRow>(
    'SELECT unit_id, lesson_id, lesson_code, section FROM last_location WHERE account_id = ?',
    accountId,
  );
  return row ? mapLocation(row) : null;
}

export async function saveLocation(
  db: SQLiteDatabase,
  accountId: number,
  input: { unitId: string; lessonId: string; lessonCode?: string | null; section: LocationSection },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO last_location (account_id, unit_id, lesson_id, lesson_code, section, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_id) DO UPDATE SET
       unit_id = excluded.unit_id,
       lesson_id = excluded.lesson_id,
       lesson_code = excluded.lesson_code,
       section = excluded.section,
       updated_at = excluded.updated_at`,
    accountId,
    input.unitId,
    input.lessonId,
    input.lessonCode ?? null,
    input.section,
    new Date().toISOString(),
  );
}

export async function clearLocation(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.runAsync('DELETE FROM last_location WHERE account_id = ?', accountId);
}
