export const manifestFixture = {
  schemaVersion: 2,
  catalogId: 'k7f3q',
  title: 'Curso de prueba',
  version: '2026-10-26',
  hash: 'remote-hash',
  publishedAt: '2026-10-26T00:00:00.000Z',
  lessons: [{ lessonId: 'k7f3q-l1.2', unitId: 'k7f3q-u1', hash: 'lesson-hash' }],
};

export const lessonFixture = {
  schemaVersion: 2,
  catalogId: 'k7f3q',
  lessonId: 'k7f3q-l1.2',
  hash: 'lesson-hash',
  unit: {
    id: 'k7f3q-u1',
    number: 1,
    title: 'Unidad',
    description: 'Descripción',
    difficulty: 'Fundamental',
    color: 'blue',
  },
  lesson: {
    id: 'k7f3q-l1.2',
    unitId: 'k7f3q-u1',
    code: '1.2',
    title: 'Lección',
    eyebrow: 'Módulo 01',
    body: 'Cuerpo',
    codeSample: '',
    contextTitle: 'Contexto',
    contextBody: 'Detalle',
    synthesis: ['Idea'],
    content: [{ type: 'p', text: 'Contenido' }],
    position: 1,
  },
  evaluation: {
    id: 'k7f3q-ev1.2',
    lessonId: 'k7f3q-l1.2',
    title: 'Evaluación',
    description: 'Descripción',
    questionCount: 10,
    exerciseCount: 5,
  },
  exercises: [
    {
      id: 'k7f3q-ord1',
      lessonId: 'k7f3q-l1.2',
      type: 'order',
      prompt: 'Ordena el proceso',
      instructions: 'Usa las flechas.',
      correctOrder: ['Especificar', 'Desarrollar', 'Validar'],
      config: {},
      explanation: 'El proceso va de la especificación a la validación.',
    },
  ],
  examples: [
    {
      id: 'k7f3q-ex1',
      lessonId: 'k7f3q-l1.2',
      type: 'fill',
      title: 'Ejemplo remoto',
      prompt: 'Completa',
      config: {
        sentences: ['El {{requisito}} guía el trabajo.'],
        bank: ['requisito'],
      },
      steps: [{ text: 'Leer la frase', why: 'El contexto define la palabra.' }],
      hints: ['Piensa en lo que se acuerda con el cliente.'],
      explanation: 'El requisito define la necesidad.',
    },
  ],
  questions: [
    {
      evaluationId: 'k7f3q-ev1.2',
      question: {
        id: 'k7f3q-q1',
        type: 'mcq',
        prompt: '¿Qué se hace primero?',
        options: ['Especificar', 'Validar'],
        answer: 0,
        explanation: 'Primero se especifica.',
      },
    },
  ],
};

/** Fixture de contrato con los cuatro ejercicios y una pregunta de ordenar. */
export const lessonAllTypesFixture = {
  ...lessonFixture,
  hash: 'lesson-hash-all',
  exercises: [
    lessonFixture.exercises[0],
    {
      id: 'k7f3q-fill1',
      lessonId: 'k7f3q-l1.2',
      type: 'fill',
      prompt: 'Completa la definición',
      instructions: 'Escribe la palabra que falta.',
      correctOrder: [],
      config: {
        sentences: ['El {{requisito}} describe una necesidad.'],
        bank: ['requisito', 'diseño'],
      },
      explanation: 'El requisito describe la necesidad.',
      example: {
        title: 'Ejemplo de completar',
        steps: [{ text: 'Lee la oración', why: 'El contexto da la pista.' }],
        hints: ['Piensa en lo que se acuerda con el cliente.'],
      },
    },
    {
      id: 'k7f3q-match1',
      lessonId: 'k7f3q-l1.2',
      type: 'match',
      prompt: 'Relaciona cada término',
      instructions: 'Une cada concepto con su definición.',
      correctOrder: [],
      config: {
        pairs: [
          { left: 'Requisito', right: 'Necesidad' },
          { left: 'Diseño', right: 'Solución' },
        ],
      },
      explanation: 'Cada concepto tiene su definición.',
    },
    {
      id: 'k7f3q-cross1',
      lessonId: 'k7f3q-l1.2',
      type: 'crossword',
      prompt: 'Resuelve el crucigrama',
      instructions: 'Escribe las palabras.',
      correctOrder: [],
      config: {
        crossword: {
          rows: 3,
          cols: 5,
          entries: [
            { word: 'SOL', clue: 'Estrella', row: 0, col: 0, direction: 'across' },
            { word: 'SAL', clue: 'Condimento', row: 0, col: 0, direction: 'down' },
          ],
        },
      },
      explanation: 'Las palabras comparten la S.',
    },
  ],
  examples: [],
  questions: [
    lessonFixture.questions[0],
    {
      evaluationId: 'k7f3q-ev1.2',
      question: {
        id: 'k7f3q-q2',
        type: 'order',
        prompt: 'Ordena el proceso',
        options: ['Especificar', 'Desarrollar', 'Validar'],
        answer: 0,
        explanation: 'El proceso va de la especificación a la validación.',
      },
    },
  ],
};

