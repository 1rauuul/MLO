import type { SQLiteDatabase } from 'expo-sqlite';

import { ParseError, type HttpClient } from '@/shared/services/http/client';
import { isRecord, isString } from '@/shared/utils/validate';

import type { ContentBlock } from '@/shared/model/entities';

import {
  assertV3Envelope,
  ContractV3Error,
  type V3Envelope,
} from '@/shared/services/content/remote/contractV3';

/** En el contrato, “grupo” sigue llamándose clase; el curso base no cambia. */
const BASE_CATALOG_ID = 'base';
const COURSES_SYNCED_PREFIX = 'courses_synced:';

export const COURSE_LIST_SCHEMA_VERSION = 3;
const STUDENT_KEY_HEADER = 'X-MLO-Student-Key';

export interface RemoteCourse {
  catalogId: string;
  title: string;
  status: 'published';
  usesBase: boolean;
  version: string;
  hash: string;
  publishedAt: string;
  empty: boolean;
}

export interface CourseList {
  schemaVersion: typeof COURSE_LIST_SCHEMA_VERSION;
  courses: RemoteCourse[];
}

export interface CourseManifest extends V3Envelope {
  kind: 'course';
  catalogId: string;
  course: { title: string; description: string; visibility: 'published' | 'unpublished' };
  baseRef: { catalogId: string; version: number; hash: string } | null;
  units: unknown[];
  topics: unknown[];
  lessons: unknown[];
  evaluations: unknown[];
  questions: unknown[];
  exercises: unknown[];
  examples: unknown[];
}

export interface GroupManifest extends V3Envelope {
  kind: 'group';
  catalogId: string;
  groupId: string;
  courseRef: { version: number; hash: string };
  group: { name: string; visibility: 'published' | 'unpublished' };
  units: unknown[];
  topics: unknown[];
  lessons: unknown[];
  evaluations: unknown[];
  questions: unknown[];
  exercises: unknown[];
  examples: unknown[];
  additions: { lessonId: string; blocks: ContentBlock[] }[];
}

export interface AccountCourses {
  courses: RemoteCourse[];
  activeCatalogId: string;
}

interface CourseRow {
  catalog_id: string;
  title: string;
  status: string;
  uses_base: number;
  version: string;
  hash: string;
  published_at: string | null;
  empty: number;
  active: number;
}

function fail(message: string): never {
  throw new ParseError(`Contenido remoto v3 inválido: ${message}`);
}

function nonEmpty(value: unknown, field: string): string {
  if (!isString(value) || value.trim().length === 0) {
    fail(`${field} vacío`);
  }
  return value;
}

function courseVersion(value: unknown): string {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
    return String(value);
  }
  if (isString(value) && value.trim().length > 0) {
    return value;
  }
  return fail('version inválida');
}

function parseCourse(value: unknown): RemoteCourse {
  if (!isRecord(value)) {
    fail('curso inválido');
  }
  const catalogId = nonEmpty(value.catalogId, 'catalogId');
  if (!isString(value.title)) {
    fail(`título inválido en ${catalogId}`);
  }
  if (value.status !== 'published') {
    fail(`estado no publicado en ${catalogId}`);
  }
  if (typeof value.usesBase !== 'boolean' || typeof value.empty !== 'boolean') {
    fail(`uso de base o vacío inválido en ${catalogId}`);
  }
  if (!isString(value.publishedAt)) {
    fail(`publishedAt inválido en ${catalogId}`);
  }
  return {
    catalogId,
    title: value.title,
    status: 'published',
    usesBase: value.usesBase,
    version: courseVersion(value.version),
    hash: nonEmpty(value.hash, `hash de ${catalogId}`),
    publishedAt: value.publishedAt,
    empty: value.empty,
  };
}

export function parseCourseList(value: unknown): CourseList {
  if (!isRecord(value) || value.schemaVersion !== COURSE_LIST_SCHEMA_VERSION) {
    fail('schemaVersion no soportada en la lista de cursos');
  }
  if (!Array.isArray(value.courses)) {
    fail('courses no es un arreglo');
  }
  const courses = value.courses.map(parseCourse);
  if (new Set(courses.map(course => course.catalogId)).size !== courses.length) {
    fail('cursos repetidos');
  }
  return { schemaVersion: COURSE_LIST_SCHEMA_VERSION, courses };
}

function parseBaseRef(value: unknown): CourseManifest['baseRef'] {
  if (value === null) {
    return null;
  }
  if (
    !isRecord(value) ||
    !isString(value.catalogId) ||
    value.catalogId.trim().length === 0 ||
    typeof value.version !== 'number' ||
    !Number.isInteger(value.version) ||
    value.version < 1 ||
    !isString(value.hash) ||
    value.hash.trim().length === 0
  ) {
    fail('baseRef inválido');
  }
  return { catalogId: value.catalogId, version: value.version, hash: value.hash };
}

export function parseCourseManifest(value: unknown, catalogId: string): CourseManifest {
  let envelope: V3Envelope;
  try {
    envelope = assertV3Envelope(value);
  } catch (error) {
    if (error instanceof ContractV3Error) {
      throw new ParseError(error.message);
    }
    throw error;
  }
  if (envelope.kind !== 'course') {
    fail(`kind distinto de course en ${catalogId}`);
  }
  if (envelope.catalogId !== catalogId) {
    fail(`catalogId no coincide con ${catalogId}`);
  }
  const record = value as Record<string, unknown>;
  const course = record.course;
  if (
    !isRecord(course) ||
    !isString(course.title) ||
    course.title.trim().length === 0 ||
    !isString(course.description)
  ) {
    fail(`course inválido en ${catalogId}`);
  }
  if (course.visibility !== 'published' && course.visibility !== 'unpublished') {
    fail(`visibilidad inválida en ${catalogId}`);
  }
  for (const key of [
    'units',
    'topics',
    'lessons',
    'evaluations',
    'questions',
    'exercises',
    'examples',
  ]) {
    if (!Array.isArray(record[key])) {
      fail(`${key} no es un arreglo en ${catalogId}`);
    }
  }
  return {
    ...envelope,
    kind: 'course',
    catalogId,
    course: {
      title: course.title,
      description: course.description,
      visibility: course.visibility,
    },
    baseRef: parseBaseRef(record.baseRef),
    units: record.units as unknown[],
    topics: record.topics as unknown[],
    lessons: record.lessons as unknown[],
    evaluations: record.evaluations as unknown[],
    questions: record.questions as unknown[],
    exercises: record.exercises as unknown[],
    examples: record.examples as unknown[],
  };
}

export function parseGroupRelease(value: unknown, catalogId: string): GroupManifest {
  let envelope: V3Envelope;
  try {
    envelope = assertV3Envelope(value);
  } catch (error) {
    if (error instanceof ContractV3Error) {
      throw new ParseError(error.message);
    }
    throw error;
  }
  if (envelope.kind !== 'group') {
    fail('kind distinto de group');
  }
  if (envelope.catalogId !== catalogId) {
    fail(`catalogId no coincide con ${catalogId}`);
  }
  const record = value as Record<string, unknown>;
  const groupId = nonEmpty(record.groupId, 'groupId');
  if (
    !isRecord(record.courseRef) ||
    typeof record.courseRef.version !== 'number' ||
    !Number.isInteger(record.courseRef.version) ||
    record.courseRef.version < 1 ||
    !isString(record.courseRef.hash) ||
    record.courseRef.hash.trim().length === 0
  ) {
    fail('courseRef inválido');
  }
  if (
    !isRecord(record.group) ||
    !isString(record.group.name) ||
    record.group.name.trim().length === 0 ||
    (record.group.visibility !== 'published' && record.group.visibility !== 'unpublished')
  ) {
    fail('group inválido');
  }
  for (const key of [
    'units',
    'topics',
    'lessons',
    'evaluations',
    'questions',
    'exercises',
    'examples',
    'additions',
  ]) {
    if (!Array.isArray(record[key])) {
      fail(`${key} no es un arreglo`);
    }
  }
  const additions = (record.additions as unknown[]).map(item => {
    if (!isRecord(item) || !isString(item.lessonId) || !Array.isArray(item.blocks)) {
      fail('addition inválida');
    }
    return { lessonId: item.lessonId, blocks: item.blocks as ContentBlock[] };
  });
  return {
    ...envelope,
    kind: 'group',
    catalogId,
    groupId,
    courseRef: {
      version: record.courseRef.version,
      hash: record.courseRef.hash,
    },
    group: {
      name: record.group.name,
      visibility: record.group.visibility,
    },
    units: record.units as unknown[],
    topics: record.topics as unknown[],
    lessons: record.lessons as unknown[],
    evaluations: record.evaluations as unknown[],
    questions: record.questions as unknown[],
    exercises: record.exercises as unknown[],
    examples: record.examples as unknown[],
    additions,
  };
}

export function fetchCourseList(client: HttpClient, studentKey: string): Promise<CourseList> {  return client
    .get<unknown>('/courses', { headers: { [STUDENT_KEY_HEADER]: studentKey } })
    .then(parseCourseList);
}

export function fetchCourseManifest(
  client: HttpClient,
  catalogId: string,
  studentKey: string,
): Promise<CourseManifest> {
  return client
    .get<unknown>(`/catalogs/${encodeURIComponent(catalogId)}/manifest`, {
      headers: { [STUDENT_KEY_HEADER]: studentKey },
    })
    .then(value => parseCourseManifest(value, catalogId));
}

export function fetchGroupRelease(
  client: HttpClient,
  code: string,
  studentKey: string,
  catalogId: string,
): Promise<GroupManifest> {
  return client
    .get<unknown>(`/classes/${encodeURIComponent(code)}/release`, {
      headers: { [STUDENT_KEY_HEADER]: studentKey },
    })
    .then(value => parseGroupRelease(value, catalogId));
}

function mapCourse(row: CourseRow): RemoteCourse {
  return {
    catalogId: row.catalog_id,
    title: row.title,
    status: 'published',
    usesBase: row.uses_base === 1,
    version: row.version,
    hash: row.hash,
    publishedAt: row.published_at ?? '',
    empty: row.empty === 1,
  };
}

async function hasCourseSync(db: SQLiteDatabase, accountId: number): Promise<boolean> {
  const row = await db.getFirstAsync<{ key: string }>(
    'SELECT key FROM meta WHERE key = ?',
    `${COURSES_SYNCED_PREFIX}${accountId}`,
  );
  return row !== null;
}

/**
 * El curso base empaquetado existe siempre. Si hay cuenta y todavía no tiene
 * cursos, se le asigna el base activo; el progreso no se toca. Una cuenta que
 * ya sincronizó no recupera el base: la lista vacía es una decisión del servidor.
 */
export async function ensureBaseCourse(db: SQLiteDatabase, accountId?: number): Promise<void> {
  if (accountId !== undefined && (await hasCourseSync(db, accountId))) {
    return;
  }
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO remote_courses
       (catalog_id, title, status, uses_base, version, hash, published_at, empty, is_base, manifest, fetched_at)
     VALUES ('base', 'Contenido base', 'published', 0, '', '', NULL, 0, 1, NULL, ?)
     ON CONFLICT(catalog_id) DO NOTHING`,
    now,
  );
  if (accountId === undefined) {
    return;
  }
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM account_courses WHERE account_id = ?',
    accountId,
  );
  if ((row?.count ?? 0) > 0) {
    return;
  }
  await db.runAsync(
    `INSERT INTO account_courses (account_id, catalog_id, active, added_at)
     VALUES (?, 'base', 1, ?)
     ON CONFLICT(account_id, catalog_id) DO UPDATE SET active = 1`,
    accountId,
    now,
  );
}

export async function loadAccountCourses(
  db: SQLiteDatabase,
  accountId?: number,
): Promise<AccountCourses> {
  const synced = accountId !== undefined ? await hasCourseSync(db, accountId) : false;
  if (!synced) {
    await ensureBaseCourse(db, accountId);
  }
  const rows = accountId
    ? await db.getAllAsync<CourseRow>(
        `SELECT rc.*, ac.active FROM account_courses ac
         JOIN remote_courses rc ON rc.catalog_id = ac.catalog_id
         WHERE ac.account_id = ?
         ORDER BY rc.is_base DESC, rc.title`,
        accountId,
      )
    : await db.getAllAsync<CourseRow>(
        `SELECT rc.*, 0 AS active FROM remote_courses rc
         WHERE rc.catalog_id = 'base'`,
      );
  if (rows.length === 0) {
    return synced
      ? { courses: [], activeCatalogId: '' }
      : { courses: [], activeCatalogId: BASE_CATALOG_ID };
  }
  let activeCatalogId = rows.find(row => row.active === 1)?.catalog_id;
  if (!activeCatalogId) {
    activeCatalogId = rows.some(row => row.catalog_id === BASE_CATALOG_ID)
      ? BASE_CATALOG_ID
      : rows[0]!.catalog_id;
    if (accountId) {
      await selectCourse(db, accountId, activeCatalogId);
    }
  }
  return {
    courses: rows.map(mapCourse),
    activeCatalogId: activeCatalogId ?? BASE_CATALOG_ID,
  };
}

/** Cambia el curso activo solo si la cuenta tiene acceso a ese catálogo. */
export async function selectCourse(
  db: SQLiteDatabase,
  accountId: number,
  catalogId: string,
): Promise<boolean> {
  const membership = await db.getFirstAsync<{ present: number }>(
    'SELECT 1 AS present FROM account_courses WHERE account_id = ? AND catalog_id = ?',
    accountId,
    catalogId,
  );
  if (!membership) {
    return false;
  }
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE account_courses SET active = 0 WHERE account_id = ?', accountId);
    await db.runAsync(
      'UPDATE account_courses SET active = 1 WHERE account_id = ? AND catalog_id = ?',
      accountId,
      catalogId,
    );
  });
  return true;
}

/**
 * Descarga la lista autorizada y los manifiestos v3 no-base. Toda la escritura
 * ocurre al final: si la red o el parseo fallan, la caché anterior queda igual.
 * Devuelve si cambió algún curso no-base respecto a la última sincronización.
 */
export async function refreshCourseList(
  db: SQLiteDatabase,
  client: HttpClient,
): Promise<boolean> {
  const account = await db.getFirstAsync<{ id: number; external_key: string }>(
    `SELECT a.id, a.external_key FROM auth_session s
     JOIN accounts a ON a.id = s.account_id
     WHERE s.id = 1`,
  );
  if (!account || !account.external_key) {
    return false;
  }

  const list = await fetchCourseList(client, account.external_key);
  const manifests = new Map<string, CourseManifest>();
  for (const course of list.courses) {
    if (course.catalogId === BASE_CATALOG_ID) {
      continue;
    }
    manifests.set(
      course.catalogId,
      await fetchCourseManifest(client, course.catalogId, account.external_key),
    );
  }

  const synced = await hasCourseSync(db, account.id);
  const previous = new Map(
    (
      await db.getAllAsync<{ catalog_id: string; version: string; hash: string }>(
        `SELECT rc.catalog_id, rc.version, rc.hash
           FROM account_courses ac
           JOIN remote_courses rc ON rc.catalog_id = ac.catalog_id
          WHERE ac.account_id = ? AND rc.catalog_id != ?`,
        account.id,
        BASE_CATALOG_ID,
      )
    ).map(row => [row.catalog_id, row]),
  );
  const remoteCourses = list.courses.filter(course => course.catalogId !== BASE_CATALOG_ID);
  const changed =
    synced &&
    (remoteCourses.length !== previous.size ||
      remoteCourses.some(course => {
        const before = previous.get(course.catalogId);
        return !before || before.version !== course.version || before.hash !== course.hash;
      }));

  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    const previous = await db.getAllAsync<{ catalog_id: string; active: number }>(
      'SELECT catalog_id, active FROM account_courses WHERE account_id = ?',
      account.id,
    );
    const previousActive = previous.find(row => row.active === 1)?.catalog_id;

    for (const course of list.courses) {
      await db.runAsync(
        `INSERT INTO remote_courses
           (catalog_id, title, status, uses_base, version, hash, published_at, empty, is_base, manifest, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(catalog_id) DO UPDATE SET
           title = excluded.title, status = excluded.status, uses_base = excluded.uses_base,
           version = excluded.version, hash = excluded.hash, published_at = excluded.published_at,
           empty = excluded.empty, is_base = excluded.is_base, manifest = excluded.manifest,
           fetched_at = excluded.fetched_at`,
        course.catalogId,
        course.title,
        course.status,
        course.usesBase ? 1 : 0,
        course.version,
        course.hash,
        course.publishedAt,
        course.empty ? 1 : 0,
        course.catalogId === BASE_CATALOG_ID ? 1 : 0,
        manifests.get(course.catalogId) ? JSON.stringify(manifests.get(course.catalogId)) : null,
        now,
      );
    }

    const catalogIds = list.courses.map(course => course.catalogId);
    if (catalogIds.length === 0) {
      await db.runAsync('DELETE FROM account_courses WHERE account_id = ?', account.id);
    } else {
      await db.runAsync(
        `DELETE FROM account_courses WHERE account_id = ?
         AND catalog_id NOT IN (${catalogIds.map(() => '?').join(', ')})`,
        account.id,
        ...catalogIds,
      );
    }
    await db.runAsync('UPDATE account_courses SET active = 0 WHERE account_id = ?', account.id);
    const activeCatalogId =
      previousActive && catalogIds.includes(previousActive)
        ? previousActive
        : catalogIds.includes(BASE_CATALOG_ID)
          ? BASE_CATALOG_ID
          : catalogIds[0];
    if (activeCatalogId) {
      await db.runAsync(
        `INSERT INTO account_courses (account_id, catalog_id, active, added_at)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(account_id, catalog_id) DO UPDATE SET active = 1`,
        account.id,
        activeCatalogId,
        now,
      );
    }
    // La marca evita que `ensureBaseCourse` reintroduzca el base tras una
    // sincronización válida con cero cursos (DEC-05).
    await db.runAsync(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      `${COURSES_SYNCED_PREFIX}${account.id}`,
      now,
    );
  });
  return changed;
}
