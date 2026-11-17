import type { SQLiteDatabase } from 'expo-sqlite';

import {
  archiveClassCache,
  reassignAccountClassCourse,
  selectClassMemberships,
  selectClassSyncState,
  updateClassMetadata,
} from '@/features/classes/model/classRepository';
import { applyV3GroupRelease } from '@/shared/services/content/applyV3Content';
import { fetchGroupRelease, parseGroupRelease, registerJoinedCourse } from '@/shared/services/content/coursesV3';
import { cacheMediaInGroupRelease } from '@/shared/services/content/mediaCache';
import { fetchClassPreview } from '@/shared/services/content/remoteContent';
import { HttpError, ParseError } from '@/shared/services/http/client';
import type { HttpClient } from '@/shared/services/http/client';

export interface ClassStageSummary {
  changed: boolean;
  failed: string[];
}

/**
 * Corrige membresías guardadas antes de que la clase conociera su curso y
 * mantiene el título del curso para la biblioteca. Usa la vista previa v2, que
 * ya incluye `course`; los servidores anteriores se ignoran sin romper el sync.
 */
export async function refreshClassMemberships(
  db: SQLiteDatabase,
  client: HttpClient,
): Promise<boolean> {
  let changed = false;
  const rows = await db.getAllAsync<{
    account_id: number;
    class_id: string;
    class_code: string;
    course_catalog_id: string;
  }>(
    `SELECT DISTINCT ac.account_id, ac.class_id, ac.class_code, ac.course_catalog_id
       FROM account_classes ac
      WHERE ac.active = 1`,
  );

  for (const row of rows) {
    try {
      const preview = await fetchClassPreview(client, row.class_code);
      if (!preview.course) {
        continue;
      }
      if (preview.course.catalogId !== row.course_catalog_id) {
        await reassignAccountClassCourse(
          db,
          row.account_id,
          row.class_id,
          preview.course.catalogId,
        );
        changed = true;
      }
      await registerJoinedCourse(
        db,
        row.account_id,
        preview.course.catalogId,
        preview.course.title,
      );
      await updateClassMetadata(
        db,
        row.class_id,
        row.class_code,
        preview.class.name,
        preview.class.teacherName,
      );
    } catch (caught) {
      if (__DEV__) {
        console.warn(`[classes] no se pudo actualizar la membresía ${row.class_code}`, caught);
      }
    }
  }
  return changed;
}

/**
 * Descarga los releases a `class_cache.release_v3` sin aplicarlos. La copia y
 * el progreso vigentes no cambian hasta que el alumno confirma la actualización.
 * La primera release de un grupo se aplica de inmediato para no dejar sin
 * contenido a una membresía recién creada.
 */
export async function stageClassContent(
  db: SQLiteDatabase,
  client: HttpClient,
): Promise<ClassStageSummary> {
  let changed = false;
  const failed: string[] = [];
  for (const membership of await selectClassMemberships(db)) {
    try {
      const staged = await stageClassRelease(
        db,
        client,
        membership.classId,
        membership.classCode,
        membership.studentKey,
        membership.courseCatalogId,
      );
      changed = staged.changed || changed;
      if (staged.initial) {
        const applied = await applyStagedClassReleases(db, membership.classId);
        failed.push(...applied.failed);
      }
    } catch (caught) {
      failed.push(membership.classId);
      if (__DEV__) {
        console.warn(`[classes] no se pudo actualizar ${membership.classCode}`, caught);
      }
    }
  }
  return { changed, failed };
}

export interface ClassStageResult {
  /** Hay un release pendiente distinto del aplicado. */
  changed: boolean;
  /** No había release v3 previo: se puede aplicar sin aviso. */
  initial: boolean;
}

export async function stageClassRelease(
  db: SQLiteDatabase,
  client: HttpClient,
  classId: string,
  code: string,
  studentKey = '',
  courseCatalogId = 'base',
): Promise<ClassStageResult> {
  const stored = await selectClassSyncState(db, classId);

  let release;
  try {
    release = await fetchGroupRelease(client, code, studentKey, courseCatalogId);
  } catch (caught) {
    if (caught instanceof HttpError && caught.status === 404) {
      if (stored?.applied_hash) {
        await archiveClassCache(db, classId);
      }
      return { changed: false, initial: false };
    }
    throw caught;
  }

  if (release.groupId !== classId) {
    throw new ParseError('El release del grupo no coincide con la membresía.');
  }
  if (stored && stored.archived === 0 && stored.applied_hash === release.hash) {
    return { changed: false, initial: false };
  }

  release = await cacheMediaInGroupRelease(db, release);
  const initial = !stored?.release_v3;
  await db.runAsync(
    `UPDATE class_cache SET
       class_name = ?, version = ?, hash = ?, published_at = ?,
       course_catalog_id = ?, archived = 0, release_v3 = ?, fetched_at = ?
     WHERE class_id = ?`,
    release.group.name,
    release.version,
    release.hash,
    release.publishedAt,
    courseCatalogId,
    JSON.stringify(release),
    new Date().toISOString(),
    classId,
  );
  return { changed: !initial, initial };
}

export interface ClassApplyResult {
  failed: string[];
}

/** Aplica los releases v3 ya descargados cuya hash no es la aplicada. */
export async function applyStagedClassReleases(
  db: SQLiteDatabase,
  classId?: string,
): Promise<ClassApplyResult> {
  const rows = classId
    ? await db.getAllAsync<{
        class_id: string;
        course_catalog_id: string;
        release_v3: string;
      }>(
        `SELECT class_id, COALESCE(course_catalog_id, 'base') AS course_catalog_id, release_v3
           FROM class_cache
          WHERE class_id = ? AND release_v3 IS NOT NULL
            AND (applied_hash IS NULL OR applied_hash != hash)
            AND COALESCE(archived, 0) = 0`,
        classId,
      )
    : await db.getAllAsync<{
        class_id: string;
        course_catalog_id: string;
        release_v3: string;
      }>(
        `SELECT class_id, COALESCE(course_catalog_id, 'base') AS course_catalog_id, release_v3
           FROM class_cache
          WHERE release_v3 IS NOT NULL
            AND (applied_hash IS NULL OR applied_hash != hash)
            AND COALESCE(archived, 0) = 0`,
      );

  const failed: string[] = [];
  for (const row of rows) {
    try {
      const parsed: unknown = JSON.parse(row.release_v3);
      const release = parseGroupRelease(parsed, row.course_catalog_id);
      await applyV3GroupRelease(db, release, row.class_id);
    } catch (caught) {
      failed.push(row.class_id);
      if (__DEV__) {
        console.warn(`[classes] release v3 pendiente ${row.class_id}`, caught);
      }
    }
  }
  return { failed };
}

/**
 * Descarga y aplica el release v3 de cada grupo activo. Si la red falla se
 * conserva la copia anterior; un 404 con release v3 previo archiva el grupo,
 * sin borrar contenido ni progreso.
 */
export async function refreshClassContent(
  db: SQLiteDatabase,
  client: HttpClient,
): Promise<void> {
  for (const membership of await selectClassMemberships(db)) {
    try {
      await refreshClassRelease(
        db,
        client,
        membership.classId,
        membership.classCode,
        membership.studentKey,
        membership.courseCatalogId,
      );
    } catch (caught) {
      if (__DEV__) {
        console.warn(`[classes] no se pudo actualizar ${membership.classCode}`, caught);
      }
    }
  }
}

export async function refreshClassRelease(
  db: SQLiteDatabase,
  client: HttpClient,
  classId: string,
  code: string,
  studentKey = '',
  courseCatalogId = 'base',
): Promise<boolean> {
  const stored = await selectClassSyncState(db, classId);

  let release;
  try {
    release = await fetchGroupRelease(client, code, studentKey, courseCatalogId);
  } catch (caught) {
    if (caught instanceof HttpError && caught.status === 404) {
      if (stored?.applied_hash) {
        await archiveClassCache(db, classId);
      }
      return false;
    }
    throw caught;
  }

  if (release.groupId !== classId) {
    throw new ParseError('El release del grupo no coincide con la membresía.');
  }
  if (stored && stored.archived === 0 && stored.applied_hash === release.hash) {
    return false;
  }

  release = await cacheMediaInGroupRelease(db, release);
  await applyV3GroupRelease(db, release, classId);
  return true;
}
