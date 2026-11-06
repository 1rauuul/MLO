import type { SQLiteDatabase } from 'expo-sqlite';

import type { ContentBlock, ExerciseConfig, ExerciseType } from '@/shared/model/entities';
import type { CourseManifest, GroupManifest } from '@/shared/services/content/coursesV3';
import { parseCourseManifest } from '@/shared/services/content/coursesV3';

interface V3Unit {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: string;
  color: string;
  position: number;
}

interface V3Topic {
  id: string;
  unitId: string;
  title: string;
  summary?: string;
  position: number;
}

interface V3Lesson {
  id: string;
  topicId: string;
  code: string;
  title: string;
  eyebrow: string;
  body: string;
  content: ContentBlock[];
  position: number;
}

interface V3Example {
  id: string;
  topicId: string;
  type: ExerciseType;
  title: string;
  prompt: string;
  config?: ExerciseConfig;
  steps: { text: string; why: string }[];
  hints?: string[];
  explanation?: string;
  position: number;
}

interface V3EmbeddedExample {
  title: string;
  steps: { text: string; why: string }[];
  hints?: string[];
}

interface V3Exercise {
  id: string;
  topicId: string;
  type: ExerciseType;
  prompt: string;
  instructions: string;
  correctOrder: string[];
  config?: ExerciseConfig;
  explanation?: string;
  example: V3EmbeddedExample | null;
  position: number;
}

interface V3Evaluation {
  id: string;
  topicId: string;
  title: string;
  description: string;
  position: number;
  questionIds: string[];
  exerciseIds: string[];
}

interface V3Question {
  id: string;
  evaluationId: string;
  type: string;
  prompt: string;
  options: string[];
  answer: number;
  config?: ExerciseConfig;
  explanation?: string;
  position: number;
}

/**
 * Backfill DEC-03: cada lección existente se convierte en subtema `t-<lesson.id>`
 * y todo su contenido hereda el `topic_id`. Idempotente.
 */
export async function backfillLegacyTopics(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `INSERT INTO topics (id, unit_id, title, summary, position, catalog_id, archived_at)
     SELECT 't-' || id, unit_id, title, body, position, catalog_id, archived_at
     FROM lessons WHERE topic_id IS NULL
     ON CONFLICT(id) DO NOTHING`,
  );
  await db.runAsync(
    `UPDATE lessons SET topic_id = 't-' || id WHERE topic_id IS NULL`,
  );
  for (const table of ['examples', 'exercises', 'evaluations'] as const) {
    await db.runAsync(
      `UPDATE ${table} SET topic_id =
         (SELECT l.topic_id FROM lessons l WHERE l.id = ${table}.lesson_id)
       WHERE topic_id IS NULL`,
    );
  }
}

function placeholders(values: string[]): string {
  return values.map(() => '?').join(', ');
}

async function deleteMissing(
  db: SQLiteDatabase,
  table: 'examples' | 'exercises',
  catalogId: string,
  keepIds: string[],
): Promise<void> {
  const keep = keepIds.length > 0 ? ` AND id NOT IN (${placeholders(keepIds)})` : '';
  await db.runAsync(
    `DELETE FROM ${table} WHERE lesson_id IN
       (SELECT id FROM lessons WHERE catalog_id = ?)${keep}`,
    catalogId,
    ...keepIds,
  );
}

async function insertExample(
  db: SQLiteDatabase,
  example: V3Example,
  lessonId: string,
  groupId: string | null = null,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO examples
       (id, lesson_id, topic_id, type, title, prompt, config, steps, hints, explanation, position, group_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       lesson_id = excluded.lesson_id, topic_id = excluded.topic_id, type = excluded.type,
       title = excluded.title, prompt = excluded.prompt, config = excluded.config,
       steps = excluded.steps, hints = excluded.hints, explanation = excluded.explanation,
       position = excluded.position, group_id = excluded.group_id`,
    example.id,
    lessonId,
    example.topicId,
    example.type,
    example.title,
    example.prompt,
    JSON.stringify(example.config ?? {}),
    JSON.stringify(example.steps),
    JSON.stringify(example.hints ?? []),
    example.explanation ?? '',
    example.position,
    groupId,
  );
}

async function insertEmbeddedExample(
  db: SQLiteDatabase,
  exercise: V3Exercise,
  lessonId: string,
): Promise<void> {
  if (!exercise.example) {
    return;
  }
  await insertExample(
    db,
    {
      id: exercise.id,
      topicId: exercise.topicId,
      type: exercise.type,
      title: exercise.example.title,
      prompt: exercise.prompt,
      config: exercise.config ?? {},
      steps: exercise.example.steps,
      hints: exercise.example.hints ?? [],
      explanation: exercise.explanation ?? '',
      position: exercise.position,
    },
    lessonId,
  );
}

/**
 * Aplica un release v3 completo. Todo es transaccional: si una escritura falla,
 * la copia anterior y el progreso quedan intactos. Un release vacío solo marca
 * el hash, sin archivar el contenido local migrado.
 */
export async function applyV3Release(
  db: SQLiteDatabase,
  release: CourseManifest,
  catalogId: string,
): Promise<void> {
  const units = release.units as V3Unit[];
  const topics = release.topics as V3Topic[];
  const lessons = release.lessons as V3Lesson[];
  const examples = release.examples as V3Example[];
  const exercises = release.exercises as V3Exercise[];
  const evaluations = release.evaluations as V3Evaluation[];
  const questions = release.questions as V3Question[];
  const now = new Date().toISOString();

  if (units.length === 0 && topics.length === 0 && lessons.length === 0) {
    await db.runAsync(
      'UPDATE remote_courses SET applied_hash = ? WHERE catalog_id = ?',
      release.hash,
      catalogId,
    );
    return;
  }

  const topicUnits = new Map(topics.map(topic => [topic.id, topic.unitId]));
  const firstLesson = new Map<string, string>();
  for (const lesson of [...lessons].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  )) {
    if (!firstLesson.has(lesson.topicId)) {
      firstLesson.set(lesson.topicId, lesson.id);
    }
  }
  const contextLesson = (topicId: string): string => {
    const lessonId = firstLesson.get(topicId);
    if (!lessonId) {
      throw new Error(`El subtema ${topicId} no tiene lecciones.`);
    }
    return lessonId;
  };

  await db.withTransactionAsync(async () => {
    for (const unit of units) {
      await db.runAsync(
        `INSERT INTO units (id, number, title, description, difficulty, color, catalog_id, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           number = excluded.number, title = excluded.title, description = excluded.description,
           difficulty = excluded.difficulty, color = excluded.color,
           catalog_id = excluded.catalog_id, archived_at = NULL`,
        unit.id,
        unit.number,
        unit.title,
        unit.description,
        unit.difficulty,
        unit.color,
        catalogId,
      );
    }

    for (const topic of topics) {
      await db.runAsync(
        `INSERT INTO topics (id, unit_id, title, summary, position, catalog_id, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           unit_id = excluded.unit_id, title = excluded.title, summary = excluded.summary,
           position = excluded.position, catalog_id = excluded.catalog_id, archived_at = NULL`,
        topic.id,
        topic.unitId,
        topic.title,
        topic.summary ?? '',
        topic.position,
        catalogId,
      );
    }

    for (const lesson of lessons) {
      const unitId = topicUnits.get(lesson.topicId);
      if (!unitId) {
        throw new Error(`La lección ${lesson.id} apunta a un subtema desconocido.`);
      }
      await db.runAsync(
        `INSERT INTO lessons
           (id, unit_id, topic_id, code, title, eyebrow, body, code_sample, context_title,
            context_body, synthesis, content, position, catalog_id, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, '', '', '', '[]', ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           unit_id = excluded.unit_id, topic_id = excluded.topic_id, code = excluded.code,
           title = excluded.title, eyebrow = excluded.eyebrow, body = excluded.body,
           content = excluded.content, position = excluded.position,
           catalog_id = excluded.catalog_id, archived_at = NULL`,
        lesson.id,
        unitId,
        lesson.topicId,
        lesson.code,
        lesson.title,
        lesson.eyebrow,
        lesson.body,
        JSON.stringify(lesson.content ?? []),
        lesson.position,
        catalogId,
      );
    }

    for (const example of examples) {
      await insertExample(db, example, contextLesson(example.topicId));
    }

    for (const exercise of exercises) {
      const lessonId = contextLesson(exercise.topicId);
      await db.runAsync(
        `INSERT INTO exercises
           (id, lesson_id, topic_id, type, prompt, instructions, correct_order, config, explanation, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           lesson_id = excluded.lesson_id, topic_id = excluded.topic_id, type = excluded.type,
           prompt = excluded.prompt, instructions = excluded.instructions,
           correct_order = excluded.correct_order, config = excluded.config,
           explanation = excluded.explanation, position = excluded.position`,
        exercise.id,
        lessonId,
        exercise.topicId,
        exercise.type,
        exercise.prompt,
        exercise.instructions,
        JSON.stringify(exercise.correctOrder ?? []),
        JSON.stringify(exercise.config ?? {}),
        exercise.explanation ?? '',
        exercise.position,
      );
      await insertEmbeddedExample(db, exercise, lessonId);
    }

    const keepExampleIds = [
      ...examples.map(example => example.id),
      ...exercises.filter(exercise => exercise.example).map(exercise => exercise.id),
    ];
    await deleteMissing(db, 'examples', catalogId, keepExampleIds);
    await deleteMissing(
      db,
      'exercises',
      catalogId,
      exercises.map(exercise => exercise.id),
    );

    for (const evaluation of evaluations) {
      const lessonId = contextLesson(evaluation.topicId);
      await db.runAsync(
        `INSERT INTO evaluations
           (id, lesson_id, topic_id, title, description, question_count, exercise_count, archived_at, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
         ON CONFLICT(id) DO UPDATE SET
           lesson_id = excluded.lesson_id, topic_id = excluded.topic_id,
           title = excluded.title, description = excluded.description,
           question_count = excluded.question_count, exercise_count = excluded.exercise_count,
           archived_at = NULL, position = excluded.position`,
        evaluation.id,
        lessonId,
        evaluation.topicId,
        evaluation.title,
        evaluation.description,
        evaluation.questionIds.length,
        evaluation.exerciseIds.length,
        evaluation.position,
      );

      const questionIds = questions
        .filter(question => question.evaluationId === evaluation.id)
        .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
        .map(question => question.id);
      const keepQuestions = questionIds.length > 0
        ? ` AND id NOT IN (${placeholders(questionIds)})`
        : '';
      await db.runAsync(
        `DELETE FROM questions WHERE evaluation_id = ?${keepQuestions}`,
        evaluation.id,
        ...questionIds,
      );

      await db.runAsync('DELETE FROM evaluation_exercises WHERE evaluation_id = ?', evaluation.id);
      for (const exerciseId of evaluation.exerciseIds) {
        await db.runAsync(
          `INSERT INTO evaluation_exercises (evaluation_id, exercise_id) VALUES (?, ?)
           ON CONFLICT(evaluation_id, exercise_id) DO NOTHING`,
          evaluation.id,
          exerciseId,
        );
      }
    }

    for (const question of questions) {
      if (!evaluations.some(evaluation => evaluation.id === question.evaluationId)) {
        throw new Error(`La pregunta ${question.id} apunta a una evaluación desconocida.`);
      }
      await db.runAsync(
        `INSERT INTO questions
           (id, evaluation_id, order_index, type, config, prompt, options, answer, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           evaluation_id = excluded.evaluation_id, order_index = excluded.order_index,
           type = excluded.type, config = excluded.config, prompt = excluded.prompt,
           options = excluded.options, answer = excluded.answer,
           explanation = excluded.explanation`,
        question.id,
        question.evaluationId,
        question.position,
        question.type,
        JSON.stringify(question.config ?? {}),
        question.prompt,
        JSON.stringify(question.options ?? []),
        question.answer,
        question.explanation ?? '',
      );
    }

    const lessonIds = lessons.map(lesson => lesson.id);
    const topicIds = topics.map(topic => topic.id);
    const evaluationIds = evaluations.map(evaluation => evaluation.id);

    const keepLessons = lessonIds.length > 0 ? ` AND id NOT IN (${placeholders(lessonIds)})` : '';
    await db.runAsync(
      `UPDATE lessons SET archived_at = ? WHERE catalog_id = ? AND archived_at IS NULL${keepLessons}`,
      now,
      catalogId,
      ...lessonIds,
    );
    const keepTopics = topicIds.length > 0 ? ` AND id NOT IN (${placeholders(topicIds)})` : '';
    await db.runAsync(
      `UPDATE topics SET archived_at = ? WHERE catalog_id = ? AND archived_at IS NULL${keepTopics}`,
      now,
      catalogId,
      ...topicIds,
    );
    const keepEvaluations =
      evaluationIds.length > 0 ? ` AND id NOT IN (${placeholders(evaluationIds)})` : '';
    await db.runAsync(
      `UPDATE evaluations SET archived_at = ? WHERE archived_at IS NULL AND lesson_id IN
         (SELECT id FROM lessons WHERE catalog_id = ?)${keepEvaluations}`,
      now,
      catalogId,
      ...evaluationIds,
    );
    await db.runAsync(
      `DELETE FROM questions WHERE evaluation_id IN
         (SELECT id FROM evaluations WHERE archived_at IS NOT NULL AND lesson_id IN
            (SELECT id FROM lessons WHERE catalog_id = ?))`,
      catalogId,
    );
    await db.runAsync(
      `UPDATE units SET archived_at = ? WHERE catalog_id = ? AND archived_at IS NULL
       AND id NOT IN (
         SELECT DISTINCT unit_id FROM lessons WHERE catalog_id = ? AND archived_at IS NULL
       )`,
      now,
      catalogId,
      catalogId,
    );
    await db.runAsync(
      'UPDATE remote_courses SET applied_hash = ? WHERE catalog_id = ?',
      release.hash,
      catalogId,
    );
  });
}

export interface ApplyStoredResult {
  failed: string[];
}

/**
 * Aplica un release v3 de grupo. El contenido propio se guarda con `group_id` y
 * se mantiene aislado del curso y de otros grupos. Las adiciones usan
 * `class_extras_cache` con id determinista.
 */
export async function applyV3GroupRelease(
  db: SQLiteDatabase,
  release: GroupManifest,
  groupId: string,
): Promise<void> {
  if (release.kind !== 'group' || release.groupId !== groupId) {
    throw new Error('El release no corresponde al grupo.');
  }
  const catalogId = release.catalogId;
  const units = release.units as V3Unit[];
  const topics = release.topics as V3Topic[];
  const lessons = release.lessons as V3Lesson[];
  const examples = release.examples as V3Example[];
  const exercises = release.exercises as V3Exercise[];
  const evaluations = release.evaluations as V3Evaluation[];
  const questions = release.questions as V3Question[];
  const now = new Date().toISOString();

  const topicUnits = new Map(topics.map(topic => [topic.id, topic.unitId]));
  const firstLesson = new Map<string, string>();
  for (const lesson of [...lessons].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  )) {
    if (!firstLesson.has(lesson.topicId)) {
      firstLesson.set(lesson.topicId, lesson.id);
    }
  }
  const externalLessons = new Map<string, string>();
  const contextLesson = async (topicId: string): Promise<string> => {
    const own = firstLesson.get(topicId);
    if (own) {
      return own;
    }
    const cached = externalLessons.get(topicId);
    if (cached) {
      return cached;
    }
    const row = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM lessons
       WHERE topic_id = ? AND catalog_id = ? AND archived_at IS NULL
         AND (group_id IS NULL OR group_id = ?)
       ORDER BY position, id LIMIT 1`,
      topicId,
      catalogId,
      groupId,
    );
    if (!row) {
      throw new Error(`El subtema ${topicId} no tiene lecciones de contexto.`);
    }
    externalLessons.set(topicId, row.id);
    return row.id;
  };

  await db.withTransactionAsync(async () => {
    for (const unit of units) {
      await db.runAsync(
        `INSERT INTO units (id, number, title, description, difficulty, color, catalog_id, group_id, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           number = excluded.number, title = excluded.title, description = excluded.description,
           difficulty = excluded.difficulty, color = excluded.color,
           catalog_id = excluded.catalog_id, group_id = excluded.group_id, archived_at = NULL`,
        unit.id,
        unit.number,
        unit.title,
        unit.description,
        unit.difficulty,
        unit.color,
        catalogId,
        groupId,
      );
    }

    for (const topic of topics) {
      await db.runAsync(
        `INSERT INTO topics (id, unit_id, title, summary, position, catalog_id, group_id, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           unit_id = excluded.unit_id, title = excluded.title, summary = excluded.summary,
           position = excluded.position, catalog_id = excluded.catalog_id,
           group_id = excluded.group_id, archived_at = NULL`,
        topic.id,
        topic.unitId,
        topic.title,
        topic.summary ?? '',
        topic.position,
        catalogId,
        groupId,
      );
    }

    for (const lesson of lessons) {
      let unitId = topicUnits.get(lesson.topicId);
      if (!unitId) {
        const row = await db.getFirstAsync<{ unit_id: string }>(
          `SELECT unit_id FROM topics
           WHERE id = ? AND catalog_id = ? AND archived_at IS NULL
             AND (group_id IS NULL OR group_id = ?)`,
          lesson.topicId,
          catalogId,
          groupId,
        );
        unitId = row?.unit_id;
      }
      if (!unitId) {
        throw new Error(`La lección ${lesson.id} apunta a un subtema desconocido.`);
      }
      await db.runAsync(
        `INSERT INTO lessons
           (id, unit_id, topic_id, code, title, eyebrow, body, code_sample, context_title,
            context_body, synthesis, content, position, catalog_id, group_id, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, '', '', '', '[]', ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           unit_id = excluded.unit_id, topic_id = excluded.topic_id, code = excluded.code,
           title = excluded.title, eyebrow = excluded.eyebrow, body = excluded.body,
           content = excluded.content, position = excluded.position,
           catalog_id = excluded.catalog_id, group_id = excluded.group_id, archived_at = NULL`,
        lesson.id,
        unitId,
        lesson.topicId,
        lesson.code,
        lesson.title,
        lesson.eyebrow,
        lesson.body,
        JSON.stringify(lesson.content ?? []),
        lesson.position,
        catalogId,
        groupId,
      );
    }

    for (const example of examples) {
      await insertExample(db, example, await contextLesson(example.topicId), groupId);
    }

    for (const exercise of exercises) {
      const lessonId = await contextLesson(exercise.topicId);
      await db.runAsync(
        `INSERT INTO exercises
           (id, lesson_id, topic_id, type, prompt, instructions, correct_order, config, explanation, position, group_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           lesson_id = excluded.lesson_id, topic_id = excluded.topic_id, type = excluded.type,
           prompt = excluded.prompt, instructions = excluded.instructions,
           correct_order = excluded.correct_order, config = excluded.config,
           explanation = excluded.explanation, position = excluded.position,
           group_id = excluded.group_id`,
        exercise.id,
        lessonId,
        exercise.topicId,
        exercise.type,
        exercise.prompt,
        exercise.instructions,
        JSON.stringify(exercise.correctOrder ?? []),
        JSON.stringify(exercise.config ?? {}),
        exercise.explanation ?? '',
        exercise.position,
        groupId,
      );
      if (exercise.example) {
        await insertExample(
          db,
          {
            id: exercise.id,
            topicId: exercise.topicId,
            type: exercise.type,
            title: exercise.example.title,
            prompt: exercise.prompt,
            config: exercise.config ?? {},
            steps: exercise.example.steps,
            hints: exercise.example.hints ?? [],
            explanation: exercise.explanation ?? '',
            position: exercise.position,
          },
          lessonId,
          groupId,
        );
      }
    }

    for (const evaluation of evaluations) {
      const lessonId = await contextLesson(evaluation.topicId);
      await db.runAsync(
        `INSERT INTO evaluations
           (id, lesson_id, topic_id, title, description, question_count, exercise_count, archived_at, position, group_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           lesson_id = excluded.lesson_id, topic_id = excluded.topic_id,
           title = excluded.title, description = excluded.description,
           question_count = excluded.question_count, exercise_count = excluded.exercise_count,
           archived_at = NULL, position = excluded.position, group_id = excluded.group_id`,
        evaluation.id,
        lessonId,
        evaluation.topicId,
        evaluation.title,
        evaluation.description,
        evaluation.questionIds.length,
        evaluation.exerciseIds.length,
        evaluation.position,
        groupId,
      );

      const questionIds = questions
        .filter(question => question.evaluationId === evaluation.id)
        .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
        .map(question => question.id);
      const keepQuestions =
        questionIds.length > 0 ? ` AND id NOT IN (${placeholders(questionIds)})` : '';
      await db.runAsync(
        `DELETE FROM questions WHERE evaluation_id = ?${keepQuestions}`,
        evaluation.id,
        ...questionIds,
      );
      await db.runAsync('DELETE FROM evaluation_exercises WHERE evaluation_id = ?', evaluation.id);
      for (const exerciseId of evaluation.exerciseIds) {
        await db.runAsync(
          `INSERT INTO evaluation_exercises (evaluation_id, exercise_id) VALUES (?, ?)
           ON CONFLICT(evaluation_id, exercise_id) DO NOTHING`,
          evaluation.id,
          exerciseId,
        );
      }
    }

    for (const question of questions) {
      if (!evaluations.some(evaluation => evaluation.id === question.evaluationId)) {
        throw new Error(`La pregunta ${question.id} apunta a una evaluación desconocida.`);
      }
      await db.runAsync(
        `INSERT INTO questions
           (id, evaluation_id, order_index, type, config, prompt, options, answer, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           evaluation_id = excluded.evaluation_id, order_index = excluded.order_index,
           type = excluded.type, config = excluded.config, prompt = excluded.prompt,
           options = excluded.options, answer = excluded.answer,
           explanation = excluded.explanation`,
        question.id,
        question.evaluationId,
        question.position,
        question.type,
        JSON.stringify(question.config ?? {}),
        question.prompt,
        JSON.stringify(question.options ?? []),
        question.answer,
        question.explanation ?? '',
      );
    }

    for (const addition of release.additions) {
      await db.runAsync(
        `INSERT INTO class_extras_cache (class_id, extra_id, lesson_id, type, payload, position)
         VALUES (?, ?, ?, 'lesson', ?, ?)
         ON CONFLICT(class_id, extra_id) DO UPDATE SET
           lesson_id = excluded.lesson_id, type = excluded.type,
           payload = excluded.payload, position = excluded.position`,
        groupId,
        `v3-${groupId}-${addition.lessonId}`,
        addition.lessonId,
        JSON.stringify({ title: '', blocks: addition.blocks }),
        0,
      );
    }
    const additionIds = release.additions.map(
      addition => `v3-${groupId}-${addition.lessonId}`,
    );
    const keepAdditions =
      additionIds.length > 0 ? ` AND extra_id NOT IN (${placeholders(additionIds)})` : '';
    await db.runAsync(
      `DELETE FROM class_extras_cache
       WHERE class_id = ? AND extra_id LIKE ?${keepAdditions}`,
      groupId,
      `v3-${groupId}-%`,
      ...additionIds,
    );

    const lessonIds = lessons.map(lesson => lesson.id);
    const topicIds = topics.map(topic => topic.id);
    const evaluationIds = evaluations.map(evaluation => evaluation.id);
    const exampleIds = [
      ...examples.map(example => example.id),
      ...exercises.filter(exercise => exercise.example).map(exercise => exercise.id),
    ];

    const keepLessons = lessonIds.length > 0 ? ` AND id NOT IN (${placeholders(lessonIds)})` : '';
    await db.runAsync(
      `UPDATE lessons SET archived_at = ?
       WHERE group_id = ? AND catalog_id = ? AND archived_at IS NULL${keepLessons}`,
      now,
      groupId,
      catalogId,
      ...lessonIds,
    );
    const keepTopics = topicIds.length > 0 ? ` AND id NOT IN (${placeholders(topicIds)})` : '';
    await db.runAsync(
      `UPDATE topics SET archived_at = ?
       WHERE group_id = ? AND catalog_id = ? AND archived_at IS NULL${keepTopics}`,
      now,
      groupId,
      catalogId,
      ...topicIds,
    );
    await db.runAsync(
      `UPDATE units SET archived_at = ?
       WHERE group_id = ? AND catalog_id = ? AND archived_at IS NULL
         AND id NOT IN (SELECT DISTINCT unit_id FROM lessons
                        WHERE group_id = ? AND catalog_id = ? AND archived_at IS NULL)`,
      now,
      groupId,
      catalogId,
      groupId,
      catalogId,
    );

    const keepExamples = exampleIds.length > 0 ? ` AND id NOT IN (${placeholders(exampleIds)})` : '';
    await db.runAsync(
      `DELETE FROM examples WHERE group_id = ?${keepExamples}`,
      groupId,
      ...exampleIds,
    );
    const exerciseIds = exercises.map(exercise => exercise.id);
    const keepExercises =
      exerciseIds.length > 0 ? ` AND id NOT IN (${placeholders(exerciseIds)})` : '';
    await db.runAsync(
      `DELETE FROM exercises WHERE group_id = ?${keepExercises}`,
      groupId,
      ...exerciseIds,
    );
    const keepEvaluations =
      evaluationIds.length > 0 ? ` AND id NOT IN (${placeholders(evaluationIds)})` : '';
    await db.runAsync(
      `UPDATE evaluations SET archived_at = ?
       WHERE group_id = ? AND archived_at IS NULL${keepEvaluations}`,
      now,
      groupId,
      ...evaluationIds,
    );
    await db.runAsync(
      `DELETE FROM questions WHERE evaluation_id IN
         (SELECT id FROM evaluations WHERE group_id = ? AND archived_at IS NOT NULL)`,
      groupId,
    );

    await db.runAsync(
      `UPDATE class_cache SET
         class_name = ?, version = ?, hash = ?, published_at = ?,
         course_catalog_id = ?, archived = 0, release_v3 = ?, applied_hash = ?,
         fetched_at = ?
       WHERE class_id = ?`,
      release.group.name,
      release.version,
      release.hash,
      release.publishedAt,
      catalogId,
      JSON.stringify(release),
      release.hash,
      now,
      groupId,
    );
  });
}

/** Aplica manifiestos v3 guardados cuya hash aún no coincide con `applied_hash`. */
export async function applyStoredV3Content(
  db: SQLiteDatabase,
  catalogId?: string,
): Promise<ApplyStoredResult> {
  const rows = catalogId
    ? await db.getAllAsync<{
        catalog_id: string;
        manifest: string;
        hash: string;
        applied_hash: string | null;
      }>(
        `SELECT catalog_id, manifest, hash, applied_hash FROM remote_courses
         WHERE manifest IS NOT NULL AND catalog_id = ?`,
        catalogId,
      )
    : await db.getAllAsync<{
        catalog_id: string;
        manifest: string;
        hash: string;
        applied_hash: string | null;
      }>(
        `SELECT catalog_id, manifest, hash, applied_hash FROM remote_courses
         WHERE manifest IS NOT NULL`,
      );

  const failed: string[] = [];
  for (const row of rows) {
    if (!row.manifest || row.applied_hash === row.hash) {
      continue;
    }
    try {
      const parsed: unknown = JSON.parse(row.manifest);
      const release = parseCourseManifest(parsed, row.catalog_id);
      await applyV3Release(db, release, row.catalog_id);
    } catch (caught) {
      failed.push(row.catalog_id);
      if (__DEV__) {
        console.warn(`[content] release v3 pendiente ${row.catalog_id}`, caught);
      }
    }
  }
  return { failed };
}
