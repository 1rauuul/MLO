import { useEffect, useRef } from 'react';

import type { Exercise } from '@/shared/model/entities';
import type { EvaluationAnswer } from '@/features/evaluations/viewmodel/evaluation.logic';
import {
  useCrosswordEngine,
  useExerciseEngine,
  useFillEngine,
  useMatchEngine,
} from '@/features/exercises/viewmodel/useExerciseEngine';

import { FillExercise } from '@/features/exercises/view/FillExercise';
import { MatchExercise } from '@/features/exercises/view/MatchExercise';
import { CrosswordExercise } from '@/features/exercises/view/activities/CrosswordExercise';
import { OrderExercise } from '@/features/exercises/view/activities/OrderExercise';

export type ActivityVariant = 'default' | 'example';

interface ActivityViewProps {
  exercise: Exercise;
  onSubmit: (answer: string, correct: boolean) => void;
  allowReset?: boolean;
  locked?: boolean;
  variant?: ActivityVariant;
  revealSignal?: number;
  initialAnswer?: EvaluationAnswer | null;
  onAnswerChange?: (answer: EvaluationAnswer) => void;
  hideCheck?: boolean;
}

export function ActivityView({
  exercise,
  onSubmit,
  allowReset = true,
  locked = false,
  variant = 'default',
  revealSignal = 0,
  initialAnswer = null,
  onAnswerChange,
  hideCheck = false,
}: ActivityViewProps) {
  const order = useExerciseEngine(
    exercise,
    initialAnswer?.type === 'order' ? initialAnswer.steps : undefined,
  );
  const fill = useFillEngine(
    exercise,
    initialAnswer?.type === 'fill'
      ? { ordered: initialAnswer.ordered, assignment: initialAnswer.assignment }
      : undefined,
  );
  const match = useMatchEngine(
    exercise,
    initialAnswer?.type === 'match'
      ? { rights: initialAnswer.rights, assignment: initialAnswer.assignment }
      : undefined,
  );
  const crossword = useCrosswordEngine(
    exercise,
    initialAnswer?.type === 'crossword' ? initialAnswer.letters : undefined,
  );

  const enginesRef = useRef({ order, fill, match, crossword });
  useEffect(() => {
    enginesRef.current = { order, fill, match, crossword };
  });

  const onChangeRef = useRef(onAnswerChange);
  useEffect(() => {
    onChangeRef.current = onAnswerChange;
  });

  useEffect(() => {
    if (exercise.type === 'order') {
      onChangeRef.current?.({ type: 'order', steps: order.steps });
    }
  }, [exercise.type, order.steps]);

  useEffect(() => {
    if (exercise.type === 'fill') {
      onChangeRef.current?.({ type: 'fill', ordered: fill.ordered, assignment: fill.assignment });
    }
  }, [exercise.type, fill.ordered, fill.assignment]);

  useEffect(() => {
    if (exercise.type === 'match') {
      onChangeRef.current?.({ type: 'match', rights: match.rights, assignment: match.assignment });
    }
  }, [exercise.type, match.rights, match.assignment]);

  useEffect(() => {
    if (exercise.type === 'crossword') {
      onChangeRef.current?.({ type: 'crossword', letters: crossword.letters });
    }
  }, [exercise.type, crossword.letters]);

  useEffect(() => {
    if (revealSignal <= 0) {
      return;
    }
    const engines = enginesRef.current;
    if (exercise.type === 'order') {
      engines.order.solve();
    } else if (exercise.type === 'fill') {
      engines.fill.solve();
    } else if (exercise.type === 'match') {
      engines.match.solve();
    } else if (exercise.type === 'crossword') {
      engines.crossword.solve();
    }
  }, [revealSignal, exercise.type]);

  switch (exercise.type) {
    case 'order':
      return (
        <OrderExercise engine={order} onSubmit={onSubmit} locked={locked} variant={variant} hideCheck={hideCheck} />
      );
    case 'fill':
      return (
        <FillExercise
          engine={fill}
          onSubmit={onSubmit}
          showReset={allowReset}
          locked={locked}
          variant={variant}
          hideCheck={hideCheck}
        />
      );
    case 'match':
      return (
        <MatchExercise
          engine={match}
          onSubmit={onSubmit}
          showReset={allowReset}
          locked={locked}
          variant={variant}
          hideCheck={hideCheck}
        />
      );
    case 'crossword':
      return (
        <CrosswordExercise engine={crossword} onSubmit={onSubmit} locked={locked} variant={variant} hideCheck={hideCheck} />
      );
    default:
      return null;
  }
}
