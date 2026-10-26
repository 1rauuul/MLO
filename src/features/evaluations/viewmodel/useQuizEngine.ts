import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Evaluation, Exercise, Question } from '@/shared/model/entities';
import { useRepositories } from '@/shared/services/data/DataProvider';
import { ACTIVITY_TYPES, EXERCISE_TYPES } from '@/shared/model/entities';

import { summarizeAttempts, type AttemptSummary } from '@/features/evaluations/viewmodel/analytics.logic';
import {
  buildEvaluationPool,
  isAnswerComplete,
  isAnswerCorrect,
  type EvaluationAnswer,
} from '@/features/evaluations/viewmodel/evaluation.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';

interface UseEvaluationForLessonResult {
  evaluation: Evaluation | null;
  questions: Question[];
  isLoading: boolean;
}

function questionFromExercise(exercise: Exercise, evaluationId: string): Question {
  return {
    id: exercise.id,
    evaluationId,
    orderIndex: 0,
    type: exercise.type,
    config: exercise.config,
    prompt: exercise.prompt,
    options: exercise.type === 'order' ? exercise.correctOrder : [],
    answer: 0,
    explanation: exercise.explanation,
  };
}

export function useEvaluationForLesson(lessonId: string | null): UseEvaluationForLessonResult {
  const { evaluations, exercises: exerciseRepository } = useRepositories();
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
      try {
        const loadedEvaluation = await evaluations.selectEvaluationByLesson(lessonId);
        const [exercises, bankQuestions] = await Promise.all([
          exerciseRepository.selectExercisesByLesson(lessonId),
          loadedEvaluation
            ? evaluations.selectQuestions(loadedEvaluation.id)
            : Promise.resolve([] as Question[]),
        ]);
        const evaluationId = loadedEvaluation?.id ?? `bank-${lessonId}`;
        const questionPool = bankQuestions.filter(question => ACTIVITY_TYPES.includes(question.type));
        const exercisePool = exercises
          .filter(exercise => EXERCISE_TYPES.includes(exercise.type))
          .map(exercise => questionFromExercise(exercise, evaluationId));
        const { mixed } = buildEvaluationPool(questionPool, exercisePool, Math.random);
        if (!active) {
          return;
        }
        setEvaluation(loadedEvaluation);
        setQuestions(mixed);
      } catch (caught) {
        if (__DEV__) {
          console.error('[evaluation] carga fallida', caught);
        }
        if (active) {
          setEvaluation(null);
          setQuestions([]);
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
  }, [evaluations, exerciseRepository, lessonId]);

  return { evaluation, questions, isLoading };
}

export function useRecordEvaluationResult(): (
  evaluationId: string,
  score: number,
  correctCount: number,
  totalCount: number,
) => Promise<void> {
  const { evaluations } = useRepositories();
  const { account } = useAuth();
  return useCallback(
    async (evaluationId: string, score: number, correctCount: number, totalCount: number) => {
      if (!account) {
        return;
      }
      await evaluations.insertEvaluationResult(
        account.id,
        evaluationId,
        score,
        correctCount,
        totalCount,
      );
    },
    [evaluations, account],
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
  const { attempts } = useRepositories();
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
    const loaded = await attempts.selectAttemptsByLesson(account.id, lessonId);
    setSummary(summarizeAttempts(loaded));
  }, [attempts, account, lessonId]);

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
          void attempts.insertAttempt(
            account.id,
            'evaluation',
            question.id,
            question.type,
            lessonId,
            results[i],
            { correct: results[i] ? 1 : 0, total: 1 },
          );
        }
      });
    }
    void refreshSummary();
    setPhase('summary');
  }, [usable, answers, attempts, account, lessonId, refreshSummary]);

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
