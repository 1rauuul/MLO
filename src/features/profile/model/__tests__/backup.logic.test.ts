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
  it('acepta el respaldo v3 con grupo, ejemplos y ubicación', () => {
    const backup = parse({
      ...v2Backup,
      version: 3,
      group: { code: 'abc123', catalogId: 'k7f3q', name: 'Grupo A' },
    });

    expect(backup.version).toBe(3);
    expect(backup.group).toEqual({
      code: 'abc123',
      catalogId: 'k7f3q',
      name: 'Grupo A',
      groupId: null,
      teacherName: null,
    });
    expect(backup.exampleState[0]?.payload.drawExerciseIds).toEqual(['b']);
    expect(backup.attempts[0]?.scoreCorrect).toBe(3);
  });

  it('conserva groupId y maestro cuando el respaldo los trae', () => {
    const backup = parse({
      ...v2Backup,
      version: 3,
      group: {
        code: 'abc123',
        catalogId: 'k7f3q',
        name: 'Grupo A',
        groupId: 'g1',
        teacherName: 'Profesora Ríos',
      },
    });

    expect(backup.group?.groupId).toBe('g1');
    expect(backup.group?.teacherName).toBe('Profesora Ríos');
  });

  it('sigue aceptando v1 y v2 y los normaliza a v3 sin grupo', () => {
    const v1 = parse(v1Backup);
    const v2 = parse(v2Backup);

    expect(v1.version).toBe(3);
    expect(v2.version).toBe(3);
    expect(v1.group).toBeNull();
    expect(v1.exampleState).toEqual([]);
    expect(v1.attempts[0]?.scoreCorrect).toBe(1);
    expect(v2.exampleState).toHaveLength(1);
  });

  it('rechaza versiones desconocidas', () => {
    expect(() => parse({ ...v2Backup, version: 4 })).toThrow('Formato de respaldo no compatible.');
  });

  it('rechaza intentos con una fuente desconocida', () => {
    expect(() =>
      parse({ ...v2Backup, attempts: [{ ...v2Backup.attempts[0], source: 'other' }] }),
    ).toThrow('Los intentos del respaldo no son válidos.');
  });
});
