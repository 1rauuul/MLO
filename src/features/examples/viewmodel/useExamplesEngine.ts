import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useActiveGroup } from '@/features/classes/viewmodel/useActiveGroup';
import { syntheticExamples } from '@/features/examples/viewmodel/example.logic';
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
  const groupId = useActiveGroup();
  const [items, setItems] = useState<Exercise[]>([]);
  const [pool, setPool] = useState<Exercise[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [drawExerciseIds, setDrawExerciseIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedLessonId, setLoadedLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) {
      setItems([]);
      setPool([]);
      setExamples([]);
      setIndex(0);
      setLoadedLessonId(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      try {
        const [loadedExercises, loadedExamples] = await Promise.all([
          account
            ? exerciseRepository.selectPracticeExercisesByLesson(account.id, lessonId, groupId)
            : exerciseRepository.selectExercisesByLesson(lessonId, groupId),
          account
            ? exampleRepository.selectExamplesWithExtras(account.id, lessonId, groupId)
            : exampleRepository.selectExamplesByLesson(lessonId, groupId),
        ]);
        const loaded = loadedExercises.filter(exercise => EXERCISE_TYPES.includes(exercise.type));
        const byId = new Map(loaded.map(exercise => [exercise.id, exercise]));
        const independent = syntheticExamples(loaded, loadedExamples);
        let chosenIds: string[] = [];
        let exerciseIds: string[] = [];
        let startIndex = 0;

        if (account) {
          const state = await ensureLessonDraw(
            { exercises: exerciseRepository, exampleState },
            account.id,
            lessonId,
            undefined,
            groupId,
          );
          chosenIds = state.drawExampleIds.filter(id => byId.has(id));
          exerciseIds = state.drawExerciseIds;
          startIndex = Math.max(
            0,
            Math.min(state.exampleIndex, chosenIds.length + independent.length - 1),
          );
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
        setLoadedLessonId(lessonId);
        setItems([
          ...chosenIds.map(id => byId.get(id)).filter((item): item is Exercise => Boolean(item)),
          ...independent,
        ]);
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
  }, [exerciseRepository, exampleRepository, exampleState, lessonId, account, groupId]);

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

  // Marca como visto el ejemplo en pantalla (incluido el último) en cada avance.
  useEffect(() => {
    if (!account || !lessonId || loadedLessonId !== lessonId || items.length === 0) {
      return;
    }
    persist(
      index,
      items.slice(0, index + 1).map(item => item.id),
      items.map(item => item.id),
      drawExerciseIds,
    );
  }, [account, lessonId, loadedLessonId, items, index, drawExerciseIds, persist]);

  const next = useCallback(() => {
    if (index >= items.length - 1) {
      return;
    }
    setIndex(index + 1);
  }, [index, items.length]);

  const redraw = useCallback(() => {
    const ids = pool.map(item => item.id);
    if (ids.length === 0) {
      return;
    }
    const drawn = splitDraw(ids, EXAMPLE_DRAW_COUNT);
    const byId = new Map(pool.map(item => [item.id, item]));
    setItems([
      ...drawn.exampleIds.map(id => byId.get(id)).filter((item): item is Exercise => Boolean(item)),
      ...syntheticExamples(pool, examples),
    ]);
    setDrawExerciseIds(drawn.exerciseIds);
    setIndex(0);
  }, [pool, examples]);

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
