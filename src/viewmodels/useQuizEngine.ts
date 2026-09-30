import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { insertAttempt, selectAttemptsByLesson } from '@/data/repositories/attemptRepository';
import {
  insertEvaluationResult,
  selectEvaluationByLesson,
  selectQuestions,
} from '@/data/repositories/evaluationRepository';
import type { ActivityType, Evaluation, Question } from '@/models/entities';

import { summarizeAttempts, type AttemptSummary } from './analyticsLogic';
import { computeScore, countCorrect } from './quizLogic';
import { useAuth } from './useAuth';

const KNOWN_ACTIVITY_TYPES: ActivityType[] = ['order', 'fill', 'match', 'crossword', 'mcq'];

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

export interface EvaluationEngine {
  index: number;
  total: number;
  items: Question[];
  question: Question | null;
  phase: 'running' | 'summary';
  answered: boolean;
  lastCorrect: boolean | null;
  correctCount: number;
  outcomes: (boolean | null)[];
  summary: AttemptSummary;
  submit: (answer: string, correct: boolean) => void;
  next: () => void;
  restart: () => void;
}

export function useEvaluationEngine(questions: Question[], lessonId: string | null): EvaluationEngine {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const usable = useMemo(
    () => questions.filter(question => KNOWN_ACTIVITY_TYPES.includes(question.type)),
    [questions],
  );
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
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
    setAnswered(false);
    setLastCorrect(null);
    setCorrectCount(0);
    setOutcomes(usable.map(() => null));
    setPhase('running');
  }, [usable]);

  useEffect(() => {
    restart();
  }, [usable, restart]);

  const submit = useCallback(
    (answer: string, correct: boolean) => {
      if (answered || phase !== 'running') {
        return;
      }
      const question = usable[index];
      if (question && account && lessonId) {
        void insertAttempt(db, account.id, 'evaluation', question.id, question.type, lessonId, correct);
      }
      setAnswered(true);
      setLastCorrect(correct);
      setOutcomes(previous => {
        const next = [...previous];
        next[index] = correct;
        return next;
      });
      if (correct) {
        setCorrectCount(current => current + 1);
      }
    },
    [answered, phase, usable, index, db, account, lessonId],
  );

  const next = useCallback(() => {
    if (index < usable.length - 1) {
      setIndex(current => current + 1);
      setAnswered(false);
      setLastCorrect(null);
      return;
    }
    void refreshSummary();
    setPhase('summary');
  }, [index, usable.length, refreshSummary]);

  return {
    index,
    total: usable.length,
    items: usable,
    question: usable[index] ?? null,
    phase,
    answered,
    lastCorrect,
    correctCount,
    outcomes,
    summary,
    submit,
    next,
    restart,
  };
}
