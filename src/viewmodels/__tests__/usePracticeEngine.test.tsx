import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Exercise } from '@/models/entities';
import * as attemptRepository from '@/data/repositories/attemptRepository';
import * as exerciseRepository from '@/data/repositories/exerciseRepository';

import { usePracticeEngine } from '../usePracticeEngine';

const mockDb = { marker: 'db' };
let mockAccountState: { id: number } | null = { id: 7 };

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('../useAuth', () => ({ useAuth: () => ({ account: mockAccountState }) }));
jest.mock('@/data/repositories/attemptRepository');
jest.mock('@/data/repositories/exerciseRepository');

const insertAttempt = attemptRepository.insertAttempt as jest.MockedFunction<
  typeof attemptRepository.insertAttempt
>;
const selectAttemptsByLesson = attemptRepository.selectAttemptsByLesson as jest.MockedFunction<
  typeof attemptRepository.selectAttemptsByLesson
>;
const selectExercisesByLesson = exerciseRepository.selectExercisesByLesson as jest.MockedFunction<
  typeof exerciseRepository.selectExercisesByLesson
>;

const fillExercise: Exercise = {
  id: 'fill-1',
  lessonId: 'lesson-2',
  type: 'fill',
  prompt: 'Completa el enunciado',
  instructions: '',
  correctOrder: [],
  config: { sentences: ['El {{requisito}} guía el trabajo.'], bank: [] },
  explanation: 'El requisito es la base.',
};

const orderExercise: Exercise = {
  id: 'order-1',
  lessonId: 'lesson-2',
  type: 'order',
  prompt: 'Ordena los pasos',
  instructions: '',
  correctOrder: ['A', 'B'],
  config: {},
  explanation: 'Primero A, luego B.',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAccountState = { id: 7 };
  selectAttemptsByLesson.mockResolvedValue([]);
  selectExercisesByLesson.mockResolvedValue([fillExercise]);
});

it('persiste un único intento por pulsación de Comprobar', async () => {
  const { result } = renderHook(() => usePracticeEngine('lesson-2'));

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.current).not.toBeNull();

  act(() => result.current.submit('respuesta', true));
  act(() => result.current.submit('respuesta', true));

  expect(insertAttempt).toHaveBeenCalledTimes(1);
});

it('permite registrar un nuevo intento al avanzar al siguiente ejercicio', async () => {
  selectExercisesByLesson.mockResolvedValue([fillExercise, orderExercise]);

  const { result } = renderHook(() => usePracticeEngine('lesson-2'));

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  act(() => result.current.submit('respuesta', true));
  act(() => result.current.next());
  act(() => result.current.submit('otra', false));

  expect(insertAttempt).toHaveBeenCalledTimes(2);
  expect(insertAttempt).toHaveBeenNthCalledWith(
    1,
    mockDb,
    7,
    'practice',
    expect.any(String),
    expect.any(String),
    'lesson-2',
    true,
  );
});

it('no escribe intentos cuando no hay cuenta', async () => {
  mockAccountState = null;

  const { result } = renderHook(() => usePracticeEngine('lesson-2'));

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  act(() => result.current.submit('respuesta', true));

  expect(insertAttempt).not.toHaveBeenCalled();
});

it('marca fase summary y refresca el resumen al terminar la lista', async () => {
  const { result } = renderHook(() => usePracticeEngine('lesson-2'));

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  act(() => result.current.submit('respuesta', true));
  act(() => result.current.next());

  expect(result.current.phase).toBe('summary');
  await waitFor(() => expect(selectAttemptsByLesson).toHaveBeenCalled());
});
