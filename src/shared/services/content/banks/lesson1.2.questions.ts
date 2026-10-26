import type { QuestionSeed } from '@/shared/services/content/unit1.content';

// Banco de preguntas de EVALUACIÓN de l1.2 (mcq y otros tipos).
// Pega aquí objetos QuestionSeed. La siembra es idempotente y usa ids
// `ev1.2-bank-qN` bajo la evaluación `ev1.2`.

export const l12QuestionBank: QuestionSeed[] = [
  // 1) Opción múltiple (la más común)
  {
    id: 'ev1.2-bank-q01',
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
  },
  {
    id: 'ev1.2-bank-q02',
    type: 'mcq',
    prompt: '¿Qué es software según la ingeniería de software?',
    options: [
      'Únicamente el código fuente de un programa',
      'Solo las aplicaciones que corren en teléfonos móviles',
      'Programas de cómputo y documentación asociada', // índice 2 = correcta
      'El conjunto de dispositivos físicos de una computadora',
    ],
    answer: 2,
    explanation:
      'El software incluye los programas y toda la documentación asociada (y datos de configuración) necesaria para que operen correctamente.',
  },
  {
    id: 'ev1.2-bank-q03',
    type: 'mcq',
    prompt: '¿Cómo se define la ingeniería de software?',
    options: [
      'Una disciplina de la ingeniería que se interesa por todos los aspectos de la producción de software', // índice 0 = correcta
      'La disciplina que estudia únicamente la teoría de la computación',
      'La actividad de escribir código sin planeación previa',
      'El diseño de hardware para sistemas basados en computadoras',
    ],
    answer: 0,
    explanation:
      'Abarca desde la especificación inicial hasta el mantenimiento del sistema después de ponerlo en operación.',
  },
  {
    id: 'ev1.2-bank-q04',
    type: 'mcq',
    prompt: '¿Cuáles son las cuatro actividades fundamentales comunes a todos los procesos de software?',
    options: [
      'Compra, instalación, venta y soporte',
      'Diseño gráfico, programación, publicidad y cobro',
      'Planeación, contratación, despliegue y auditoría',
      'Especificación, desarrollo, validación y evolución', // índice 3 = correcta
    ],
    answer: 3,
    explanation:
      'Todo proceso de software incluye especificar, desarrollar, validar y evolucionar el software.',
  },
  {
    id: 'ev1.2-bank-q05',
    type: 'mcq',
    prompt: '¿Cuál es la diferencia entre ciencias de la computación e ingeniería de software?',
    options: [
      'No existe ninguna diferencia, son términos equivalentes',
      'Las ciencias de la computación se enfocan en teoría y fundamentos; la ingeniería de software, en el sentido práctico del desarrollo y la distribución', // índice 1 = correcta
      'La ingeniería de software se ocupa solo de teoría y las ciencias de la computación solo de práctica',
      'Las ciencias de la computación estudian únicamente hardware',
    ],
    answer: 1,
    explanation:
      'Las ciencias de la computación se interesan por teorías y métodos; la ingeniería de software por los asuntos prácticos de producir software.',
  },
  {
    id: 'ev1.2-bank-q06',
    type: 'mcq',
    prompt: '¿Qué distingue a la ingeniería de sistemas de la ingeniería de software?',
    options: [
      'La ingeniería de sistemas solo se ocupa de redes de datos',
      'La ingeniería de sistemas es parte de la ingeniería de software',
      'La ingeniería de sistemas abarca todo el sistema basado en computadoras (hardware, software y procesos) y la ingeniería de software es parte de ella', // índice 2 = correcta
      'Ambas se ocupan exclusivamente de programar',
    ],
    answer: 2,
    explanation:
      'La ingeniería de sistemas se interesa por hardware, software e ingeniería de procesos; la ingeniería de software es parte de ese proceso más general.',
  },
  {
    id: 'ev1.2-bank-q07',
    type: 'mcq',
    prompt: '¿Cuáles son los principales retos que enfrenta la ingeniería de software?',
    options: [
      'Diversidad creciente, demandas por tiempos de distribución limitados y desarrollo de software confiable', // índice 0 = correcta
      'Escasez de lenguajes de programación y ausencia de usuarios',
      'Exceso de tiempo disponible y presupuestos ilimitados',
      'Eliminar la documentación y reducir las pruebas',
    ],
    answer: 0,
    explanation:
      'Heterogeneidad, cambio empresarial y social, y seguridad y confianza son retos generales que afectan a muchos tipos de software.',
  },
  {
    id: 'ev1.2-bank-q08',
    type: 'mcq',
    prompt: '¿Cómo se distribuyen aproximadamente los costos del software elaborado de forma genérica?',
    options: [
      '90% en pruebas y 10% en desarrollo',
      '50% en documentación y 50% en ventas',
      'Aproximadamente 60% en desarrollo y 40% en pruebas', // índice 2 = correcta
      '100% en desarrollo, las pruebas no tienen costo',
    ],
    answer: 2,
    explanation:
      'Alrededor del 60% de los costos es de desarrollo y 40% de prueba.',
  },
  {
    id: 'ev1.2-bank-q09',
    type: 'mcq',
    prompt: 'En el software elaborado específicamente para un cliente, ¿qué ocurre con frecuencia con los costos?',
    options: [
      'Los costos de evolución son siempre nulos',
      'Los costos de evolución superan con frecuencia los costos de desarrollo', // índice 1 = correcta
      'Los costos de prueba son mayores que los de desarrollo en todos los casos',
      'Los costos se mantienen constantes después de la entrega',
    ],
    answer: 1,
    explanation:
      'Para muchos sistemas, la mayor parte del costo se genera al cambiar el software después de ponerlo en operación.',
  },
  {
    id: 'ev1.2-bank-q10',
    type: 'mcq',
    prompt: '¿Existe un método o técnica de ingeniería de software mejor que todos los demás?',
    options: [
      'Sí, la cascada es la mejor para todos los sistemas',
      'Sí, el desarrollo sin documentación es siempre el mejor',
      'Sí, siempre se debe usar prototipado',
      'No, la técnica adecuada depende del tipo de sistema', // índice 3 = correcta
    ],
    answer: 3,
    explanation:
      'Los juegos se diseñan con prototipos, mientras que los sistemas críticos de seguridad requieren una especificación completa y analizable. No puede decirse que un método sea mejor que otro.',
  },
  {
    id: 'ev1.2-bank-q11',
    type: 'mcq',
    prompt: '¿Qué aportó la Web a la ingeniería de software?',
    options: [
      'Disponibilidad de servicios de software y posibilidad de desarrollar sistemas basados en servicios distribuidos', // índice 0 = correcta
      'La desaparición de la necesidad de reutilizar software',
      'El fin de los sistemas legados',
      'La eliminación de las interfaces de usuario',
    ],
    answer: 0,
    explanation:
      'El desarrollo de sistemas basados en Web condujo a avances en lenguajes de programación y reutilización de software.',
  },
  {
    id: 'ev1.2-bank-q12',
    type: 'mcq',
    prompt: '¿Por qué los sistemas de software pueden volverse rápidamente complejos y costosos de cambiar?',
    options: [
      'Porque están hechos de materiales frágiles',
      'Porque son abstractos e intangibles y no tienen restricciones físicas que limiten su crecimiento', // índice 1 = correcta
      'Porque siempre se desarrollan por una sola persona',
      'Porque no necesitan requerimientos',
    ],
    answer: 1,
    explanation:
      'Al no estar restringido por leyes físicas ni procesos de fabricación, el software no tiene límites naturales de potencial, pero sí puede crecer en complejidad.',
  },
  {
    id: 'ev1.2-bank-q13',
    type: 'mcq',
    prompt: 'Muchas de las llamadas "fallas del software" se deben principalmente a dos factores. ¿Cuáles son?',
    options: [
      'Exceso de pruebas y exceso de documentación',
      'Falta de hardware y falta de energía eléctrica',
      'Demandas crecientes y expectativas bajas', // índice 2 = correcta
      'Demasiados usuarios y demasiados desarrolladores',
    ],
    answer: 2,
    explanation:
      'Los sistemas deben ser más grandes, complejos y rápidos de entregar (demandas crecientes), y muchas compañías no usan métodos de ingeniería de software (expectativas bajas).',
  },
  {
    id: 'ev1.2-bank-q14',
    type: 'mcq',
    prompt: '¿A qué se refiere el factor "expectativas bajas" en las fallas del software?',
    options: [
      'A que es sencillo escribir programas sin usar métodos de ingeniería de software, lo que genera software más costoso y menos confiable', // índice 0 = correcta
      'A que los clientes no desean usar el software',
      'A que los sistemas siempre son pequeños',
      'A que el software no necesita mantenimiento',
    ],
    answer: 0,
    explanation:
      'Muchas empresas se deslizan hacia la ingeniería de software conforme evolucionan, por lo que se requiere mejor educación y capacitación.',
  },
  {
    id: 'ev1.2-bank-q15',
    type: 'mcq',
    prompt: '¿Qué son los productos de software genéricos?',
    options: [
      'Sistemas desarrollados exclusivamente para un cliente específico',
      'Sistemas que solo se usan dentro de una empresa',
      'Programas que no requieren especificación',
      'Sistemas independientes producidos por una organización y vendidos en el mercado abierto a cualquier cliente', // índice 3 = correcta
    ],
    answer: 3,
    explanation:
      'Ejemplos: software para PC, bases de datos, procesadores de texto, paquetes de dibujo y herramientas de administración de proyectos.',
  },
  {
    id: 'ev1.2-bank-q16',
    type: 'mcq',
    prompt: '¿Qué son los productos de software personalizados (a la medida)?',
    options: [
      'Software que se vende a cualquier persona en tiendas',
      'Sistemas destinados a un cliente en particular, desarrollados por un contratista para ese cliente', // índice 1 = correcta
      'Programas que no pueden modificarse',
      'Software libre sin documentación',
    ],
    answer: 1,
    explanation:
      'Ejemplos: sistemas de control para dispositivos electrónicos, sistemas para procesos empresariales y sistemas de control de tráfico aéreo.',
  },
  {
    id: 'ev1.2-bank-q17',
    type: 'mcq',
    prompt: '¿Quién controla la especificación en un producto de software genérico?',
    options: [
      'La organización que desarrolla el software', // índice 0 = correcta
      'La organización que compra el software',
      'Cada usuario final de forma individual',
      'Un organismo gubernamental',
    ],
    answer: 0,
    explanation:
      'En los productos personalizados, en cambio, la organización que compra el software suele definir y controlar la especificación.',
  },
  {
    id: 'ev1.2-bank-q18',
    type: 'mcq',
    prompt: '¿Por qué los sistemas ERP, como SAP, ilustran que la distinción entre producto genérico y personalizado es cada vez más difusa?',
    options: [
      'Porque se desarrollan desde cero para cada cliente',
      'Porque no se pueden adaptar a las necesidades del cliente',
      'Porque un sistema genérico grande y complejo se adapta a una compañía incorporando sus reglas, procesos y reportes', // índice 2 = correcta
      'Porque son sistemas embebidos',
    ],
    answer: 2,
    explanation:
      'Cada vez más sistemas se construyen con un producto genérico como base que luego se adapta a los requerimientos de un cliente.',
  },
  {
    id: 'ev1.2-bank-q19',
    type: 'mcq',
    prompt: '¿Por qué el mantenimiento es un atributo crítico del buen software?',
    options: [
      'Porque el software nunca cambia',
      'Porque el cambio del software es un requerimiento inevitable de un entorno empresarial variable', // índice 1 = correcta
      'Porque reduce la necesidad de usuarios',
      'Porque elimina la necesidad de pruebas',
    ],
    answer: 1,
    explanation:
      'El software debe escribirse de forma que pueda evolucionar para satisfacer las necesidades cambiantes de los clientes.',
  },
  {
    id: 'ev1.2-bank-q20',
    type: 'mcq',
    prompt: '¿Qué abarca el atributo "confiabilidad y seguridad" del software?',
    options: [
      'Solo la velocidad de respuesta',
      'Únicamente la apariencia de la interfaz',
      'El número de líneas de código',
      'Fiabilidad, seguridad y protección: no causar daño físico ni económico en caso de falla y evitar el acceso de usuarios malintencionados', // índice 3 = correcta
    ],
    answer: 3,
    explanation:
      'Los usuarios malintencionados no deben tener posibilidad de acceder al sistema o dañarlo.',
  },
  {
    id: 'ev1.2-bank-q21',
    type: 'mcq',
    prompt: '¿Qué significa que el software sea eficiente?',
    options: [
      'Que no desperdicie los recursos del sistema, como la memoria y los ciclos del procesador', // índice 0 = correcta
      'Que tenga la mayor cantidad posible de funciones',
      'Que sea fácil de vender',
      'Que se escriba en un solo lenguaje',
    ],
    answer: 0,
    explanation:
      'La eficiencia incluye capacidad de respuesta, tiempo de procesamiento y utilización de memoria.',
  },
  {
    id: 'ev1.2-bank-q22',
    type: 'mcq',
    prompt: '¿Qué implica el atributo de aceptabilidad del software?',
    options: [
      'Que el software sea gratuito',
      'Que el software sea difícil de copiar',
      'Que sea comprensible, utilizable y compatible con otros sistemas que usan los usuarios para quienes se diseña', // índice 2 = correcta
      'Que el software no requiera usuarios',
    ],
    answer: 2,
    explanation:
      'El software debe ser aceptable para el tipo de usuarios a quienes está dirigido.',
  },
  {
    id: 'ev1.2-bank-q23',
    type: 'mcq',
    prompt: 'Además de los programas, ¿qué incluye normalmente un sistema de software profesional?',
    options: [
      'Nada más que un archivo ejecutable',
      'Archivos de configuración, documentación del sistema, manuales de usuario y sitios web de información', // índice 1 = correcta
      'Solo el código fuente',
      'Únicamente los datos de los usuarios',
    ],
    answer: 1,
    explanation:
      'Un sistema profesional es más que un solo programa: consta de programas, archivos de configuración y documentación asociada.',
  },
  {
    id: 'ev1.2-bank-q24',
    type: 'mcq',
    prompt: '¿Cuál es una diferencia clave entre el desarrollo profesional y el de aficionado?',
    options: [
      'El software profesional nunca se modifica',
      'El software de aficionado siempre es más seguro',
      'No existe ninguna diferencia',
      'El software profesional lo usan otros y lo modifican otros ingenieros, por lo que requiere documentación adicional junto con el código', // índice 3 = correcta
    ],
    answer: 3,
    explanation:
      'En un programa personal nadie más lo usará, por lo que no hay que elaborar guías ni documentar el diseño.',
  },
  {
    id: 'ev1.2-bank-q25',
    type: 'mcq',
    prompt: 'En la actividad de validación del software, ¿qué se hace?',
    options: [
      'Se verifica el software para asegurar que sea lo que el cliente requiere', // índice 0 = correcta
      'Se definen por primera vez las restricciones del sistema',
      'Se programa el sistema',
      'Se modifica el software para nuevos requerimientos del mercado',
    ],
    answer: 0,
    explanation:
      'La validación comprueba que el software cumple lo que el cliente necesita.',
  },
  {
    id: 'ev1.2-bank-q26',
    type: 'mcq',
    prompt: 'En la actividad de evolución del software, ¿qué ocurre?',
    options: [
      'Los clientes e ingenieros definen el software por producir',
      'Se diseña la arquitectura inicial del sistema',
      'Se modifica el software para reflejar los requerimientos cambiantes del cliente y del mercado', // índice 2 = correcta
      'Se verifica que el sistema funcione sin errores',
    ],
    answer: 2,
    explanation:
      'El software debe cambiar a lo largo de su vida para seguir siendo útil.',
  },
  {
    id: 'ev1.2-bank-q27',
    type: 'mcq',
    prompt: '¿Qué factor es quizás el más significativo para determinar qué métodos y técnicas de ingeniería de software son más importantes?',
    options: [
      'El color de la interfaz',
      'El tipo de aplicación que se está desarrollando', // índice 1 = correcta
      'El tamaño del equipo de ventas',
      'La marca de la computadora',
    ],
    answer: 1,
    explanation:
      'Existen muchos tipos de aplicación (independientes, transaccionales, embebidas, por lotes, entretenimiento, etc.) y cada una requiere técnicas distintas.',
  },
  {
    id: 'ev1.2-bank-q28',
    type: 'mcq',
    prompt: '¿Cuál es un ejemplo de sistema de control embebido?',
    options: [
      'Un procesador de texto',
      'Un sistema de comercio electrónico',
      'Un programa de facturación mensual',
      'El software que controla los frenos antibloqueo de un automóvil', // índice 3 = correcta
    ],
    answer: 3,
    explanation:
      'Los sistemas embebidos regulan y gestionan dispositivos de hardware; también incluyen el software de un celular o de un horno de microondas.',
  },
  {
    id: 'ev1.2-bank-q29',
    type: 'mcq',
    prompt: '¿Cuál es un ejemplo de sistema de procesamiento en lotes (batch)?',
    options: [
      'Un sistema de facturación telefónica o de pago de salarios', // índice 0 = correcta
      'Un videojuego en línea',
      'Un navegador web',
      'El software de un horno de microondas',
    ],
    answer: 0,
    explanation:
      'Los sistemas batch procesan grandes cantidades de entradas individuales para crear salidas correspondientes.',
  },
  {
    id: 'ev1.2-bank-q30',
    type: 'mcq',
    prompt: '¿Cuándo y en qué contexto se propuso originalmente el concepto de "ingeniería de software"?',
    options: [
      'En 1995, durante el auge de Internet',
      'En 1980, con la aparición de los lenguajes orientados a objetos',
      'En 1968, en una conferencia sobre la llamada "crisis del software"', // índice 2 = correcta
      'En 2010, con los métodos ágiles',
    ],
    answer: 2,
    explanation:
      'Se hizo claro que los enfoques individuales no escalaban a sistemas grandes y complejos, que eran poco confiables, costaban más de lo esperado y se entregaban con demora.',
  },
  {
    id: 'ev1.2-bank-q31',
    type: 'mcq',
    prompt: '¿Cuál NO es un fundamento de la ingeniería de software aplicable a todos los tipos de sistemas?',
    options: [
      'Usar un proceso de desarrollo administrado y comprendido',
      'Garantizar confiabilidad y desempeño',
      'Utilizar un único lenguaje de programación para todos los sistemas', // índice 2 = correcta
      'Reutilizar software ya desarrollado cuando sea adecuado',
    ],
    answer: 2,
    explanation:
      'Los fundamentos son proceso, confiabilidad, requerimientos y reutilización; no cubren técnicas específicas de programación, que varían de un sistema a otro.',
  },
  {
    id: 'ev1.2-bank-q32',
    type: 'mcq',
    prompt: '¿En qué consiste el reto de la heterogeneidad en la ingeniería de software?',
    options: [
      'En construir software confiable y flexible que opere como sistema distribuido sobre diferentes tipos de computadoras, dispositivos móviles y sistemas legados', // índice 0 = correcta
      'En desarrollar software que solo funcione en un tipo de computadora',
      'En evitar integrar sistemas nuevos con sistemas viejos',
      'En reducir el número de lenguajes de programación a uno',
    ],
    answer: 0,
    explanation:
      'Con frecuencia es necesario integrar software nuevo con sistemas legados escritos en diferentes lenguajes.',
  },
  {
    id: 'ev1.2-bank-q33',
    type: 'mcq',
    prompt: '¿Qué enfoque se ha vuelto dominante para construir sistemas basados en la Web?',
    options: [
      'Desarrollar todo desde cero para cada proyecto',
      'Especificar por adelantado todos los requerimientos',
      'Evitar el uso de navegadores',
      'La reutilización de software: ensamblar a partir de componentes y sistemas preexistentes', // índice 3 = correcta
    ],
    answer: 3,
    explanation:
      'Además, los sistemas web se desarrollan y entregan de manera progresiva, y sus interfaces están restringidas por las capacidades de los navegadores.',
  }
];
