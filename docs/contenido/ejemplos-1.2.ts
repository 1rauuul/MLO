import type { ExampleSeed } from './types';

export const ejemplosL1_2: ExampleSeed[] = [
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
      {
        text: 'Leer el atributo Mantenimiento',
        why: 'Conviene identificar la propiedad de calidad antes de buscar su definición.',
      },
      {
        text: 'Buscar la definición que habla de evolución y cambio',
        why: 'El cambio del software es inevitable en un entorno empresarial variable.',
      },
      {
        text: 'Enlazar eficiencia con el uso de recursos',
        why: 'La eficiencia se refiere a memoria, ciclos y tiempo de respuesta.',
      },
      {
        text: 'Comprobar que ninguna definición se repita',
        why: 'Cada atributo tiene una consecuencia distinta y verificable.',
      },
    ],
    hints: [
      'Concéntrate en la consecuencia de cada atributo, no en su nombre.',
      'Confiabilidad habla de daño y ataques; eficiencia, de recursos.',
      'Aceptabilidad se juzga desde el usuario que usará el sistema.',
    ],
    explanation:
      'Mantenimiento permite evolucionar con el cambio; confiabilidad y seguridad evitan daño y ataques; eficiencia cuida los recursos; aceptabilidad mira la comprensión y compatibilidad con otros sistemas.',
  },
];