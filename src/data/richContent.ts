import type { ContentBlock } from '@/models/entities';

export const richContent: Record<string, ContentBlock[]> = {
  'l1.1': [
    {
      type: 'p',
      text: 'En la actualidad, el software ocupa un lugar central en la vida cotidiana. Los sistemas informáticos gestionan la infraestructura nacional, los servicios públicos y la mayoría de los dispositivos eléctricos mediante computadoras y software de control. Sectores como la producción, la distribución industrial y el sistema financiero están completamente informatizados. Asimismo, el sector del entretenimiento, que incluye la música, los videojuegos, el cine y la televisión, depende en gran medida del software.',
    },
    {
      type: 'p',
      text: 'Por lo tanto, la ingeniería de software resulta fundamental para el funcionamiento de las sociedades tanto a nivel nacional como internacional. Los sistemas de software son abstractos e intangibles, y no dependen de materiales, leyes físicas ni procesos de fabricación. Esta característica proporciona mayor flexibilidad a la ingeniería de software, ya que no existen límites naturales para su desarrollo. No obstante, la ausencia de restricciones físicas puede incrementar la complejidad de los sistemas, dificultar su comprensión y aumentar los costos de modificación.',
    },
    {
      type: 'p',
      text: 'Los sistemas de software abarcan desde simples sistemas embebidos hasta complejos sistemas de información a escala global. La búsqueda de notaciones, métodos o técnicas universales para la ingeniería de software es inapropiada, ya que cada tipo de software requiere enfoques específicos. Por ejemplo, el desarrollo de un sistema organizacional de información difiere considerablemente del desarrollo de un controlador para un instrumento científico. Además, ninguno de estos sistemas comparte muchas características con un videojuego de alto rendimiento gráfico. Aunque todas estas aplicaciones requieren ingeniería de software, no emplean las mismas técnicas.',
    },
    {
      type: 'p',
      text: 'Numerosos casos de proyectos de software fallidos y de "fallas de software" continúan reportándose. En consecuencia, la ingeniería de software suele considerarse insuficiente para satisfacer las demandas del desarrollo contemporáneo. No obstante, muchas de estas fallas pueden atribuirse principalmente a dos factores:',
    },
    {
      type: 'numbers',
      items: [
        'Demandas crecientes: El progreso en la ingeniería de software ha permitido construir sistemas más grandes y complejos, lo que genera demandas en constante evolución. Los sistemas requieren desarrollarse y desplegarse con mayor rapidez, ser más robustos e incorporar capacidades antes inalcanzables. Los métodos actuales resultan insuficientes para estos desafíos, por lo que es fundamental desarrollar nuevas técnicas que respondan a las demandas emergentes.',
        'Expectativas bajas: El desarrollo de software sin aplicar métodos formales de ingeniería de software resulta relativamente sencillo. Muchas empresas adoptan la ingeniería de software de manera gradual, pero no la integran en sus procesos cotidianos. Como consecuencia, el software producido suele ser más costoso y menos confiable de lo previsto. Para abordar este problema, es necesaria una mejora sustancial en la educación y capacitación en ingeniería de software.',
      ],
    },
    {
      type: 'p',
      text: 'Los logros alcanzados por la ingeniería de software son significativos. Aunque persisten desafíos en el desarrollo de software complejo, sin esta disciplina no habrían sido posibles la exploración espacial, el desarrollo de Internet ni las telecomunicaciones modernas. Asimismo, los medios de transporte resultarían considerablemente más peligrosos y costosos. La ingeniería de software ha realizado contribuciones sustanciales y se prevé que su impacto en el siglo XXI será aún mayor.',
    },
  ],
  'l1.2': [
    {
      type: 'p',
      text: 'El desarrollo de software profesional generalmente se realiza en equipo y requiere mantenimiento y modificaciones a lo largo de su ciclo de vida. La ingeniería de software tiene como objetivo respaldar este proceso mediante técnicas que facilitan la especificación, el diseño y la evolución de los sistemas. A continuación, se plantean preguntas destinadas a ofrecer una visión integral de la ingeniería de software:',
    },
    {
      type: 'table',
      header: ['Pregunta', 'Respuesta'],
      rows: [
        [
          '¿Qué es software?',
          'Programas de cómputo y documentación asociada. Los productos de software se desarrollan para un cliente en particular o para un mercado en general.',
        ],
        [
          '¿Cuáles son los atributos del buen software?',
          'El buen software debe entregar al usuario la funcionalidad y el desempeño requerido, y debe ser sustentable, confiable y utilizable.',
        ],
        [
          '¿Qué es ingeniería de software?',
          'La ingeniería de software es una disciplina de la ingeniería que se interesa por todos los aspectos de la producción de software.',
        ],
        [
          '¿Cuáles son las actividades fundamentales de la ingeniería de software?',
          'Especificación, desarrollo, validación y evolución del software.',
        ],
        [
          '¿Cuál es la diferencia entre ingeniería de software y ciencias de la computación?',
          'Las ciencias de la computación se enfocan en teoría y fundamentos; mientras la ingeniería de software se enfoca en el sentido práctico del desarrollo y en la distribución de software.',
        ],
        [
          '¿Cuál es la diferencia entre ingeniería de software e ingeniería de sistemas?',
          'La ingeniería de sistemas se interesa por todos los aspectos del desarrollo de sistemas basados en computadoras, incluidos hardware, software e ingeniería de procesos. La ingeniería de software es parte de este proceso más general.',
        ],
        [
          '¿Cuáles son los principales retos que enfrenta la ingeniería de software?',
          'Se enfrentan con una diversidad creciente, demandas por tiempos de distribución limitados y desarrollo de software confiable.',
        ],
        [
          '¿Cuáles son los costos de la ingeniería de software?',
          'Aproximadamente 60% de los costos del software son de desarrollo, y 40% de prueba. Para el software elaborado específicamente, los costos de evolución superan con frecuencia los costos de desarrollo.',
        ],
        [
          '¿Cuáles son los mejores métodos y técnicas de la ingeniería de software?',
          'Aun cuando todos los proyectos de software deben gestionarse y desarrollarse de manera profesional, existen diferentes técnicas que son adecuadas para distintos tipos de sistema. Por ejemplo, los juegos siempre deben diseñarse usando una serie de prototipos, mientras que los sistemas críticos de control de seguridad requieren de una especificación completa y analizable para su desarrollo. Por lo tanto, no puede decirse que un método sea mejor que otro.',
        ],
        [
          '¿Qué diferencias ha marcado la Web a la ingeniería de software?',
          'La Web ha llevado a la disponibilidad de servicios de software y a la posibilidad de desarrollar sistemas basados en servicios distribuidos ampliamente. El desarrollo de sistemas basados en Web ha conducido a importantes avances en lenguajes de programación y reutilización de software.',
        ],
      ],
    },
    {
      type: 'p',
      text: 'La ingeniería de software abarca no solo los programas, sino también la documentación asociada y los datos de configuración necesarios para su funcionamiento. Un sistema de software profesional generalmente está compuesto por varios programas independientes, archivos de configuración para su instalación, documentación del sistema, manuales de usuario y sitios web que facilitan el acceso a la información del producto. Esta complejidad distingue el desarrollo profesional del aficionado. En los programas personales, por lo general, no se requieren guías ni documentación adicional, ya que solo el autor los utiliza. Por el contrario, si crea software que otros usarán y que otros ingenieros modificarán, debe incluir documentación complementaria junto con el código fuente.',
    },
    {
      type: 'p',
      text: 'El desarrollo de productos de software profesional se clasifica en dos tipos principales:',
    },
    {
      type: 'bullets',
      items: [
        'Los productos genéricos consisten en sistemas independientes desarrollados por una organización y comercializados en el mercado abierto para cualquier cliente interesado, como software para PC, bases de datos, procesadores de texto, paquetes de dibujo, herramientas de gestión de proyectos y aplicaciones verticales diseñadas para un propósito específico, como sistemas de información de librería, sistemas de contabilidad o sistemas de registro dental.',
        'Los productos personalizados, o a medida, son sistemas diseñados para un cliente específico. Un contratista de software desarrolla el sistema conforme a los requisitos específicos del cliente. Ejemplos de este tipo de software incluyen sistemas de control de dispositivos electrónicos, sistemas diseñados para apoyar procesos empresariales y sistemas de control de tráfico aéreo.',
      ],
    },
    {
      type: 'p',
      text: 'Una diferencia clave entre estos tipos de software es que, en los productos genéricos, la organización desarrolladora controla la especificación, mientras que, en los productos personalizados, la organización adquirente suele definirla y gestionarla. Sin embargo, esta distinción es cada vez menos clara, ya que muchos sistemas se basan en productos genéricos adaptados a las necesidades del cliente. Los sistemas de Enterprise Resource Planning (ERP), como SAP, ejemplifican este enfoque.',
    },
    {
      type: 'p',
      text: 'La calidad del software profesional debe evaluarse considerando que tanto los usuarios finales como los desarrolladores interactúan y modifican el software. Por lo tanto, la calidad del software abarca sus funcionalidades, su comportamiento en ejecución, la estructura y organización de los programas del sistema, así como la documentación asociada. Estos aspectos se reflejan en los denominados atributos de calidad, o aspectos no funcionales, del software. Ejemplos de estos atributos incluyen el tiempo de respuesta y la comprensibilidad del código del programa. El conjunto específico de atributos requerido para un sistema de software depende de su aplicación. Algunos atributos esenciales del buen software son:',
    },
    {
      type: 'table',
      header: ['Características del producto', 'Descripción'],
      rows: [
        [
          'Mantenimiento',
          'El software debe escribirse de tal forma que pueda evolucionar para satisfacer las necesidades cambiantes de los clientes. Éste es un atributo crítico porque el cambio del software es un requerimiento inevitable de un entorno empresarial variable.',
        ],
        [
          'Confiabilidad y seguridad',
          'La confiabilidad del software incluye un rango de características que abarcan fiabilidad, seguridad y protección. El software confiable no tiene que causar daño físico ni económico, en caso de falla del sistema. Los usuarios malintencionados no deben tener posibilidad de acceder al sistema o dañarlo.',
        ],
        [
          'Eficiencia',
          'El software no tiene que desperdiciar los recursos del sistema, como la memoria y los ciclos del procesador. Por lo tanto, la eficiencia incluye capacidad de respuesta, tiempo de procesamiento, utilización de memoria, etcétera.',
        ],
        [
          'Aceptabilidad',
          'El software debe ser aceptable al tipo de usuarios para quienes se diseña. Esto significa que necesita ser comprensible, utilizable y compatible con otros sistemas que ellos usan.',
        ],
      ],
    },
  ],
};
