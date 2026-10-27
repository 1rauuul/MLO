import type { SQLiteDatabase } from 'expo-sqlite';

import { applyLessonPayload } from '@/shared/services/db/seed';
import type { RemoteLessonPayload } from '@/shared/services/content/remote/validateLessonPayload';

interface StagedRow {
  catalog_id: string;
  lesson_id: string;
  hash: string;
  payload: string;
}

/**
 * Aplica el contenido ya validado y guardado en `remote_lessons`. Es local:
 * nunca hace red. Una lección que falla queda pendiente para el próximo arranque.
 */
export interface StagedApplyResult {
  failed: string[];
}

export async function applyStagedContent(
  db: SQLiteDatabase,
  catalogId?: string,
): Promise<StagedApplyResult> {
  const failed: string[] = [];
  const rows = catalogId
    ? await db.getAllAsync<StagedRow>(
        `SELECT catalog_id, lesson_id, hash, payload FROM remote_lessons
         WHERE catalog_id = ? AND (applied_hash IS NULL OR applied_hash != hash)`,
        catalogId,
      )
    : await db.getAllAsync<StagedRow>(
        `SELECT catalog_id, lesson_id, hash, payload FROM remote_lessons
         WHERE applied_hash IS NULL OR applied_hash != hash`,
      );

  for (const row of rows) {
    let payload: RemoteLessonPayload;
    try {
      payload = JSON.parse(row.payload) as RemoteLessonPayload;
    } catch {
      continue;
    }
    try {
      await applyLessonPayload(db, payload);
      await db.runAsync(
        'UPDATE remote_lessons SET applied_hash = ? WHERE catalog_id = ? AND lesson_id = ?',
        row.hash,
        row.catalog_id,
        row.lesson_id,
      );
    } catch (caught) {
      failed.push(row.lesson_id);
      if (__DEV__) {
        console.warn(`[content] lección pendiente ${row.lesson_id}`, caught);
      }
    }
  }

  const catalogs = catalogId
    ? [{ catalog_id: catalogId }]
    : await db.getAllAsync<{ catalog_id: string }>('SELECT catalog_id FROM remote_catalogs');
  for (const catalog of catalogs) {
    await archiveMissingLessons(db, catalog.catalog_id);
  }

  return { failed };
}

async function archiveMissingLessons(db: SQLiteDatabase, catalogId: string): Promise<void> {
  const row = await db.getFirstAsync<{ lesson_ids: string }>(
    'SELECT lesson_ids FROM remote_catalogs WHERE catalog_id = ?',
    catalogId,
  );
  if (!row) {
    return;
  }
  let lessonIds: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.lesson_ids);
    if (Array.isArray(parsed)) {
      lessonIds = parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    lessonIds = [];
  }
  const now = new Date().toISOString();
  if (lessonIds.length === 0) {
    await db.runAsync(
      'UPDATE lessons SET archived_at = ? WHERE catalog_id = ? AND archived_at IS NULL',
      now,
      catalogId,
    );
  } else {
    await db.runAsync(
      `UPDATE lessons SET archived_at = ? WHERE catalog_id = ? AND archived_at IS NULL
       AND id NOT IN (${lessonIds.map(() => '?').join(', ')})`,
      now,
      catalogId,
      ...lessonIds,
    );
  }
  await db.runAsync(
    `UPDATE evaluations SET archived_at = ? WHERE lesson_id IN
       (SELECT id FROM lessons WHERE catalog_id = ? AND archived_at IS NOT NULL)`,
    now,
    catalogId,
  );
  await db.runAsync(
    `UPDATE units SET archived_at = ? WHERE catalog_id = ? AND archived_at IS NULL
       AND id NOT IN (SELECT DISTINCT unit_id FROM lessons WHERE catalog_id = ? AND archived_at IS NULL)`,
    now,
    catalogId,
    catalogId,
  );
}
