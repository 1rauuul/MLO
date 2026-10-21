// ────────────────────────────────────────────────────────────────────────────
// PLANTILLA DE PREGUNTAS DE EVALUACIÓN — QuestionSeed
// ────────────────────────────────────────────────────────────────────────────
// Archivo de referencia: NO se importa ni se siembra. Sirve para copiar y pegar.
//
// Dónde van: en `src/shared/services/content/unit1.content.ts` dentro del arreglo
// `evalXXQuestions` de la evaluación que corresponda (ev1.2, ev1.3, …), o en un
// banco de preguntas por lección si decidimos separarlo.
//
// El id de cada pregunta se genera solo: `<evaluacion>-q<posición>`, p. ej. `ev1.2-q5`.
// El orden del arreglo define las posiciones.
//
// Campos:
//   type         'mcq' | 'order' | 'fill' | 'match' | 'crossword'
//   prompt       enunciado
//   options      mcq: las 4 opciones. order: la secuencia CORRECTA. resto: []
//   answer       mcq: índice (0-based) de la opción correcta. resto: 0
//   explanation  retroalimentación (se muestra en el resumen)
//   config       order/mcq no lo usan; fill/match/crossword sí (ver abajo)
// ────────────────────────────────────────────────────────────────────────────



export const evaluationQuestionsTemplate: QuestionSeed[] = [
  // 1) Opción múltiple (la más común)
  {
    type: 'mcq',
    prompt: '¿Cuál es un atributo esencial del buen software?',
    options: [
      'Que solo funcione en un equipo',
      'Que sea mantenible y confiable', // índice 1 = correcta
      'Que se entregue sin pruebas',
      'Que no tenga documentación',
    ],
    answer: 1,
    explanation: 'Mantenibilidad y confiabilidad son atributos esenciales del software.',
  }
];
