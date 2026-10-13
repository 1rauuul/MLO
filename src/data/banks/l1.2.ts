import type { ExerciseSeed } from './types';

export const l12ExerciseBank: ExerciseSeed[] = [
  {
    id: 'cross1.2a',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama: atributos y tipos de software',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    config: {
      crossword: {
        rows: 12,
        cols: 13,
        entries: [
          {
            word: 'MANTENIMIENTO',
            clue: 'Atributo: facilidad para modificar el software cuando el cliente cambia sus necesidades.',
            row: 0,
            col: 0,
            direction: 'across',
          },
          {
            word: 'EFICIENCIA',
            clue: 'Atributo de un sistema que hace buen uso de la memoria y del procesador: no malgasta recursos.',
            row: 0,
            col: 4,
            direction: 'down',
          },
          {
            word: 'GENERICO',
            clue: 'Un procesador de textos es un producto ___: se desarrolla para venderlo a cualquier cliente del mercado.',
            row: 5,
            col: 3,
            direction: 'across',
          },
          {
            word: 'EVOLUCION',
            clue: 'Actividad de seguir cambiando un sistema ya entregado para que continúe siendo útil al negocio.',
            row: 3,
            col: 10,
            direction: 'down',
          },
          {
            word: 'MEDIDA',
            clue: 'Software personalizado: se desarrolla "a la ___" del cliente.',
            row: 9,
            col: 7,
            direction: 'across',
          },
        ],
      },
      bank: ['ACEPTABILIDAD', 'SOFTWARE', 'CONFIGURACION'],
    },
    explanation:
      'Mantenimiento y eficiencia son atributos; genérico y "a la medida" son los dos tipos de producto; la evolución es la actividad que mantiene vivo al sistema después de entregarlo. Ojo con la diferencia: el mantenimiento es una cualidad del software y la evolución es algo que se hace con él.',
  },
  {
    id: 'fill1.2c',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa los atributos esenciales del buen software',
    instructions: 'Toca un espacio y después selecciona la palabra correcta del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'El atributo que permite evolucionar ante necesidades cambiantes es el {{mantenimiento}}.',
        'No causar daño ante un fallo se relaciona con la {{confiabilidad}} y seguridad.',
        'No desperdiciar memoria ni ciclos del procesador es tener {{eficiencia}}.',
        'Ser comprensible, utilizable y compatible define la {{aceptabilidad}}.',
      ],
      bank: ['seguridad', 'usabilidad', 'portabilidad', 'escalabilidad'],
    },
    explanation:
      'Los atributos esenciales son mantenimiento, confiabilidad y seguridad, eficiencia y aceptabilidad.',
  },
  {
    id: 'ord1.2a',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Ordena las actividades del proceso en un sistema de facturación',
    instructions: 'Usa las flechas para ordenar la secuencia correcta.',
    correctOrder: [
      'Definir con el cliente qué debe hacer el sistema y sus restricciones',
      'Diseñar e implementar los módulos de facturación y reportes',
      'Verificar que las facturas cumplen los requisitos definidos',
      'Modificar el sistema cuando cambian las regulaciones fiscales',
    ],
    config: {},
    explanation:
      'La secuencia representa especificación, desarrollo, validación y evolución. En proyectos reales estas actividades pueden solaparse e iterarse.',
  },
];