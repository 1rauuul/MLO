import type { Attempt, Exercise } from '@/shared/model/entities';

export type TopicProgressState = 'pending' | 'in-progress' | 'completed';

export interface TopicProgressSection {
  done: number;
  total: number;
  state: TopicProgressState;
}

export interface TopicProgress {
  lessons: TopicProgressSection;
  exercises: TopicProgressSection;
  evaluation: { score: number | null; state: TopicProgressState };
}

export function topicSection(done: number, total: number): TopicProgressSection {
  const state: TopicProgressState =
    total > 0 && done >= total ? 'completed' : done > 0 ? 'in-progress' : 'pending';
  return { done, total, state };
}

/** Progreso del subtema a partir de datos registrados; los ejemplos no se inventan. */
export function computeTopicProgress(input: {
  lessonIds: string[];
  completionMap: Record<string, boolean>;
  exercises: Exercise[];
  attempts: Attempt[];
  evaluationScores: Record<string, number | null>;
}): TopicProgress {
  const lessonIds = new Set(input.lessonIds);
  const lessonsDone = input.lessonIds.filter(id => input.completionMap[id]).length;

  const exerciseIds = new Set(input.exercises.map(exercise => exercise.id));
  const attempted = new Set(
    input.attempts
      .filter(attempt => attempt.source === 'practice' && lessonIds.has(attempt.lessonId))
      .map(attempt => attempt.itemId)
      .filter(id => exerciseIds.has(id)),
  );

  const scores = input.lessonIds
    .map(id => input.evaluationScores[id])
    .filter((score): score is number => typeof score === 'number');
  const score = scores.length > 0 ? Math.max(...scores) : null;

  return {
    lessons: topicSection(lessonsDone, input.lessonIds.length),
    exercises: topicSection(attempted.size, input.exercises.length),
    evaluation: { score, state: score === null ? 'pending' : 'completed' },
  };
}
