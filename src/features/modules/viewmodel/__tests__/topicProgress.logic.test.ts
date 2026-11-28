import { computeTopicProgress } from '@/features/modules/viewmodel/topicProgress.logic';
import type { Attempt, Exercise } from '@/shared/model/entities';

const exercise = (id: string) => ({ id } as Exercise);
const attempt = (itemId: string, source: 'practice' | 'evaluation' = 'practice') =>
  ({ itemId, source, lessonId: 'l1' } as Attempt);

describe('computeTopicProgress', () => {
  it('combina lecciones, ejercicios y evaluación con datos registrados', () => {
    const progress = computeTopicProgress({
      lessonIds: ['l1', 'l2'],
      completionMap: { l1: true, l2: false },
      exercises: [exercise('e1'), exercise('e2'), exercise('e3')],
      attempts: [attempt('e1'), attempt('e1'), attempt('e2'), attempt('e9', 'evaluation')],
      evaluationScores: { l1: 80, l2: null },
    });

    expect(progress.lessons).toMatchObject({ done: 1, total: 2, state: 'in-progress' });
    expect(progress.exercises).toMatchObject({ done: 2, total: 3, state: 'in-progress' });
    expect(progress.evaluation).toMatchObject({ score: 80, state: 'completed' });
  });

  it('distingue pendiente de completado', () => {
    const progress = computeTopicProgress({
      lessonIds: ['l1'],
      completionMap: {},
      exercises: [exercise('e1')],
      attempts: [],
      evaluationScores: { l1: null },
    });

    expect(progress.lessons.state).toBe('pending');
    expect(progress.exercises.state).toBe('pending');
    expect(progress.evaluation.state).toBe('pending');
  });

  it('ignora intentos de evaluación y ejercicios de otro subtema para el conteo de práctica', () => {
    const progress = computeTopicProgress({
      lessonIds: ['l1'],
      completionMap: {},
      exercises: [exercise('e1')],
      attempts: [attempt('e1', 'evaluation'), attempt('e2')],
      evaluationScores: {},
    });

    expect(progress.exercises).toMatchObject({ done: 0, total: 1, state: 'pending' });
    expect(progress.evaluation.state).toBe('pending');
  });
});
