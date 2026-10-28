import type { SQLiteDatabase } from 'expo-sqlite';

import {
  selectClassMemberships,
  selectClassVersion,
  storeClassRelease,
  updateClassMetadata,
} from '@/features/classes/model/classRepository';
import { ParseError } from '@/shared/services/http/client';
import type { HttpClient } from '@/shared/services/http/client';

import { fetchClassPreview, fetchClassRelease } from './remoteContent';

/**
 * Descarga el último release de cada clase en la que participa cualquier
 * cuenta local. No borra la caché si la red falla: el alumno sigue sin conexión.
 */
export async function refreshClassContent(
  db: SQLiteDatabase,
  client: HttpClient,
): Promise<void> {
  for (const membership of await selectClassMemberships(db)) {
    try {
      await refreshClassRelease(db, client, membership.classId, membership.classCode);
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
): Promise<boolean> {
  const preview = await fetchClassPreview(client, code);
  if (preview.class.id !== classId) {
    throw new ParseError('El código de la clase pertenece a otra clase.');
  }

  await updateClassMetadata(db, classId, code, preview.class.name, preview.class.teacherName);

  if (!preview.published) {
    return false;
  }

  const stored = await selectClassVersion(db, classId);
  if (
    stored &&
    stored.version === preview.published.version &&
    stored.hash === preview.published.hash
  ) {
    return false;
  }

  const release = await fetchClassRelease(client, code);
  if (
    release.class.id !== classId ||
    release.version !== preview.published.version ||
    release.hash !== preview.published.hash
  ) {
    throw new ParseError('El release de la clase no coincide con la vista previa.');
  }

  await storeClassRelease(db, code, release);
  return true;
}
