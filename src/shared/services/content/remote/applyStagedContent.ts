import type { SQLiteDatabase } from 'expo-sqlite';

import { applyLessonPayloadInTransaction } from '@/shared/services/db/seed';
import { applyStagedClassReleases } from '@/shared/services/content/classSync';
import { applyStoredV3Content } from '@/shared/services/content/applyV3Content';
import type { RemoteLessonPayload } from '@/shared/services/content/remote/validateLessonPayload';

interface StagedRow {
  catalog_id: string;
  lesson_id: string;
  hash: string;
  payload: string;
}

/**
 * Aplica el contenido ya validado y guardado en `remote_lessons`. Es local:
 * nunca hace red. Todo el snapshot es una sola transacción: si una lección
 * falla, no se aplica ninguna y la copia anterior queda intacta.
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

  const catalogs = catalogId
    ? [{ catalog_id: catalogId }]
    : await db.getAllAsync<{ catalog_id: string }>('SELECT catalog_id FROM remote_catalogs');

  try {
    await db.withTransactionAsync(async () => {
      for (const row of rows) {
        let payload: RemoteLessonPayload;
        try {
          payload = JSON.parse(row.payload) as RemoteLessonPayload;
        } catch {
          failed.push(row.lesson_id);
          throw new Error(`La lección pendiente ${row.lesson_id} no es JSON válido.`);
        }
        try {
          await applyLessonPayloadInTransaction(db, payload);
          await db.runAsync(
            'UPDATE remote_lessons SET applied_hash = ? WHERE catalog_id = ? AND lesson_id = ?',
            row.hash,
            row.catalog_id,
            row.lesson_id,
          );
        } catch (caught) {
          failed.push(row.lesson_id);
          throw caught;
        }
      }
      for (const catalog of catalogs) {
        await archiveMissingLessons(db, catalog.catalog_id);
      }
    });
  } catch (caught) {
    if (failed.length === 0) {
      failed.push(catalogId ?? 'snapshot');
    }
    if (__DEV__) {
      console.warn('[content] snapshot pendiente', caught);
    }
  }

  return { failed };
}

/** Aplica en orden el snapshot v2 y los releases v3 pendientes. */
export async function applyPendingContent(db: SQLiteDatabase): Promise<StagedApplyResult> {
  const base = await applyStagedContent(db);
  if (base.failed.length > 0) {
    return base;
  }
  const courses = await applyStoredV3Content(db);
  if (courses.failed.length > 0) {
    return courses;
  }
  return applyStagedClassReleases(db);
}

/**
 * Solo cuenta lo pendiente sobre una base ya aplicada. Así la primera
 * sincronización no se presenta como «contenido nuevo».
 */
export async function hasPendingContent(db: SQLiteDatabase): Promise<boolean> {
  const base = await db.getFirstAsync<{ present: number }>(
    `SELECT 1 AS present FROM remote_lessons rl
       JOIN remote_catalogs rc ON rc.catalog_id = rl.catalog_id
      WHERE rl.applied_hash IS NULL OR rl.applied_hash != rl.hash
      LIMIT 1`,
  );
  if (base) {
    return true;
  }
  const course = await db.getFirstAsync<{ present: number }>(
    `SELECT 1 AS present FROM remote_courses
      WHERE manifest IS NOT NULL AND applied_hash IS NOT NULL AND applied_hash != hash
      LIMIT 1`,
  );
  if (course) {
    return true;
  }
  const classRelease = await db.getFirstAsync<{ present: number }>(
    `SELECT 1 AS present FROM class_cache
      WHERE release_v3 IS NOT NULL AND applied_hash IS NOT NULL AND applied_hash != hash
        AND COALESCE(archived, 0) = 0
      LIMIT 1`,
  );
  return classRelease !== null;
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
