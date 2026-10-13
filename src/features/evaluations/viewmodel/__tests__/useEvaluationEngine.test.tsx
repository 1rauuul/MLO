import { act, renderHook } from '@testing-library/react-native';

import { insertAttempt, selectAttemptsByLesson } from '@/features/exercises/model/attemptRepository';
import type { Question } from '@/shared/model/entities';

import { useEvaluationEngine } from '@/features/evaluations/viewmodel/useQuizEngine';

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('@/features/auth/viewmodel/useAuth', () => ({ useAuth: () => ({ account: { id: 1 } }) }));
jest.mock('@/features/exercises/model/attemptRepository', () => ({
  insertAttempt: jest.fn(async () => {}),
  selectAttemptsByLesson: jest.fn(async () => []),
}));

const mockInsertAttempt = insertAttempt as jest.Mock;
const mockSelectAttempts = selectAttemptsByLesson as jest.Mock;

const questions: Question[] = [
  {
    id: 'q1',
    evaluationId: 'ev',
    orderIndex: 0,
    type: 'mcq',
    config: {},
    prompt: 'p1',
    options: ['a', 'b'],
    answer: 1,
    explanation: '',
  },
  {
    id: 'q2',
    evaluationId: 'ev',
    orderIndex: 1,
    type: 'mcq',
    config: {},
    prompt: 'p2',
    options: ['a', 'b'],
    answer: 0,
    explanation: '',
  },
];

describe('useEvaluationEngine', () => {
  beforeEach(() => {
    mockInsertAttempt.mockClear();
    mockSelectAttempts.mockClear();
  });

  it('no permite enviar sin respuesta y avanza al responder', () => {
    const { result } = renderHook(() => useEvaluationEngine(questions, 'l1.2'));

    expect(result.current.canSend).toBe(false);
    act(() => result.current.setAnswer({ type: 'mcq', chosen: 1 }));
    expect(result.current.canSend).toBe(true);

    act(() => result.current.send());
    expect(result.current.index).toBe(1);
    expect(result.current.phase).toBe('running');
  });

  it('permite regresar y conserva la respuesta', () => {
    const { result } = renderHook(() => useEvaluationEngine(questions, 'l1.2'));

    act(() => result.current.setAnswer({ type: 'mcq', chosen: 1 }));
    act(() => result.current.send());
    act(() => result.current.goPrev());

    expect(result.current.index).toBe(0);
    expect(result.current.answer).toEqual({ type: 'mcq', chosen: 1 });
  });

  it('califica en el último reactivo y registra los intentos', async () => {
    const { result } = renderHook(() => useEvaluationEngine(questions, 'l1.2'));

    act(() => result.current.setAnswer({ type: 'mcq', chosen: 1 }));
    act(() => result.current.send());
    act(() => result.current.setAnswer({ type: 'mcq', chosen: 1 }));
    await act(async () => {
      result.current.send();
    });

    expect(result.current.phase).toBe('summary');
    expect(result.current.correctCount).toBe(1);
    expect(mockInsertAttempt).toHaveBeenCalledTimes(2);
  });
});
