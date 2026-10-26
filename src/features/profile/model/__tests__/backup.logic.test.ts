import { parseProgressBackup } from '@/features/profile/model/backup.logic';

const v1Backup = {
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
};

const v2Backup = {
  ...v1Backup,
  version: 2,
  attempts: [{ ...v1Backup.attempts[0], scoreCorrect: 3, scoreTotal: 4 }],
  exampleState: [
    {
      lessonId: 'lesson-1',
      payload: {
        drawExampleIds: ['a'],
        drawExerciseIds: ['b'],
        seenExampleIds: [],
        exampleIndex: 0,
      },
      updatedAt: '2026-10-15T00:00:00.000Z',
    },
  ],
  lastLocation: {
    unitId: 'u1',
    lessonId: 'lesson-1',
    lessonCode: '1.1',
    section: 'exercise',
    updatedAt: '2026-10-15T00:00:00.000Z',
  },
};

const parse = (value: unknown) => parseProgressBackup(JSON.stringify(value));

describe('parseProgressBackup', () => {
  it('acepta el respaldo v2 con estado de ejemplos y ubicación', () => {
    const backup = parse(v2Backup);

    expect(backup.version).toBe(2);
    expect(backup.exampleState[0]?.payload.drawExerciseIds).toEqual(['b']);
    expect(backup.lastLocation?.lessonId).toBe('lesson-1');
    expect(backup.attempts[0]?.scoreCorrect).toBe(3);
  });

  it('sigue aceptando el respaldo v1 y lo normaliza a v2', () => {
    const backup = parse(v1Backup);

    expect(backup.version).toBe(2);
    expect(backup.exampleState).toEqual([]);
    expect(backup.lastLocation).toBeNull();
    expect(backup.attempts[0]?.scoreCorrect).toBe(1);
    expect(backup.attempts[0]?.scoreTotal).toBe(1);
  });

  it('rechaza versiones desconocidas', () => {
    expect(() => parse({ ...v2Backup, version: 3 })).toThrow('Formato de respaldo no compatible.');
  });

  it('rechaza intentos con una fuente desconocida', () => {
    expect(() =>
      parse({ ...v2Backup, attempts: [{ ...v2Backup.attempts[0], source: 'other' }] }),
    ).toThrow('Los intentos del respaldo no son válidos.');
  });
});
