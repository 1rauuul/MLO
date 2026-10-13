// ────────────────────────────────────────────────────────────────────────────
// PLANTILLA DE EJERCICIOS — Banco de práctica
// ────────────────────────────────────────────────────────────────────────────
// Archivo de referencia: NO se importa ni se siembra. Sirve para copiar y pegar.
//
// Para agregar un ejercicio a una lección:
//   1. Copia el objeto correspondiente a su banco (p. ej. `src/data/banks/l1.2.ts`).
//   2. Usa un `id` ÚNICO (no repitas ninguno existente).
//   3. Usa un `lessonId` que EXISTA (l1.1 … l5.5).
//   4. En crucigramas, cada intersección debe compartir la misma letra.
//
// Reglas por campo:
//   id            string único. Convención: <tipo><leccion><sufijo>, ej. fill1.2d
//   lessonId      string, debe existir en la tabla lessons.
//   type          'order' | 'fill' | 'match' | 'crossword'   (NO se usa 'mcq' aquí)
//   prompt        enunciado/título corto que ve el alumno.
//   instructions  indicación de cómo resolverlo.
//   correctOrder  solo se usa en 'order'; en el resto va [].
//   config        forma variable según el type (ver cada ejemplo).
//   explanation   retroalimentación que se muestra al responder.
// ────────────────────────────────────────────────────────────────────────────

import type { ExerciseSeed } from '@/shared/services/content/banks/types';

export const exerciseBankTemplate: ExerciseSeed[] = [
  // ── 1. order : ordenar una secuencia ──────────────────────────────────────
  // La respuesta (en orden) va en `correctOrder`. `config` queda vacío.
  {
    id: 'ord1.2z', // ÚNICO
    lessonId: 'l1.2', // debe existir
    type: 'order',
    prompt: 'Ordena las actividades del proceso de software',
    instructions: 'Usa las flechas para ordenar la secuencia correcta.',
    correctOrder: [
      'Especificación del software',
      'Desarrollo del software',
      'Validación del software',
      'Evolución del software',
    ], // el ORDEN correcto, de arriba a abajo
    config: {},
    explanation: 'Las cuatro actividades fundamentales son especificación, desarrollo, validación y evolución.',
  },

  // ── 2. fill : completar espacios ──────────────────────────────────────────
  // La respuesta se marca dentro de las frases con {{palabra}}.
  // `bank` son DISTRACTORES extra (no forman la frase, van al banco de palabras).
  {
    id: 'fill1.2z',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa los conceptos',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'El buen software debe ser {{mantenible}} y confiable.', // {{...}} = respuesta correcta
        'Los productos {{genéricos}} se venden en el mercado abierto.',
      ],
      bank: ['seguro', 'personalizados', 'económico'], // solo distractores
    },
    explanation: 'La mantenibilidad y confiabilidad son atributos esenciales del software.',
  },

  // ── 3. match : relacionar columnas ────────────────────────────────────────
  // Cada `pairs` tiene `left` (esta columna) y su `right` correcto.
  {
    id: 'match1.2z',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada atributo con su descripción',
    instructions: 'Toca un elemento y después su descripción.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Mantenimiento', right: 'Puede evolucionar ante necesidades cambiantes' },
        { left: 'Eficiencia', right: 'No desperdicia memoria ni ciclos del procesador' },
      ],
    },
    explanation: 'Cada atributo describe una propiedad distinta del software.',
  },

  // ── 4. crossword : crucigrama ─────────────────────────────────────────────
  // rows/cols deben ser iguales o mayores que el largo de cada palabra.
  //   across → la letra `offset` va en (row, col + offset).
  //   down   → la letra `offset` va en (row + offset, col).
  // Regla de oro: donde dos palabras se cruzan, la letra debe coincidir.
  //   Ejemplo: INGENIERIA cruza VALIDACION en (3,0) → ambas tienen 'I'.
  // `bank` son palabras DISTRACTORAS (nunca se colocan en la cuadrícula).
  {
    id: 'cross1.2z',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama de actividades del proceso',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    config: {
      crossword: {
        rows: 10,
        cols: 10,
        entries: [
          {
            word: 'INGENIERIA',
            clue: 'Disciplina que cubre todo el proceso de producción del software',
            row: 3,
            col: 0,
            direction: 'across',
          },
          {
            word: 'VALIDACION',
            clue: 'Actividad que confirma que el sistema cumple los requisitos',
            row: 0,
            col: 0,
            direction: 'down',
          },
        ],
      },
      bank: ['MANTENIMIENTO', 'EVOLUCION', 'ESPECIFICACION'], // distractores
    },
    explanation: 'La validación comprueba los requisitos; la ingeniería de software abarca todo el proceso.',
  },
];