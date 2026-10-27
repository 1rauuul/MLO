import type { SQLiteDatabase } from 'expo-sqlite';

import type { Complexity, UnitColor } from '@/shared/model/entities';

import { richContent } from '@/shared/services/content/richContent';
import type { RemoteLessonPayload } from '@/shared/services/content/remote/validateLessonPayload';
import { l12QuestionBank } from '@/shared/services/content/banks/lesson1.2.questions';
import type { ExerciseSeed } from '@/shared/services/content/banks/types';
import {
  unit1Evaluations,
  unit1Examples,
  unit1Exercises,
  type EvaluationSeed,
  type ExampleSeed,
  type QuestionSeed,
} from '@/shared/services/content/unit1.content';

interface UnitSeed {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: Complexity;
  color: UnitColor;
}

interface LessonSeed {
  id: string;
  unitId: string;
  code: string;
  title: string;
  eyebrow: string;
  body: string;
  codeSample?: string;
  contextTitle?: string;
  contextBody?: string;
  synthesis?: string[];
  position: number;
}

const units: UnitSeed[] = [
  { id: 'u1', number: 1, title: 'Introducción', description: 'Software de calidad más allá de programar.', difficulty: 'Fundamental', color: 'blue' },
  { id: 'u2', number: 2, title: 'Procesos de software', description: 'Modelos y actividades del proceso de desarrollo.', difficulty: 'Intermedio', color: 'violet' },
  { id: 'u3', number: 3, title: 'Desarrollo ágil de software', description: 'Métodos ágiles, XP y gestión de proyectos.', difficulty: 'Intermedio', color: 'green' },
  { id: 'u4', number: 4, title: 'Ingeniería de requerimientos', description: 'Cómo descubrir, especificar y validar requerimientos.', difficulty: 'Avanzado', color: 'blue' },
  { id: 'u5', number: 5, title: 'Modelado del sistema', description: 'Modelos de contexto, interacción, estructura y comportamiento.', difficulty: 'Avanzado', color: 'violet' },
];

const unitOneLessons: LessonSeed[] = [
  {
    id: 'l1.1',
    unitId: 'u1',
    code: '1.1',
    title: 'Introducción a la ingeniería de software',
    eyebrow: 'Módulo 01 · Lección 01',
    body: 'La ingeniería de software es la disciplina de ingeniería que se ocupa de todos los aspectos del desarrollo de sistemas de software, desde la especificación inicial hasta el mantenimiento posterior a la entrega.',
    contextTitle: 'De programar a ingenierizar',
    contextBody: 'Un programa pequeño puede escribirse sin proceso; un sistema usado por miles de personas exige requisitos, diseño, pruebas y mantenimiento.',
    synthesis: [
      'La ingeniería de software cubre todo el ciclo de vida, no solo programar.',
      'Un software de calidad es mantenible, confiable y cumple los requisitos acordados.',
      'La disciplina aplica procesos, estándares y trabajo en equipo.',
    ],
    position: 0,
  },
  {
    id: 'l1.2',
    unitId: 'u1',
    code: '1.2',
    title: 'Desarrollo de software profesional',
    eyebrow: 'Módulo 01 · Lección 02',
    body: 'El desarrollo profesional se organiza en actividades: especificación, diseño, implementación, validación y mantenimiento. Documentar, usar control de versiones y registrar incidencias hace el trabajo trazable.',
    contextTitle: 'Trabajo coordinado y trazable',
    contextBody: 'Requisitos, versiones y pruebas dejan evidencia de qué se decidió y cómo se validó.',
    synthesis: [
      'Especificar define qué debe hacer el sistema.',
      'La validación confirma que se cumplen los requisitos.',
      'El mantenimiento continúa después de la entrega.',
    ],
    position: 1,
  },
  {
    id: 'l1.3',
    unitId: 'u1',
    code: '1.3',
    title: 'Ética en la ingeniería de software',
    eyebrow: 'Módulo 01 · Lección 03',
    body: 'El código de ética y práctica profesional ACM/IEEE establece principios: interés público, calidad del producto, integridad del juicio profesional, competencia y confidencialidad.',
    contextTitle: 'Decisiones bajo presión',
    contextBody: 'Ante un fallo que expone datos personales, el interés público y la protección de datos prevalecen sobre evitar retrasos comerciales.',
    synthesis: [
      'El interés público y la protección de datos son prioritarios.',
      'La competencia profesional implica no aceptar tareas para las que no se está capacitado.',
      'La confidencialidad se equilibra con la obligación de informar riesgos graves.',
    ],
    position: 2,
  },
  {
    id: 'l1.4',
    unitId: 'u1',
    code: '1.4',
    title: 'Estudios de caso',
    eyebrow: 'Módulo 01 · Lección 04',
    body: 'Los estudios de caso conectan decisiones técnicas con implicaciones éticas y sociales: un sistema embebido (bomba de insulina), un sistema de información (MHC-PMS) y un sistema de adquisición de datos (estación meteorológica).',
    contextTitle: 'Del código a las consecuencias',
    contextBody: 'Cada dominio enfatiza atributos de calidad distintos: seguridad, privacidad o fiabilidad en ambientes hostiles.',
    synthesis: [
      'Cada dominio enfatiza atributos de calidad distintos.',
      'Las decisiones técnicas tienen consecuencias éticas y sociales.',
      'El diseño responsable implica transparencia y minimización de datos.',
    ],
    position: 3,
  },
];

interface SimpleLessonSeed {
  code: string;
  title: string;
  summary: string;
}

const simpleLessons: Record<string, SimpleLessonSeed[]> = {
  u2: [
    { code: '2.1', title: 'Modelos de proceso de software', summary: 'Un modelo de proceso es una representación simplificada de las actividades de desarrollo: cascada, incremental, iterativo y espiral organizan el trabajo de formas distintas.' },
    { code: '2.2', title: 'Actividades del proceso', summary: 'Las actividades fundamentales del proceso son la especificación, el diseño e implementación, la validación y la evolución del software.' },
    { code: '2.3', title: 'Cómo enfrentar el cambio', summary: 'El cambio es inevitable; los procesos iterativos e incrementales permiten incorporarlo sin rehacer todo el sistema.' },
    { code: '2.4', title: 'El Proceso Unificado Racional', summary: 'El RUP organiza el desarrollo en fases (inicio, elaboración, construcción y transición) y en flujos de trabajo con iteraciones.' },
  ],
  u3: [
    { code: '3.1', title: 'Métodos ágiles', summary: 'Los métodos ágiles priorizan entregas frecuentes, colaboración con el cliente y respuesta al cambio sobre la planificación exhaustiva.' },
    { code: '3.2', title: 'Desarrollo dirigido por un plan y desarrollo ágil', summary: 'El desarrollo dirigido por un plan anticipa requisitos y diseño; el ágil los descubre iterativamente. Ambos pueden combinarse según el contexto.' },
    { code: '3.3', title: 'Programación extrema', summary: 'XP es una metodología ágil con prácticas como desarrollo guiado por pruebas, programación en parejas e integración continua.' },
    { code: '3.4', title: 'Administración de un proyecto ágil', summary: 'La gestión ágil planifica por iteraciones cortas, mide avance con entregas reales y ajusta prioridades de forma continua.' },
    { code: '3.5', title: 'Escalamiento de métodos ágiles', summary: 'Escalar ágil implica coordinar varios equipos manteniendo la autonomía y la sincronización de entregas.' },
  ],
  u4: [
    { code: '4.1', title: 'Requerimientos funcionales y no funcionales', summary: 'Los requerimientos funcionales describen qué debe hacer el sistema; los no funcionales imponen restricciones de calidad como rendimiento, seguridad o usabilidad.' },
    { code: '4.2', title: 'El documento de requerimientos de software', summary: 'El documento de requerimientos es el acuerdo formal entre cliente y equipo sobre lo que el sistema debe hacer.' },
    { code: '4.3', title: 'Especificación de requerimientos', summary: 'Especificar es traducir necesidades ambiguas en enunciados precisos, verificables y sin contradicciones.' },
    { code: '4.4', title: 'Procesos de ingeniería de requerimientos', summary: 'La ingeniería de requerimientos incluye obtención, análisis, especificación y validación de los requerimientos.' },
    { code: '4.5', title: 'Adquisición y análisis de requerimientos', summary: 'La adquisición combina entrevistas, observación y prototipos; el análisis resuelve conflictos y prioriza.' },
    { code: '4.6', title: 'Validación de requerimientos', summary: 'Validar requerimientos es comprobar con las partes interesadas que definen realmente el sistema correcto.' },
    { code: '4.7', title: 'Administración de requerimientos', summary: 'Administrar requerimientos es gestionar cambios, trazabilidad y versiones a lo largo del proyecto.' },
  ],
  u5: [
    { code: '5.1', title: 'Modelos de contexto', summary: 'Los modelos de contexto delimitan el sistema y su entorno, mostrando qué queda dentro y qué interactúa con él.' },
    { code: '5.2', title: 'Modelos de interacción', summary: 'Los modelos de interacción describen cómo los usuarios y otros sistemas se comunican con el software.' },
    { code: '5.3', title: 'Modelos estructurales', summary: 'Los modelos estructurales representan la organización estática del sistema: clases, componentes y sus relaciones.' },
    { code: '5.4', title: 'Modelos de comportamiento', summary: 'Los modelos de comportamiento describen la dinámica del sistema: estados, eventos y secuencias de interacción.' },
    { code: '5.5', title: 'Ingeniería dirigida por modelo', summary: 'La ingeniería dirigida por modelo genera artefactos a partir de modelos, elevando el nivel de abstracción del desarrollo.' },
  ],
};

function buildSimpleLessons(): LessonSeed[] {
  const result: LessonSeed[] = [];
  for (const [unitId, items] of Object.entries(simpleLessons)) {
    const unit = units.find(item => item.id === unitId);
    if (!unit) continue;
    items.forEach((item, index) => {
      result.push({
        id: `l${item.code}`,
        unitId,
        code: item.code,
        title: item.title,
        eyebrow: `Módulo ${String(unit.number).padStart(2, '0')} · Lección ${String(index + 1).padStart(2, '0')}`,
        body: item.summary,
        contextTitle: 'En contexto',
        contextBody: 'Este tema se profundiza en las siguientes unidades del curso.',
        synthesis: [
          'Revisa la relación del tema con el proceso de desarrollo.',
          'Identifica qué decisiones profesionales implica.',
        ],
        position: index,
      });
    });
  }
  return result;
}

const LESSONS = [...unitOneLessons, ...buildSimpleLessons()];

function hashString(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// Cualquier cambio en el contenido empaquetado cambia el hash y dispara una
// re-sincronización sin subir DATABASE_VERSION.
export const CONTENT_HASH = hashString(
  JSON.stringify({
    units,
    lessons: LESSONS,
    unit1Exercises,
    unit1Examples,
    unit1Evaluations,
    l12QuestionBank,
    richContent,
  }),
);

const CONTENT_HASH_KEY = 'content_hash';

function placeholders(values: string[]): string {
  return values.map(() => '?').join(', ');
}

async function insertExampleRow(db: SQLiteDatabase, example: ExampleSeed): Promise<void> {
  await db.runAsync(
    `INSERT INTO examples (id, lesson_id, type, title, prompt, config, steps, hints, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       lesson_id = excluded.lesson_id, type = excluded.type, title = excluded.title,
       prompt = excluded.prompt, config = excluded.config, steps = excluded.steps,
       hints = excluded.hints, explanation = excluded.explanation`,
    example.id,
    example.lessonId,
    example.type,
    example.title,
    example.prompt,
    JSON.stringify(example.config),
    JSON.stringify(example.steps),
    JSON.stringify(example.hints),
    example.explanation,
  );
}

async function insertExerciseRow(db: SQLiteDatabase, exercise: ExerciseSeed): Promise<void> {
  await db.runAsync(
    `INSERT INTO exercises (id, lesson_id, type, prompt, instructions, correct_order, config, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       lesson_id = excluded.lesson_id, type = excluded.type, prompt = excluded.prompt,
       instructions = excluded.instructions, correct_order = excluded.correct_order,
       config = excluded.config, explanation = excluded.explanation`,
    exercise.id,
    exercise.lessonId,
    exercise.type,
    exercise.prompt,
    exercise.instructions,
    JSON.stringify(exercise.correctOrder),
    JSON.stringify(exercise.config ?? {}),
    exercise.explanation ?? '',
  );
}

function exampleFromExercise(exercise: ExerciseSeed): ExampleSeed | null {
  if (!exercise.example) {
    return null;
  }
  return {
    id: exercise.id,
    lessonId: exercise.lessonId,
    type: exercise.type,
    title: exercise.example.title,
    prompt: exercise.prompt,
    config: exercise.config ?? {},
    steps: exercise.example.steps,
    hints: exercise.example.hints,
    explanation: exercise.explanation ?? '',
  };
}

async function insertExerciseWithExample(db: SQLiteDatabase, exercise: ExerciseSeed): Promise<void> {
  await insertExerciseRow(db, exercise);
  const example = exampleFromExercise(exercise);
  if (example) {
    await insertExampleRow(db, example);
  }
}

function evaluationQuestionId(evaluationId: string, index: number, question: QuestionSeed): string {
  return question.id ?? `${evaluationId}-q${index + 1}`;
}

function bankQuestionId(evaluationId: string, index: number, question: QuestionSeed): string {
  return question.id ?? `${evaluationId}-bank-q${index + 1}`;
}

// El banco manda sobre la copia embebida: se omite al sembrar sin desplazar
// los ids posicionales del resto, para no romper attempts.
function isBankDuplicate(evaluationId: string, question: QuestionSeed): boolean {
  return (
    evaluationId === 'ev1.2' &&
    l12QuestionBank.some(bankQuestion => bankQuestion.prompt === question.prompt)
  );
}

async function insertQuestionRow(
  db: SQLiteDatabase,
  id: string,
  evaluationId: string,
  orderIndex: number,
  question: QuestionSeed,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO questions (id, evaluation_id, order_index, type, config, prompt, options, answer, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       evaluation_id = excluded.evaluation_id, order_index = excluded.order_index,
       type = excluded.type, config = excluded.config, prompt = excluded.prompt,
       options = excluded.options, answer = excluded.answer, explanation = excluded.explanation`,
    id,
    evaluationId,
    orderIndex,
    question.type,
    JSON.stringify(question.config ?? {}),
    question.prompt,
    JSON.stringify(question.options),
    question.answer,
    question.explanation,
  );
}

async function insertEvaluationRows(db: SQLiteDatabase, evaluation: EvaluationSeed): Promise<void> {
  await db.runAsync(
    `INSERT INTO evaluations (id, lesson_id, title, description) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       lesson_id = excluded.lesson_id, title = excluded.title, description = excluded.description`,
    evaluation.id,
    evaluation.lessonId,
    evaluation.title,
    evaluation.description,
  );
  for (const [index, question] of evaluation.questions.entries()) {
    if (isBankDuplicate(evaluation.id, question)) {
      continue;
    }
    await insertQuestionRow(
      db,
      evaluationQuestionId(evaluation.id, index, question),
      evaluation.id,
      index,
      question,
    );
  }
}

async function insertQuestionBankRows(
  db: SQLiteDatabase,
  evaluationId: string,
  bank: QuestionSeed[],
): Promise<void> {
  for (const [index, question] of bank.entries()) {
    await insertQuestionRow(
      db,
      bankQuestionId(evaluationId, index, question),
      evaluationId,
      1000 + index,
      question,
    );
  }
}

const UNIT1_LESSONS = ['l1.1', 'l1.2', 'l1.3', 'l1.4'];
const UNIT1_EVALUATIONS = ['ev1.1', 'ev1.2', 'ev1.3', 'ev1.4'];

function seedExerciseIds(): string[] {
  return unit1Exercises.map(exercise => exercise.id);
}

function seedExampleIds(): string[] {
  return [
    ...unit1Examples.map(example => example.id),
    ...unit1Exercises.filter(exercise => exercise.example).map(exercise => exercise.id),
  ];
}

function seedQuestionIds(): string[] {
  return [
    ...unit1Evaluations.flatMap(evaluation =>
      evaluation.questions
        .map((question, index) => ({ question, index }))
        .filter(({ question }) => !isBankDuplicate(evaluation.id, question))
        .map(({ question, index }) => evaluationQuestionId(evaluation.id, index, question)),
    ),
    ...l12QuestionBank.map((question, index) => bankQuestionId('ev1.2', index, question)),
  ];
}

async function deleteOrphans(
  db: SQLiteDatabase,
  table: 'exercises' | 'examples' | 'questions',
  column: 'lesson_id' | 'evaluation_id',
  owned: string[],
  keepIds: string[],
): Promise<void> {
  const keep = keepIds.length > 0 ? ` AND id NOT IN (${placeholders(keepIds)})` : '';
  await db.runAsync(
    `DELETE FROM ${table} WHERE ${column} IN (${placeholders(owned)})${keep}`,
    ...owned,
    ...keepIds,
  );
}

// Solo borra huérfanos de las lecciones/evaluaciones gestionadas; attempts no se toca.
async function deleteContentOrphans(db: SQLiteDatabase): Promise<void> {
  await deleteOrphans(db, 'exercises', 'lesson_id', UNIT1_LESSONS, seedExerciseIds());
  await deleteOrphans(db, 'examples', 'lesson_id', UNIT1_LESSONS, seedExampleIds());
  await deleteOrphans(db, 'questions', 'evaluation_id', UNIT1_EVALUATIONS, seedQuestionIds());
}

/**
 * Upsert + limpieza del contenido empaquetado. No abre transacción: los
 * llamadores deciden el límite atómico (expo-sqlite falla con anidamiento).
 */
async function writeUnitsAndLessons(db: SQLiteDatabase): Promise<void> {
  for (const unit of units) {
    await db.runAsync(
      `INSERT INTO units (id, number, title, description, difficulty, color) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         number = excluded.number, title = excluded.title, description = excluded.description,
         difficulty = excluded.difficulty, color = excluded.color`,
      unit.id,
      unit.number,
      unit.title,
      unit.description,
      unit.difficulty,
      unit.color,
    );
  }
  for (const lesson of LESSONS) {
    await db.runAsync(
      `INSERT INTO lessons (id, unit_id, code, title, eyebrow, body, code_sample, context_title, context_body, synthesis, content, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         unit_id = excluded.unit_id, code = excluded.code, title = excluded.title,
         eyebrow = excluded.eyebrow, body = excluded.body, code_sample = excluded.code_sample,
         context_title = excluded.context_title, context_body = excluded.context_body,
         synthesis = excluded.synthesis, content = excluded.content, position = excluded.position`,
      lesson.id,
      lesson.unitId,
      lesson.code,
      lesson.title,
      lesson.eyebrow,
      lesson.body,
      lesson.codeSample ?? '',
      lesson.contextTitle ?? '',
      lesson.contextBody ?? '',
      JSON.stringify(lesson.synthesis ?? []),
      JSON.stringify(richContent[lesson.id] ?? []),
      lesson.position,
    );
  }
}

export async function writeContentSync(db: SQLiteDatabase): Promise<void> {
  await writeUnitsAndLessons(db);
  for (const example of unit1Examples) {
    await insertExampleRow(db, example);
  }
  for (const exercise of unit1Exercises) {
    // unit1Exercises ya incluye l12ExerciseBank, así que el banco no se inserta aparte.
    await insertExerciseWithExample(db, exercise);
  }
  for (const evaluation of unit1Evaluations) {
    await insertEvaluationRows(db, evaluation);
  }
  await insertQuestionBankRows(db, 'ev1.2', l12QuestionBank);
  await deleteContentOrphans(db);
}

export async function applyContentSync(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(() => writeContentSync(db));
}

export async function applyExerciseBank(db: SQLiteDatabase, bank: ExerciseSeed[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const exercise of bank) {
      await insertExerciseWithExample(db, exercise);
    }
  });
}

// El banco de l1.2 entra por unit1Exercises; se conserva el nombre para las
// llamadas históricas y ahora re-sincroniza todo el contenido.
export async function applyUnit12ExerciseBank(db: SQLiteDatabase): Promise<void> {
  return applyContentSync(db);
}

export async function applyQuestionBank(
  db: SQLiteDatabase,
  evaluationId: string,
  bank: QuestionSeed[],
): Promise<void> {
  await db.withTransactionAsync(() => insertQuestionBankRows(db, evaluationId, bank));
}

export async function applyL12QuestionBank(db: SQLiteDatabase): Promise<void> {
  return applyQuestionBank(db, 'ev1.2', l12QuestionBank);
}

export async function writeSeedDatabase(db: SQLiteDatabase): Promise<void> {
  await writeContentSync(db);
}

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(() => writeSeedDatabase(db));
}

export async function saveContentHash(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    CONTENT_HASH_KEY,
    CONTENT_HASH,
  );
}

export async function syncContentIfChanged(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    CONTENT_HASH_KEY,
  );
  if (row?.value === CONTENT_HASH) {
    return false;
  }
  await db.withTransactionAsync(async () => {
    await writeContentSync(db);
    await saveContentHash(db);
    // El remoto del curso base se reaplica en el próximo arranque, sin red (B2).
    await db.runAsync(
      "UPDATE remote_lessons SET applied_hash = NULL WHERE catalog_id = 'base'",
    );
  });
  return true;
}

/**
 * Renombra los ids posicionales del banco (`ev1.2-bank-q1`) a los ids
 * explícitos actuales y re-mapea attempts.item_id. Debe correr dentro de la
 * transacción de la migración.
 */
export async function migrateQuestionIds(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<{ id: string; prompt: string }>(
    "SELECT id, prompt FROM questions WHERE evaluation_id = 'ev1.2'",
  );
  const idByPrompt = new Map(
    l12QuestionBank.map((question, index) => [
      question.prompt,
      bankQuestionId('ev1.2', index, question),
    ]),
  );
  for (const row of rows) {
    const newId = idByPrompt.get(row.prompt);
    if (!newId || newId === row.id) {
      continue;
    }
    await db.runAsync('UPDATE attempts SET item_id = ? WHERE item_id = ?', newId, row.id);
    await db.runAsync('DELETE FROM questions WHERE id = ?', row.id);
  }
}

export async function applyContentMigration(db: SQLiteDatabase): Promise<void> {
  for (const [lessonId, blocks] of Object.entries(richContent)) {
    await db.runAsync('UPDATE lessons SET content = ? WHERE id = ?', JSON.stringify(blocks), lessonId);
  }
}

/**
 * Aplica una lección remota completa. Cada lección es atómica: si una llave
 * foránea falla, la transacción revierte y la fila queda pendiente.
 */
export async function applyLessonPayload(
  db: SQLiteDatabase,
  payload: RemoteLessonPayload,
): Promise<void> {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    const { unit, lesson, evaluation } = payload;

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
      payload.catalogId,
    );

    await db.runAsync(
      `INSERT INTO lessons (id, unit_id, code, title, eyebrow, body, code_sample, context_title,
                            context_body, synthesis, content, position, catalog_id, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET
         unit_id = excluded.unit_id, code = excluded.code, title = excluded.title,
         eyebrow = excluded.eyebrow, body = excluded.body, code_sample = excluded.code_sample,
         context_title = excluded.context_title, context_body = excluded.context_body,
         synthesis = excluded.synthesis, content = excluded.content, position = excluded.position,
         catalog_id = excluded.catalog_id, archived_at = NULL`,
      lesson.id,
      lesson.unitId,
      lesson.code,
      lesson.title,
      lesson.eyebrow,
      lesson.body,
      lesson.codeSample,
      lesson.contextTitle,
      lesson.contextBody,
      JSON.stringify(lesson.synthesis),
      JSON.stringify(lesson.content),
      lesson.position,
      payload.catalogId,
    );

    if (evaluation) {
      await db.runAsync(
        `INSERT INTO evaluations (id, lesson_id, title, description, question_count, exercise_count, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           lesson_id = excluded.lesson_id, title = excluded.title, description = excluded.description,
           question_count = excluded.question_count, exercise_count = excluded.exercise_count,
           archived_at = NULL`,
        evaluation.id,
        evaluation.lessonId,
        evaluation.title,
        evaluation.description,
        evaluation.questionCount,
        evaluation.exerciseCount,
      );
    } else {
      await db.runAsync(
        'UPDATE evaluations SET archived_at = ? WHERE lesson_id = ? AND archived_at IS NULL',
        now,
        lesson.id,
      );
      await db.runAsync(
        'DELETE FROM questions WHERE evaluation_id IN (SELECT id FROM evaluations WHERE lesson_id = ?)',
        lesson.id,
      );
    }

    const exerciseIds = payload.exercises.map(exercise => exercise.id);
    await deleteMissing(
      db,
      'exercises',
      'lesson_id',
      lesson.id,
      exerciseIds,
    );
    for (const exercise of payload.exercises) {
      await insertExerciseWithExample(db, exercise);
    }

    const exampleIds = [
      ...payload.examples.map(example => example.id),
      ...payload.exercises.filter(exercise => exercise.example).map(exercise => exercise.id),
    ];
    await deleteMissing(db, 'examples', 'lesson_id', lesson.id, exampleIds);
    for (const example of payload.examples) {
      await insertExampleRow(db, example);
    }

    if (evaluation) {
      const questionIds = payload.questions.map(entry => entry.question.id!);
      await deleteMissing(db, 'questions', 'evaluation_id', evaluation.id, questionIds);
      for (const [index, entry] of payload.questions.entries()) {
        await insertQuestionRow(
          db,
          entry.question.id!,
          entry.evaluationId,
          index,
          entry.question,
        );
      }
    }
  });
}

async function deleteMissing(
  db: SQLiteDatabase,
  table: 'exercises' | 'examples' | 'questions',
  column: 'lesson_id' | 'evaluation_id',
  ownerId: string,
  keepIds: string[],
): Promise<void> {
  if (keepIds.length === 0) {
    await db.runAsync(`DELETE FROM ${table} WHERE ${column} = ?`, ownerId);
    return;
  }
  await db.runAsync(
    `DELETE FROM ${table} WHERE ${column} = ? AND id NOT IN (${placeholders(keepIds)})`,
    ownerId,
    ...keepIds,
  );
}
