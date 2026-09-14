import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { insertResult, selectExercisesByLesson } from '@/data/repositories/exerciseRepository';
import type { Exercise } from '@/models/entities';

import { isOrderCorrect, moveItem, scrambleOrder } from './exerciseLogic';

export interface ExerciseEngine {
  steps: string[];
  checked: boolean;
  isCorrect: boolean;
  move: (index: number, direction: -1 | 1) => void;
  submit: (onResult?: (correct: boolean) => void) => boolean;
  reset: () => void;
}

export function useExerciseEngine(exercise: Exercise | null): ExerciseEngine {
  const [steps, setSteps] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (!exercise) {
      setSteps([]);
      setChecked(false);
      setIsCorrect(false);
      return;
    }
    setSteps(scrambleOrder(exercise.correctOrder));
    setChecked(false);
    setIsCorrect(false);
  }, [exercise]);

  const move = useCallback((index: number, direction: -1 | 1) => {
    setSteps(previous => moveItem(previous, index, direction));
    setChecked(false);
  }, []);

  const submit = useCallback(
    (onResult?: (correct: boolean) => void) => {
      if (!exercise) {
        return false;
      }
      const correct = isOrderCorrect(steps, exercise.correctOrder);
      setIsCorrect(correct);
      setChecked(true);
      onResult?.(correct);
      return correct;
    },
    [exercise, steps],
  );

  const reset = useCallback(() => {
    if (!exercise) {
      return;
    }
    setSteps(scrambleOrder(exercise.correctOrder));
    setChecked(false);
    setIsCorrect(false);
  }, [exercise]);

  return { steps, checked, isCorrect, move, submit, reset };
}

interface UseExerciseForLessonResult {
  exercise: Exercise | null;
  isLoading: boolean;
}

export function useExerciseForLesson(lessonId: string | null): UseExerciseForLessonResult {
  const db = useSQLiteContext();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setExercise(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      const loaded = await selectExercisesByLesson(db, lessonId);
      if (!active) {
        return;
      }
      setExercise(loaded[0] ?? null);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId]);

  return { exercise, isLoading };
}

export function useRecordExerciseResult(): (
  exerciseId: string,
  answer: string,
  correct: boolean,
) => Promise<void> {
  const db = useSQLiteContext();
  return useCallback(
    async (exerciseId: string, answer: string, correct: boolean) => {
      await insertResult(db, exerciseId, answer, correct);
    },
    [db],
  );
}
