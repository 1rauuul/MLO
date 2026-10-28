import type { SQLiteDatabase } from 'expo-sqlite';

import type { ExampleState } from '@/features/exercises/model/exampleStateRepository';
import type { ProgressBackup } from '@/features/profile/model/backup.logic';

interface ProgressRow {
  lesson_id: string;
  completed: number;
  updated_at: string;
}

interface AttemptRow {
  source: 'practice' | 'evaluation';
  item_id: string;
  item_type: string;
  lesson_id: string;
  correct: number;
  score_correct: number;
  score_total: number;
  created_at: string;
}

interface EvaluationResultRow {
  evaluation_id: string;
  score: number;
  correct_count: number;
  total_count: number;
  created_at: string;
}

interface ExampleStateRow {
  lesson_id: string;
  payload: string;
  updated_at: string;
}

interface LastLocationRow {
  unit_id: string | null;
  lesson_id: string | null;
  lesson_code: string | null;
  section: string | null;
  updated_at: string;
}

interface ClassRow {
  class_id: string;
  class_code: string;
  class_name: string;
  teacher_name: string | null;
}

export interface BackupImportResult {
  omitted: number;
}

function parsePayload(raw: string): ExampleState {
  try {
    const parsed = JSON.parse(raw) as ExampleState;
    return {
      drawExampleIds: parsed.drawExampleIds ?? [],
      drawExerciseIds: parsed.drawExerciseIds ?? [],
      seenExampleIds: parsed.seenExampleIds ?? [],
      exampleIndex: parsed.exampleIndex ?? 0,
    };
  } catch {
    return { drawExampleIds: [], drawExerciseIds: [], seenExampleIds: [], exampleIndex: 0 };
  }
}

export async function selectProgressBackup(db: SQLiteDatabase, accountId: number): Promise<ProgressBackup> {
  const [
    moduleProgress,
    attempts,
    evaluationResults,
    exampleState,
    lastLocation,
    account,
    classes,
  ] = await Promise.all([
    db.getAllAsync<ProgressRow>(
      'SELECT lesson_id, completed, updated_at FROM module_progress WHERE account_id = ? ORDER BY lesson_id',
      accountId,
    ),
    db.getAllAsync<AttemptRow>(
      'SELECT source, item_id, item_type, lesson_id, correct, score_correct, score_total, created_at FROM attempts WHERE account_id = ? ORDER BY id',
      accountId,
    ),
    db.getAllAsync<EvaluationResultRow>(
      'SELECT evaluation_id, score, correct_count, total_count, created_at FROM evaluation_results WHERE account_id = ? ORDER BY id',
      accountId,
    ),
    db.getAllAsync<ExampleStateRow>(
      'SELECT lesson_id, payload, updated_at FROM example_state WHERE account_id = ? ORDER BY lesson_id',
      accountId,
    ),
    db.getFirstAsync<LastLocationRow>(
      'SELECT unit_id, lesson_id, lesson_code, section, updated_at FROM last_location WHERE account_id = ?',
      accountId,
    ),
    db.getFirstAsync<{ external_key: string }>(
      'SELECT external_key FROM accounts WHERE id = ?',
      accountId,
    ),
    db.getAllAsync<ClassRow>(
      `SELECT ac.class_id, ac.class_code,
              COALESCE(c.class_name, ac.class_code) AS class_name,
              c.teacher_name
         FROM account_classes ac
         LEFT JOIN class_cache c ON c.class_id = ac.class_id
        WHERE ac.account_id = ?
        ORDER BY class_name COLLATE NOCASE`,
      accountId,
    ),
  ]);

  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    student: account?.external_key ? { externalKey: account.external_key } : null,
    classes: classes.map(row => ({
      classId: row.class_id,
      code: row.class_code,
      name: row.class_name,
      teacherName: row.teacher_name,
    })),
    moduleProgress: moduleProgress.map(row => ({
      lessonId: row.lesson_id,
      completed: row.completed === 1,
      updatedAt: row.updated_at,
    })),
    attempts: attempts.map(row => ({
      source: row.source,
      itemId: row.item_id,
      itemType: row.item_type,
      lessonId: row.lesson_id,
      correct: row.correct === 1,
      scoreCorrect: row.score_correct,
      scoreTotal: row.score_total,
      createdAt: row.created_at,
    })),
    evaluationResults: evaluationResults.map(row => ({
      evaluationId: row.evaluation_id,
      score: row.score,
      correctCount: row.correct_count,
      totalCount: row.total_count,
      createdAt: row.created_at,
    })),
    exampleState: exampleState.map(row => ({
      lessonId: row.lesson_id,
      payload: parsePayload(row.payload),
      updatedAt: row.updated_at,
    })),
    lastLocation: lastLocation
      ? {
          unitId: lastLocation.unit_id,
          lessonId: lastLocation.lesson_id,
          lessonCode: lastLocation.lesson_code,
          section: lastLocation.section,
          updatedAt: lastLocation.updated_at,
        }
      : null,
  };
}

export async function replaceProgressFromBackup(
  db: SQLiteDatabase,
  accountId: number,
  backup: ProgressBackup,
): Promise<BackupImportResult> {
  const [lessonRows, evaluationRows] = await Promise.all([
    db.getAllAsync<{ id: string }>('SELECT id FROM lessons'),
    db.getAllAsync<{ id: string }>('SELECT id FROM evaluations'),
  ]);
  const lessonIds = new Set(lessonRows.map(row => row.id));
  const evaluationIds = new Set(evaluationRows.map(row => row.id));
  let omitted = 0;

  if (backup.student) {
    const conflict = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM accounts WHERE external_key = ? AND id <> ?',
      backup.student.externalKey,
      accountId,
    );
    if (conflict) {
      throw new Error('Ese respaldo pertenece a otra cuenta local.');
    }
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM module_progress WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM attempts WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM evaluation_results WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM example_state WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM last_location WHERE account_id = ?', accountId);

    if (backup.student) {
      await db.runAsync(
        'UPDATE accounts SET external_key = ? WHERE id = ?',
        backup.student.externalKey,
        accountId,
      );
      await db.runAsync('DELETE FROM account_classes WHERE account_id = ?', accountId);
      for (const klass of backup.classes) {
        await db.runAsync(
          `INSERT INTO class_cache
             (class_id, class_code, class_name, teacher_name, version, hash, published_at, fetched_at)
           VALUES (?, ?, ?, ?, 0, '', NULL, NULL)
           ON CONFLICT(class_id) DO UPDATE SET
             class_code = excluded.class_code,
             class_name = excluded.class_name,
             teacher_name = excluded.teacher_name`,
          klass.classId,
          klass.code,
          klass.name,
          klass.teacherName,
        );
        await db.runAsync(
          `INSERT INTO account_classes (account_id, class_id, class_code, joined_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(account_id, class_id) DO UPDATE SET class_code = excluded.class_code`,
          accountId,
          klass.classId,
          klass.code,
          backup.exportedAt,
        );
      }
    }

    for (const progress of backup.moduleProgress) {
      if (!lessonIds.has(progress.lessonId)) {
        omitted += 1;
        continue;
      }
      await db.runAsync(
        'INSERT INTO module_progress (account_id, lesson_id, completed, updated_at) VALUES (?, ?, ?, ?)',
        accountId,
        progress.lessonId,
        progress.completed ? 1 : 0,
        progress.updatedAt,
      );
    }

    for (const attempt of backup.attempts) {
      if (!lessonIds.has(attempt.lessonId)) {
        omitted += 1;
        continue;
      }
      await db.runAsync(
        `INSERT INTO attempts (account_id, source, item_id, item_type, lesson_id, correct, score_correct, score_total, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        accountId,
        attempt.source,
        attempt.itemId,
        attempt.itemType,
        attempt.lessonId,
        attempt.correct ? 1 : 0,
        attempt.scoreCorrect,
        attempt.scoreTotal,
        attempt.createdAt,
      );
    }

    for (const result of backup.evaluationResults) {
      if (!evaluationIds.has(result.evaluationId)) {
        omitted += 1;
        continue;
      }
      await db.runAsync(
        'INSERT INTO evaluation_results (account_id, evaluation_id, score, correct_count, total_count, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        accountId,
        result.evaluationId,
        result.score,
        result.correctCount,
        result.totalCount,
        result.createdAt,
      );
    }

    for (const state of backup.exampleState) {
      if (!lessonIds.has(state.lessonId)) {
        omitted += 1;
        continue;
      }
      await db.runAsync(
        `INSERT INTO example_state (account_id, lesson_id, payload, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(account_id, lesson_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
        accountId,
        state.lessonId,
        JSON.stringify(state.payload),
        state.updatedAt,
      );
    }

    if (backup.lastLocation && lessonIds.has(backup.lastLocation.lessonId ?? '')) {
      await db.runAsync(
        'INSERT INTO last_location (account_id, unit_id, lesson_id, lesson_code, section, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        accountId,
        backup.lastLocation.unitId,
        backup.lastLocation.lessonId,
        backup.lastLocation.lessonCode,
        backup.lastLocation.section,
        backup.lastLocation.updatedAt,
      );
    }
  });

  return { omitted };
}
