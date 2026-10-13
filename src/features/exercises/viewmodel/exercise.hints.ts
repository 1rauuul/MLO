import type { ExerciseType } from '@/shared/model/entities';

const HINTS: Record<ExerciseType, string[]> = {
  order: [
    'Piensa en la secuencia lógica: primero se comprende, después se construye y al final se verifica o evoluciona.',
    'Sostén una opción para arrastrarla o usa las flechas para reubicarla.',
  ],
  fill: [
    'Lee la frase completa antes de colocar una palabra.',
    'Descarta del banco las palabras que no encajen con el sentido de la frase.',
  ],
  match: [
    'Enlaza primero los pares más evidentes y deja los dudosos para el final.',
    'Fíjate en la consecuencia o definición, no solo en el nombre del concepto.',
  ],
  crossword: [
    'Empieza por la palabra más larga o la que tengas más clara.',
    'Toca el inicio de una palabra (H#/V#) para seleccionarla y escribirla.',
  ],
};

export function hintsForType(type: ExerciseType): string[] {
  return HINTS[type] ?? [];
}
