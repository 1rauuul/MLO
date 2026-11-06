import type { SQLiteDatabase } from 'expo-sqlite';

import {
  archiveClassCache,
  selectClassMemberships,
  selectClassSyncState,
} from '@/features/classes/model/classRepository';
import { applyV3GroupRelease } from '@/shared/services/content/applyV3Content';
import { fetchGroupRelease } from '@/shared/services/content/coursesV3';
import { HttpError, ParseError } from '@/shared/services/http/client';
import type { HttpClient } from '@/shared/services/http/client';

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

  await applyV3GroupRelease(db, release, classId);
  return true;
}
