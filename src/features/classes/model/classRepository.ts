import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  AccountClass,
  Example,
  Exercise,
  ExerciseConfig,
  ExerciseType,
  LessonClassExtra,
  ContentBlock,
} from '@/shared/model/entities';
import { EXERCISE_TYPES } from '@/shared/model/entities';
import type {
  ClassPreviewData,
  RemoteClassRelease,
} from '@/shared/services/content/remote/validateClassRelease';

export interface ClassMembershipKey {
  accountId: number;
  studentKey: string;
  classId: string;
  classCode: string;
  courseCatalogId: string;
}

export interface ClassExtraRecord {
  id: string;
  lessonId: string;
  type: 'lesson' | 'example' | 'exercise';
  payload: string;
  classNames: string[];
  teacherNames: string[];
}

interface ClassRow {
  class_id: string;
  class_code: string;
  class_name: string;
  teacher_name: string | null;
  version: number;
  joined_at: string;
}

interface ExtraRow {
  id: string;
  lesson_id: string;
  type: string;
  payload: string;
  class_name: string;
  teacher_name: string | null;
}

function parsePayload(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export async function selectAccountClasses(
  db: SQLiteDatabase,
  accountId: number,
): Promise<AccountClass[]> {
  const rows = await db.getAllAsync<ClassRow>(
    `SELECT ac.class_id, ac.class_code,
            COALESCE(c.class_name, ac.class_code) AS class_name,
            c.teacher_name, COALESCE(c.version, 0) AS version, ac.joined_at
       FROM account_classes ac
       LEFT JOIN class_cache c ON c.class_id = ac.class_id
      WHERE ac.account_id = ? AND ac.active = 1
        AND COALESCE(c.archived, 0) = 0
      ORDER BY class_name COLLATE NOCASE`,
    accountId,
  );
  return rows.map(row => ({
    classId: row.class_id,
    classCode: row.class_code,
    className: row.class_name,
    teacherName: row.teacher_name,
    version: row.version,
    joinedAt: row.joined_at,
  }));
}

export async function selectJoinedClasses(
  db: SQLiteDatabase,
  accountId: number,
): Promise<AccountClass[]> {
  return selectAccountClasses(db, accountId);
}

export async function saveAccountClass(
  db: SQLiteDatabase,
  accountId: number,
  code: string,
  preview: ClassPreviewData,
  courseCatalogId = 'base',
): Promise<void> {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO class_cache
         (class_id, class_code, class_name, teacher_name, version, hash, published_at,
          course_catalog_id, archived, release_v3, applied_hash, fetched_at)
       VALUES (?, ?, ?, ?, 0, '', NULL, ?, 0, NULL, NULL, ?)
       ON CONFLICT(class_id) DO UPDATE SET
         class_code = excluded.class_code,
         class_name = excluded.class_name,
         teacher_name = excluded.teacher_name,
         course_catalog_id = excluded.course_catalog_id`,
      preview.class.id,
      code,
      preview.class.name,
      preview.class.teacherName,
      courseCatalogId,
      now,
    );
    // Una sola membresía activa por curso: la anterior queda inactiva, no se borra.
    await db.runAsync(
      `UPDATE account_classes SET active = 0
       WHERE account_id = ? AND course_catalog_id = ? AND class_id <> ? AND active = 1`,
      accountId,
      courseCatalogId,
      preview.class.id,
    );
    await db.runAsync(
      `INSERT INTO account_classes
         (account_id, class_id, class_code, course_catalog_id, active, joined_at)
       VALUES (?, ?, ?, ?, 1, ?)
       ON CONFLICT(account_id, class_id) DO UPDATE SET
         class_code = excluded.class_code,
         course_catalog_id = excluded.course_catalog_id,
         active = 1`,
      accountId,
      preview.class.id,
      code,
      courseCatalogId,
      now,
    );
  });
}

export async function removeAccountClass(
  db: SQLiteDatabase,
  accountId: number,
  classId: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE account_classes SET active = 0 WHERE account_id = ? AND class_id = ?',
    accountId,
    classId,
  );
}

export async function selectClassMemberships(
  db: SQLiteDatabase,
): Promise<ClassMembershipKey[]> {
  return db.getAllAsync<ClassMembershipKey>(
    `SELECT DISTINCT ac.account_id AS accountId, a.external_key AS studentKey,
            ac.class_id AS classId, ac.class_code AS classCode,
            ac.course_catalog_id AS courseCatalogId
       FROM account_classes ac
       JOIN accounts a ON a.id = ac.account_id
      WHERE ac.active = 1`,
  );
}

export async function selectActiveGroup(
  db: SQLiteDatabase,
  accountId: number,
  courseCatalogId: string,
): Promise<string | null> {
  const row = await db.getFirstAsync<{ class_id: string }>(
    `SELECT ac.class_id FROM account_classes ac
     JOIN class_cache c ON c.class_id = ac.class_id
     WHERE ac.account_id = ? AND ac.course_catalog_id = ? AND ac.active = 1
       AND COALESCE(c.archived, 0) = 0
     LIMIT 1`,
    accountId,
    courseCatalogId,
  );
  return row?.class_id ?? null;
}

export interface ClassSyncState {
  version: number;
  hash: string;
  archived: number;
  applied_hash: string | null;
  course_catalog_id: string;
  release_v3?: string | null;
}

export async function selectClassSyncState(
  db: SQLiteDatabase,
  classId: string,
): Promise<ClassSyncState | null> {
  return db.getFirstAsync<ClassSyncState>(
    `SELECT version, hash, COALESCE(archived, 0) AS archived,
            applied_hash, COALESCE(course_catalog_id, 'base') AS course_catalog_id,
            release_v3
       FROM class_cache WHERE class_id = ?`,
    classId,
  );
}

export async function archiveClassCache(db: SQLiteDatabase, classId: string): Promise<void> {
  await db.runAsync('UPDATE class_cache SET archived = 1 WHERE class_id = ?', classId);
}

export async function selectClassVersion(
  db: SQLiteDatabase,
  classId: string,
): Promise<{ version: number; hash: string } | null> {
  return db.getFirstAsync<{ version: number; hash: string }>(
    'SELECT version, hash FROM class_cache WHERE class_id = ?',
    classId,
  );
}

export async function storeClassRelease(
  db: SQLiteDatabase,
  code: string,
  release: RemoteClassRelease,
): Promise<void> {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO class_cache
         (class_id, class_code, class_name, teacher_name, version, hash, published_at,
          course_catalog_id, archived, release_v3, applied_hash, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'base', 0, NULL, NULL, ?)
       ON CONFLICT(class_id) DO UPDATE SET
         class_code = excluded.class_code,
         class_name = excluded.class_name,
         teacher_name = excluded.teacher_name,
         version = excluded.version,
         hash = excluded.hash,
         published_at = excluded.published_at,
         archived = 0,
         fetched_at = excluded.fetched_at`,
      release.class.id,
      code,
      release.class.name,
      release.class.teacherName,
      release.version,
      release.hash,
      release.publishedAt,
      now,
    );

    await db.runAsync('DELETE FROM class_extras_cache WHERE class_id = ?', release.class.id);

    let position = 0;
    for (const lesson of release.lessons) {
      for (const extra of lesson.extras) {
        await db.runAsync(
          `INSERT INTO class_extras_cache
             (class_id, extra_id, lesson_id, type, payload, position)
           VALUES (?, ?, ?, ?, ?, ?)`,
          release.class.id,
          extra.id,
          lesson.lessonId,
          extra.type,
          JSON.stringify(extra.content),
          position,
        );
        position += 1;
      }
    }
  });
}

export async function updateClassMetadata(
  db: SQLiteDatabase,
  classId: string,
  code: string,
  name: string,
  teacherName: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE class_cache
        SET class_code = ?, class_name = ?, teacher_name = ?, fetched_at = ?
      WHERE class_id = ?`,
    code,
    name,
    teacherName,
    new Date().toISOString(),
    classId,
  );
}

/**
 * Extras de todas las clases de la cuenta para una lección. Si el mismo
 * contenido está en varias clases, se devuelve una vez con todas las etiquetas
 * y se conserva la versión publicada más recientemente.
 */
export async function selectExtrasByLesson(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
): Promise<ClassExtraRecord[]> {
  const rows = await db.getAllAsync<ExtraRow>(
    `SELECT e.extra_id AS id, e.lesson_id, e.type, e.payload,
            c.class_name, c.teacher_name
       FROM account_classes ac
       JOIN class_extras_cache e ON e.class_id = ac.class_id
       JOIN class_cache c ON c.class_id = e.class_id
       JOIN lessons l ON l.id = e.lesson_id AND l.archived_at IS NULL
      WHERE ac.account_id = ? AND e.lesson_id = ?
        AND ac.active = 1 AND COALESCE(c.archived, 0) = 0
      ORDER BY c.published_at DESC, c.class_name COLLATE NOCASE, e.position`,
    accountId,
    lessonId,
  );

  const grouped = new Map<
    string,
    { row: ExtraRow; classNames: Set<string>; teacherNames: Set<string> }
  >();
  for (const row of rows) {
    const current = grouped.get(row.id);
    if (current) {
      current.classNames.add(row.class_name);
      if (row.teacher_name) current.teacherNames.add(row.teacher_name);
      continue;
    }
    grouped.set(row.id, {
      row,
      classNames: new Set([row.class_name]),
      teacherNames: new Set(row.teacher_name ? [row.teacher_name] : []),
    });
  }

  return [...grouped.values()]
    .filter(({ row }) => row.type === 'lesson' || row.type === 'example' || row.type === 'exercise')
    .map(({ row, classNames, teacherNames }) => ({
      id: row.id,
      lessonId: row.lesson_id,
      type: row.type as ClassExtraRecord['type'],
      payload: row.payload,
      classNames: [...classNames],
      teacherNames: [...teacherNames],
    }));
}

function classLabel(record: ClassExtraRecord): string | undefined {
  const names = record.classNames.filter(Boolean);
  if (names.length > 0) return names.join(', ');
  const teachers = record.teacherNames.filter(Boolean);
  return teachers.length > 0 ? teachers.join(', ') : undefined;
}

export async function selectLessonExtras(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
): Promise<LessonClassExtra[]> {
  const records = await selectExtrasByLesson(db, accountId, lessonId);
  return records
    .map(extraToLesson)
    .filter((extra): extra is LessonClassExtra => extra !== null);
}

export function extraToLesson(record: ClassExtraRecord): LessonClassExtra | null {
  if (record.type !== 'lesson') return null;
  const payload = parsePayload(record.payload);
  if (!payload) return null;
  const blocks = Array.isArray(payload.blocks) ? (payload.blocks as ContentBlock[]) : [];
  if (blocks.length === 0) return null;
  return {
    id: record.id,
    lessonId: record.lessonId,
    title: typeof payload.title === 'string' ? payload.title : '',
    blocks,
    classNames: record.classNames,
  };
}

export function extraToExercise(record: ClassExtraRecord): Exercise | null {
  if (record.type !== 'exercise') return null;
  const payload = parsePayload(record.payload);
  if (!payload) return null;
  const type = payload.type;
  if (typeof type !== 'string' || !EXERCISE_TYPES.includes(type as ExerciseType)) return null;
  if (typeof payload.prompt !== 'string') return null;
  const config =
    payload.config && typeof payload.config === 'object' && !Array.isArray(payload.config)
      ? (payload.config as ExerciseConfig)
      : {};
  return {
    id: record.id,
    lessonId: record.lessonId,
    type: type as ExerciseType,
    prompt: payload.prompt,
    instructions: typeof payload.instructions === 'string' ? payload.instructions : '',
    correctOrder: stringArray(payload.correctOrder),
    config,
    explanation: typeof payload.explanation === 'string' ? payload.explanation : '',
    className: classLabel(record),
  };
}

export function extraToExample(record: ClassExtraRecord): Example | null {
  if (record.type !== 'example') return null;
  const payload = parsePayload(record.payload);
  if (!payload) return null;
  const type = payload.type;
  if (typeof type !== 'string' || !EXERCISE_TYPES.includes(type as ExerciseType)) return null;
  if (typeof payload.title !== 'string' || typeof payload.prompt !== 'string') return null;
  const config =
    payload.config && typeof payload.config === 'object' && !Array.isArray(payload.config)
      ? (payload.config as ExerciseConfig)
      : {};
  const steps = Array.isArray(payload.steps)
    ? payload.steps
        .filter(
          (step): step is { text: string; why: string } =>
            !!step &&
            typeof step === 'object' &&
            'text' in step &&
            'why' in step &&
            typeof step.text === 'string' &&
            typeof step.why === 'string',
        )
        .map(step => ({ text: step.text, why: step.why }))
    : [];
  return {
    id: record.id,
    lessonId: record.lessonId,
    type: type as ExerciseType,
    title: payload.title,
    prompt: payload.prompt,
    config,
    steps,
    hints: stringArray(payload.hints),
    explanation: typeof payload.explanation === 'string' ? payload.explanation : '',
    className: classLabel(record),
  };
}
