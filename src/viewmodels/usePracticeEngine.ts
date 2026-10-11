import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { insertAttempt, selectAttemptsByLesson } from '@/data/repositories/attemptRepository';
import { selectExercisesByLesson } from '@/data/repositories/exerciseRepository';
import type { Exercise } from '@/models/entities';
import { EXERCISE_TYPES } from '@/models/entities';

import { summarizeAttempts, type AttemptSummary } from './analyticsLogic';
import { shuffleItems } from './exerciseLogic';
import { useAuth } from './useAuth';

export type PracticePhase = 'running' | 'summary';

export interface PracticeEngine {
  items: Exercise[];
  phase: PracticePhase;
  index: number;
  total: number;
  current: Exercise | null;
  answered: boolean;
  lastCorrect: boolean | null;
  summary: AttemptSummary;
  isLoading: boolean;
  submit: (answer: string, correct: boolean) => void;
  next: () => void;
}

export function usePracticeEngine(lessonId: string | null): PracticeEngine {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [items, setItems] = useState<Exercise[]>([]);
  const [order, setOrder] = useState<Exercise[]>([]);
  const [phase, setPhase] = useState<PracticePhase>('running');
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<AttemptSummary>(summarizeAttempts([]));
  const [isLoading, setIsLoading] = useState(true);
  const answeredRef = useRef(false);

  useEffect(() => {
    if (!lessonId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    answeredRef.current = false;
    (async () => {
      const loaded = (await selectExercisesByLesson(db, lessonId)).filter(exercise =>
        EXERCISE_TYPES.includes(exercise.type),
      );
      if (!active) {
        return;
      }
      setItems(loaded);
      setOrder(shuffleItems(loaded, Math.random));
      setIndex(0);
      setAnswered(false);
      setLastCorrect(null);
      setPhase('running');
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId]);

  const refreshSummary = useCallback(async () => {
    if (!account || !lessonId) {
      setSummary(summarizeAttempts([]));
      return;
    }
    const attempts = await selectAttemptsByLesson(db, account.id, lessonId);
    setSummary(summarizeAttempts(attempts));
  }, [db, account, lessonId]);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  const submit = useCallback(
    (answer: string, correct: boolean) => {
      if (answeredRef.current) {
        return;
      }
      answeredRef.current = true;
      setAnswered(true);
      setLastCorrect(correct);
      if (account && lessonId) {
        void insertAttempt(
          db,
          account.id,
          'practice',
          currentItemId(order, index),
          typeAt(order, index),
          lessonId,
          correct,
        );
      }
    },
    [db, account, lessonId, order, index],
  );

  const next = useCallback(() => {
    if (index < order.length - 1) {
      setIndex(current => current + 1);
      setAnswered(false);
      setLastCorrect(null);
      answeredRef.current = false;
      return;
    }
    void refreshSummary();
    setPhase('summary');
  }, [index, order.length, refreshSummary]);

  const current = order[index] ?? null;

  return {
    items,
    phase,
    index,
    total: order.length,
    current,
    answered,
    lastCorrect,
    summary,
    isLoading,
    submit,
    next,
  };
}

function currentItemId(order: Exercise[], index: number): string {
  return order[index]?.id ?? '';
}

function typeAt(order: Exercise[], index: number) {
  return order[index]?.type ?? 'order';
}
