import { act, renderHook } from '@testing-library/react-native';

import type { Exercise } from '@/shared/model/entities';

import {
  useCrosswordEngine,
  useExerciseEngine,
  useFillEngine,
  useMatchEngine,
} from '@/features/exercises/viewmodel/useExerciseEngine';

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

const exercise: Exercise = {
  id: 'ord',
  lessonId: 'l1.2',
  type: 'order',
  prompt: 'Ordena',
  instructions: 'Usa las flechas',
  correctOrder: ['a', 'b', 'c', 'd'],
  config: {},
  explanation: '',
};

describe('useExerciseEngine', () => {
  it('inicia con un orden mezclado distinto al correcto', () => {
    const { result } = renderHook(() => useExerciseEngine(exercise));
    expect(result.current.steps).toHaveLength(4);
    expect(result.current.steps).not.toEqual(exercise.correctOrder);
    expect([...result.current.steps].sort()).toEqual([...exercise.correctOrder].sort());
  });

  it('al comprobar marca el estado y reporta el resultado', () => {
    const { result } = renderHook(() => useExerciseEngine(exercise));

    let confirmed = true;
    act(() => {
      confirmed = result.current.submit();
    });

    expect(confirmed).toBe(false);
    expect(result.current.checked).toBe(true);
    expect(result.current.isCorrect).toBe(false);
  });

  it('permite mover elementos y reiniciar', () => {
    const { result } = renderHook(() => useExerciseEngine(exercise));
    const before = [...result.current.steps];

    act(() => {
      result.current.move(0, 1);
    });
    expect(result.current.steps).not.toEqual(before);

    act(() => {
      result.current.reset();
    });
    expect(result.current.steps).toEqual(before);
  });

  it('solve deja la secuencia correcta y marca el resultado', () => {
    const { result } = renderHook(() => useExerciseEngine(exercise));

    act(() => {
      result.current.solve();
    });

    expect(result.current.steps).toEqual(exercise.correctOrder);
    expect(result.current.checked).toBe(true);
    expect(result.current.isCorrect).toBe(true);
  });
});

const fillExercise: Exercise = {
  id: 'fill',
  lessonId: 'l1.2',
  type: 'fill',
  prompt: 'Completa',
  instructions: '',
  correctOrder: [],
  config: { sentences: ['A {{uno}} y {{dos}}.'] },
  explanation: '',
};

describe('solve de las actividades de ejemplo', () => {
  it('completar rellena las respuestas correctas y marca used', () => {
    const { result } = renderHook(() => useFillEngine(fillExercise));

    act(() => {
      result.current.solve();
    });

    expect(result.current.assignment).toEqual(['uno', 'dos']);
    expect(result.current.checked).toBe(true);
    expect(result.current.isCorrect).toBe(true);
  });

  it('enlazar asigna los pares correctos', () => {
    const matchExercise: Exercise = {
      ...fillExercise,
      id: 'match',
      type: 'match',
      config: { pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }] },
    };
    const { result } = renderHook(() => useMatchEngine(matchExercise));

    act(() => {
      result.current.solve();
    });

    expect(result.current.assignment).toEqual([
      result.current.rights.indexOf('1'),
      result.current.rights.indexOf('2'),
    ]);
    expect(result.current.checked).toBe(true);
    expect(result.current.isCorrect).toBe(true);
  });

  it('crucigrama escribe las letras de cada entrada', () => {
    const crosswordExercise: Exercise = {
      ...fillExercise,
      id: 'cross',
      type: 'crossword',
      config: {
        crossword: {
          rows: 1,
          cols: 2,
          entries: [{ row: 0, col: 0, direction: 'across', word: 'AB', clue: 'x' }],
        },
      },
    };
    const { result } = renderHook(() => useCrosswordEngine(crosswordExercise));

    act(() => {
      result.current.solve();
    });

    expect(result.current.letters['0-0']).toBe('A');
    expect(result.current.letters['0-1']).toBe('B');
    expect(result.current.checked).toBe(true);
    expect(result.current.isCorrect).toBe(true);
  });
});
