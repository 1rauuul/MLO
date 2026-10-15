import type { ExerciseSeed } from './types';

export const exercisesL1_2: ExerciseSeed[] = [
{
    id: 'ordn',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Ordena la evolución de la Web y el software',
    instructions: 'Usa las flechas para ordenar las etapas de la más antigua a la más reciente.',
    correctOrder: [
      'La Web como almacén de información universal accesible',
      'Los navegadores agregan cada vez más funcionalidades',
      'Surgen los servicios Web',
      'Se desarrolla la noción de software como servicio',
    ],
    config: {},
    explanation:
      'Primero la Web fue un almacén de información; alrededor del año 2000 los navegadores ganaron funcionalidad, luego surgieron los servicios Web y después el software como servicio en la nube.',
    example: {
      title: 'La evolución de la Web paso a paso',
      steps: [
        { text: 'Ubicar el inicio: la Web como almacén de información', why: 'Al principio tuvo escaso efecto sobre los sistemas de software.' },
        { text: 'Seguir con navegadores más funcionales', why: 'Alrededor del año 2000 permitieron sistemas basados en la Web.' },
        { text: 'Colocar servicios Web y luego software como servicio', why: 'La nube es la etapa más reciente descrita en el texto.' },
      ],
      hints: ['Piensa de lo más simple (información) a lo más complejo (nube).'],
    },
  },
{
    id: 'ordp',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Ordena la historia de la ingeniería de software',
    instructions: 'Usa las flechas para ordenar los hechos cronológicamente.',
    correctOrder: [
      'Se propone el concepto en una conferencia de 1968 sobre la crisis del software',
      'En las décadas de 1970 y 1980 surgen la programación estructurada y el desarrollo orientado a objetos',
      'Herramientas y notaciones estándar se perfeccionan y se usan de manera extensa',
    ],
    config: {},
    explanation:
      'El término nació en 1968 ante la crisis del software; después se desarrollaron nuevas técnicas y finalmente se estandarizaron herramientas y notaciones.',
    example: {
      title: 'Línea del tiempo de la disciplina',
      steps: [
        { text: 'Empezar por 1968', why: 'Es el año en que se propuso el concepto.' },
        { text: 'Seguir con las décadas de 1970 y 1980', why: 'En ellas surgieron nuevas técnicas y métodos.' },
        { text: 'Terminar con la estandarización', why: 'Las herramientas y notaciones se usan hoy de manera extensa.' },
      ],
      hints: ['Fíjate en las fechas: 1968, luego 1970-1980.'],
    },
  },
{
    id: 'ordq',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Ordena el trabajo de los ingenieros de sistemas',
    instructions: 'Usa las flechas para ordenar las acciones.',
    correctOrder: [
      'Intervienen en la especificación del sistema',
      'Definen su arquitectura global',
      'Integran las diferentes partes',
      'Obtienen el sistema terminado',
    ],
    config: {},
    explanation:
      'Los ingenieros de sistemas especifican el sistema, definen su arquitectura global y luego integran las partes para crear el sistema terminado.',
    example: {
      title: 'El trabajo del ingeniero de sistemas',
      steps: [
        { text: 'Comenzar por la especificación del sistema', why: 'Es donde intervienen primero.' },
        { text: 'Definir la arquitectura global', why: 'Se decide la estructura antes de unir piezas.' },
        { text: 'Integrar las partes y obtener el sistema terminado', why: 'La integración produce el resultado final.' },
      ],
      hints: ['Primero se define el todo, después se unen las partes.'],
    },
  },
{
    id: 'ordr',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Ordena los temas de la parte 1 del libro',
    instructions: 'Usa las flechas para ordenar los temas según el capítulo en que aparecen.',
    correctOrder: [
      'Ingeniería de requerimientos',
      'Modelado de sistemas con UML',
      'Diseño arquitectónico',
      'Diseño orientado a objetos',
      'Pruebas del software',
      'Evolución del software',
    ],
    config: {},
    explanation:
      'Los capítulos 4 a 9 tratan requerimientos, modelado UML, diseño arquitectónico, diseño orientado a objetos, pruebas y evolución.',
    example: {
      title: 'Recorrido por los capítulos 4 a 9',
      steps: [
        { text: 'Empezar por requerimientos', why: 'Primero se define qué debe hacer el sistema.' },
        { text: 'Seguir con modelado y diseño', why: 'UML, arquitectura y diseño orientado a objetos dan forma al sistema.' },
        { text: 'Terminar con pruebas y evolución', why: 'Se comprueba el software y luego se mantiene.' },
      ],
      hints: ['El orden de los capítulos sigue las actividades del proceso de software.'],
    },
  },
{
    id: 'ords',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Ordena el flujo de una solicitud de gastos de viaje',
    instructions: 'Usa las flechas para ordenar los pasos del ejemplo.',
    correctOrder: [
      'La solicitud se envía mediante una aplicación Web',
      'Se procesa en una aplicación batch',
      'Se realiza el pago mensual',
    ],
    config: {},
    explanation:
      'El ejemplo muestra que los sistemas por lotes se combinan con sistemas basados en la Web: la Web recibe la solicitud y el proceso batch paga mensualmente.',
    example: {
      title: 'Web y lotes trabajando juntos',
      steps: [
        { text: 'Identificar la entrada: la aplicación Web', why: 'La solicitud se envía por la Web.' },
        { text: 'Ubicar el procesamiento batch', why: 'Las solicitudes se procesan por lotes.' },
        { text: 'Cerrar con el pago mensual', why: 'Es el resultado del proceso batch.' },
      ],
      hints: ['Primero se recibe la solicitud, luego se procesa y al final se paga.'],
    },
  },
{
    id: 'ordt',
    lessonId: 'l1.2',
    type: 'order',
    prompt: 'Ordena el alcance de la ingeniería de software',
    instructions: 'Usa las flechas para ordenar las etapas, de la primera a la última.',
    correctOrder: [
      'Primeras etapas de la especificación del sistema',
      'Puesta en operación del sistema',
      'Mantenimiento del sistema',
    ],
    config: {},
    explanation:
      'La ingeniería de software abarca desde la especificación inicial hasta el mantenimiento del sistema después de ponerlo en operación.',
    example: {
      title: 'Alcance de la ingeniería de software',
      steps: [
        { text: 'Iniciar en la especificación del sistema', why: 'La definición dice que abarca desde las primeras etapas.' },
        { text: 'Pasar por la puesta en operación', why: 'Marca el momento en que el sistema empieza a usarse.' },
        { text: 'Terminar en el mantenimiento', why: 'Continúa después de que el sistema opera.' },
      ],
      hints: ['La definición dice "desde... hasta el mantenimiento".'],
    },
  },
{
    id: 'filln',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: naturaleza del software y sus fallas',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'Los sistemas de software son abstractos e {{intangibles}}.',
        'Muchas fallas del software se deben a demandas {{crecientes}} y expectativas {{bajas}}.',
      ],
      bank: ['tangibles', 'altas', 'físicos'],
    },
    explanation:
      'Al no tener restricciones físicas, el software puede volverse complejo; las fallas se explican por demandas crecientes y expectativas bajas.',
    example: {
      title: 'Naturaleza del software y sus fallas',
      steps: [
        { text: 'Pensar en lo que no tiene el software', why: 'No está restringido por materiales ni leyes físicas.' },
        { text: 'Recordar los dos factores de las fallas', why: 'El autor menciona demandas y expectativas.' },
      ],
      hints: ['Lo opuesto a "tangible" describe al software.'],
    },
  },
{
    id: 'fillo',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: origen de la ingeniería de software',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'El concepto se propuso en {{1968}} en una conferencia.',
        'Esa conferencia discutió la llamada {{crisis}} del software.',
      ],
      bank: ['1980', '2000', 'revolución'],
    },
    explanation:
      'La ingeniería de software surge en 1968, cuando los enfoques individuales no escalaban a sistemas grandes y complejos.',
    example: {
      title: 'El origen de la disciplina',
      steps: [
        { text: 'Buscar el año de la conferencia', why: 'El concepto se propuso en esa reunión.' },
        { text: 'Identificar el problema que se discutía', why: 'Los sistemas no eran confiables y costaban más de lo esperado.' },
      ],
      hints: ['Es un año de la década de 1960.'],
    },
  },
{
    id: 'fillp',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: costos del software',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'Aproximadamente 60% de los costos del software son de {{desarrollo}}.',
        'El 40% restante corresponde a {{prueba}}.',
        'En software elaborado específicamente, los costos de {{evolución}} suelen superar a los de desarrollo.',
      ],
      bank: ['diseño', 'publicidad', 'hardware'],
    },
    explanation:
      'La mayor parte del costo está en desarrollo y prueba; en software a la medida la evolución suele costar más que el desarrollo.',
    example: {
      title: 'Cómo se reparten los costos',
      steps: [
        { text: 'Asignar el 60% y el 40%', why: 'Son las dos actividades con más costo según la figura 1.1.' },
        { text: 'Completar el caso del software a la medida', why: 'Su costo después de la entrega puede ser mayor que el de desarrollo.' },
      ],
      hints: ['Lo que ocurre tras la entrega se llama evolución.'],
    },
  },
{
    id: 'fillq',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: la ingeniería en la práctica',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'La ingeniería busca resultados de calidad dentro de la fecha y del {{presupuesto}}.',
        'Los ingenieros no deben ser {{perfeccionistas}}.',
        'Los ingenieros de software adoptan un enfoque {{sistemático}} y organizado.',
      ],
      bank: ['improvisado', 'individualistas', 'inventario'],
    },
    explanation:
      'La ingeniería implica compromisos: lograr la calidad requerida con tiempo y dinero limitados, usando un enfoque sistemático.',
    example: {
      title: 'La ingeniería con limitaciones reales',
      steps: [
        { text: 'Identificar las restricciones del proyecto', why: 'Se trabaja con fecha y dinero limitados.' },
        { text: 'Elegir la actitud adecuada del ingeniero', why: 'Debe aceptar compromisos y trabajar de forma organizada.' },
      ],
      hints: ['Si hay compromisos, no se puede buscar la perfección.'],
    },
  },
{
    id: 'fillr',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: proceso de software',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'Un proceso de software es una {{secuencia}} de actividades que conducen a un producto de software.',
        'El software en tiempo real de una {{aeronave}} debe especificarse por completo antes del desarrollo.',
        'En el comercio {{electrónico}}, la especificación y el programa se desarrollan en conjunto.',
      ],
      bank: ['colección', 'impresora', 'tradicional'],
    },
    explanation:
      'Distintos tipos de sistemas necesitan distintos procesos: algunos exigen especificación completa previa y otros la desarrollan junto con el programa.',
    example: {
      title: 'Procesos según el tipo de sistema',
      steps: [
        { text: 'Definir proceso de software', why: 'Es un conjunto ordenado de actividades.' },
        { text: 'Asociar cada ejemplo con su tipo de proceso', why: 'El software crítico se especifica antes; el comercio electrónico evoluciona junto con el programa.' },
      ],
      hints: ['Piensa en un sistema donde un error en vuelo es grave.'],
    },
  },
{
    id: 'fills',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: tipos de aplicación',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'Numéricamente, quizás existen más sistemas {{embebidos}} que cualquier otro tipo.',
        'En los sistemas de {{entretenimiento}}, la calidad de interacción es la característica más importante.',
        'Los sistemas de adquisición de datos recopilan datos usando {{sensores}}.',
      ],
      bank: ['monolíticos', 'navegadores', 'servidores'],
    },
    explanation:
      'Cada tipo de aplicación tiene rasgos propios que determinan qué técnicas de ingeniería son más adecuadas.',
    example: {
      title: 'Rasgos de cada tipo de aplicación',
      steps: [
        { text: 'Identificar el tipo de sistema más numeroso', why: 'Están en teléfonos, automóviles y microondas.' },
        { text: 'Relacionar cada característica con su tipo', why: 'Juegos e interacción; datos del entorno y sensores.' },
      ],
      hints: ['Los juegos pertenecen a los sistemas de entretenimiento.'],
    },
  },
{
    id: 'fillt',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: sistemas embebidos en automóviles',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'El sistema de control embebido de un automóvil se quema en la {{ROM}}.',
        'Por eso es muy {{costoso}} cambiarlo.',
        'Necesita verificación y {{validación}} muy exhaustivas.',
      ],
      bank: ['RAM', 'barato', 'publicidad'],
    },
    explanation:
      'Como cambiarlo es caro y es crítico para la seguridad, este software requiere verificación y validación exhaustivas.',
    example: {
      title: 'Software crítico en un automóvil',
      steps: [
        { text: 'Ubicar dónde se instala el software', why: 'Se graba en una memoria que no se cambia fácilmente.' },
        { text: 'Deducir la consecuencia', why: 'Si cambiarlo es difícil, hay que verificarlo a fondo.' },
      ],
      hints: ['La memoria de solo lectura no es la RAM.'],
    },
  },
{
    id: 'fillu',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: software y la nube',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'Los servicios Web son {{componentes}} de software que entregan funcionalidad específica.',
        'Una nube de computación es un enorme número de sistemas de cómputo {{vinculados}}.',
        'Antes de la Web, las aplicaciones empresariales eran básicamente {{monolíticas}}.',
      ],
      bank: ['aislados', 'manuales', 'distribuidas'],
    },
    explanation:
      'La Web llevó de aplicaciones monolíticas a software distribuido basado en servicios y en la nube.',
    example: {
      title: 'De lo monolítico a la nube',
      steps: [
        { text: 'Definir servicio Web', why: 'Es una pieza de software accesible desde la Web.' },
        { text: 'Describir la nube y la situación anterior', why: 'Antes todo corría en computadoras individuales.' },
      ],
      hints: ['Una nube son muchos sistemas unidos que comparten usuarios.'],
    },
  },
{
    id: 'fillv',
    lessonId: 'l1.2',
    type: 'fill',
    prompt: 'Completa: interfaces en sistemas Web',
    instructions: 'Toca un espacio y después una palabra del banco.',
    correctOrder: [],
    config: {
      sentences: [
        'Las interfaces de usuario están restringidas por las capacidades de los {{navegadores}} Web.',
        'Tecnologías como {{AJAX}} permiten crear valiosas interfaces dentro de un navegador.',
        'Los sistemas basados en la Web deben entregarse de manera {{progresiva}}.',
      ],
      bank: ['servidores', 'UML', 'única'],
    },
    explanation:
      'No es práctico especificar todo por adelantado en sistemas Web, y sus interfaces dependen de lo que permiten los navegadores.',
    example: {
      title: 'Límites y forma de entrega en la Web',
      steps: [
        { text: 'Identificar qué limita la interfaz', why: 'La interfaz corre dentro de un programa del usuario.' },
        { text: 'Recordar cómo se entregan los sistemas Web', why: 'No se especifica todo por adelantado.' },
      ],
      hints: ['AJAX es la tecnología citada en el texto.'],
    },
  },
{
    id: 'matchp',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada tipo de aplicación con su ejemplo',
    instructions: 'Toca un elemento y después su ejemplo.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Aplicación independiente', right: 'Programa CAD en una PC' },
        { left: 'Aplicación interactiva basada en transacción', right: 'Comercio electrónico en la Web' },
        { left: 'Sistema de control embebido', right: 'Frenos antibloqueo de un automóvil' },
        { left: 'Sistema de procesamiento en lotes', right: 'Sistema de pago de salario' },
      ],
    },
    explanation: 'Cada tipo de aplicación se reconoce por dónde se ejecuta y qué tarea realiza.',
    example: {
      title: 'Aplicaciones y sus ejemplos',
      steps: [
        { text: 'Identificar dónde se ejecuta cada aplicación', why: 'PC local, computadora remota o dispositivo.' },
        { text: 'Asociar el ejemplo que encaja', why: 'Los ejemplos vienen de la sección 1.1.2.' },
      ],
      hints: ['La facturación y el pago de salarios se procesan en lotes.'],
    },
  },
{
    id: 'matchq',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada tipo de sistema con su descripción',
    instructions: 'Toca un elemento y después su descripción.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Sistema de entretenimiento', right: 'Uso personal, sobre todo juegos' },
        { left: 'Sistema de modelado y simulación', right: 'Modela procesos físicos con muchos objetos interactuantes' },
        { left: 'Sistema de adquisición de datos', right: 'Recopila datos del entorno mediante sensores' },
        { left: 'Sistema de sistemas', right: 'Compuesto por varios sistemas de software' },
      ],
    },
    explanation: 'Estos tipos completan la lista de aplicaciones descrita en la sección 1.1.2.',
    example: {
      title: 'Más tipos de sistemas',
      steps: [
        { text: 'Leer el propósito de cada sistema', why: 'Entretener, simular, recopilar o combinar.' },
        { text: 'Elegir la descripción coherente', why: 'Cada tipo tiene un rasgo distintivo.' },
      ],
      hints: ['Los sensores pertenecen a la adquisición de datos.'],
    },
  },
{
    id: 'matchr',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada reto general con su descripción',
    instructions: 'Toca un elemento y después su descripción.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Heterogeneidad', right: 'Operar en redes con distintas computadoras y dispositivos móviles' },
        { left: 'Cambio empresarial y social', right: 'Reducir el tiempo para que el software dé valor' },
        { left: 'Seguridad y confianza', right: 'Evitar que usuarios malintencionados ataquen el software' },
      ],
    },
    explanation: 'Estos tres problemas generales afectan a muy diversos tipos de software y no son independientes.',
    example: {
      title: 'Los tres retos generales',
      steps: [
        { text: 'Leer el nombre del reto', why: 'Cada nombre resume un problema.' },
        { text: 'Buscar el problema concreto', why: 'La descripción explica qué hay que resolver.' },
      ],
      hints: ['Heterogeneidad significa diversidad de equipos y dispositivos.'],
    },
  },
{
    id: 'matchs',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada pregunta con su respuesta',
    instructions: 'Toca una pregunta y después su respuesta.',
    correctOrder: [],
    config: {
      pairs: [
        { left: '¿Qué es software?', right: 'Programas de cómputo y documentación asociada' },
        { left: '¿Qué es ingeniería de software?', right: 'Disciplina interesada en todos los aspectos de la producción de software' },
        { left: '¿Principales retos?', right: 'Diversidad creciente, tiempos limitados y software confiable' },
        { left: '¿Mejor método?', right: 'No puede decirse que un método sea mejor que otro' },
      ],
    },
    explanation: 'La figura 1.1 reúne las preguntas planteadas con frecuencia sobre el software.',
    example: {
      title: 'Preguntas frecuentes sobre el software',
      steps: [
        { text: 'Leer la pregunta', why: 'Identifica qué concepto se pide.' },
        { text: 'Elegir la respuesta de la figura 1.1', why: 'Cada respuesta corresponde a una sola pregunta.' },
      ],
      hints: ['Sobre el mejor método, el texto dice que no hay uno universal.'],
    },
  },
{
    id: 'matcht',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada disciplina con su interés',
    instructions: 'Toca un elemento y después su descripción.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Ciencias de la computación', right: 'Teorías y métodos que subyacen en computadoras y software' },
        { left: 'Ingeniería de software', right: 'Asuntos prácticos de la producción del software' },
        { left: 'Ingeniería de sistemas', right: 'Hardware, políticas, procesos e implementación del sistema' },
      ],
    },
    explanation:
      'La ingeniería de software es práctica, se apoya en las ciencias de la computación y forma parte de la ingeniería de sistemas.',
    example: {
      title: 'Disciplinas relacionadas',
      steps: [
        { text: 'Distinguir teoría de práctica', why: 'Ciencias de la computación es teoría; ingeniería de software, práctica.' },
        { text: 'Ubicar la visión más amplia', why: 'La ingeniería de sistemas incluye hardware y procesos.' },
      ],
      hints: ['La ingeniería de software forma parte de la ingeniería de sistemas.'],
    },
  },
{
    id: 'matchu',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada factor de las fallas del software con su explicación',
    instructions: 'Toca un elemento y después su explicación.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Demandas crecientes', right: 'Se piden sistemas más grandes, complejos y rápidos de entregar' },
        { left: 'Expectativas bajas', right: 'Empresas que no usan métodos de ingeniería en su trabajo diario' },
        { left: 'Solución a expectativas bajas', right: 'Mejor educación y capacitación en ingeniería de software' },
      ],
    },
    explanation:
      'Según el autor, muchas fallas se deben a demandas que superan los métodos existentes y a no aplicar ingeniería de software.',
    example: {
      title: 'Por qué falla el software',
      steps: [
        { text: 'Separar los dos factores', why: 'Uno viene de lo que se exige y otro de cómo se trabaja.' },
        { text: 'Identificar la solución propuesta', why: 'El autor propone mejorar la formación.' },
      ],
      hints: ['Las expectativas bajas aparecen cuando no se usan métodos de ingeniería.'],
    },
  },
{
    id: 'matchv',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada cambio de la Web con su consecuencia',
    instructions: 'Toca un elemento y después su consecuencia.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Reutilización de software', right: 'Ensamblar sistemas con componentes preexistentes' },
        { left: 'Requerimientos', right: 'No es práctico especificarlos todos por adelantado' },
        { left: 'Interfaces de usuario', right: 'Restringidas por las capacidades de los navegadores' },
        { left: 'Software en servidor Web', right: 'Más barato cambiar y actualizar el software' },
      ],
    },
    explanation: 'La Web cambió la forma de construir software: más reutilización, entrega progresiva y software en servidores.',
    example: {
      title: 'Efectos de la Web en la ingeniería',
      steps: [
        { text: 'Leer el aspecto afectado', why: 'Reutilización, requerimientos, interfaces o despliegue.' },
        { text: 'Elegir el cambio que produjo la Web', why: 'Cada aspecto cambió de una forma concreta.' },
      ],
      hints: ['Instalar en un servidor evita instalar en cada PC.'],
    },
  },
{
    id: 'matchw',
    lessonId: 'l1.2',
    type: 'match',
    prompt: 'Enlaza cada fundamento con lo que implica',
    instructions: 'Toca un elemento y después su descripción.',
    correctOrder: [],
    config: {
      pairs: [
        { left: 'Proceso', right: 'Desarrollo administrado y comprendido' },
        { left: 'Confiabilidad y desempeño', right: 'Comportarse como se espera, sin fallas' },
        { left: 'Requerimientos', right: 'Comprender y gestionar lo que el software debe hacer' },
        { left: 'Reutilización', right: 'Usar el software ya desarrollado en vez de diseñar uno nuevo' },
      ],
    },
    explanation: 'Estos fundamentos se aplican a todos los tipos de sistemas de software.',
    example: {
      title: 'Fundamentos para todo tipo de sistema',
      steps: [
        { text: 'Leer el fundamento', why: 'Son proceso, confiabilidad, requerimientos y reutilización.' },
        { text: 'Buscar su significado práctico', why: 'Cada fundamento describe qué hacer.' },
      ],
      hints: ['Reutilizar es usar lo existente en lugar de crear algo nuevo.'],
    },
  },
{
    id: 'crossn',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama de actividades y atributos',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    config: {
      crossword: {
        rows: 11,
        cols: 16,
        entries: [
          {
            word: 'DESARROLLO',
            clue: 'Actividad donde se diseña y programa el software',
            row: 0,
            col: 0,
            direction: 'down',
          },
          {
            word: 'ESPECIFICACION',
            clue: 'Actividad donde se definen el software y sus restricciones',
            row: 1,
            col: 0,
            direction: 'across',
          },
          {
            word: 'EFICIENCIA',
            clue: 'Atributo de no desperdiciar recursos del sistema',
            row: 1,
            col: 3,
            direction: 'down',
          },
          {
            word: 'VALIDACION',
            clue: 'Actividad que verifica que el software sea lo que el cliente requiere',
            row: 0,
            col: 9,
            direction: 'down',
          },
          {
            word: 'EVOLUCION',
            clue: 'Actividad que modifica el software ante requerimientos cambiantes',
            row: 8,
            col: 7,
            direction: 'across',
          },
        ],
      },
      bank: ['MANTENIMIENTO', 'ACEPTABILIDAD', 'PRUEBA'],
    },
    explanation:
      'Las cuatro actividades fundamentales son especificación, desarrollo, validación y evolución; la eficiencia es un atributo del buen software.',
    example: {
      title: 'Crucigrama: actividades y atributos',
      steps: [
        { text: 'Resolver primero ESPECIFICACION', why: 'Es la palabra más larga y cruza con tres palabras.' },
        { text: 'Confirmar cada letra con el cruce', why: 'En una intersección ambas palabras deben coincidir.' },
      ],
      hints: ['DESARROLLO cruza ESPECIFICACION en la E (1,0); EVOLUCION cruza VALIDACION en la O (8,9).'],
    },
  },
{
    id: 'crosso',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama de productos y aplicaciones',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    config: {
      crossword: {
        rows: 14,
        cols: 14,
        entries: [
          {
            word: 'PERSONALIZADOS',
            clue: 'Productos destinados a un cliente en particular',
            row: 6,
            col: 0,
            direction: 'across',
          },
          {
            word: 'GENERICOS',
            clue: 'Productos que se venden en el mercado abierto',
            row: 5,
            col: 1,
            direction: 'down',
          },
          {
            word: 'EMBEBIDOS',
            clue: 'Sistemas de control que regulan dispositivos de hardware',
            row: 1,
            col: 8,
            direction: 'down',
          },
          {
            word: 'LOTES',
            clue: 'Los sistemas batch procesan datos en grandes...',
            row: 8,
            col: 7,
            direction: 'across',
          },
          {
            word: 'SIMULACION',
            clue: 'Sistemas de modelado y ... que usan científicos e ingenieros',
            row: 10,
            col: 0,
            direction: 'across',
          },
        ],
      },
      bank: ['INDEPENDIENTES', 'TRANSACCION', 'ADQUISICION'],
    },
    explanation:
      'Los productos pueden ser genéricos o personalizados, y las aplicaciones incluyen sistemas embebidos, por lotes y de simulación.',
    example: {
      title: 'Crucigrama: productos y aplicaciones',
      steps: [
        { text: 'Resolver primero PERSONALIZADOS', why: 'Su E y su I sirven de cruce para dos palabras.' },
        { text: 'Completar las palabras que cuelgan de ella', why: 'Cada cruce confirma una letra.' },
      ],
      hints: ['EMBEBIDOS cruza PERSONALIZADOS en la I (6,8).'],
    },
  },
{
    id: 'crossp',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama de retos y la Web',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    config: {
      crossword: {
        rows: 16,
        cols: 14,
        entries: [
          {
            word: 'HETEROGENEIDAD',
            clue: 'Reto de operar en redes con distintos tipos de computadoras',
            row: 3,
            col: 0,
            direction: 'across',
          },
          {
            word: 'SEGURIDAD',
            clue: 'Junto con la confianza, reto ante usuarios malintencionados',
            row: 2,
            col: 1,
            direction: 'down',
          },
          {
            word: 'REUTILIZACION',
            clue: 'Enfoque dominante para construir sistemas basados en la Web',
            row: 3,
            col: 4,
            direction: 'down',
          },
          {
            word: 'CONFIANZA',
            clue: 'Es esencial tenerla en el software porque está en todos los aspectos de la vida',
            row: 1,
            col: 8,
            direction: 'down',
          },
          {
            word: 'SERVICIOS',
            clue: 'Componentes Web que entregan funcionalidad específica y útil',
            row: 13,
            col: 0,
            direction: 'across',
          },
        ],
      },
      bank: ['LEGADOS', 'AJAX', 'MONOLITICAS'],
    },
    explanation:
      'Heterogeneidad, cambio, seguridad y confianza son retos generales; la Web impulsó la reutilización y los servicios Web.',
    example: {
      title: 'Crucigrama: retos y la Web',
      steps: [
        { text: 'Resolver primero HETEROGENEIDAD', why: 'Cruza con SEGURIDAD, REUTILIZACION y CONFIANZA.' },
        { text: 'Usar REUTILIZACION para encontrar SERVICIOS', why: 'Comparten la I en (13,4).' },
      ],
      hints: ['REUTILIZACION empieza en la R de HETEROGENEIDAD (3,4).'],
    },
  },
{
    id: 'crossq',
    lessonId: 'l1.2',
    type: 'crossword',
    prompt: 'Crucigrama de conceptos básicos',
    instructions: 'Toca una celda y escribe la palabra que corresponde a la pista.',
    correctOrder: [],
    config: {
      crossword: {
        rows: 9,
        cols: 13,
        entries: [
          {
            word: 'DOCUMENTACION',
            clue: 'Además de los programas, forma parte del software',
            row: 2,
            col: 0,
            direction: 'across',
          },
          {
            word: 'SOFTWARE',
            clue: 'Programas de cómputo y documentación asociada',
            row: 1,
            col: 1,
            direction: 'down',
          },
          {
            word: 'CRISIS',
            clue: 'Situación del software discutida en la conferencia de 1968',
            row: 2,
            col: 9,
            direction: 'down',
          },
          {
            word: 'PROCESO',
            clue: 'Secuencia de actividades que conducen a un producto de software',
            row: 0,
            col: 11,
            direction: 'down',
          },
          {
            word: 'PRUEBA',
            clue: 'Actividad que representa cerca del 40% de los costos',
            row: 7,
            col: 0,
            direction: 'across',
          },
        ],
      },
      bank: ['HARDWARE', 'PROGRAMA', 'DESARROLLO'],
    },
    explanation:
      'El software incluye documentación; la disciplina nació por la crisis del software y se organiza en procesos con costos de desarrollo y prueba.',
    example: {
      title: 'Crucigrama: conceptos básicos',
      steps: [
        { text: 'Resolver primero DOCUMENTACION', why: 'Cruza con SOFTWARE, CRISIS y PROCESO.' },
        { text: 'Encontrar PRUEBA desde SOFTWARE', why: 'Comparten la R en (7,1).' },
      ],
      hints: ['CRISIS empieza en la C de DOCUMENTACION (2,9).'],
    },
  }
];
