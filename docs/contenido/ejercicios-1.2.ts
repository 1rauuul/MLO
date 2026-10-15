import type { ExerciseSeed } from './types';

export const ejerciciosL1_2: ExerciseSeed[] = [
  {
    id: 'ord1.2',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Actividades fundamentales del proceso',
    instructions: 'Usa las flechas para ordenar la secuencia correcta.',
    correctOrder: [
      'Especificación del software',
      'Desarrollo del software',
      'Validación del software',
      'Evolución del software',
    ],
    config: {},
    explanation:
      'Las actividades del proceso son especificación, desarrollo, validación y evolución; en la práctica se solapan e iteran.',
  },
  {
    id: 'fill1.2',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa los conceptos del desarrollo profesional',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'El buen software debe entregar la {{funcionalidad}} y el desempeño requeridos.',
        'Los productos {{genéricos}} se venden en el mercado abierto a cualquier cliente.',
        'Los productos {{personalizados}} se desarrollan para un cliente en particular.',
        'Aproximadamente el {{60}}% de los costos del software son de desarrollo.',
      ],
      bank: ['mantenimiento', 'confiabilidad', 'eficiencia', 'hardware', '40'],
    },
    explanation:
      'El buen software debe ser funcional, genérico o personalizado según su mercado; cerca del 60% de los costos son de desarrollo.',
  },
  {
    id: 'match1.2',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada atributo con su descripción',
    instructions: 'Toca un atributo y después su descripción.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Mantenimiento', right: 'Puede evolucionar ante necesidades cambiantes' },
        { left: 'Confiabilidad y seguridad', right: 'No causa daño y resiste ataques' },
        { left: 'Eficiencia', right: 'No desperdicia memoria ni ciclos del procesador' },
        { left: 'Aceptabilidad', right: 'Comprensible, utilizable y compatible' },
      ],
    },
    explanation:
      'Cada atributo describe una propiedad distinta: evolución, seguridad, uso de recursos y aceptación por el usuario.',
  },
  {
    id: 'match1.2b',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada tipo de producto con su ejemplo',
    instructions: 'Toca un tipo y después su ejemplo.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Producto genérico', right: 'Sistema de contabilidad que se vende a cualquier cliente' },
        { left: 'Producto personalizado', right: 'Sistema de control de tráfico aéreo para un cliente' },
        { left: 'Producto genérico adaptado', right: 'ERP configurado con las reglas de una empresa' },
      ],
    },
    explanation:
      'El sistema de contabilidad es genérico; el control de tráfico aéreo es personalizado; el ERP es un genérico adaptado.',
  },
  {
    id: 'cross1.2',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama de atributos del software',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    config: {
      crossword: {
        rows: 16,
        cols: 13,
        entries: [
          {
            word: 'ACEPTABILIDAD',
            clue: 'Cualidad que hace al software comprensible, fácil de usar y compatible con otros sistemas; si falla, los usuarios lo rechazan.',
            row: 3,
            col: 0,
            direction: 'across',
          },
          {
            word: 'CONFIABILIDAD',
            clue: 'Cualidad por la que el sistema responde sin fallas y resiste ataques maliciosos: puedes contar con él.',
            row: 3,
            col: 1,
            direction: 'down',
          },
          {
            word: 'EFICIENCIA',
            clue: 'Atributo de un sistema que aprovecha bien la memoria y el procesador, sin malgastar ciclos.',
            row: 3,
            col: 2,
            direction: 'down',
          },
          {
            word: 'INGENIERIA',
            clue: '___ de software: disciplina que abarca todo el proceso de producción, desde la especificación hasta el mantenimiento.',
            row: 3,
            col: 7,
            direction: 'down',
          },
        ],
      },
      bank: ['MANTENIMIENTO', 'SOFTWARE', 'REUTILIZACION', 'CONFIGURACION'],
    },
    explanation:
      'Aceptabilidad, confiabilidad y eficiencia son atributos de calidad que van más allá de lo que el sistema hace. La ingeniería de software es la disciplina que busca lograrlos a lo largo de todo el proceso.',
  },
  {
    id: 'fill1.2b',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa los tipos de producto y la calidad',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'Un sistema profesional incluye programas separados y archivos de {{configuración}}.',
        'Los ERP como SAP son productos {{genéricos}} adaptados al cliente.',
        'En los productos {{personalizados}}, el cliente controla la especificación.',
        'La calidad considera también los atributos {{no funcionales}} del software.',
      ],
      bank: ['seguridad', 'funcionales', 'manuales', 'monolíticos', 'medibles'],
    },
    explanation: 'El ERP es un producto genérico adaptado; la calidad incluye atributos no funcionales.',
  },
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