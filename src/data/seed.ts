import type { SQLiteDatabase } from 'expo-sqlite';

import type { Complexity, UnitColor } from '@/models/entities';

interface UnitSeed {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: Complexity;
  duration: string;
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

interface ExampleSeed {
  id: string;
  lessonId: string;
  complexity: Complexity;
  title: string;
  scenario: string;
  before: string;
  after: string;
}

interface ExerciseSeed {
  id: string;
  lessonId: string;
  prompt: string;
  instructions: string;
  correctOrder: string[];
}

interface QuestionSeed {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface EvaluationSeed {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: QuestionSeed[];
}

const units: UnitSeed[] = [
  {
    id: 'u1',
    number: 1,
    title: 'Introducción',
    description: 'Software de calidad más allá de programar.',
    difficulty: 'Fundamental',
    duration: '38 min',
    color: 'blue',
  },
  {
    id: 'u2',
    number: 2,
    title: 'Procesos de software',
    description: 'Modelos y actividades del proceso de desarrollo.',
    difficulty: 'Intermedio',
    duration: '42 min',
    color: 'violet',
  },
  {
    id: 'u3',
    number: 3,
    title: 'Desarrollo ágil de software',
    description: 'Métodos ágiles, XP y gestión de proyectos.',
    difficulty: 'Intermedio',
    duration: '45 min',
    color: 'green',
  },
  {
    id: 'u4',
    number: 4,
    title: 'Ingeniería de requerimientos',
    description: 'Cómo descubrir, especificar y validar requerimientos.',
    difficulty: 'Avanzado',
    duration: '52 min',
    color: 'blue',
  },
  {
    id: 'u5',
    number: 5,
    title: 'Modelado del sistema',
    description: 'Modelos de contexto, interacción, estructura y comportamiento.',
    difficulty: 'Avanzado',
    duration: '48 min',
    color: 'violet',
  },
];

const unitOneLessons: LessonSeed[] = [
  {
    id: 'l1.1',
    unitId: 'u1',
    code: '1.1',
    title: 'Introducción a la ingeniería de software',
    eyebrow: 'Módulo 01 · Lección 01',
    body: 'La ingeniería de software es la disciplina de ingeniería que se ocupa de todos los aspectos del desarrollo de sistemas de software, desde la especificación inicial hasta el mantenimiento posterior a la entrega. Se distingue de la programación ad-hoc porque aplica procesos, estándares y trabajo en equipo para construir software de calidad de forma sostenible.',
    contextTitle: 'De programar a ingenierizar',
    contextBody: 'Un programa pequeño puede escribirse sin proceso; un sistema usado por miles de personas exige requisitos, diseño, pruebas y mantenimiento. La ingeniería de software aporta ese marco disciplinado.',
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
    body: 'El desarrollo profesional se organiza en actividades: especificación, diseño, implementación, validación y mantenimiento. Aunque suelen presentarse en secuencia, en la práctica se solapan e iteran. Documentar, usar control de versiones y registrar incidencias hace el trabajo trazable y responsable.',
    codeSample:
      'const procesoProfesional = [\n  "Especificar requisitos",\n  "Diseñar la solución",\n  "Implementar",\n  "Validar",\n  "Mantener"\n]',
    contextTitle: 'Trabajo coordinado y trazable',
    contextBody: 'Requisitos, versiones y pruebas dejan evidencia de qué se decidió y cómo se validó. Esa trazabilidad permite corregir fallos sin introducir nuevos errores.',
    synthesis: [
      'Especificar define qué debe hacer el sistema.',
      'La validación confirma que se cumplen los requisitos.',
      'El mantenimiento continúa después de la entrega.',
      'Las actividades se solapan e iteran según el modelo de proceso.',
    ],
    position: 1,
  },
  {
    id: 'l1.3',
    unitId: 'u1',
    code: '1.3',
    title: 'Ética en la ingeniería de software',
    eyebrow: 'Módulo 01 · Lección 03',
    body: 'El código de ética y práctica profesional ACM/IEEE establece principios: interés público, calidad del producto, integridad del juicio profesional, competencia y confidencialidad. Estos principios orientan las decisiones cuando existe presión comercial, datos sensibles o riesgos para terceros.',
    contextTitle: 'Decisiones bajo presión',
    contextBody: 'Ante un fallo que expone datos personales, el interés público y la protección de datos prevalecen sobre evitar retrasos comerciales. Informar riesgos significativos forma parte de la responsabilidad profesional.',
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
    body: 'Los estudios de caso conectan decisiones técnicas con implicaciones éticas y sociales. Analizar un sistema médico crítico o un sistema de monitoreo de empleados permite reconocer qué atributos de calidad y qué principios éticos están en juego.',
    contextTitle: 'Del código a las consecuencias',
    contextBody: 'En sistemas médicos priman seguridad y confiabilidad; en monitoreo de empleados, privacidad; en sistemas financieros, integridad de datos. El diseño responsable reduce la captura de datos a lo estrictamente necesario.',
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

const examples: ExampleSeed[] = [
  {
    id: 'ex1',
    lessonId: 'l1.2',
    complexity: 'Fundamental',
    title: 'De la improvisación al proceso',
    scenario: 'Un equipo desarrolla una aplicación interna sin documentar requisitos, sin control de versiones y sin registro de incidencias. Los fallos se acumulan y corregirlos introduce nuevos errores.',
    before: 'Desarrollo ad-hoc → cambios sin registro ni pruebas',
    after: 'Proceso básico → requisitos, versiones, pruebas e incidencias',
  },
  {
    id: 'ex2',
    lessonId: 'l1.3',
    complexity: 'Intermedio',
    title: 'Presión comercial ante un fallo grave',
    scenario: 'Un desarrollador detecta un fallo que expone datos personales; la dirección sugiere no informar al cliente para evitar penalizaciones económicas.',
    before: 'Ocultar el fallo para evitar retrasos',
    after: 'Informar el riesgo y corregir protegiendo los datos',
  },
  {
    id: 'ex3',
    lessonId: 'l1.4',
    complexity: 'Avanzado',
    title: 'Monitoreo de empleados y privacidad',
    scenario: 'Una empresa diseña un sistema que registra con detalle la actividad de sus empleados y el equipo duda si respeta la privacidad y la legislación vigente.',
    before: 'Registrar toda la actividad sin límites ni políticas',
    after: 'Minimizar datos, consultar a las partes y definir políticas transparentes',
  },
];

const exercises: ExerciseSeed[] = [
  {
    id: 'ord1.1',
    lessonId: 'l1.1',
    prompt: 'Reconstruye el enfoque de la ingeniería de software',
    instructions: 'Usa las flechas para ordenar las ideas que distinguen a la ingeniería de software de la programación ad-hoc.',
    correctOrder: [
      'Comprender el problema',
      'Aplicar un proceso disciplinado',
      'Trabajar en equipo con estándares',
      'Entregar software de calidad mantenible',
    ],
  },
  {
    id: 'ord1.2',
    lessonId: 'l1.2',
    prompt: 'Reconstruye el proceso de desarrollo',
    instructions: 'Usa las flechas para ordenar las actividades de un desarrollo sencillo. En la práctica pueden iterarse.',
    correctOrder: [
      'Comprender el problema y recopilar requisitos',
      'Diseñar la solución',
      'Implementar el código',
      'Probar funciones clave',
      'Desplegar y realizar mantenimiento',
    ],
  },
  {
    id: 'ord1.3',
    lessonId: 'l1.3',
    prompt: 'Ordena el razonamiento ético',
    instructions: 'Usa las flechas para ordenar los pasos de un análisis ético ante un dilema profesional.',
    correctOrder: [
      'Identificar a los afectados',
      'Reconocer el principio ético en juego',
      'Evaluar riesgos y alternativas',
      'Actuar y documentar la decisión',
    ],
  },
  {
    id: 'ord1.4',
    lessonId: 'l1.4',
    prompt: 'Ordena el análisis de un caso',
    instructions: 'Usa las flechas para ordenar un análisis responsable de un estudio de caso.',
    correctOrder: [
      'Describir el contexto del sistema',
      'Identificar los atributos de calidad relevantes',
      'Analizar las implicaciones éticas',
      'Proponer una solución responsable',
    ],
  },
];

const evaluations: EvaluationSeed[] = [
  {
    id: 'ev1.1',
    lessonId: 'l1.1',
    title: 'Comprobación: Introducción',
    description: 'Disciplina, ciclo de vida y atributos de calidad.',
    questions: [
      {
        prompt: '¿Qué distingue a la ingeniería de software de la programación ad-hoc?',
        options: [
          'Escribir código más rápido.',
          'Aplicar procesos, estándares y trabajo en equipo a todo el ciclo de vida.',
          'Usar únicamente un lenguaje de programación.',
          'Evitar la documentación.',
        ],
        answer: 1,
        explanation: 'La ingeniería de software cubre especificación, diseño, implementación, validación y mantenimiento con procesos y estándares, no solo la escritura de código.',
      },
      {
        prompt: '¿Cuál es un atributo de un software de calidad?',
        options: [
          'Que no tenga documentación.',
          'Que sea mantenible y cumpla los requisitos.',
          'Que solo funcione en un equipo.',
          'Que se entregue sin pruebas.',
        ],
        answer: 1,
        explanation: 'La mantenibilidad, la confiabilidad y el cumplimiento de requisitos son atributos centrales de la calidad del software.',
      },
    ],
  },
  {
    id: 'ev1.2',
    lessonId: 'l1.2',
    title: 'Comprobación: Desarrollo profesional',
    description: 'Actividades del proceso y trazabilidad.',
    questions: [
      {
        prompt: '¿Cuál es una actividad propia de un proceso de software profesional?',
        options: [
          'Modificar código sin registrar cambios.',
          'Validar que el sistema cumple los requisitos.',
          'Evitar documentar para entregar más rápido.',
          'Probar únicamente cuando aparece un fallo.',
        ],
        answer: 1,
        explanation: 'La validación comprueba que el sistema satisface los requisitos acordados. Es una actividad central junto con especificación, diseño, implementación y mantenimiento.',
      },
      {
        prompt: '¿Qué práctica deja trazabilidad de los cambios?',
        options: [
          'Documentar requisitos y usar control de versiones.',
          'Cambiar el código directamente en producción.',
          'Probar solo cuando falla.',
          'No registrar incidencias.',
        ],
        answer: 0,
        explanation: 'Documentar requisitos y usar control de versiones produce evidencia de qué se decidió y cómo se validó cada cambio.',
      },
    ],
  },
  {
    id: 'ev1.3',
    lessonId: 'l1.3',
    title: 'Comprobación: Ética profesional',
    description: 'Principios del código de ética ACM/IEEE.',
    questions: [
      {
        prompt: 'Un fallo grave expone datos personales y la dirección pide ocultarlo. ¿Qué principio debe priorizarse?',
        options: [
          'Evitar cualquier retraso comercial.',
          'Mantener la confidencialidad del fallo ante el cliente.',
          'El interés público y la protección de datos.',
          'Delegar la decisión sin informar riesgos.',
        ],
        answer: 2,
        explanation: 'El código de ética ACM/IEEE prioriza el interés público. Informar riesgos significativos y proteger datos personales es parte de la responsabilidad profesional.',
      },
      {
        prompt: '¿Qué principio prioriza el código de ética ACM/IEEE?',
        options: [
          'El beneficio comercial.',
          'El interés público.',
          'La velocidad de entrega.',
          'La confidencialidad por encima de todo.',
        ],
        answer: 1,
        explanation: 'El interés público encabeza los principios: el bienestar de la sociedad prevalece sobre intereses comerciales particulares.',
      },
    ],
  },
  {
    id: 'ev1.4',
    lessonId: 'l1.4',
    title: 'Comprobación: Estudios de caso',
    description: 'Atributos de calidad y decisiones responsables.',
    questions: [
      {
        prompt: 'En un sistema médico crítico, ¿qué atributos de calidad son prioritarios?',
        options: [
          'Privacidad y estética.',
          'Seguridad y confiabilidad.',
          'Velocidad y publicidad.',
          'Portabilidad y color.',
        ],
        answer: 1,
        explanation: 'Cuando está en juego la salud, la seguridad y la confiabilidad del sistema son los atributos más críticos.',
      },
      {
        prompt: 'Para un sistema de monitoreo de empleados, ¿qué práctica es responsable?',
        options: [
          'Registrar toda la actividad sin límites.',
          'Minimizar los datos capturados y definir políticas transparentes.',
          'Ocultar el propósito del sistema.',
          'Compartir los datos con terceros sin aviso.',
        ],
        answer: 1,
        explanation: 'El diseño responsable minimiza la captura de datos, consulta a las partes interesadas y define políticas transparentes.',
      },
    ],
  },
];

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
        contextBody:
          'Este tema se profundiza en las siguientes unidades del curso. El contenido completo estará disponible en una próxima actualización.',
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

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const unit of units) {
      await db.runAsync(
        'INSERT INTO units (id, number, title, description, difficulty, duration, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
        unit.id,
        unit.number,
        unit.title,
        unit.description,
        unit.difficulty,
        unit.duration,
        unit.color,
      );
    }

    const lessons = [...unitOneLessons, ...buildSimpleLessons()];
    for (const lesson of lessons) {
      await db.runAsync(
        'INSERT INTO lessons (id, unit_id, code, title, eyebrow, body, code_sample, context_title, context_body, synthesis, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        lesson.position,
      );
    }

    for (const example of examples) {
      await db.runAsync(
        'INSERT INTO examples (id, lesson_id, complexity, title, scenario, before_state, after_state) VALUES (?, ?, ?, ?, ?, ?, ?)',
        example.id,
        example.lessonId,
        example.complexity,
        example.title,
        example.scenario,
        example.before,
        example.after,
      );
    }

    for (const exercise of exercises) {
      await db.runAsync(
        'INSERT INTO exercises (id, lesson_id, type, prompt, instructions, correct_order) VALUES (?, ?, ?, ?, ?, ?)',
        exercise.id,
        exercise.lessonId,
        'order',
        exercise.prompt,
        exercise.instructions,
        JSON.stringify(exercise.correctOrder),
      );
    }

    for (const evaluation of evaluations) {
      await db.runAsync(
        'INSERT INTO evaluations (id, lesson_id, title, description) VALUES (?, ?, ?, ?)',
        evaluation.id,
        evaluation.lessonId,
        evaluation.title,
        evaluation.description,
      );
      let questionIndex = 0;
      for (const question of evaluation.questions) {
        await db.runAsync(
          'INSERT INTO questions (id, evaluation_id, order_index, prompt, options, answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
          `${evaluation.id}-q${questionIndex + 1}`,
          evaluation.id,
          questionIndex,
          question.prompt,
          JSON.stringify(question.options),
          question.answer,
          question.explanation,
        );
        questionIndex += 1;
      }
    }

    await db.runAsync(
      'INSERT INTO learner_profile (id, learner_name, learning_style, dark_mode, large_text) VALUES (1, ?, ?, 1, 0)',
      'Valentina Ríos',
      'Pragmático',
    );

    const now = new Date().toISOString();
    for (const lessonId of ['l1.1', 'l1.2']) {
      await db.runAsync(
        'INSERT INTO module_progress (lesson_id, completed, updated_at) VALUES (?, 1, ?)',
        lessonId,
        now,
      );
    }
  });
}
