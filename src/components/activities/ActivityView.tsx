import { useEffect, useRef } from 'react';

import type { Exercise } from '@/models/entities';
import {
  useCrosswordEngine,
  useExerciseEngine,
  useFillEngine,
  useMatchEngine,
} from '@/viewmodels/useExerciseEngine';

import { FillExercise } from '../FillExercise';
import { MatchExercise } from '../MatchExercise';
import { CrosswordExercise } from './CrosswordExercise';
import { OrderExercise } from './OrderExercise';

export type ActivityVariant = 'default' | 'example';

interface ActivityViewProps {
  exercise: Exercise;
  onSubmit: (answer: string, correct: boolean) => void;
  allowReset?: boolean;
  locked?: boolean;
  variant?: ActivityVariant;
  revealSignal?: number;
}

export function ActivityView({
  exercise,
  onSubmit,
  allowReset = true,
  locked = false,
  variant = 'default',
  revealSignal = 0,
}: ActivityViewProps) {
  const order = useExerciseEngine(exercise);
  const fill = useFillEngine(exercise);
  const match = useMatchEngine(exercise);
  const crossword = useCrosswordEngine(exercise);

  const enginesRef = useRef({ order, fill, match, crossword });
  useEffect(() => {
    enginesRef.current = { order, fill, match, crossword };
  });

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
      return <OrderExercise engine={order} onSubmit={onSubmit} locked={locked} variant={variant} />;
    case 'fill':
      return (
        <FillExercise
          engine={fill}
          onSubmit={onSubmit}
          showReset={allowReset}
          locked={locked}
          variant={variant}
        />
      );
    case 'match':
      return <MatchExercise engine={match} onSubmit={onSubmit} showReset={allowReset} locked={locked} />;
    case 'crossword':
      return <CrosswordExercise engine={crossword} onSubmit={onSubmit} locked={locked} />;
    default:
      return null;
  }
}
