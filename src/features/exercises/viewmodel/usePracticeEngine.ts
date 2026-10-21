import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { insertAttempt } from '@/features/exercises/model/attemptRepository';
import { selectExercisesByLesson } from '@/features/exercises/model/exerciseRepository';
import { selectExampleState } from '@/features/exercises/model/exampleStateRepository';
import type { Exercise, ExerciseType } from '@/shared/model/entities';
import { EXERCISE_TYPES } from '@/shared/model/entities';
import { L12_TOPIC_BY_ID } from '@/shared/services/content/topics';

import type { AttemptSummary } from '@/features/evaluations/viewmodel/analytics.logic';
import type { ExerciseScore } from '@/features/exercises/viewmodel/exercise.logic';
import { drawGroups } from '@/features/exercises/viewmodel/draw.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';

export const PRACTICE_DRAW_COUNT = 10;

export type PracticePhase = 'running' | 'summary';

export interface PracticeQuestion {
  exerciseId: string;
  index: number;
  type: ExerciseType;
  correct: number;
  total: number;
}

export interface PracticeSummary extends AttemptSummary {
  byQuestion: PracticeQuestion[];
}

export interface PracticeEngine {
  items: Exercise[];
  phase: PracticePhase;
  index: number;
  total: number;
  current: Exercise | null;
  answered: boolean;
  lastCorrect: boolean | null;
  summary: PracticeSummary;
  isLoading: boolean;
  submit: (answer: string, correct: boolean, score?: ExerciseScore) => void;
  next: () => void;
}

const EMPTY_SUMMARY: PracticeSummary = {
  total: 0,
  correct: 0,
  accuracy: 1,
  byType: {},
  byQuestion: [],
};

function fractionOf(question: PracticeQuestion): number {
  return question.total === 0 ? 0 : question.correct / question.total;
}

// Califica solo la sesión dibujada: cada pregunta pesa igual y se desglosa por reactivo interno.
function summarizeSession(order: Exercise[], results: Record<string, ExerciseScore>): PracticeSummary {
  const byQuestion: PracticeQuestion[] = order.map((exercise, index) => {
    const score = results[exercise.id] ?? { correct: 0, total: 1 };
    return { exerciseId: exercise.id, index, type: exercise.type, correct: score.correct, total: score.total };
  });
  const byType: AttemptSummary['byType'] = {};
  const byTopic: AttemptSummary['byTopic'] = {};
  let points = 0;
  for (const question of byQuestion) {
    const fraction = fractionOf(question);
    points += fraction;
    const bucket = byType[question.type] ?? { total: 0, correct: 0 };
    bucket.total += 1;
    bucket.correct += fraction;
    byType[question.type] = bucket;
    const topic = L12_TOPIC_BY_ID[question.exerciseId];
    if (topic) {
      const topicBucket = byTopic[topic] ?? { total: 0, correct: 0 };
      topicBucket.total += 1;
      topicBucket.correct += fraction;
      byTopic[topic] = topicBucket;
    }
  }
  const total = byQuestion.length;
  return {
    total,
    correct: points,
    accuracy: total === 0 ? 1 : points / total,
    byType,
    byTopic,
    byQuestion,
  };
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
  const [results, setResults] = useState<Record<string, ExerciseScore>>({});
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
      let exampleIds: string[] = [];
      if (account) {
        const state = await selectExampleState(db, account.id, lessonId);
        exampleIds = state.drawExampleIds;
      }
      const pool = loaded
        .filter(exercise => !exampleIds.includes(exercise.id))
        .map(exercise => exercise.id);
      const drawnIds = drawGroups([], pool, PRACTICE_DRAW_COUNT, Math.random).exerciseIds;
      const byId = new Map(loaded.map(exercise => [exercise.id, exercise]));
      const orderItems = drawnIds
        .map(id => byId.get(id))
        .filter((item): item is Exercise => Boolean(item));
      if (!active) {
        return;
      }
      setItems(loaded);
      setOrder(orderItems);
      setIndex(0);
      setAnswered(false);
      setLastCorrect(null);
      setResults({});
      setPhase('running');
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId, account]);

  const summary = useMemo(() => summarizeSession(order, results), [order, results]);

  const submit = useCallback(
    (answer: string, correct: boolean, score?: ExerciseScore) => {
      if (answeredRef.current) {
        return;
      }
      answeredRef.current = true;
      setAnswered(true);
      setLastCorrect(correct);
      const itemId = currentItemId(order, index);
      setResults(previous => ({
        ...previous,
        [itemId]: score ?? { correct: correct ? 1 : 0, total: 1 },
      }));
      if (account && lessonId) {
        void insertAttempt(
          db,
          account.id,
          'practice',
          itemId,
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
    setPhase('summary');
  }, [index, order.length]);

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
