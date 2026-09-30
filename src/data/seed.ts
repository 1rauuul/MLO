import type { SQLiteDatabase } from 'expo-sqlite';

import type { Complexity, UnitColor } from '@/models/entities';

import { richContent } from './richContent';
import {
  unit1Evaluations,
  unit1Examples,
  unit1Exercises,
  unit12ExerciseBankAdditions,
  type EvaluationSeed,
  type ExampleSeed,
  type ExerciseSeed,
  type QuestionSeed,
} from './unit1Content';

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

async function insertExampleRow(db: SQLiteDatabase, example: ExampleSeed): Promise<void> {
  await db.runAsync(
    'INSERT INTO examples (id, lesson_id, type, title, prompt, config, steps, hints, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
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
    'INSERT INTO exercises (id, lesson_id, type, prompt, instructions, correct_order, config, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
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

async function insertQuestionRow(
  db: SQLiteDatabase,
  id: string,
  evaluationId: string,
  orderIndex: number,
  question: QuestionSeed,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO questions (id, evaluation_id, order_index, type, config, prompt, options, answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
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
    'INSERT INTO evaluations (id, lesson_id, title, description) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
    evaluation.id,
    evaluation.lessonId,
    evaluation.title,
    evaluation.description,
  );
  let index = 0;
  for (const question of evaluation.questions) {
    await insertQuestionRow(db, `${evaluation.id}-q${index + 1}`, evaluation.id, index, question);
    index += 1;
  }
}

const UNIT1_LESSONS = ['l1.1', 'l1.2', 'l1.3', 'l1.4'];
const UNIT1_EVALUATIONS = ['ev1.1', 'ev1.2', 'ev1.3', 'ev1.4'];

export async function applyUnit1Content(db: SQLiteDatabase, clearAttempts = true): Promise<void> {
  await db.withTransactionAsync(async () => {
    if (clearAttempts) {
      await db.runAsync(
        `DELETE FROM attempts WHERE lesson_id IN (${UNIT1_LESSONS.map(() => '?').join(', ')})`,
        ...UNIT1_LESSONS,
      );
    }
    await db.runAsync(
      `DELETE FROM exercises WHERE lesson_id IN (${UNIT1_LESSONS.map(() => '?').join(', ')})`,
      ...UNIT1_LESSONS,
    );
    await db.runAsync(
      `DELETE FROM questions WHERE evaluation_id IN (${UNIT1_EVALUATIONS.map(() => '?').join(', ')})`,
      ...UNIT1_EVALUATIONS,
    );
    await db.runAsync("DELETE FROM evaluations WHERE id = 'ev1.1'");

    for (const example of unit1Examples) {
      await insertExampleRow(db, example);
    }
    for (const exercise of unit1Exercises) {
      await insertExerciseRow(db, exercise);
    }
    for (const evaluation of unit1Evaluations) {
      await insertEvaluationRows(db, evaluation);
    }
  });
}

export async function applyUnit12ExerciseBank(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const exercise of unit12ExerciseBankAdditions) {
      await insertExerciseRow(db, exercise);
    }
  });
}

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const unit of units) {
      await db.runAsync(
        'INSERT INTO units (id, number, title, description, difficulty, color) VALUES (?, ?, ?, ?, ?, ?)',
        unit.id,
        unit.number,
        unit.title,
        unit.description,
        unit.difficulty,
        unit.color,
      );
    }

    const lessons = [...unitOneLessons, ...buildSimpleLessons()];
    for (const lesson of lessons) {
      await db.runAsync(
        'INSERT INTO lessons (id, unit_id, code, title, eyebrow, body, code_sample, context_title, context_body, synthesis, content, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

    for (const example of unit1Examples) {
      await insertExampleRow(db, example);
    }
    for (const exercise of unit1Exercises) {
      await insertExerciseRow(db, exercise);
    }
    for (const evaluation of unit1Evaluations) {
      await insertEvaluationRows(db, evaluation);
    }
  });
}

export async function applyContentMigration(db: SQLiteDatabase): Promise<void> {
  for (const [lessonId, blocks] of Object.entries(richContent)) {
    await db.runAsync('UPDATE lessons SET content = ? WHERE id = ?', JSON.stringify(blocks), lessonId);
  }
}
