import { act, renderHook } from '@testing-library/react-native';

import type { Question } from '@/models/entities';

import { useQuizEngine } from '../useQuizEngine';

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

const questions: Question[] = [
  {
    id: 'q1',
    evaluationId: 'ev',
    orderIndex: 0,
    prompt: 'Pregunta 1',
    options: ['a', 'b'],
    answer: 1,
    explanation: 'explicación 1',
  },
  {
    id: 'q2',
    evaluationId: 'ev',
    orderIndex: 1,
    prompt: 'Pregunta 2',
    options: ['a', 'b'],
    answer: 0,
    explanation: 'explicación 2',
  },
];

describe('useQuizEngine', () => {
  it('avanza, calcula el puntaje y finaliza', () => {
    const { result } = renderHook(() => useQuizEngine(questions));

    expect(result.current.total).toBe(2);
    expect(result.current.index).toBe(0);

    act(() => result.current.choose(1));
    expect(result.current.chosen).toBe(1);

    act(() => result.current.next());
    expect(result.current.index).toBe(1);

    act(() => result.current.choose(1));
    act(() => result.current.next());

    expect(result.current.finished).toBe(true);
    expect(result.current.correctCount).toBe(1);
    expect(result.current.score).toBe(50);
  });

  it('ignora un segundo intento de respuesta en la misma pregunta', () => {
    const { result } = renderHook(() => useQuizEngine(questions));
    act(() => result.current.choose(1));
    act(() => result.current.choose(0));
    expect(result.current.chosen).toBe(1);
  });

  it('reinicia el estado', () => {
    const { result } = renderHook(() => useQuizEngine(questions));
    act(() => result.current.choose(1));
    act(() => result.current.next());
    act(() => result.current.restart());
    expect(result.current.index).toBe(0);
    expect(result.current.chosen).toBeNull();
    expect(result.current.finished).toBe(false);
  });
});
