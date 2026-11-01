import type { ExampleState } from '@/features/exercises/model/exampleStateRepository';
import {
  isTopicCompleted,
  practiceAccuracy,
  type PracticeAttempt,
  type TopicCompletionInput,
} from '@/features/modules/model/completion.logic';

function state(overrides: Partial<ExampleState> = {}): ExampleState {
  return {
    drawExampleIds: [],
    drawExerciseIds: [],
    seenExampleIds: [],
    exampleIndex: 0,
    ...overrides,
  };
}

function attempt(
  itemId: string,
  scoreCorrect: number,
  scoreTotal = 1,
  source: 'practice' | 'evaluation' = 'practice',
): PracticeAttempt {
  return { source, itemId, scoreCorrect, scoreTotal };
}

const base: TopicCompletionInput = {
  lessonsDone: true,
  poolIds: ['e1', 'e2'],
  state: state({ drawExampleIds: ['e1'], drawExerciseIds: ['e2'], seenExampleIds: ['e1'] }),
  independentExampleIds: [],
  attempts: [attempt('e2', 1)],
  evaluationScore: 80,
};

describe('practiceAccuracy', () => {
  it('toma el mejor intento de cada ejercicio del sorteo', () => {
    const accuracy = practiceAccuracy(
      ['e1', 'e2'],
      [attempt('e1', 1, 2), attempt('e1', 2, 2), attempt('e2', 0, 1)],
    );

    expect(accuracy).toBeCloseTo(0.5);
  });

  it('ignora los intentos de evaluación y cuenta 0 los no resueltos', () => {
    const accuracy = practiceAccuracy(
      ['e1', 'e2'],
      [attempt('e1', 2, 2), attempt('e2', 1, 1, 'evaluation')],
    );

    expect(accuracy).toBeCloseTo(0.5);
  });

  it('devuelve 0 sin ejercicios', () => {
    expect(practiceAccuracy([], [attempt('e1', 1)])).toBe(0);
  });
});

describe('isTopicCompleted', () => {
  it('completa con lección, ejemplos, ejercicios y evaluación aprobados', () => {
    expect(isTopicCompleted(base)).toBe(true);
  });

  it('exige la lección completada', () => {
    expect(isTopicCompleted({ ...base, lessonsDone: false })).toBe(false);
  });

  it('exige haber visto todos los ejemplos del sorteo', () => {
    expect(
      isTopicCompleted({ ...base, state: state({ drawExampleIds: ['e1'], drawExerciseIds: ['e2'] }) }),
    ).toBe(false);
  });

  it('exige ver los ejemplos independientes', () => {
    const input: TopicCompletionInput = {
      ...base,
      independentExampleIds: ['ex1'],
    };
    expect(isTopicCompleted(input)).toBe(false);
    expect(
      isTopicCompleted({ ...input, state: state({ ...input.state, seenExampleIds: ['e1', 'ex1'] }) }),
    ).toBe(true);
  });

  it('exige 80 en el total de ejercicios (79 no aprueba)', () => {
    expect(isTopicCompleted({ ...base, attempts: [attempt('e2', 79, 100)] })).toBe(false);
    expect(isTopicCompleted({ ...base, attempts: [attempt('e2', 80, 100)] })).toBe(true);
  });

  it('exige 80 en la evaluación cuando el tema la tiene', () => {
    expect(isTopicCompleted({ ...base, evaluationScore: 79 })).toBe(false);
    expect(isTopicCompleted({ ...base, evaluationScore: 80 })).toBe(true);
  });

  it('sin evaluación solo exige el resto de condiciones', () => {
    expect(isTopicCompleted({ ...base, evaluationScore: null })).toBe(true);
  });

  it('sin ejemplos ni banco de ejercicios no bloquea el tema', () => {
    expect(
      isTopicCompleted({
        lessonsDone: true,
        poolIds: [],
        state: state(),
        independentExampleIds: [],
        attempts: [],
        evaluationScore: null,
      }),
    ).toBe(true);
  });

  it('sin sorteo de ejemplos no completa aunque haya banco', () => {
    expect(
      isTopicCompleted({
        ...base,
        state: state({ drawExerciseIds: ['e2'], seenExampleIds: [] }),
      }),
    ).toBe(false);
  });
});
