import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { ensureLessonDraw, splitDraw } from '@/features/exercises/viewmodel/lessonDraw';
import type { Example, Exercise } from '@/shared/model/entities';
import { EXERCISE_TYPES } from '@/shared/model/entities';
import { useRepositories } from '@/shared/services/data/DataProvider';

export const EXAMPLE_DRAW_COUNT = 10;

export interface ExamplesEngine {
  items: Exercise[];
  index: number;
  total: number;
  current: Exercise | null;
  currentExample: Example | null;
  isLast: boolean;
  isLoading: boolean;
  next: () => void;
  redraw: () => void;
}

export function useExamplesEngine(lessonId: string | null): ExamplesEngine {
  const { exercises: exerciseRepository, examples: exampleRepository, exampleState } =
    useRepositories();
  const { account } = useAuth();
  const [items, setItems] = useState<Exercise[]>([]);
  const [pool, setPool] = useState<Exercise[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [drawExerciseIds, setDrawExerciseIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setItems([]);
      setPool([]);
      setExamples([]);
      setIndex(0);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      try {
        const [loadedExercises, loadedExamples] = await Promise.all([
          exerciseRepository.selectExercisesByLesson(lessonId),
          exampleRepository.selectExamplesByLesson(lessonId),
        ]);
        const loaded = loadedExercises.filter(exercise => EXERCISE_TYPES.includes(exercise.type));
        const byId = new Map(loaded.map(exercise => [exercise.id, exercise]));
        let chosenIds: string[] = [];
        let exerciseIds: string[] = [];
        let startIndex = 0;

        if (account) {
          const state = await ensureLessonDraw(
            { exercises: exerciseRepository, exampleState },
            account.id,
            lessonId,
          );
          chosenIds = state.drawExampleIds.filter(id => byId.has(id));
          exerciseIds = state.drawExerciseIds;
          startIndex = Math.max(0, Math.min(state.exampleIndex, chosenIds.length - 1));
        }

        if (chosenIds.length === 0) {
          chosenIds = splitDraw(loaded.map(exercise => exercise.id), EXAMPLE_DRAW_COUNT).exampleIds;
        }

        if (!active) {
          return;
        }
        setPool(loaded);
        setExamples(loadedExamples);
        setDrawExerciseIds(exerciseIds);
        setItems(chosenIds.map(id => byId.get(id)).filter((item): item is Exercise => Boolean(item)));
        setIndex(Math.max(0, startIndex));
      } catch (caught) {
        if (__DEV__) {
          console.error('[examples] carga fallida', caught);
        }
        if (active) {
          setItems([]);
          setPool([]);
          setExamples([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [exerciseRepository, exampleRepository, exampleState, lessonId, account]);

  const persist = useCallback(
    (nextIndex: number, seen: string[], exampleIds: string[], exerciseIds: string[]) => {
      if (!account || !lessonId) {
        return;
      }
      void exampleState.saveExampleState(account.id, lessonId, {
        drawExampleIds: exampleIds,
        drawExerciseIds: exerciseIds,
        seenExampleIds: seen,
        exampleIndex: nextIndex,
      });
    },
    [account, lessonId, exampleState],
  );

  const next = useCallback(() => {
    if (index >= items.length - 1) {
      return;
    }
    const nextIndex = index + 1;
    const seen = items.slice(0, nextIndex).map(item => item.id);
    setIndex(nextIndex);
    persist(
      nextIndex,
      seen,
      items.map(item => item.id),
      drawExerciseIds,
    );
  }, [index, items, drawExerciseIds, persist]);

  const redraw = useCallback(() => {
    const ids = pool.map(item => item.id);
    if (ids.length === 0) {
      return;
    }
    const drawn = splitDraw(ids, EXAMPLE_DRAW_COUNT);
    const byId = new Map(pool.map(item => [item.id, item]));
    setItems(drawn.exampleIds.map(id => byId.get(id)).filter((item): item is Exercise => Boolean(item)));
    setDrawExerciseIds(drawn.exerciseIds);
    setIndex(0);
    persist(0, [], drawn.exampleIds, drawn.exerciseIds);
  }, [pool, persist]);

  const current = items[index] ?? null;
  const examplesById = useMemo(() => new Map(examples.map(example => [example.id, example])), [examples]);

  return {
    items,
    index,
    total: items.length,
    current,
    currentExample: current ? (examplesById.get(current.id) ?? null) : null,
    isLast: items.length > 0 && index === items.length - 1,
    isLoading,
    next,
    redraw,
  };
}
