import { act, renderHook } from '@testing-library/react-native';

import type { Exercise } from '@/models/entities';

import { useExerciseEngine } from '../useExerciseEngine';

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
});
