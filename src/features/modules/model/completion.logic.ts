import type { ExampleState } from '@/features/exercises/model/exampleStateRepository';

export const TOPIC_PASS_SCORE = 80;

export interface PracticeAttempt {
  source: 'practice' | 'evaluation';
  itemId: string;
  scoreCorrect: number;
  scoreTotal: number;
}

export interface TopicCompletionInput {
  lessonsDone: boolean;
  /** Banco de práctica del tema (core + extras de clase). */
  poolIds: string[];
  state: ExampleState;
  /** Ejemplos que no son ejercicios del banco (siempre se muestran). */
  independentExampleIds: string[];
  attempts: PracticeAttempt[];
  /** `null` cuando el tema no tiene evaluación. */
  evaluationScore: number | null;
}

/** 0..1: promedio del mejor intento de cada ejercicio del sorteo; sin intento cuenta 0. */
export function practiceAccuracy(drawnIds: string[], attempts: PracticeAttempt[]): number {
  if (drawnIds.length === 0) {
    return 0;
  }
  const best = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.source !== 'practice' || attempt.scoreTotal <= 0) {
      continue;
    }
    const fraction = attempt.scoreCorrect / attempt.scoreTotal;
    if (fraction > (best.get(attempt.itemId) ?? 0)) {
      best.set(attempt.itemId, fraction);
    }
  }
  const points = drawnIds.reduce((sum, id) => sum + (best.get(id) ?? 0), 0);
  return points / drawnIds.length;
}

export function isTopicCompleted(input: TopicCompletionInput): boolean {
  if (!input.lessonsDone) {
    return false;
  }
  const pool = new Set(input.poolIds);
  const exampleIds = [
    ...input.state.drawExampleIds.filter(id => pool.has(id)),
    ...input.independentExampleIds,
  ];
  const examplesDone =
    exampleIds.length > 0
      ? exampleIds.every(id => input.state.seenExampleIds.includes(id))
      : input.poolIds.length === 0;
  if (!examplesDone) {
    return false;
  }
  const drawnExercises = input.state.drawExerciseIds.filter(id => pool.has(id));
  const practiceIds = drawnExercises.length > 0 ? drawnExercises : input.poolIds;
  const exercisesDone =
    practiceIds.length === 0 ||
    practiceAccuracy(practiceIds, input.attempts) >= TOPIC_PASS_SCORE / 100;
  if (!exercisesDone) {
    return false;
  }
  return input.evaluationScore === null || input.evaluationScore >= TOPIC_PASS_SCORE;
}
