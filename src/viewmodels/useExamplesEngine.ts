import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectExercisesByLesson } from '@/data/repositories/exerciseRepository';
import type { Exercise, ExerciseType } from '@/models/entities';

const KNOWN_TYPES: ExerciseType[] = ['order', 'fill', 'match', 'crossword'];

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
        KNOWN_TYPES.includes(exercise.type),
      );
      if (!active) {
        return;
      }
      setItems(loaded);
      setIndex(0);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId]);

  const next = useCallback(() => {
    setIndex(current => (current < items.length - 1 ? current + 1 : current));
  }, [items.length]);

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
