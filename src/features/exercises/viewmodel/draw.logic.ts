import { shuffleItems } from '@/features/exercises/viewmodel/exercise.logic';

export interface DrawnGroups {
  exampleIds: string[];
  exerciseIds: string[];
}

function pick(ids: string[], count: number, random: () => number): string[] {
  if (count >= ids.length) {
    return [...ids];
  }
  return shuffleItems([...ids], random).slice(0, Math.max(0, count));
}

// Reparte hasta `count` ejemplos y `count` ejercicios sin que un mismo id caiga en ambos grupos.
// Un id presente en las dos fuentes no puede estar a la vez en ejemplo y ejercicio.
export function drawGroups(
  exampleIds: string[],
  exerciseIds: string[],
  count: number,
  random: () => number = Math.random,
): DrawnGroups {
  const exerciseIds2 = pick(exerciseIds, count, random);
  const chosen = new Set(exerciseIds2);
  const exampleIds2 = pick(
    exampleIds.filter(id => !chosen.has(id)),
    count,
    random,
  );
  return { exampleIds: exampleIds2, exerciseIds: exerciseIds2 };
}
