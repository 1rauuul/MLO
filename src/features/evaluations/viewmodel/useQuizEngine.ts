import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Evaluation, Exercise, Question } from '@/shared/model/entities';
import { useRepositories } from '@/shared/services/data/DataProvider';
import { ACTIVITY_TYPES, EXERCISE_TYPES } from '@/shared/model/entities';
import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';

import type { AttemptSummary } from '@/features/evaluations/viewmodel/analytics.logic';
import {
  buildEvaluationPool,
  EVALUATION_EXERCISES_COUNT,
  EVALUATION_QUESTIONS_COUNT,
  isAnswerComplete,
  isAnswerCorrect,
  shuffleQuestionOptions,
  summarizeEvaluation,
  type EvaluationAnswer,
} from '@/features/evaluations/viewmodel/evaluation.logic';
import { shuffleItems } from '@/features/exercises/viewmodel/exercise.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';

interface UseEvaluationForLessonResult {
  evaluation: Evaluation | null;
  questions: Question[];
  isLoading: boolean;
  error: string | null;
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

export function useEvaluationForLesson(
  lessonId: string | null,
  evaluationId: string | null = null,
  catalogId: string = BASE_CATALOG_ID,
  groupId: string | null = null,
): UseEvaluationForLessonResult {
  const { evaluations, exercises: exerciseRepository } = useRepositories();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId && !evaluationId) {
      setEvaluation(null);
      setQuestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const loadedEvaluation = evaluationId
          ? await evaluations.selectEvaluationById(evaluationId, catalogId, groupId)
          : lessonId
            ? await evaluations.selectEvaluationByLesson(lessonId, groupId)
            : null;
        if (!loadedEvaluation) {
          if (active) {
            setEvaluation(null);
            setQuestions([]);
            setError(null);
          }
          return;
        }
        const [selected, bankQuestions, lessonExercises] = await Promise.all([
          evaluations.selectSelectedExercises(loadedEvaluation.id),
          evaluations.selectQuestions(loadedEvaluation.id),
          !evaluationId &&
          (loadedEvaluation.exerciseCount ?? 0) > 0 &&
          lessonId
            ? exerciseRepository.selectExercisesByLesson(lessonId, groupId)
            : Promise.resolve([] as Exercise[]),
        ]);
        const hasSelection = selected.length > 0;
        const sourceExercises = hasSelection ? selected : lessonExercises;
        const questionCount = EVALUATION_QUESTIONS_COUNT;
        const exerciseCount = EVALUATION_EXERCISES_COUNT;
        const questionPool = bankQuestions.filter(question => ACTIVITY_TYPES.includes(question.type));
        const exercisePool = sourceExercises
          .filter(exercise => EXERCISE_TYPES.includes(exercise.type))
          .map(exercise => questionFromExercise(exercise, loadedEvaluation.id));
        const pool = buildEvaluationPool(
          questionPool,
          exercisePool,
          Math.random,
          questionCount,
          exerciseCount,
        );
        if (!active) {
          return;
        }
        setEvaluation(loadedEvaluation);
        setQuestions(pool.isComplete ? pool.mixed : []);
        setError(
          pool.isComplete
            ? null
            : `La evaluación requiere ${questionCount} preguntas y ${exerciseCount} ejercicios disponibles.`,
        );
      } catch (caught) {
        if (__DEV__) {
          console.error('[evaluation] carga fallida', caught);
        }
        if (active) {
          setEvaluation(null);
          setQuestions([]);
          setError('No se pudo cargar la evaluación.');
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
  }, [evaluations, exerciseRepository, lessonId, evaluationId, catalogId, groupId]);

  return { evaluation, questions, isLoading, error };
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
  /** Sube en cada reintento para distinguir el intento al guardar el resultado. */
  runId: number;
  setAnswer: (answer: EvaluationAnswer) => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  send: () => void;
  restart: () => void;
}

export function useEvaluationEngine(
  questions: Question[],
  lessonId: string | null,
  random: () => number = Math.random,
): EvaluationEngine {
  const { attempts } = useRepositories();
  const { account } = useAuth();
  const usable = useMemo(
    () => questions.filter(question => ACTIVITY_TYPES.includes(question.type)),
    [questions],
  );
  const [items, setItems] = useState<Question[]>(usable);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(EvaluationAnswer | null)[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [outcomes, setOutcomes] = useState<(boolean | null)[]>([]);
  const [phase, setPhase] = useState<'running' | 'summary'>('running');
  const [summary, setSummary] = useState<AttemptSummary>(summarizeEvaluation([], []));
  const graded = useRef(false);
  const [runId, setRunId] = useState(0);
  const poolSignature = useMemo(
    () =>
      JSON.stringify(
        usable.map(question => ({
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          options: question.options,
          answer: question.answer,
          config: question.config,
        })),
      ),
    [usable],
  );
  const appliedPoolSignature = useRef<string | null>(null);

  const restart = useCallback(() => {
    graded.current = false;
    const next = shuffleItems(usable, random).map(question =>
      shuffleQuestionOptions(question, random),
    );
    setItems(next);
    setIndex(0);
    setAnswers(next.map(() => null));
    setCorrectCount(0);
    setOutcomes(next.map(() => null));
    setPhase('running');
    setRunId(current => current + 1);
  }, [usable, random]);

  useEffect(() => {
    if (appliedPoolSignature.current === poolSignature) {
      return;
    }
    appliedPoolSignature.current = poolSignature;
    graded.current = false;
    setItems(usable);
    setIndex(0);
    setAnswers(usable.map(() => null));
    setCorrectCount(0);
    setOutcomes(usable.map(() => null));
    setPhase('running');
    if (usable.length > 0) {
      setRunId(current => current + 1);
    }
  }, [poolSignature, usable]);

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

  const goTo = useCallback((target: number) => {
    if (phase === 'running' && Number.isInteger(target) && target >= 0 && target < items.length) {
      setIndex(target);
    }
  }, [phase, items.length]);

  const grade = useCallback(() => {
    if (graded.current) return;
    graded.current = true;
    const results = items.map((question, i) => {
      const answer = answers[i];
      return answer ? isAnswerCorrect(question, answer) : false;
    });
    setOutcomes(results);
    setCorrectCount(results.filter(Boolean).length);
    if (account && lessonId) {
      items.forEach((question, i) => {
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
    setSummary(summarizeEvaluation(items, answers));
    setPhase('summary');
  }, [items, answers, attempts, account, lessonId]);

  const send = useCallback(() => {
    const question = items[index];
    const answer = answers[index] ?? null;
    if (!question || !isAnswerComplete(question, answer)) {
      return;
    }
    if (index < items.length - 1) {
      setIndex(current => current + 1);
      return;
    }
    const missing = items.findIndex((item, position) => !isAnswerComplete(item, answers[position] ?? null));
    if (missing >= 0) { setIndex(missing); return; }
    grade();
  }, [items, answers, index, grade]);

  const question = items[index] ?? null;
  const answer = answers[index] ?? null;

  return {
    index,
    total: items.length,
    items,
    question,
    phase,
    answers,
    answer,
    canSend: question ? isAnswerComplete(question, answer) : false,
    isLast: index >= items.length - 1,
    correctCount,
    outcomes,
    summary,
    runId,
    setAnswer,
    goPrev,
    goTo,
    send,
    restart,
  };
}
