import { parseProgressBackup } from '@/features/profile/model/backup.logic';

const validBackup = JSON.stringify({
  version: 1,
  exportedAt: '2026-10-15T00:00:00.000Z',
  moduleProgress: [{ lessonId: 'lesson-1', completed: true, updatedAt: '2026-10-15T00:00:00.000Z' }],
  attempts: [
    {
      source: 'practice',
      itemId: 'exercise-1',
      itemType: 'fill',
      lessonId: 'lesson-1',
      correct: true,
      createdAt: '2026-10-15T00:00:00.000Z',
    },
  ],
  evaluationResults: [
    {
      evaluationId: 'evaluation-1',
      score: 100,
      correctCount: 2,
      totalCount: 2,
      createdAt: '2026-10-15T00:00:00.000Z',
    },
  ],
});

describe('parseProgressBackup', () => {
  it('acepta un respaldo válido', () => {
    expect(parseProgressBackup(validBackup).moduleProgress[0]?.lessonId).toBe('lesson-1');
  });

  it('rechaza versiones desconocidas', () => {
    expect(() => parseProgressBackup(validBackup.replace('"version":1', '"version":2'))).toThrow(
      'Formato de respaldo no compatible.',
    );
  });

  it('rechaza intentos con una fuente desconocida', () => {
    expect(() => parseProgressBackup(validBackup.replace('"practice"', '"other"'))).toThrow(
      'Los intentos del respaldo no son válidos.',
    );
  });
});
