import type { ActivityType, ExerciseConfig, ExerciseType } from '@/models/entities';

export interface ExampleSeed {
  id: string;
  lessonId: string;
  type: ExerciseType;
  title: string;
  prompt: string;
  config: ExerciseConfig;
  steps: { text: string; why: string }[];
  hints: string[];
  explanation: string;
}

export interface ExerciseSeed {
  id: string;
  lessonId: string;
  type: ExerciseType;
  prompt: string;
  instructions: string;
  correctOrder: string[];
  config?: ExerciseConfig;
  explanation?: string;
}

export interface QuestionSeed {
  type: ActivityType;
  config?: ExerciseConfig;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface EvaluationSeed {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: QuestionSeed[];
}

const ORDER_HINT = 'Usa las flechas para ordenar la secuencia correcta.';

const mcq = (
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): QuestionSeed => ({ type: 'mcq', prompt, options, answer, explanation });

export const unit1Examples: ExampleSeed[] = [
  {
    id: 'exA1.2',
    lessonId: 'l1.2',
    type: 'match',
    title: 'Atributos del buen software',
    prompt: 'Enlaza cada atributo con su descripción',
    config: {
      pairs: [
        { left: 'Mantenimiento', right: 'Puede evolucionar ante necesidades cambiantes' },
        { left: 'Confiabilidad y seguridad', right: 'No causa daño y resiste ataques' },
        { left: 'Eficiencia', right: 'No desperdicia memoria ni ciclos del procesador' },
        { left: 'Aceptabilidad', right: 'Comprensible, utilizable y compatible' },
      ],
    },
    steps: [
      { text: 'Leer el atributo Mantenimiento', why: 'Conviene identificar la propiedad de calidad antes de buscar su definición.' },
      { text: 'Buscar la definición que habla de evolución y cambio', why: 'El cambio del software es inevitable en un entorno empresarial variable.' },
      { text: 'Enlazar eficiencia con el uso de recursos', why: 'La eficiencia se refiere a memoria, ciclos y tiempo de respuesta.' },
      { text: 'Comprobar que ninguna definición se repita', why: 'Cada atributo tiene una consecuencia distinta y verificable.' },
    ],
    hints: [
      'Concéntrate en la consecuencia de cada atributo, no en su nombre.',
      'Confiabilidad habla de daño y ataques; eficiencia, de recursos.',
      'Aceptabilidad se juzga desde el usuario que usará el sistema.',
    ],
    explanation:
      'Mantenimiento permite evolucionar con el cambio; confiabilidad y seguridad evitan daño y ataques; eficiencia cuida los recursos; aceptabilidad mira la comprensión y compatibilidad con otros sistemas.',
  },
  {
    id: 'exA1.3',
    lessonId: 'l1.3',
    type: 'match',
    title: 'Principios del código ACM/IEEE',
    prompt: 'Enlaza cada principio con su obligación',
    config: {
      pairs: [
        { left: 'PÚBLICO', right: 'Actuar conforme al interés del público' },
        { left: 'CLIENTE Y EMPLEADOR', right: 'Fomentar su mejor interés en coherencia con el interés público' },
        { left: 'JUICIO', right: 'Mantener integridad e independencia en el juicio profesional' },
        { left: 'COLEGAS', right: 'Ser justos con los colegas y apoyarlos' },
      ],
    },
    steps: [
      { text: 'Leer el primer principio', why: 'Cada principio nombra un ámbito de responsabilidad del ingeniero.' },
      { text: 'Ubicar su obligación en el código', why: 'Las obligaciones están formuladas como conductas observables, no como valores abstractos.' },
      { text: 'Revisar que la pareja no se repita', why: 'CLIENTE Y EMPLEADOR no es lo mismo que PÚBLICO: siempre se subordina al interés público.' },
    ],
    hints: [
      'El principio PÚBLICO antepone el interés social a cualquier beneficio particular.',
      'JUICIO trata de integridad, no de tareas ni de clientes.',
      'COLEGAS se refiere al trato justo y de apoyo entre profesionales.',
    ],
    explanation:
      'El código resume ocho principios. PÚBLICO antepone el interés social; CLIENTE Y EMPLEADOR busca su mejor interés sin dañar al público; JUICIO exige integridad e independencia; COLEGAS pide justicia y apoyo entre profesionales.',
  },
  {
    id: 'exA1.4',
    lessonId: 'l1.4',
    type: 'match',
    title: 'Estudios de caso y tipo de sistema',
    prompt: 'Enlaza cada sistema con su tipo',
    config: {
      pairs: [
        { left: 'Bomba de insulina', right: 'Sistema embebido que controla un dispositivo médico' },
        { left: 'MHC-PMS', right: 'Sistema de información de pacientes de salud mental' },
        { left: 'Estación meteorológica', right: 'Sistema de adquisición de datos con sensores' },
        { left: 'Mantenimiento de estación', right: 'Monitoriza y actualiza remotamente las estaciones' },
      ],
    },
    steps: [
      { text: 'Leer la descripción del sistema', why: 'Cada estudio de caso enfatiza un tipo distinto de software.' },
      { text: 'Reconocer qué controla o gestiona', why: 'Controlar hardware indica embebido; gestionar una base de datos indica sistema de información.' },
      { text: 'Asignar el tipo según esa función principal', why: 'El tipo de sistema determina qué técnicas de ingeniería se aplican.' },
    ],
    hints: [
      'Si el software controla hardware, es un sistema embebido.',
      'MHC-PMS gestiona información clínica, no hardware.',
      'La estación meteorológica obtiene datos de sensores en un entorno hostil.',
    ],
    explanation:
      'La bomba de insulina es embebida y crítica para la seguridad; el MHC-PMS es un sistema de información con fuertes requisitos de privacidad; la estación meteorológica es adquisición de datos con fiabilidad en ambiente hostil; el sistema de mantenimiento monitoriza y actualiza las estaciones de forma remota.',
  },
];

export const unit12ExerciseBankAdditions: ExerciseSeed[] = [
  {
    id: 'cross1.2a',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama: conceptos del desarrollo profesional',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    config: {
      crossword: {
        rows: 12,
        cols: 13,
        entries: [
          {
            word: 'MANTENIMIENTO',
            clue: 'Atributo que permite actualizar el software ante necesidades cambiantes',
            row: 0,
            col: 0,
            direction: 'across',
          },
          {
            word: 'EFICIENCIA',
            clue: 'Atributo que evita desperdiciar memoria y ciclos del procesador',
            row: 0,
            col: 4,
            direction: 'down',
          },
          {
            word: 'GENERICO',
            clue: 'Producto que se vende en el mercado abierto a cualquier cliente',
            row: 5,
            col: 3,
            direction: 'across',
          },
          {
            word: 'EVOLUCION',
            clue: 'Actividad que modifica el sistema ante requisitos cambiantes',
            row: 3,
            col: 10,
            direction: 'down',
          },
          {
            word: 'MEDIDA',
            clue: 'Producto personalizado: producto "a la ___"',
            row: 9,
            col: 7,
            direction: 'across',
          },
        ],
      },
      bank: ['ACEPTABILIDAD', 'SOFTWARE', 'CONFIGURACION'],
    },
    explanation:
      'El crucigrama combina atributos de calidad, tipos de productos y la actividad de evolución del software.',
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
    instructions: ORDER_HINT,
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

export const unit1Exercises: ExerciseSeed[] = [
  {
    id: 'ord1.2',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Actividades fundamentales del proceso',
    instructions: ORDER_HINT,
    correctOrder: ['Especificación del software', 'Desarrollo del software', 'Validación del software', 'Evolución del software'],
    explanation: 'Las actividades del proceso son especificación, desarrollo, validación y evolución; en la práctica se solapan e iteran.',
  },
  {
    id: 'fill1.2',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa los conceptos del desarrollo profesional',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    explanation: 'El buen software debe ser funcional, genérico o personalizado según su mercado; cerca del 60% de los costos son de desarrollo.',
    config: {
      sentences: [
        'El buen software debe entregar la {{funcionalidad}} y el desempeño requeridos.',
        'Los productos {{genéricos}} se venden en el mercado abierto a cualquier cliente.',
        'Los productos {{personalizados}} se desarrollan para un cliente en particular.',
        'Aproximadamente el {{60}}% de los costos del software son de desarrollo.',
      ],
      bank: ['mantenimiento', 'confiabilidad', 'eficiencia', 'hardware', '40'],
    },
  },
  {
    id: 'match1.2',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada atributo con su descripción',
    instructions: 'Toca un atributo y después su descripción.',
    correctOrder: [],
    explanation: 'Cada atributo describe una propiedad distinta: evolución, seguridad, uso de recursos y aceptación por el usuario.',
    config: {
      pairs: [
        { left: 'Mantenimiento', right: 'Puede evolucionar ante necesidades cambiantes' },
        { left: 'Confiabilidad y seguridad', right: 'No causa daño y resiste ataques' },
        { left: 'Eficiencia', right: 'No desperdicia memoria ni ciclos del procesador' },
        { left: 'Aceptabilidad', right: 'Comprensible, utilizable y compatible' },
      ],
    },
  },
  {
    id: 'match1.2b',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada tipo de producto con su ejemplo',
    instructions: 'Toca un tipo y después su ejemplo.',
    correctOrder: [],
    explanation: 'El sistema de contabilidad es genérico; el control de tráfico aéreo es personalizado; el ERP es un genérico adaptado.',
    config: {
      pairs: [
        { left: 'Producto genérico', right: 'Sistema de contabilidad que se vende a cualquier cliente' },
        { left: 'Producto personalizado', right: 'Sistema de control de tráfico aéreo para un cliente' },
        { left: 'Producto genérico adaptado', right: 'ERP configurado con las reglas de una empresa' },
      ],
    },
  },
  {
    id: 'cross1.2',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama de atributos del software',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    explanation: 'Los atributos esenciales son mantenimiento, confiabilidad y seguridad, eficiencia y aceptabilidad.',
    config: {
      crossword: {
        rows: 16,
        cols: 13,
        entries: [
          { word: 'ACEPTABILIDAD', clue: 'Comprensible, utilizable y compatible con otros sistemas', row: 3, col: 0, direction: 'across' },
          { word: 'CONFIABILIDAD', clue: 'Fiabilidad, seguridad y protección frente a fallas y ataques', row: 3, col: 1, direction: 'down' },
          { word: 'EFICIENCIA', clue: 'No desperdicia memoria ni ciclos del procesador', row: 3, col: 2, direction: 'down' },
          { word: 'INGENIERIA', clue: 'Disciplina que cubre todos los aspectos de la producción de software', row: 3, col: 7, direction: 'down' },
        ],
      },
      bank: ['MANTENIMIENTO', 'SOFTWARE', 'REUTILIZACION', 'CONFIGURACION'],
    },
  },
  {
    id: 'fill1.2b',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa los tipos de producto y la calidad',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    explanation: 'El ERP es un producto genérico adaptado; la calidad incluye atributos no funcionales.',
    config: {
      sentences: [
        'Un sistema profesional incluye programas separados y archivos de {{configuración}}.',
        'Los ERP como SAP son productos {{genéricos}} adaptados al cliente.',
        'En los productos {{personalizados}}, el cliente controla la especificación.',
        'La calidad considera también los atributos {{no funcionales}} del software.',
      ],
      bank: ['seguridad', 'funcionales', 'manuales', 'monolíticos', 'medibles'],
    },
  },
  ...unit12ExerciseBankAdditions,
  {
    id: 'ord1.3',
    lessonId: 'l1.3',
    type: 'order',
    prompt: 'Ordena el razonamiento ético',
    instructions: ORDER_HINT,
    correctOrder: ['Identificar a los afectados', 'Reconocer el principio en juego', 'Evaluar riesgos y alternativas', 'Actuar y documentar la decisión'],
    explanation: 'El razonamiento ético parte de los afectados, reconoce el principio, evalúa riesgos y documenta la decisión.',
  },
  {
    id: 'fill1.3',
    lessonId: 'l1.3',
    type: 'fill',
    prompt: 'Completa el código de ética',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    explanation: 'El código ACM/IEEE tiene ocho principios y prioriza el interés público, la confidencialidad y la competencia.',
    config: {
      sentences: [
        'El código ACM/IEEE establece {{ocho}} principios de conducta profesional.',
        'El principio {{PÚBLICO}} antepone el interés del público.',
        'La {{confidencialidad}} se respeta aun sin un acuerdo formal firmado.',
        'No aceptar trabajo fuera de la propia {{competencia}} es un deber profesional.',
      ],
      bank: ['siete', 'integridad', 'honestidad', 'COLEGAS', 'gestión'],
    },
  },
  {
    id: 'match1.3',
    lessonId: 'l1.3',
    type: 'match',
    prompt: 'Enlaza cada principio con su obligación',
    instructions: 'Toca un principio y después su obligación.',
    correctOrder: [],
    explanation: 'Cada principio delimita un ámbito de responsabilidad: público, cliente, juicio y colegas.',
    config: {
      pairs: [
        { left: 'PÚBLICO', right: 'Actuar conforme al interés del público' },
        { left: 'CLIENTE Y EMPLEADOR', right: 'Fomentar su mejor interés en coherencia con el interés público' },
        { left: 'JUICIO', right: 'Mantener integridad e independencia en el juicio profesional' },
        { left: 'COLEGAS', right: 'Ser justos con los colegas y apoyarlos' },
      ],
    },
  },
  {
    id: 'match1.3b',
    lessonId: 'l1.3',
    type: 'match',
    prompt: 'Enlaza cada deber profesional con su ejemplo',
    instructions: 'Toca un deber y después su ejemplo.',
    correctOrder: [],
    explanation: 'La confidencialidad protege datos del cliente; la competencia evita aceptar tareas fuera de capacidad; la propiedad intelectual respeta patentes y copyright.',
    config: {
      pairs: [
        { left: 'Confidencialidad', right: 'No revelar información del cliente sin autorización' },
        { left: 'Competencia', right: 'Rechazar una tarea para la que no se está capacitado' },
        { left: 'Propiedad intelectual', right: 'Respetar patentes y copyright del software' },
      ],
    },
  },
  {
    id: 'cross1.3',
    lessonId: 'l1.3',
    type: 'crossword',
    prompt: 'Crucigrama de ética profesional',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    explanation: 'Confidencialidad, competencia e integridad son deberes centrales del código de ética.',
    config: {
      crossword: {
        rows: 14,
        cols: 17,
        entries: [
          { word: 'CONFIDENCIALIDAD', clue: 'Respeto a la información del empleador o cliente', row: 3, col: 0, direction: 'across' },
          { word: 'COMPETENCIA', clue: 'No aceptar trabajo fuera de la propia capacidad', row: 3, col: 0, direction: 'down' },
          { word: 'INTEGRIDAD', clue: 'Honestidad e independencia en el juicio', row: 3, col: 4, direction: 'down' },
          { word: 'ETICA', clue: 'Marco de conducta profesional', row: 3, col: 6, direction: 'down' },
        ],
      },
      bank: ['PRODUCTO', 'JUICIO', 'COLEGAS', 'HONESTIDAD'],
    },
  },
  {
    id: 'fill1.3b',
    lessonId: 'l1.3',
    type: 'fill',
    prompt: 'Completa la responsabilidad profesional',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    explanation: 'La responsabilidad profesional abarca propiedad intelectual, mal uso de computadoras y códigos de conducta.',
    config: {
      sentences: [
        'Conocer patentes y copyright es respetar los derechos de {{propiedad intelectual}}.',
        'Usar mal las computadoras de otros incluye diseminar {{malware}}.',
        'Los principios se publican en códigos de {{conducta}}.',
        'La ética se analiza mejor en un contexto de {{ingeniería}} de software.',
      ],
      bank: ['programación', 'gestión', 'ética', 'arquitectura', 'pruebas'],
    },
  },
  {
    id: 'ord1.4',
    lessonId: 'l1.4',
    type: 'order',
    prompt: 'Ordena el funcionamiento de la bomba de insulina',
    instructions: ORDER_HINT,
    correctOrder: ['Medir el nivel de azúcar en la sangre', 'Calcular la dosis necesaria', 'Enviar pulsos a la bomba', 'Administrar la insulina'],
    explanation: 'La bomba mide la glucosa, calcula la dosis, envía pulsos y administra la insulina.',
  },
  {
    id: 'fill1.4',
    lessonId: 'l1.4',
    type: 'fill',
    prompt: 'Completa los estudios de caso',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    explanation: 'Los estudios de caso representan un sistema embebido, uno de información y uno de adquisición de datos.',
    config: {
      sentences: [
        'La bomba de insulina es un sistema {{embebido}} crítico de seguridad.',
        'El MHC-PMS es un sistema de {{información}} con base de datos centralizada.',
        'La estación meteorológica adquiere {{datos}} con sensores.',
        'Las estaciones usan un enlace {{satelital}} de baja rapidez.',
      ],
      bank: ['lotes', 'hardware', 'sensores', 'red', 'control'],
    },
  },
  {
    id: 'match1.4',
    lessonId: 'l1.4',
    type: 'match',
    prompt: 'Enlaza cada sistema con su tipo',
    instructions: 'Toca un sistema y después su tipo.',
    correctOrder: [],
    explanation: 'La función principal de cada sistema determina su tipo.',
    config: {
      pairs: [
        { left: 'Bomba de insulina', right: 'Sistema embebido que controla un dispositivo médico' },
        { left: 'MHC-PMS', right: 'Sistema de información de pacientes de salud mental' },
        { left: 'Estación meteorológica', right: 'Sistema de adquisición de datos con sensores' },
        { left: 'Mantenimiento de estación', right: 'Monitoriza y actualiza remotamente las estaciones' },
      ],
    },
  },
  {
    id: 'fill1.4b',
    lessonId: 'l1.4',
    type: 'fill',
    prompt: 'Completa los requerimientos de los estudios de caso',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    explanation: 'El MHC-PMS prioriza la privacidad; la estación debe ser fiable en ambiente hostil; la bomba exige disponibilidad y dosis correcta.',
    config: {
      sentences: [
        'El MHC-PMS prioriza la {{privacidad}} de los pacientes.',
        'La estación meteorológica debe ser fiable en un ambiente {{hostil}}.',
        'La bomba debe estar {{disponible}} para entregar insulina cuando se requiere.',
        'El sistema de mantenimiento actualiza el software de forma {{remota}}.',
      ],
      bank: ['seguridad', 'amigable', 'confiable', 'local', 'manual'],
    },
  },
  {
    id: 'cross1.4',
    lessonId: 'l1.4',
    type: 'crossword',
    prompt: 'Crucigrama de estudios de caso',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    explanation: 'La estación meteorológica y la bomba ejemplifican adquisición de datos y sistemas embebidos.',
    config: {
      crossword: {
        rows: 12,
        cols: 13,
        entries: [
          { word: 'METEOROLOGICA', clue: 'Estación a campo abierto que adquiere datos', row: 3, col: 0, direction: 'across' },
          { word: 'MHC', clue: 'Sistema de administración de pacientes de salud mental', row: 3, col: 0, direction: 'down' },
          { word: 'EMBEBIDO', clue: 'Sistema que controla un dispositivo de hardware', row: 3, col: 1, direction: 'down' },
          { word: 'INSULINA', clue: 'Hormona que administra la bomba automática', row: 3, col: 10, direction: 'down' },
        ],
      },
      bank: ['SENSORES', 'PACIENTES', 'SATELITAL', 'PRIVACIDAD'],
    },
  },
  {
    id: 'match1.4b',
    lessonId: 'l1.4',
    type: 'match',
    prompt: 'Enlaza cada sistema con su requerimiento clave',
    instructions: 'Toca un sistema y después su requerimiento.',
    correctOrder: [],
    explanation: 'Cada sistema enfatiza un atributo: privacidad, fiabilidad en ambiente hostil y disponibilidad con dosis correcta.',
    config: {
      pairs: [
        { left: 'MHC-PMS', right: 'Privacidad y disponibilidad de la información clínica' },
        { left: 'Estación meteorológica', right: 'Fiabilidad en condiciones de ambiente hostil' },
        { left: 'Bomba de insulina', right: 'Disponibilidad y entrega de la dosis correcta' },
      ],
    },
  },
];

const eval12Questions: QuestionSeed[] = [
  mcq('¿Cuál es una actividad fundamental del proceso de software?', ['Diseñar la interfaz gráfica', 'Validar que el sistema cumple los requisitos', 'Comprar hardware', 'Publicar en la Web'], 1, 'Las actividades fundamentales son especificación, desarrollo, validación y evolución del software.'),
  mcq('¿Qué incluye un sistema de software profesional además de los programas?', ['Solo el código fuente', 'Documentación y archivos de configuración', 'Únicamente manuales impresos', 'Solo el sitio de descargas'], 1, 'Incluye documentación del sistema y del usuario, archivos de configuración y sitios con información del producto.'),
  mcq('En los productos personalizados, ¿quién controla generalmente la especificación?', ['La organización desarrolladora', 'La organización que compra el software', 'El mercado abierto', 'El equipo de pruebas'], 1, 'En los personalizados la especificación la define y controla quien adquiere el software.'),
  mcq('¿Qué caracteriza a los productos genéricos?', ['Se desarrollan para un cliente específico', 'Se venden en el mercado abierto a cualquier cliente', 'No requieren documentación', 'Solo existen como servicio web'], 1, 'Los productos genéricos son sistemas independientes que se comercializan en el mercado abierto.'),
  mcq('¿Cuál es un atributo esencial del buen software?', ['Que no tenga documentación', 'Que sea mantenible y confiable', 'Que solo funcione en un equipo', 'Que se entregue sin pruebas'], 1, 'Mantenimiento, confiabilidad y seguridad, eficiencia y aceptabilidad son atributos esenciales.'),
  mcq('¿Qué diferencia a la ingeniería de software de las ciencias de la computación?', ['No tienen relación', 'Las ciencias se enfocan en teoría; la ingeniería, en la producción práctica de software', 'La ingeniería estudia solo hardware', 'Las ciencias solo estudian juegos'], 1, 'Las ciencias de la computación se centran en teoría y fundamentos; la ingeniería de software, en los asuntos prácticos de la producción.'),
  mcq('¿Por qué se afirma que no existe un método universal de ingeniería de software?', ['Porque todos los sistemas son iguales', 'Porque distintos tipos de sistema requieren distintas técnicas', 'Porque no hay métodos', 'Porque solo sirve la programación'], 1, 'Cada tipo de sistema requiere enfoques y técnicas específicas; no hay una técnica universal.'),
  mcq('¿Qué aportó la Web a la ingeniería de software?', ['Eliminó la necesidad de pruebas', 'Impulsó la reutilización y los servicios distribuidos', 'Evitó el mantenimiento', 'Eliminó los requerimientos'], 1, 'La Web trajo disponibilidad de servicios, componentes reutilizables y avances en lenguajes y reutilización.'),
  { type: 'match', config: { pairs: [{ left: 'Mantenimiento', right: 'Evolucionar ante necesidades cambiantes' }, { left: 'Eficiencia', right: 'No desperdiciar recursos' }, { left: 'Aceptabilidad', right: 'Comprensible y compatible' }] }, prompt: 'Enlaza cada atributo con su descripción', options: [], answer: 0, explanation: 'Cada atributo de calidad describe una propiedad distinta del software profesional.' },
  { type: 'match', config: { pairs: [{ left: 'Producto genérico', right: 'Se vende en el mercado abierto' }, { left: 'Producto personalizado', right: 'Se desarrolla para un cliente específico' }, { left: 'ERP adaptado', right: 'Producto genérico adaptado a la empresa' }] }, prompt: 'Enlaza cada tipo de producto con su definición', options: [], answer: 0, explanation: 'Genérico se comercializa en el mercado; personalizado se diseña para un cliente; el ERP es un genérico adaptado.' },
  { type: 'fill', config: { sentences: ['La calidad del software abarca los atributos {{no funcionales}}.', 'Un sistema profesional incluye archivos de {{configuración}}.'], bank: ['funcionales', 'seguridad', 'manuales', 'monolíticos'] }, prompt: 'Completa las frases', options: [], answer: 0, explanation: 'La calidad incluye atributos no funcionales y el sistema incluye configuración y documentación.' },
  { type: 'fill', config: { sentences: ['Aproximadamente el {{60}}% de los costos son de desarrollo.', 'Los productos se venden en el mercado {{abierto}}.'], bank: ['40', 'cerrado', 'privado', '80'] }, prompt: 'Completa las cifras y términos', options: [], answer: 0, explanation: 'Cerca del 60% de los costos son de desarrollo y el mercado de los productos genéricos es abierto.' },
  { type: 'order', config: {}, prompt: 'Ordena las actividades del proceso', options: ['Especificación del software', 'Desarrollo del software', 'Validación del software', 'Evolución del software'], answer: 0, explanation: 'El proceso va de la especificación a la evolución, pasando por desarrollo y validación.' },
  mcq('¿Qué práctica deja trazabilidad del trabajo profesional?', ['No documentar', 'Usar control de versiones y registrar incidencias', 'Cambiar el código en producción', 'Probar solo al final'], 1, 'Documentar y usar control de versiones deja evidencia de qué se decidió y cómo se validó.'),
  { type: 'crossword', config: { crossword: { rows: 16, cols: 13, entries: [{ word: 'MANTENIMIENTO', clue: 'Permite evolucionar ante necesidades cambiantes', row: 3, col: 0, direction: 'across' as const }, { word: 'ACEPTABILIDAD', clue: 'Comprensible, utilizable y compatible', row: 3, col: 1, direction: 'down' as const }, { word: 'EFICIENCIA', clue: 'No desperdicia recursos del sistema', row: 3, col: 4, direction: 'down' as const }] }, bank: ['CONFIABILIDAD', 'SOFTWARE', 'USABILIDAD'] }, prompt: 'Completa el crucigrama de atributos', options: [], answer: 0, explanation: 'Mantenimiento, aceptabilidad y eficiencia son atributos esenciales del buen software.' },
];

const eval13Questions: QuestionSeed[] = [
  mcq('¿Cuántos principios reúne el código de ética ACM/IEEE?', ['Seis', 'Siete', 'Ocho', 'Nueve'], 2, 'El código resume ocho principios, desde PÚBLICO hasta UNO MISMO.'),
  mcq('¿Qué principio antepone el interés del público?', ['GESTIÓN', 'PÚBLICO', 'PRODUCTO', 'COLEGAS'], 1, 'PÚBLICO exige actuar consecuentemente con el interés del público.'),
  mcq('¿Qué implica el principio JUICIO?', ['Aceptar cualquier tarea', 'Mantener integridad e independencia en el juicio profesional', 'Ocultar los fallos', 'Priorizar el beneficio comercial'], 1, 'JUICIO exige integridad e independencia en el juicio profesional.'),
  mcq('¿Qué exige el principio COMPETENCIA?', ['Aceptar todo trabajo', 'No aceptar trabajo fuera de la propia competencia', 'Trabajar sin capacitación', 'Delegar sin supervisión'], 1, 'No se debe desvirtuar el nivel de competencia aceptando trabajo para el que no se está capacitado.'),
  mcq('¿Cuál es un deber de confidencialidad?', ['Revelar datos si conviene', 'Respetar la información del cliente o empleador, con o sin contrato', 'Publicar datos personales', 'Compartir información con terceros'], 1, 'La confidencialidad se respeta con independencia de que exista un acuerdo formal.'),
  mcq('¿Qué abarca respetar la propiedad intelectual?', ['Ignorar patentes', 'Conocer y proteger patentes y copyright', 'Copiar software ajeno', 'Distribuir licencias sin permiso'], 1, 'Se deben conocer las leyes locales de patentes y copyright y proteger la propiedad del empleador y del cliente.'),
  mcq('Si un fallo expone datos personales, ¿qué debe priorizarse?', ['Evitar cualquier retraso comercial', 'El interés público y la protección de datos', 'Ocultar el fallo', 'Delegar sin informar'], 1, 'El interés público y la protección de datos prevalecen; hay que informar riesgos significativos.'),
  mcq('¿Por qué es un reto la participación en sistemas militares?', ['Porque no existen', 'Porque genera conflictos éticos y exige transparencia anticipada', 'Porque está prohibida', 'Porque siempre es ilegal'], 1, 'Es un conflicto ético frecuente; empleadores y empleados deben aclarar de antemano sus posiciones.'),
  { type: 'match', config: { pairs: [{ left: 'PÚBLICO', right: 'Actuar conforme al interés del público' }, { left: 'COLEGAS', right: 'Ser justos y apoyarlos' }, { left: 'UNO MISMO', right: 'Aprendizaje para toda la vida' }] }, prompt: 'Enlaza cada principio con su obligación', options: [], answer: 0, explanation: 'Cada principio expresa una relación de responsabilidad distinta.' },
  { type: 'match', config: { pairs: [{ left: 'Confidencialidad', right: 'Respetar la información del cliente' }, { left: 'Competencia', right: 'No aceptar trabajo fuera de capacidad' }, { left: 'Mal uso de computadoras', right: 'No dañar equipos o datos ajenos' }] }, prompt: 'Enlaza cada responsabilidad con su descripción', options: [], answer: 0, explanation: 'Son áreas de responsabilidad profesional anteriores a la ley.' },
  { type: 'fill', config: { sentences: ['El principio {{JUICIO}} exige independencia profesional.', 'El código lo publican {{ACM}} e IEEE.'], bank: ['GESTIÓN', 'PRODUCTO', 'IEEE', 'ISO'] }, prompt: 'Completa los principios', options: [], answer: 0, explanation: 'JUICIO e instituciones como ACM e IEEE forman el marco del código.' },
  { type: 'fill', config: { sentences: ['El mal uso incluye diseminar {{malware}}.', 'Los códigos de {{conducta}} establecen estándares esperados.'], bank: ['virus', 'ética', 'leyes', 'principios'] }, prompt: 'Completa las frases', options: [], answer: 0, explanation: 'El mal uso va del uso trivial a la diseminación de malware; los códigos de conducta fijan estándares.' },
  { type: 'order', config: {}, prompt: 'Ordena el razonamiento ético', options: ['Identificar a los afectados', 'Reconocer el principio en juego', 'Evaluar riesgos y alternativas', 'Actuar y documentar la decisión'], answer: 0, explanation: 'El análisis ético parte de los afectados y termina en la acción documentada.' },
  mcq('¿Qué principio obliga a actuar conforme al interés del público?', ['PRODUCTO', 'PÚBLICO', 'GESTIÓN', 'UNO MISMO'], 1, 'PÚBLICO exige actuar consecuentemente con el interés del público, por encima de intereses particulares.'),
  { type: 'crossword', config: { crossword: { rows: 19, cols: 11, entries: [{ word: 'COMPETENCIA', clue: 'No aceptar trabajo fuera de la propia capacidad', row: 3, col: 0, direction: 'across' as const }, { word: 'CONFIDENCIALIDAD', clue: 'Respeto a la información del cliente', row: 3, col: 0, direction: 'down' as const }, { word: 'ETICA', clue: 'Marco de conducta profesional', row: 3, col: 4, direction: 'down' as const }] }, bank: ['INTEGRIDAD', 'HONESTIDAD', 'PRODUCTO'] }, prompt: 'Completa el crucigrama de ética', options: [], answer: 0, explanation: 'Competencia, confidencialidad y ética son deberes centrales del código profesional.' },
];

const eval14Questions: QuestionSeed[] = [
  mcq('¿Qué tipo de sistema es la bomba de insulina?', ['Sistema de información', 'Sistema embebido', 'Procesamiento en lotes', 'Entretenimiento'], 1, 'Controla un dispositivo médico a partir de un sensor: es un sistema embebido.'),
  mcq('¿Cuál es el propósito principal del MHC-PMS?', ['Controlar hardware médico', 'Gestionar información de pacientes de salud mental', 'Predecir el clima', 'Administrar energía'], 1, 'Es un sistema de información que administra pacientes y tratamientos de salud mental.'),
  mcq('¿Qué conflicto de diseño enfrenta el MHC-PMS?', ['Velocidad frente a color', 'Privacidad frente a disponibilidad', 'Tamaño frente a precio', 'Idioma frente a moneda'], 1, 'La privacidad es más fácil con una sola copia; la disponibilidad exige varias copias.'),
  mcq('¿Qué ley afecta de forma única al MHC-PMS?', ['Leyes de tránsito', 'Leyes de salud mental con detención obligatoria', 'Leyes de comercio', 'Leyes de propiedad'], 1, 'La salud mental es la única especialidad que puede recomendar detención contra la voluntad del paciente.'),
  mcq('¿Qué mide la estación meteorológica?', ['Solo temperatura', 'Temperatura, presión, luz, lluvia y viento', 'Solo lluvia', 'Solo viento'], 1, 'Recolecta varios parámetros climáticos mediante instrumentos.'),
  mcq('¿Por qué la estación meteorológica procesa datos localmente?', ['Por comodidad', 'Porque el ancho de banda satelital es estrecho', 'Porque no tiene sensores', 'Porque no usa energía'], 1, 'Concentra los datos localmente y los transmite cuando se solicitan, dado el enlace satelital limitado.'),
  mcq('¿Qué hace el sistema de mantenimiento de estación?', ['Adquiere datos del clima', 'Monitoriza y actualiza remotamente las estaciones', 'Vende servicios web', 'Gestiona pacientes'], 1, 'Monitoriza el estado de las estaciones y puede actualizar su software embebido.'),
  mcq('¿Por qué la estación debe ser autocontenida?', ['Para gastar menos', 'Porque no hay fuentes externas de energía ni red', 'Para ser más rápida', 'Porque lo exige el usuario'], 1, 'Se despliega en campo abierto, sin energía externa ni cables de red; usa baterías y carga solar o eólica.'),
  { type: 'match', config: { pairs: [{ left: 'Bomba de insulina', right: 'Sistema embebido médico' }, { left: 'MHC-PMS', right: 'Sistema de información clínica' }, { left: 'Estación meteorológica', right: 'Adquisición de datos con sensores' }] }, prompt: 'Enlaza cada sistema con su tipo', options: [], answer: 0, explanation: 'Cada estudio de caso representa un tipo distinto de sistema.' },
  { type: 'match', config: { pairs: [{ left: 'MHC-PMS', right: 'Privacidad' }, { left: 'Estación meteorológica', right: 'Fiabilidad en ambiente hostil' }, { left: 'Bomba de insulina', right: 'Disponibilidad y dosis correcta' }] }, prompt: 'Enlaza cada sistema con su requerimiento clave', options: [], answer: 0, explanation: 'Cada sistema enfatiza un atributo de calidad distinto.' },
  { type: 'fill', config: { sentences: ['La bomba entrega insulina en respuesta a {{pulsos}} del controlador.', 'El MHC-PMS usa una base de datos {{centralizada}}.'], bank: ['señales', 'distribuida', 'local', 'respuestas'] }, prompt: 'Completa las frases', options: [], answer: 0, explanation: 'La bomba responde a pulsos y el MHC-PMS se apoya en una base de datos centralizada con copias locales.' },
  { type: 'fill', config: { sentences: ['Las estaciones se despliegan en campo {{abierto}}.', 'La estación se comunica por {{satélite}}.'], bank: ['cerrado', 'cable', 'radio', 'remoto'] }, prompt: 'Completa las frases', options: [], answer: 0, explanation: 'El escenario es campo abierto con comunicación satelital.' },
  { type: 'order', config: {}, prompt: 'Ordena el funcionamiento de la bomba de insulina', options: ['Medir el nivel de azúcar en la sangre', 'Calcular la dosis necesaria', 'Enviar pulsos a la bomba', 'Administrar la insulina'], answer: 0, explanation: 'El sistema mide, calcula, envía pulsos y administra la dosis.' },
  mcq('¿Qué atributo es prioritario en el MHC-PMS?', ['Capacidad gráfica', 'Privacidad de la información clínica', 'Tamaño físico', 'Ancho de banda'], 1, 'El MHC-PMS maneja información sensible: la privacidad es un requerimiento crítico.'),
  { type: 'crossword', config: { crossword: { rows: 11, cols: 8, entries: [{ word: 'INSULINA', clue: 'Hormona que administra la bomba', row: 3, col: 0, direction: 'across' as const }, { word: 'SENSORES', clue: 'Dispositivos que recogen datos del entorno', row: 3, col: 2, direction: 'down' as const }] }, bank: ['EMBEBIDO', 'MHC', 'PACIENTES'] }, prompt: 'Completa el crucigrama de estudios de caso', options: [], answer: 0, explanation: 'La bomba administra insulina y la estación meteorológica usa sensores.' },
];

export const unit1Evaluations: EvaluationSeed[] = [
  {
    id: 'ev1.2',
    lessonId: 'l1.2',
    title: 'Evaluación: Desarrollo de software profesional',
    description: 'Proceso, productos, atributos de calidad y el papel de la Web.',
    questions: eval12Questions,
  },
  {
    id: 'ev1.3',
    lessonId: 'l1.3',
    title: 'Evaluación: Ética en la ingeniería de software',
    description: 'Código ACM/IEEE, responsabilidades profesionales y dilemas.',
    questions: eval13Questions,
  },
  {
    id: 'ev1.4',
    lessonId: 'l1.4',
    title: 'Evaluación: Estudios de caso',
    description: 'Bomba de insulina, MHC-PMS y estación meteorológica.',
    questions: eval14Questions,
  },
];
