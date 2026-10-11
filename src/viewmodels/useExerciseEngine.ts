import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { selectExercisesByLesson } from '@/data/repositories/exerciseRepository';
import type { CrosswordEntry, Exercise, ExerciseConfig, MatchPair } from '@/models/entities';

import {
  buildFillBank,
  crosswordCells,
  extractFillAnswers,
  isCrosswordCorrect,
  isFillCorrect,
  isMatchCorrect,
  isOrderCorrect,
  moveItem,
  reorderItem,
  scrambleOrder,
  shuffleItems,
  splitFillSentences,
  type CrosswordCell,
  type FillSegment,
} from './exerciseLogic';
export interface ExerciseEngine {
  steps: string[];
  correctOrder: string[];
  checked: boolean;
  isCorrect: boolean;
  move: (index: number, direction: -1 | 1) => void;
  moveTo: (from: number, to: number) => void;
  submit: (onResult?: (correct: boolean) => void) => boolean;
  solve: () => void;
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

  const moveTo = useCallback((from: number, to: number) => {
    setSteps(previous => reorderItem(previous, from, to));
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

  const solve = useCallback(() => {
    if (!exercise) {
      return;
    }
    setSteps([...exercise.correctOrder]);
    setIsCorrect(true);
    setChecked(true);
  }, [exercise]);

  const reset = useCallback(() => {
    if (!exercise) {
      return;
    }
    setSteps(scrambleOrder(exercise.correctOrder));
    setChecked(false);
    setIsCorrect(false);
  }, [exercise]);

  return {
    steps,
    correctOrder: exercise?.correctOrder ?? [],
    checked,
    isCorrect,
    move,
    moveTo,
    submit,
    solve,
    reset,
  };
}

interface UseExercisesForLessonResult {
  exercises: Exercise[];
  isLoading: boolean;
}

export function useExercisesForLesson(lessonId: string | null): UseExercisesForLessonResult {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setExercises([]);
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
      setExercises(loaded);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId]);

  return { exercises, isLoading };
}

export interface FillEngine {
  sentences: FillSegment[][];
  answers: string[];
  bank: string[];
  used: boolean[];
  assignment: (string | null)[];
  activeBlank: number | null;
  checked: boolean;
  isCorrect: boolean;
  selectBlank: (index: number) => void;
  placeWord: (bankIndex: number) => void;
  clearBlank: (index: number) => void;
  submit: (onResult?: (correct: boolean) => void) => boolean;
  solve: () => void;
  reset: () => void;
}

export function useFillEngine(exercise: Exercise | null): FillEngine {
  const sourceSentences = useMemo(
    () => (exercise?.type === 'fill' ? (exercise.config.sentences ?? []) : []),
    [exercise],
  );
  const bankExtra = useMemo(
    () => (exercise?.type === 'fill' ? (exercise.config.bank ?? []) : []),
    [exercise],
  );
  const [ordered, setOrdered] = useState<string[]>([]);

  useEffect(() => {
    setOrdered(shuffleItems(sourceSentences, Math.random));
  }, [sourceSentences]);

  const sentences = useMemo(() => splitFillSentences(ordered), [ordered]);
  const answers = useMemo(() => extractFillAnswers(ordered), [ordered]);

  const [bank, setBank] = useState<string[]>([]);
  const [used, setUsed] = useState<boolean[]>([]);
  const [assignment, setAssignment] = useState<(string | null)[]>([]);
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const reset = useCallback(() => {
    const expected = extractFillAnswers(ordered);
    setBank(buildFillBank(ordered, Math.random, bankExtra));
    setUsed(Array.from({ length: expected.length + bankExtra.length }, () => false));
    setAssignment(expected.map(() => null));
    setActiveBlank(null);
    setChecked(false);
    setIsCorrect(false);
  }, [ordered, bankExtra]);

  useEffect(() => {
    reset();
  }, [reset]);

  const selectBlank = useCallback((index: number) => {
    setActiveBlank(current => (current === index ? null : index));
  }, []);

  const placeWord = useCallback(
    (bankIndex: number) => {
      if (used[bankIndex]) {
        return;
      }
      const target = activeBlank ?? assignment.findIndex(item => item === null);
      if (target === -1 || assignment[target] !== null) {
        return;
      }
      const word = bank[bankIndex];
      if (word === undefined) {
        return;
      }
      const nextAssignment = [...assignment];
      nextAssignment[target] = word;
      setAssignment(nextAssignment);
      setUsed(previous => previous.map((value, index) => (index === bankIndex ? true : value)));
      const nextEmpty = nextAssignment.findIndex(item => item === null);
      setActiveBlank(nextEmpty === -1 ? null : nextEmpty);
      setChecked(false);
    },
    [activeBlank, assignment, bank, used],
  );

  const clearBlank = useCallback(
    (index: number) => {
      const word = assignment[index];
      if (word === null || word === undefined) {
        return;
      }
      setAssignment(previous => previous.map((value, position) => (position === index ? null : value)));
      setUsed(previous => {
        const bankIndex = bank.findIndex((item, position) => item === word && previous[position]);
        if (bankIndex === -1) {
          return previous;
        }
        return previous.map((value, position) => (position === bankIndex ? false : value));
      });
      setChecked(false);
    },
    [assignment, bank],
  );

  const submit = useCallback(
    (onResult?: (correct: boolean) => void) => {
      const correct = isFillCorrect(ordered, assignment);
      setChecked(true);
      setIsCorrect(correct);
      onResult?.(correct);
      return correct;
    },
    [ordered, assignment],
  );

  const solve = useCallback(() => {
    const expected = extractFillAnswers(ordered);
    const nextUsed = bank.map(() => false);
    expected.forEach(word => {
      const position = bank.findIndex((item, index) => !nextUsed[index] && item === word);
      if (position !== -1) {
        nextUsed[position] = true;
      }
    });
    setAssignment([...expected]);
    setUsed(nextUsed);
    setActiveBlank(null);
    setIsCorrect(true);
    setChecked(true);
  }, [ordered, bank]);

  return {
    sentences,
    answers,
    bank,
    used,
    assignment,
    activeBlank,
    checked,
    isCorrect,
    selectBlank,
    placeWord,
    clearBlank,
    submit,
    solve,
    reset,
  };
}

export interface MatchEngine {
  pairs: MatchPair[];
  lefts: string[];
  rights: string[];
  assignment: (number | null)[];
  selectedLeft: number | null;
  checked: boolean;
  isCorrect: boolean;
  selectLeft: (index: number) => void;
  selectRight: (position: number) => void;
  submit: (onResult?: (correct: boolean) => void) => boolean;
  solve: () => void;
  reset: () => void;
}

export function useMatchEngine(exercise: Exercise | null): MatchEngine {
  const pairs = useMemo(
    () => (exercise?.type === 'match' ? (exercise.config.pairs ?? []) : []),
    [exercise],
  );
  const lefts = useMemo(() => pairs.map(pair => pair.left), [pairs]);

  const [rights, setRights] = useState<string[]>([]);
  const [assignment, setAssignment] = useState<(number | null)[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const reset = useCallback(() => {
    setRights(shuffleItems(pairs.map(pair => pair.right), Math.random));
    setAssignment(pairs.map(() => null));
    setSelectedLeft(null);
    setChecked(false);
    setIsCorrect(false);
  }, [pairs]);

  useEffect(() => {
    reset();
  }, [reset]);

  const selectLeft = useCallback((index: number) => {
    setSelectedLeft(current => (current === index ? null : index));
  }, []);

  const selectRight = useCallback(
    (position: number) => {
      if (selectedLeft === null) {
        return;
      }
      setAssignment(previous => {
        const next = [...previous];
        const owner = next.indexOf(position);
        if (owner !== -1) {
          next[owner] = null;
        }
        next[selectedLeft] = position;
        return next;
      });
      setSelectedLeft(null);
      setChecked(false);
    },
    [selectedLeft],
  );

  const submit = useCallback(
    (onResult?: (correct: boolean) => void) => {
      const correct = isMatchCorrect(pairs, rights, assignment);
      setChecked(true);
      setIsCorrect(correct);
      onResult?.(correct);
      return correct;
    },
    [pairs, rights, assignment],
  );

  const solve = useCallback(() => {
    setAssignment(pairs.map(pair => rights.indexOf(pair.right)));
    setSelectedLeft(null);
    setIsCorrect(true);
    setChecked(true);
  }, [pairs, rights]);

  return {
    pairs,
    lefts,
    rights,
    assignment,
    selectedLeft,
    checked,
    isCorrect,
    selectLeft,
    selectRight,
    submit,
    solve,
    reset,
  };
}

export interface CrosswordEngine {
  cells: CrosswordCell[];
  entries: CrosswordEntry[];
  bank: string[];
  rows: number;
  cols: number;
  letters: Record<string, string>;
  selectedEntry: number | null;
  checked: boolean;
  isCorrect: boolean;
  selectEntry: (index: number) => void;
  setLetter: (row: number, col: number, letter: string) => void;
  submit: (onResult?: (correct: boolean) => void) => boolean;
  solve: () => void;
  reset: () => void;
}

export function useCrosswordEngine(exercise: Exercise | null): CrosswordEngine {
  const crossword = useMemo(
    () => (exercise?.type === 'crossword' ? exercise.config.crossword : undefined),
    [exercise],
  );
  const config: ExerciseConfig = useMemo(() => ({ crossword }), [crossword]);
  const bank = useMemo(
    () => (exercise?.type === 'crossword' ? (exercise.config.bank ?? []) : []),
    [exercise],
  );
  const cells = useMemo(() => crosswordCells(config), [config]);
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const reset = useCallback(() => {
    setLetters({});
    setSelectedEntry(null);
    setChecked(false);
    setIsCorrect(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset, exercise]);

  const selectEntry = useCallback((index: number) => {
    setSelectedEntry(index);
  }, []);

  const setLetter = useCallback((row: number, col: number, letter: string) => {
    const clean = letter.replace(/[^a-zA-ZñÑ]/g, '').slice(-1).toUpperCase();
    setLetters(previous => ({ ...previous, [`${row}-${col}`]: clean }));
    setChecked(false);
  }, []);

  const submit = useCallback(
    (onResult?: (correct: boolean) => void) => {
      const correct = isCrosswordCorrect(config, letters);
      setChecked(true);
      setIsCorrect(correct);
      onResult?.(correct);
      return correct;
    },
    [config, letters],
  );

  const solve = useCallback(() => {
    const next: Record<string, string> = {};
    for (const entry of crossword?.entries ?? []) {
      const stepRow = entry.direction === 'down' ? 1 : 0;
      const stepCol = entry.direction === 'across' ? 1 : 0;
      entry.word.split('').forEach((character, offset) => {
        next[`${entry.row + stepRow * offset}-${entry.col + stepCol * offset}`] =
          character.toUpperCase();
      });
    }
    setLetters(next);
    setIsCorrect(true);
    setChecked(true);
  }, [crossword]);

  return {
    cells,
    entries: crossword?.entries ?? [],
    bank,
    rows: crossword?.rows ?? 0,
    cols: crossword?.cols ?? 0,
    letters,
    selectedEntry,
    checked,
    isCorrect,
    selectEntry,
    setLetter,
    submit,
    solve,
    reset,
  };
}
