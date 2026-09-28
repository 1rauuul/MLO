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

interface ActivityViewProps {
  exercise: Exercise;
  onSubmit: (answer: string, correct: boolean) => void;
  allowReset?: boolean;
}

export function ActivityView({ exercise, onSubmit, allowReset = true }: ActivityViewProps) {
  const order = useExerciseEngine(exercise);
  const fill = useFillEngine(exercise);
  const match = useMatchEngine(exercise);
  const crossword = useCrosswordEngine(exercise);

  switch (exercise.type) {
    case 'order':
      return <OrderExercise engine={order} onSubmit={onSubmit} />;
    case 'fill':
      return <FillExercise engine={fill} onSubmit={onSubmit} showReset={allowReset} />;
    case 'match':
      return <MatchExercise engine={match} onSubmit={onSubmit} showReset={allowReset} />;
    case 'crossword':
      return <CrosswordExercise engine={crossword} onSubmit={onSubmit} />;
    default:
      return null;
  }
}
