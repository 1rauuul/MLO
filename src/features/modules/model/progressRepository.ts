import type { SQLiteDatabase } from 'expo-sqlite';

import {
  extraToExample,
  extraToExercise,
  type ClassExtraRecord,
} from '@/features/classes/model/classRepository';
import { selectEvaluationScoresByLesson } from '@/features/evaluations/model/evaluationRepository';
import {
  EMPTY_EXAMPLE_STATE,
  parseExampleStatePayload,
  type ExampleState,
} from '@/features/exercises/model/exampleStateRepository';
import { isTopicCompleted, type PracticeAttempt } from '@/features/modules/model/completion.logic';

interface ProgressRow {
  lesson_id: string;
  completed: number;
}

export async function selectProgressMap(
  db: SQLiteDatabase,
  accountId: number,
  catalogId = 'base',
): Promise<Record<string, boolean>> {
  const rows = await db.getAllAsync<ProgressRow>(
    `SELECT p.lesson_id, p.completed
     FROM module_progress p
     JOIN lessons l ON l.id = p.lesson_id
     WHERE p.account_id = ? AND l.catalog_id = ? AND l.archived_at IS NULL`,
    accountId,
    catalogId,
  );
  const map: Record<string, boolean> = {};
  for (const row of rows) {
    map[row.lesson_id] = row.completed === 1;
  }
  return map;
}

export async function markLessonCompleted(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO module_progress (account_id, lesson_id, completed, updated_at) VALUES (?, ?, 1, ?)
     ON CONFLICT(account_id, lesson_id) DO UPDATE SET completed = 1, updated_at = excluded.updated_at`,
    accountId,
    lessonId,
    new Date().toISOString(),
  );
}

export async function countCompletedByUnit(
  db: SQLiteDatabase,
  accountId: number,
  unitId: string,
  catalogId = 'base',
): Promise<{ completed: number; total: number }> {
  const totalRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM lessons WHERE unit_id = ? AND catalog_id = ? AND archived_at IS NULL',
    unitId,
    catalogId,
  );
  const completedRow = await db.getFirstAsync<{ completed: number }>(
    `SELECT COUNT(*) AS completed
     FROM lessons l
     JOIN module_progress p ON p.lesson_id = l.id
     WHERE l.unit_id = ? AND l.catalog_id = ? AND l.archived_at IS NULL
       AND p.account_id = ? AND p.completed = 1`,
    unitId,
    catalogId,
    accountId,
  );
  return { completed: completedRow?.completed ?? 0, total: totalRow?.total ?? 0 };
}

export async function resetAccountProgress(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM module_progress WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM evaluation_results WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM attempts WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM example_state WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM last_location WHERE account_id = ?', accountId);
  });
}

interface ExampleRow {
  id: string;
  lesson_id: string;
  type: string;
}

interface AttemptRow {
  source: string;
  item_id: string;
  lesson_id: string;
  score_correct: number;
  score_total: number;
}

/**
 * Mapa lessonId -> tema completado: lección leída, todos los ejemplos vistos,
 * ejercicios con score >= 80 y evaluación aprobada (si existe). Solo evalúa las
 * lecciones ya leídas; el resto queda fuera del mapa (false para los consumidores).
 */
export async function selectCompletionMap(
  db: SQLiteDatabase,
  accountId: number,
  catalogId = 'base',
): Promise<Record<string, boolean>> {
  const progress = await selectProgressMap(db, accountId, catalogId);
  const readIds = Object.keys(progress).filter(id => progress[id]);
  const map: Record<string, boolean> = {};
  if (readIds.length === 0) {
    return map;
  }

  const [stateRows, exerciseRows, exampleRows, extraRows, attemptRows, scores] =
    await Promise.all([
      db.getAllAsync<{ lesson_id: string; payload: string }>(
        'SELECT lesson_id, payload FROM example_state WHERE account_id = ?',
        accountId,
      ),
      db.getAllAsync<{ id: string; lesson_id: string }>(
        'SELECT id, lesson_id FROM exercises',
      ),
      db.getAllAsync<ExampleRow>('SELECT id, lesson_id, type FROM examples'),
      db.getAllAsync<{ id: string; lesson_id: string; type: string; payload: string }>(
        `SELECT e.extra_id AS id, e.lesson_id, e.type, e.payload
           FROM account_classes ac
           JOIN class_extras_cache e ON e.class_id = ac.class_id
           JOIN class_cache c ON c.class_id = ac.class_id AND COALESCE(c.archived, 0) = 0
           JOIN lessons l ON l.id = e.lesson_id AND l.archived_at IS NULL
          WHERE ac.account_id = ? AND ac.active = 1`,
        accountId,
      ),
      db.getAllAsync<AttemptRow>(
        'SELECT source, item_id, lesson_id, score_correct, score_total FROM attempts WHERE account_id = ?',
        accountId,
      ),
      selectEvaluationScoresByLesson(db, accountId),
    ]);

  const states = new Map<string, ExampleState>();
  for (const row of stateRows) {
    states.set(row.lesson_id, parseExampleStatePayload(row.payload));
  }

  const poolByLesson = new Map<string, string[]>();
  const addPool = (lessonId: string, id: string) => {
    const pool = poolByLesson.get(lessonId) ?? [];
    pool.push(id);
    poolByLesson.set(lessonId, pool);
  };
  for (const row of exerciseRows) {
    addPool(row.lesson_id, row.id);
  }

  const examplesByLesson = new Map<string, { id: string; type: string }[]>();
  const addExample = (lessonId: string, id: string, type: string) => {
    const list = examplesByLesson.get(lessonId) ?? [];
    list.push({ id, type });
    examplesByLesson.set(lessonId, list);
  };
  for (const row of exampleRows) {
    addExample(row.lesson_id, row.id, row.type);
  }

  const seenExtras = new Set<string>();
  for (const row of extraRows) {
    if (seenExtras.has(row.id)) {
      continue;
    }
    seenExtras.add(row.id);
    const record: ClassExtraRecord = {
      id: row.id,
      lessonId: row.lesson_id,
      type: row.type as ClassExtraRecord['type'],
      payload: row.payload,
      classNames: [],
      teacherNames: [],
    };
    const exercise = extraToExercise(record);
    if (exercise) {
      addPool(exercise.lessonId, exercise.id);
    }
    const example = extraToExample(record);
    if (example) {
      addExample(example.lessonId, example.id, example.type);
    }
  }

  const attemptsByLesson = new Map<string, PracticeAttempt[]>();
  for (const row of attemptRows) {
    const list = attemptsByLesson.get(row.lesson_id) ?? [];
    list.push({
      source: row.source === 'evaluation' ? 'evaluation' : 'practice',
      itemId: row.item_id,
      scoreCorrect: row.score_correct,
      scoreTotal: row.score_total,
    });
    attemptsByLesson.set(row.lesson_id, list);
  }

  for (const lessonId of readIds) {
    const poolIds = poolByLesson.get(lessonId) ?? [];
    const pool = new Set(poolIds);
    const independentExampleIds = (examplesByLesson.get(lessonId) ?? [])
      .filter(example => !pool.has(example.id) && example.type !== 'order')
      .map(example => example.id);
    const score = scores[lessonId];
    map[lessonId] = isTopicCompleted({
      lessonsDone: true,
      poolIds,
      state: states.get(lessonId) ?? EMPTY_EXAMPLE_STATE,
      independentExampleIds,
      attempts: attemptsByLesson.get(lessonId) ?? [],
      evaluationScore: score === undefined ? null : (score ?? 0),
    });
  }
  return map;
}
