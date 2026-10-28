import type { SQLiteDatabase } from 'expo-sqlite';

import { isHybrid, type DataMode } from '@/shared/services/data/dataMode';
import type { HttpClient } from '@/shared/services/http/client';
import { ConfigError, HttpError, ParseError } from '@/shared/services/http/client';
import { isRecord, isString } from '@/shared/utils/validate';

import {
  parseClassPreview,
  parseClassRelease,
  type ClassPreviewData,
  type RemoteClassRelease,
} from '@/shared/services/content/remote/validateClassRelease';
import {
  REMOTE_SCHEMA_VERSION,
  validateLessonPayload,
  type RemoteLessonPayload,
} from '@/shared/services/content/remote/validateLessonPayload';

export interface CatalogManifest {
  schemaVersion: 2;
  catalogId: string;
  title: string;
  version: string;
  hash: string;
  publishedAt: string;
  lessons: { lessonId: string; unitId: string; hash: string }[];
}

function manifestVersion(value: unknown): string | null {
  if (isString(value) && value.trim().length > 0) {
    return value;
  }
  // El plan maestro guarda un entero incremental; el contrato lo publica como
  // texto para que el hash y la comparación de versión no cambien de tipo.
  if (typeof value === 'number' && Number.isInteger(value)) {
    return String(value);
  }
  return null;
}

export function parseCatalogManifest(value: unknown, catalogId: string): CatalogManifest {
  if (!isRecord(value)) {
    throw new ParseError('El manifiesto del curso no es válido.');
  }
  const version = manifestVersion(value.version);
  if (
    value.schemaVersion !== REMOTE_SCHEMA_VERSION ||
    value.catalogId !== catalogId ||
    !isString(value.title) ||
    version === null ||
    !isString(value.hash) ||
    value.hash.trim().length === 0 ||
    !isString(value.publishedAt) ||
    !Array.isArray(value.lessons)
  ) {
    throw new ParseError('El manifiesto del curso no es válido.');
  }
  if (value.lessons.length === 0) {
    throw new ParseError('El manifiesto del curso está vacío.');
  }
  const lessons = value.lessons.map(item => {
    if (
      !isRecord(item) ||
      !isString(item.lessonId) ||
      !isString(item.unitId) ||
      !isString(item.hash) ||
      item.hash.trim().length === 0
    ) {
      throw new ParseError('El manifiesto del curso no es válido.');
    }
    return { lessonId: item.lessonId, unitId: item.unitId, hash: item.hash };
  });
  if (new Set(lessons.map(item => item.lessonId)).size !== lessons.length) {
    throw new ParseError('El manifiesto repite lecciones.');
  }
  return {
    schemaVersion: REMOTE_SCHEMA_VERSION,
    catalogId,
    title: value.title,
    version,
    hash: value.hash,
    publishedAt: value.publishedAt,
    lessons,
  };
}

/** El alfabeto del panel es en mayúsculas; el alumno puede escribir minúsculas. */
export function canonicalClassCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export function fetchClassPreview(
  client: HttpClient,
  code: string,
): Promise<ClassPreviewData> {
  const normalized = canonicalClassCode(code);
  return client
    .get<unknown>(`/classes/${encodeURIComponent(normalized)}`)
    .then(value => parseClassPreview(value, normalized));
}

export function joinClassRequest(
  client: HttpClient,
  code: string,
  studentKey: string,
  studentName: string,
): Promise<ClassPreviewData> {
  const normalized = canonicalClassCode(code);
  return client
    .post<unknown>(`/classes/${encodeURIComponent(normalized)}/join`, {
      studentKey,
      studentName,
    })
    .then(value => parseClassPreview(value, normalized));
}

export function leaveClassRequest(
  client: HttpClient,
  code: string,
  studentKey: string,
): Promise<void> {
  const normalized = canonicalClassCode(code);
  return client.delete<void>(
    `/classes/${encodeURIComponent(normalized)}/members/${encodeURIComponent(studentKey)}`,
  );
}

export function fetchClassRelease(
  client: HttpClient,
  code: string,
): Promise<RemoteClassRelease> {
  const normalized = canonicalClassCode(code);
  return client
    .get<unknown>(`/classes/${encodeURIComponent(normalized)}/release`)
    .then(value => parseClassRelease(value, normalized));
}

export async function fetchCatalogManifest(
  client: HttpClient,
  catalogId: string,
): Promise<CatalogManifest> {
  return parseCatalogManifest(
    await client.get<unknown>(`/catalogs/${encodeURIComponent(catalogId)}/manifest`),
    catalogId,
  );
}

export async function fetchLessonPayload(
  client: HttpClient,
  catalogId: string,
  lessonId: string,
  foreignIds: Set<string>,
): Promise<RemoteLessonPayload> {
  const raw = await client.get<unknown>(
    `/catalogs/${encodeURIComponent(catalogId)}/lessons/${encodeURIComponent(lessonId)}`,
  );
  return validateLessonPayload(raw, { catalogId, lessonId }, foreignIds);
}

interface StagedHashRow {
  lesson_id: string;
  hash: string;
  payload: string;
}

/**
 * Ids que ya pertenecen a otro curso. La validación es la última red: aunque
 * el servidor prefije todos los ids, un payload no puede reasignar contenido
 * de unidades, ejercicios, ejemplos, evaluaciones ni preguntas ajenas.
 */
async function foreignContentIds(db: SQLiteDatabase, catalogId: string): Promise<Set<string>> {
  const [units, lessons, exercises, examples, evaluations, questions] = await Promise.all([
    db.getAllAsync<{ id: string }>('SELECT id FROM units WHERE catalog_id != ?', catalogId),
    db.getAllAsync<{ id: string }>('SELECT id FROM lessons WHERE catalog_id != ?', catalogId),
    db.getAllAsync<{ id: string }>(
      'SELECT e.id FROM exercises e JOIN lessons l ON l.id = e.lesson_id WHERE l.catalog_id != ?',
      catalogId,
    ),
    db.getAllAsync<{ id: string }>(
      'SELECT e.id FROM examples e JOIN lessons l ON l.id = e.lesson_id WHERE l.catalog_id != ?',
      catalogId,
    ),
    db.getAllAsync<{ id: string }>(
      'SELECT e.id FROM evaluations e JOIN lessons l ON l.id = e.lesson_id WHERE l.catalog_id != ?',
      catalogId,
    ),
    db.getAllAsync<{ id: string }>(
      `SELECT q.id FROM questions q
       JOIN evaluations e ON e.id = q.evaluation_id
       JOIN lessons l ON l.id = e.lesson_id
       WHERE l.catalog_id != ?`,
      catalogId,
    ),
  ]);
  return new Set(
    [...units, ...lessons, ...exercises, ...examples, ...evaluations, ...questions].map(
      row => row.id,
    ),
  );
}

/** Ids que no pueden repetirse entre lecciones distintas del mismo curso. */
function lessonContentIds(payload: RemoteLessonPayload): string[] {
  return [
    payload.lesson.id,
    ...(payload.evaluation ? [payload.evaluation.id] : []),
    ...payload.exercises.map(exercise => exercise.id),
    ...payload.examples.map(example => example.id),
    ...payload.questions.map(entry => entry.question.id!),
  ];
}

function stagedIdOwners(rows: StagedHashRow[]): Map<string, string> {
  const owners = new Map<string, string>();
  for (const row of rows) {
    let payload: RemoteLessonPayload;
    try {
      payload = JSON.parse(row.payload) as RemoteLessonPayload;
    } catch {
      continue;
    }
    for (const id of lessonContentIds(payload)) {
      if (!owners.has(id)) {
        owners.set(id, payload.lessonId);
      }
    }
  }
  return owners;
}

/**
 * Descarga el manifest y deja en `remote_lessons` solo las lecciones cuyo hash
 * cambió. No escribe en las tablas de contenido: eso ocurre en el arranque.
 */
export async function refreshCatalog(
  db: SQLiteDatabase,
  client: HttpClient,
  catalogId: string,
  force = false,
): Promise<boolean> {
  const manifest = await fetchCatalogManifest(client, catalogId);
  const stored = await db.getFirstAsync<{ manifest_hash: string; version: string }>(
    'SELECT manifest_hash, version FROM remote_catalogs WHERE catalog_id = ?',
    catalogId,
  );
  if (!force && stored?.manifest_hash === manifest.hash) {
    return false;
  }
  // Misma versión con otro hash es un manifiesto reescrito sin avanzar: se descarta.
  if (stored && stored.version === manifest.version && stored.manifest_hash !== manifest.hash) {
    throw new ParseError('El manifiesto repite versión con otro contenido.');
  }
  // Una versión numérica que retrocede suele ser una respuesta vieja de caché.
  if (
    stored &&
    /^\d+$/.test(stored.version) &&
    /^\d+$/.test(manifest.version) &&
    Number(manifest.version) < Number(stored.version)
  ) {
    throw new ParseError('El manifiesto retrocede de versión.');
  }

  const stagedRows = await db.getAllAsync<StagedHashRow>(
    'SELECT lesson_id, hash, payload FROM remote_lessons WHERE catalog_id = ?',
    catalogId,
  );
  const stagedHash = new Map(stagedRows.map(row => [row.lesson_id, row.hash]));
  const changed = manifest.lessons.filter(entry => stagedHash.get(entry.lessonId) !== entry.hash);
  const foreign = await foreignContentIds(db, catalogId);
  const idOwners = stagedIdOwners(stagedRows);

  // Se valida todo antes de escribir: si una lección falla, el manifest no avanza.
  const payloads: RemoteLessonPayload[] = [];
  for (const entry of changed) {
    const payload = await fetchLessonPayload(client, catalogId, entry.lessonId, foreign);
    if (payload.hash !== entry.hash) {
      throw new ParseError('La lección no coincide con el hash del manifiesto.');
    }
    // Los ids son globales en el curso. El manifest trae todas las lecciones, así
    // que comparar contra el área de espera cubre también las que no cambiaron.
    for (const id of lessonContentIds(payload)) {
      const owner = idOwners.get(id);
      if (owner !== undefined && owner !== entry.lessonId) {
        throw new ParseError(`El id ${id} ya pertenece a otra lección del curso.`);
      }
      idOwners.set(id, entry.lessonId);
    }
    payloads.push(payload);
  }

  const now = new Date().toISOString();
  const lessonIds = manifest.lessons.map(entry => entry.lessonId);
  await db.withTransactionAsync(async () => {
    for (const payload of payloads) {
      await db.runAsync(
        `INSERT INTO remote_lessons (catalog_id, lesson_id, hash, payload, fetched_at, applied_hash)
         VALUES (?, ?, ?, ?, ?, NULL)
         ON CONFLICT(catalog_id, lesson_id) DO UPDATE SET
           hash = excluded.hash, payload = excluded.payload,
           fetched_at = excluded.fetched_at, applied_hash = NULL`,
        catalogId,
        payload.lessonId,
        payload.hash,
        JSON.stringify(payload),
        now,
      );
    }
    if (lessonIds.length === 0) {
      await db.runAsync('DELETE FROM remote_lessons WHERE catalog_id = ?', catalogId);
    } else {
      await db.runAsync(
        `DELETE FROM remote_lessons WHERE catalog_id = ? AND lesson_id NOT IN (${lessonIds
          .map(() => '?')
          .join(', ')})`,
        catalogId,
        ...lessonIds,
      );
    }
    await db.runAsync(
      `INSERT INTO remote_catalogs (catalog_id, title, version, manifest_hash, lesson_ids, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(catalog_id) DO UPDATE SET
         title = excluded.title, version = excluded.version,
         manifest_hash = excluded.manifest_hash, lesson_ids = excluded.lesson_ids,
         fetched_at = excluded.fetched_at`,
      catalogId,
      manifest.title,
      manifest.version,
      manifest.hash,
      JSON.stringify(lessonIds),
      now,
    );
  });
  return true;
}

/** Las clases no cambian de catálogo: todo el contenido base vive en `base`. */
export async function catalogsInUse(_db: SQLiteDatabase): Promise<string[]> {
  return ['base'];
}

export async function refreshCatalogs(
  db: SQLiteDatabase,
  client: HttpClient,
  mode: DataMode = isHybrid() ? 'hybrid' : 'local',
): Promise<void> {
  if (mode !== 'hybrid') {
    return;
  }
  for (const catalogId of await catalogsInUse(db)) {
    try {
      await refreshCatalog(db, client, catalogId);
    } catch (caught) {
      if (__DEV__) {
        console.warn(`[content] no se pudo actualizar ${catalogId}`, caught);
      }
    }
  }
}

export type ContentError =
  | 'content_missing'
  | 'rate_limited'
  | 'config'
  | 'network'
  | 'invalid';

export type ClassError =
  | 'not_found'
  | 'rate_limited'
  | 'config'
  | 'network'
  | 'invalid';

export function isClassError(error: unknown): ClassError {
  if (error instanceof ConfigError) {
    return 'config';
  }
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return 'not_found';
    }
    if (error.status === 429) {
      return 'rate_limited';
    }
    return 'network';
  }
  if (error instanceof ParseError) {
    return 'invalid';
  }
  return 'network';
}

/** Un fallo al descargar el curso no significa que el código no exista. */
export function isContentError(error: unknown): ContentError {
  if (error instanceof ConfigError) {
    return 'config';
  }
  if (error instanceof HttpError) {
    if (error.status === 404 || error.status === 410) {
      return 'content_missing';
    }
    if (error.status === 429) {
      return 'rate_limited';
    }
    return 'network';
  }
  if (error instanceof ParseError) {
    return 'invalid';
  }
  return 'network';
}
