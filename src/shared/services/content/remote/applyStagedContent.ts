import type { SQLiteDatabase } from 'expo-sqlite';

import { applyStoredV3Content } from '@/shared/services/content/applyV3Content';
import { applyStagedClassReleases } from '@/shared/services/content/classSync';

export interface StagedApplyResult {
  failed: string[];
}

/** Aplica en orden los releases de curso y de clase ya descargados. */
export async function applyPendingContent(db: SQLiteDatabase): Promise<StagedApplyResult> {
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
