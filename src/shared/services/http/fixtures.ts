export const manifestFixture = {
  version: '2026-10-23',
  hash: 'remote-hash',
  lessons: [{ lessonId: 'l1.2', hash: 'lesson-hash' }],
};

export const lessonFixture = {
  lessonId: 'l1.2',
  exercises: [
    {
      id: 'remote-ord1',
      lessonId: 'l1.2',
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
      id: 'remote-ord1',
      lessonId: 'l1.2',
      type: 'order',
      title: 'Ejemplo remoto',
      prompt: 'Ordena el proceso',
      config: {},
      steps: [{ text: 'Especificar primero', why: 'Fija el problema.' }],
      hints: ['Empieza por definir el problema.'],
      explanation: 'El proceso va de la especificación a la validación.',
    },
  ],
  questions: [
    {
      evaluationId: 'ev1.2',
      question: {
        id: 'remote-q1',
        type: 'mcq',
        prompt: '¿Qué se hace primero?',
        options: ['Especificar', 'Validar'],
        answer: 0,
        explanation: 'Primero se especifica.',
      },
    },
  ],
};
