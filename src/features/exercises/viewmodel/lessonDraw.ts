import type { ExampleState } from '@/features/exercises/model/exampleStateRepository';
import { shuffleItems } from '@/features/exercises/viewmodel/exercise.logic';
import type { Repositories } from '@/shared/services/data/DataProvider';

export const LESSON_DRAW_COUNT = 10;

type DrawRepositories = Pick<Repositories, 'exercises' | 'exampleState'>;

export interface SplitDraw {
  exampleIds: string[];
  exerciseIds: string[];
}

export function splitDraw(
  ids: string[],
  count: number = LESSON_DRAW_COUNT,
  random: () => number = Math.random,
): SplitDraw {
  const shuffled = shuffleItems(ids, random);
  const exampleCount = ids.length <= 1 ? ids.length : Math.min(count, Math.floor(ids.length / 2));
  return {
    exampleIds: shuffled.slice(0, exampleCount),
    exerciseIds: shuffled.slice(exampleCount, exampleCount + count),
  };
}

/**
 * Sorteo único por cuenta y lección: ejemplos y ejercicios comparten pool y
 * nunca se repiten. El reparto reserva la mitad para ejemplos y deja el resto
 * a la práctica, así ninguna pantalla queda vacía con pools pequeños.
 */
export async function ensureLessonDraw(
  repositories: DrawRepositories,
  accountId: number,
  lessonId: string,
  count: number = LESSON_DRAW_COUNT,
): Promise<ExampleState> {
  const [loaded, state] = await Promise.all([
    repositories.exercises.selectExercisesByLesson(lessonId),
    repositories.exampleState.selectExampleState(accountId, lessonId),
  ]);
  const ids = loaded.map(exercise => exercise.id);
  const exampleIds = state.drawExampleIds.filter(id => ids.includes(id));
  const exerciseIds = state.drawExerciseIds.filter(id => ids.includes(id));
  const disjoint = !exerciseIds.some(id => exampleIds.includes(id));
  const complete = exampleIds.length > 0 && exerciseIds.length > 0;

  if (disjoint && complete) {
    return {
      ...state,
      drawExampleIds: exampleIds,
      drawExerciseIds: exerciseIds,
      exampleIndex: Math.max(0, Math.min(state.exampleIndex, exampleIds.length - 1)),
    };
  }

  const split = splitDraw(ids, count);
  const drawn = {
    drawExampleIds: split.exampleIds,
    drawExerciseIds: split.exerciseIds,
    seenExampleIds: [],
    exampleIndex: 0,
  };
  await repositories.exampleState.saveExampleState(accountId, lessonId, drawn);
  return drawn;
}
