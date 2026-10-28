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
  it('acepta el respaldo v4 con identidad, clases, ejemplos y ubicación', () => {
    const backup = parse({
      ...v2Backup,
      version: 4,
      student: { externalKey: '11111111-1111-4111-8111-111111111111' },
      classes: [
        {
          classId: 'c1',
          code: 'ABC123',
          name: 'Grupo A',
          teacherName: 'Profesora Ríos',
        },
      ],
    });

    expect(backup.version).toBe(4);
    expect(backup.student).toEqual({
      externalKey: '11111111-1111-4111-8111-111111111111',
    });
    expect(backup.classes).toEqual([
      {
        classId: 'c1',
        code: 'ABC123',
        name: 'Grupo A',
        teacherName: 'Profesora Ríos',
      },
    ]);
    expect(backup.exampleState[0]?.payload.drawExerciseIds).toEqual(['b']);
    expect(backup.attempts[0]?.scoreCorrect).toBe(3);
  });

  it('sigue aceptando v1, v2 y v3 y los normaliza a v4 sin identidad ni clases', () => {
    const v1 = parse(v1Backup);
    const v2 = parse(v2Backup);
    const v3 = parse({
      ...v2Backup,
      version: 3,
      group: { code: 'abc123', catalogId: 'k7f3q', name: 'Grupo A' },
    });

    expect(v1.version).toBe(4);
    expect(v2.version).toBe(4);
    expect(v3.version).toBe(4);
    expect(v1.student).toBeNull();
    expect(v1.classes).toEqual([]);
    expect(v1.exampleState).toEqual([]);
    expect(v1.attempts[0]?.scoreCorrect).toBe(1);
    expect(v2.exampleState).toHaveLength(1);
  });

  it('rechaza versiones desconocidas', () => {
    expect(() => parse({ ...v2Backup, version: 5 })).toThrow('Formato de respaldo no compatible.');
  });

  it('rechaza una identidad vacía y clases repetidas', () => {
    expect(() =>
      parse({ ...v2Backup, version: 4, student: { externalKey: '  ' } }),
    ).toThrow('La identidad del respaldo está vacía.');
    expect(() =>
      parse({ ...v2Backup, version: 4, student: { externalKey: 'no-uuid' } }),
    ).toThrow('La identidad del respaldo no es un UUID válido.');
    expect(() =>
      parse({
        ...v2Backup,
        version: 4,
        classes: [
          { classId: 'c1', code: 'ABC123', name: 'A', teacherName: null },
          { classId: 'c1', code: 'ABC124', name: 'B', teacherName: null },
        ],
      }),
    ).toThrow('El respaldo repite una clase.');
  });

  it('rechaza intentos con una fuente desconocida', () => {
    expect(() =>
      parse({ ...v2Backup, attempts: [{ ...v2Backup.attempts[0], source: 'other' }] }),
    ).toThrow('Los intentos del respaldo no son válidos.');
  });
});
