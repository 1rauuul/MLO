import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import {
  insertEvaluationResult,
  selectEvaluationByLesson,
  selectQuestions,
} from '@/data/repositories/evaluationRepository';
import type { Evaluation, Question } from '@/models/entities';

import { computeScore, countCorrect } from './quizLogic';
import { useAuth } from './useAuth';

export interface QuizEngine {
  index: number;
  total: number;
  question: Question | null;
  chosen: number | null;
  answers: number[];
  score: number;
  correctCount: number;
  finished: boolean;
  choose: (value: number) => void;
  next: () => void;
  restart: () => void;
}

export function useQuizEngine(questions: Question[]): QuizEngine {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const question = questions[index] ?? null;
  const score = computeScore(questions, answers);
  const correctCount = countCorrect(questions, answers);

  const restart = useCallback(() => {
    setIndex(0);
    setChosen(null);
    setAnswers([]);
    setFinished(false);
  }, []);

  useEffect(() => {
    restart();
  }, [questions, restart]);

  const choose = useCallback(
    (value: number) => {
      if (chosen !== null) {
        return;
      }
      setChosen(value);
      setAnswers(previous => {
        const copy = [...previous];
        copy[index] = value;
        return copy;
      });
    },
    [chosen, index],
  );

  const next = useCallback(() => {
    if (chosen === null) {
      return;
    }
    if (index >= total - 1) {
      setFinished(true);
      return;
    }
    setIndex(current => current + 1);
    setChosen(null);
  }, [chosen, index, total]);

  return {
    index,
    total,
    question,
    chosen,
    answers,
    score,
    correctCount,
    finished,
    choose,
    next,
    restart,
  };
}

interface UseEvaluationForLessonResult {
  evaluation: Evaluation | null;
  questions: Question[];
  isLoading: boolean;
}

export function useEvaluationForLesson(lessonId: string | null): UseEvaluationForLessonResult {
  const db = useSQLiteContext();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setEvaluation(null);
      setQuestions([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      const loadedEvaluation = await selectEvaluationByLesson(db, lessonId);
      const loadedQuestions = loadedEvaluation ? await selectQuestions(db, loadedEvaluation.id) : [];
      if (!active) {
        return;
      }
      setEvaluation(loadedEvaluation);
      setQuestions(loadedQuestions);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId]);

  return { evaluation, questions, isLoading };
}

export function useRecordEvaluationResult(): (
  evaluationId: string,
  score: number,
  correctCount: number,
  totalCount: number,
) => Promise<void> {
  const db = useSQLiteContext();
  const { account } = useAuth();
  return useCallback(
    async (evaluationId: string, score: number, correctCount: number, totalCount: number) => {
      if (!account) {
        return;
      }
      await insertEvaluationResult(db, account.id, evaluationId, score, correctCount, totalCount);
    },
    [db, account],
  );
}
