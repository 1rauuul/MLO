import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { insertAttempt, selectAttemptsByLesson } from '@/data/repositories/attemptRepository';
import {
  insertEvaluationResult,
  selectEvaluationByLesson,
  selectQuestions,
} from '@/data/repositories/evaluationRepository';
import type { Evaluation, Question } from '@/models/entities';
import { ACTIVITY_TYPES } from '@/models/entities';

import { summarizeAttempts, type AttemptSummary } from './analyticsLogic';
import {
  isAnswerComplete,
  isAnswerCorrect,
  type EvaluationAnswer,
} from './evaluationLogic';
import { useAuth } from './useAuth';

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

export interface EvaluationEngine {
  index: number;
  total: number;
  items: Question[];
  question: Question | null;
  phase: 'running' | 'summary';
  answers: (EvaluationAnswer | null)[];
  answer: EvaluationAnswer | null;
  canSend: boolean;
  isLast: boolean;
  correctCount: number;
  outcomes: (boolean | null)[];
  summary: AttemptSummary;
  setAnswer: (answer: EvaluationAnswer) => void;
  goPrev: () => void;
  send: () => void;
  restart: () => void;
}

export function useEvaluationEngine(questions: Question[], lessonId: string | null): EvaluationEngine {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const usable = useMemo(
    () => questions.filter(question => ACTIVITY_TYPES.includes(question.type)),
    [questions],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(EvaluationAnswer | null)[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [outcomes, setOutcomes] = useState<(boolean | null)[]>([]);
  const [phase, setPhase] = useState<'running' | 'summary'>('running');
  const [summary, setSummary] = useState<AttemptSummary>(summarizeAttempts([]));

  const refreshSummary = useCallback(async () => {
    if (!account || !lessonId) {
      setSummary(summarizeAttempts([]));
      return;
    }
    const attempts = await selectAttemptsByLesson(db, account.id, lessonId);
    setSummary(summarizeAttempts(attempts));
  }, [db, account, lessonId]);

  const restart = useCallback(() => {
    setIndex(0);
    setAnswers(usable.map(() => null));
    setCorrectCount(0);
    setOutcomes(usable.map(() => null));
    setPhase('running');
  }, [usable]);

  useEffect(() => {
    restart();
  }, [usable, restart]);

  const setAnswer = useCallback(
    (answer: EvaluationAnswer) => {
      setAnswers(previous => {
        const next = [...previous];
        next[index] = answer;
        return next;
      });
    },
    [index],
  );

  const goPrev = useCallback(() => {
    setIndex(current => Math.max(0, current - 1));
  }, []);

  const grade = useCallback(() => {
    const results = usable.map((question, i) => {
      const answer = answers[i];
      return answer ? isAnswerCorrect(question, answer) : false;
    });
    setOutcomes(results);
    setCorrectCount(results.filter(Boolean).length);
    if (account && lessonId) {
      usable.forEach((question, i) => {
        if (answers[i]) {
          void insertAttempt(
            db,
            account.id,
            'evaluation',
            question.id,
            question.type,
            lessonId,
            results[i],
          );
        }
      });
    }
    void refreshSummary();
    setPhase('summary');
  }, [usable, answers, db, account, lessonId, refreshSummary]);

  const send = useCallback(() => {
    const question = usable[index];
    const answer = answers[index] ?? null;
    if (!question || !isAnswerComplete(question, answer)) {
      return;
    }
    if (index < usable.length - 1) {
      setIndex(current => current + 1);
      return;
    }
    grade();
  }, [usable, answers, index, grade]);

  const question = usable[index] ?? null;
  const answer = answers[index] ?? null;

  return {
    index,
    total: usable.length,
    items: usable,
    question,
    phase,
    answers,
    answer,
    canSend: question ? isAnswerComplete(question, answer) : false,
    isLast: index >= usable.length - 1,
    correctCount,
    outcomes,
    summary,
    setAnswer,
    goPrev,
    send,
    restart,
  };
}
