import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectExercisesByLesson } from '@/features/exercises/model/exerciseRepository';
import {
  saveExampleState,
  selectExampleState,
} from '@/features/exercises/model/exampleStateRepository';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { drawGroups } from '@/features/exercises/viewmodel/draw.logic';
import type { Exercise } from '@/shared/model/entities';
import { EXERCISE_TYPES } from '@/shared/model/entities';

export const EXAMPLE_DRAW_COUNT = 10;

export interface ExamplesEngine {
  items: Exercise[];
  index: number;
  total: number;
  current: Exercise | null;
  isLast: boolean;
  isLoading: boolean;
  next: () => void;
}

export function useExamplesEngine(lessonId: string | null): ExamplesEngine {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [items, setItems] = useState<Exercise[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setItems([]);
      setIndex(0);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      const loaded = (await selectExercisesByLesson(db, lessonId)).filter(exercise =>
        EXERCISE_TYPES.includes(exercise.type),
      );
      const byId = new Map(loaded.map(exercise => [exercise.id, exercise]));
      let chosenIds: string[] = [];
      let startIndex = 0;

      if (account) {
        const state = await selectExampleState(db, account.id, lessonId);
        const valid = state.drawExampleIds.filter(id => byId.has(id));
        if (valid.length > 0) {
          chosenIds = valid;
          startIndex = Math.max(0, Math.min(state.exampleIndex, valid.length - 1));
        }
      }

      if (chosenIds.length === 0) {
        chosenIds = drawGroups(
          loaded.map(exercise => exercise.id),
          [],
          EXAMPLE_DRAW_COUNT,
          Math.random,
        ).exampleIds;
        if (account) {
          await saveExampleState(db, account.id, lessonId, {
            drawExampleIds: chosenIds,
            drawExerciseIds: [],
            seenExampleIds: [],
            exampleIndex: 0,
          });
        }
      }

      if (!active) {
        return;
      }
      setItems(chosenIds.map(id => byId.get(id)).filter((item): item is Exercise => Boolean(item)));
      setIndex(startIndex);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId, account]);

  const next = useCallback(() => {
    setIndex(current => {
      if (current >= items.length - 1) {
        return current;
      }
      const nextIndex = current + 1;
      if (account && lessonId) {
        void saveExampleState(db, account.id, lessonId, {
          drawExampleIds: items.map(item => item.id),
          drawExerciseIds: [],
          seenExampleIds: items.slice(0, nextIndex).map(item => item.id),
          exampleIndex: nextIndex,
        });
      }
      return nextIndex;
    });
  }, [items, account, lessonId, db]);

  const current = items[index] ?? null;

  return {
    items,
    index,
    total: items.length,
    current,
    isLast: items.length > 0 && index === items.length - 1,
    isLoading,
    next,
  };
}
