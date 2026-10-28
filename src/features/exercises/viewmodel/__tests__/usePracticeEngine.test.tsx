import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Exercise } from '@/shared/model/entities';
import * as attemptRepository from '@/features/exercises/model/attemptRepository';
import * as exerciseRepository from '@/features/exercises/model/exerciseRepository';

import { usePracticeEngine } from '@/features/exercises/viewmodel/usePracticeEngine';

const mockDb = { marker: 'db' };
let mockAccountState: { id: number } | null = { id: 7 };

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/features/auth/viewmodel/useAuth', () => ({ useAuth: () => ({ account: mockAccountState }) }));
jest.mock('@/features/exercises/model/attemptRepository');
jest.mock('@/features/exercises/model/exerciseRepository');
jest.mock('@/features/exercises/model/exampleStateRepository', () => ({
  selectExampleState: jest.fn(async () => ({
    drawExampleIds: [],
    drawExerciseIds: [],
    seenExampleIds: [],
    exampleIndex: 0,
  })),
  saveExampleState: jest.fn(async () => {}),
}));
jest.mock('@/features/exercises/viewmodel/lessonDraw', () => ({
  ensureLessonDraw: jest.fn(async () => ({
    drawExampleIds: [],
    drawExerciseIds: [],
    seenExampleIds: [],
    exampleIndex: 0,
  })),
}));

const insertAttempt = attemptRepository.insertAttempt as jest.MockedFunction<
  typeof attemptRepository.insertAttempt
>;
const selectPracticeExercisesByLesson = exerciseRepository.selectPracticeExercisesByLesson as jest.MockedFunction<
  typeof exerciseRepository.selectPracticeExercisesByLesson
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
  selectPracticeExercisesByLesson.mockResolvedValue([fillExercise]);
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
  selectPracticeExercisesByLesson.mockResolvedValue([fillExercise, orderExercise]);

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
    { correct: 1, total: 1 },
  );
});

it('no escribe intentos cuando no hay cuenta', async () => {
  mockAccountState = null;

  const { result } = renderHook(() => usePracticeEngine('lesson-2'));

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  act(() => result.current.submit('respuesta', true));

  expect(insertAttempt).not.toHaveBeenCalled();
});

it('califica solo las preguntas de la sesión con puntaje parcial', async () => {
  selectPracticeExercisesByLesson.mockResolvedValue([fillExercise, orderExercise]);

  const { result } = renderHook(() => usePracticeEngine('lesson-2'));

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  act(() => result.current.submit('respuesta', false, { correct: 1, total: 4 }));
  act(() => result.current.next());
  act(() => result.current.submit('otra', true, { correct: 2, total: 2 }));
  act(() => result.current.next());

  expect(result.current.phase).toBe('summary');
  expect(result.current.summary.total).toBe(2);
  expect(result.current.summary.correct).toBeCloseTo(1.25);
  expect(result.current.summary.accuracy).toBeCloseTo(0.625);
  expect(result.current.summary.byQuestion.map(question => question.correct)).toEqual([1, 2]);
});
