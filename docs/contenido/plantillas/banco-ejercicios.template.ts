// ────────────────────────────────────────────────────────────────────────────
// PLANTILLA DE EJERCICIOS — Banco de práctica
// ────────────────────────────────────────────────────────────────────────────
// Archivo de referencia: NO se importa ni se siembra. Sirve para copiar y pegar.
//
// Para agregar un ejercicio a una lección:
//   1. Copia el objeto correspondiente a su banco (p. ej. `src/shared/services/content/banks/lesson1.2.bank.ts`).
//   2. Usa un `id` ÚNICO (no repitas ninguno existente).
//   3. Usa un `lessonId` que EXISTA (l1.1 … l5.5).
//   4. En crucigramas, cada intersección debe compartir la misma letra.
//   5. Para que el mismo ítem también se siembre como EJEMPLO, agrega el bloque opcional `example`.
//
// Abajo, CADA tipo (1–4) incluye su propia forma `example`, para que la uses como guía.
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
//   example       OPCIONAL. Si existe, el mismo ítem se siembra además en la tabla `examples`
//                 (mismo id, prompt, config y explanation). Aporta lo propio de un ejemplo:
//                 title, steps (text + why) y hints. Las tablas exercises y examples siguen
//                 separadas; solo se comparte la fuente de autoría.
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
    example: {
      title: 'El proceso de software en orden',
      steps: [
        { text: 'Identificar la primera actividad: especificar', why: 'Sin requisitos no hay nada que diseñar.' },
        { text: 'Ubicar desarrollo y validación en medio', why: 'Se construye y luego se comprueba.' },
        { text: 'Cerrar con la evolución', why: 'El cambio del software continúa tras la entrega.' },
      ],
      hints: ['Piensa en el ciclo: definir, construir, comprobar, mantener.'],
    },
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
    example: {
      title: 'Atributos y productos del software',
      steps: [
        { text: 'Leer la frase y ver qué falta', why: 'El espacio pide un término, no una frase completa.' },
        { text: 'Elegir la palabra que respeta el sentido', why: 'El contexto descarta los distractores.' },
      ],
      hints: ['"Mantenible" es una cualidad; "genéricos" es un tipo de producto.'],
    },
  },

  // ── 3. match : relacionar columnas ────────────────────────────────────────
  // Cada `pairs` tiene `left` (esta columna) y su `right` correcto.
  // Este ejemplo incluye el bloque `example`: además de ejercicio, se siembra como EJEMPLO.
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
    // ↓ OPCIONAL: si existe, el ítem también se siembra en la tabla `examples`.
    example: {
      title: 'Atributos del buen software',
      steps: [
        { text: 'Leer el atributo', why: 'Identificar la propiedad de calidad antes de su definición.' },
        { text: 'Enlazar con su consecuencia', why: 'Cada atributo tiene una consecuencia verificable.' },
      ],
      hints: ['Concéntrate en la consecuencia, no en el nombre del atributo.'],
    },
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
    example: {
      title: 'Crucigrama: actividades y disciplina',
      steps: [
        { text: 'Resolver primero la palabra más larga', why: 'Sus letras sirven de cruce para las demás.' },
        { text: 'Confirmar cada letra con el cruce', why: 'En una intersección ambas palabras deben coincidir.' },
      ],
      hints: ['INGENIERIA cruza con VALIDACION en la letra I (posición 3,0).'],
    },
  },
];