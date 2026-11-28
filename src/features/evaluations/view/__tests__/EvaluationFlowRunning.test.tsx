import { act, fireEvent, render } from '@testing-library/react-native';

import type { EvaluationEngine } from '@/features/evaluations/viewmodel/useQuizEngine';

import EvaluationFlow from '@/features/evaluations/view/EvaluationFlow';
import { runOrGuardExit } from '@/shared/services/navigation/exitGuard';

const mockBack = jest.fn();
const mockGoPrev = jest.fn();
const mockSend = jest.fn();
const mockSetAnswer = jest.fn();

const question = {
  id: 'q1',
  evaluationId: 'ev',
  orderIndex: 0,
  type: 'mcq' as const,
  config: {},
  prompt: 'Pregunta',
  options: ['a', 'b'],
  answer: 1,
  explanation: '',
};

function makeEngine(overrides: Partial<EvaluationEngine> = {}): EvaluationEngine {
  return {
    index: 0,
    total: 2,
    items: [question],
    question,
    phase: 'running',
    answers: [null],
    answer: null,
    canSend: false,
    isLast: false,
    correctCount: 0,
    outcomes: [],
    touched: [false],
    summary: { total: 0, correct: 0, accuracy: 1, byType: {} },
    runId: 1,
    setAnswer: mockSetAnswer,
    goPrev: mockGoPrev,
    goTo: jest.fn(),
    send: mockSend,
    restart: jest.fn(),
    ...overrides,
  };
}

let mockEngine = makeEngine();

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react') as typeof import('react');
  return {
    useLocalSearchParams: () => ({ lesson: 'lesson-2' }),
    useRouter: () => ({ back: mockBack, push: jest.fn(), navigate: jest.fn() }),
    useNavigation: () => ({
      addListener: jest.fn(() => () => {}),
      setOptions: jest.fn(),
      dispatch: jest.fn(),
      goBack: mockBack,
    }),
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
    usePreventRemove: () => () => {},
  };
});
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#fff', card: '#fff', line: '#ddd', warning: '#f90', success: '#0a0', danger: '#f00',
      muted: '#777', text: '#111', primary: '#00f', soft: '#eee', onPrimary: '#fff',
    },
    scale: 1,
    spacing: { xl: 20, lg: 16, md: 12, sm: 8, xxl: 32 },
    radius: { card: 12, control: 8, pill: 99, tile: 20 },
    fonts: { mono: 'monospace' },
  }),
}));
jest.mock('@/shared/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/features/modules/viewmodel/useLessonContent', () => ({
  useLessonContent: () => ({ lesson: { id: 'lesson-2', code: '2.1', title: 'Tema 2' } }),
}));
jest.mock('@/features/classes/viewmodel/useActiveGroup', () => ({
  useActiveGroup: () => null,
}));
jest.mock('@/features/modules/viewmodel/useModuleProgress', () => ({
  useModuleProgress: () => ({ markCompleted: jest.fn() }),
}));
jest.mock('@/features/auth/viewmodel/useSession', () => ({ useSession: () => ({ record: jest.fn() }) }));
jest.mock('@/features/evaluations/viewmodel/useQuizEngine', () => ({
  useEvaluationForLesson: () => ({
    evaluation: { id: 'ev', lessonId: 'lesson-2', title: 'Evaluación', description: '' },
    questions: [question],
    isLoading: false,
  }),
  useEvaluationEngine: () => mockEngine,
  useRecordEvaluationResult: () => jest.fn(),
}));
jest.mock('@/features/exercises/view/QuizOption', () => ({ QuizOption: () => null }));
jest.mock('@/features/exercises/view/activities/ActivityView', () => ({ ActivityView: () => null }));

beforeEach(() => {
  mockBack.mockClear();
  mockGoPrev.mockClear();
  mockSend.mockClear();
  mockSetAnswer.mockClear();
  mockEngine = makeEngine();
});

function startEvaluation() {
  const screen = render(<EvaluationFlow />);
  fireEvent.press(screen.getByRole('button', { name: 'Comenzar evaluación' }));
  return screen;
}

it('presenta una introducción sin revelar reactivos ni bloquear la salida', () => {
  const screen = render(<EvaluationFlow />);
  expect(screen.getByText('Comprueba tu aprendizaje')).toBeTruthy();
  expect(screen.queryByText('Pregunta')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Salir de la evaluación')).toBeNull();
});

it('deshabilita Siguiente sin respuesta y Anterior en el primer reactivo', () => {
  const { getByRole } = startEvaluation();

  expect(getByRole('button', { name: 'Siguiente' }).props.accessibilityState).toEqual({
    disabled: true,
  });
  expect(getByRole('button', { name: 'Anterior' }).props.accessibilityState).toEqual({
    disabled: true,
  });
});

it('avanza al pulsar Siguiente cuando hay respuesta', () => {
  mockEngine = makeEngine({ canSend: true, answer: { type: 'mcq', chosen: 1 } });
  const { getByRole } = startEvaluation();

  fireEvent.press(getByRole('button', { name: 'Siguiente' }));
  expect(mockSend).toHaveBeenCalledTimes(1);
});

it('abre el navegador y permite elegir un reactivo sin revelar su solución', () => {
  const screen = startEvaluation();
  expect(screen.queryByText('Respuesta correcta')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Navegador de reactivos' }));
  fireEvent.press(screen.getByRole('button', { name: 'Reactivo 1, actual, pendiente' }));
  expect(mockEngine.goTo).toHaveBeenCalledWith(0);
  expect(screen.queryByText('Respuesta correcta')).toBeNull();
});

it('permite regresar cuando no es el primer reactivo', () => {
  mockEngine = makeEngine({ index: 1 });
  const { getByRole } = startEvaluation();

  const prev = getByRole('button', { name: 'Anterior' });
  expect(prev.props.accessibilityState).toEqual({ disabled: false });
  fireEvent.press(prev);
  expect(mockGoPrev).toHaveBeenCalledTimes(1);
});

it('no cuenta un orden inicial como respondido en el navegador', () => {
  const orderQuestion = {
    ...question,
    type: 'order' as const,
    options: ['A', 'B', 'C'],
    config: {},
  };
  mockEngine = makeEngine({
    index: 0,
    total: 1,
    items: [orderQuestion],
    question: orderQuestion,
    answers: [{ type: 'order', steps: ['B', 'A', 'C'] }],
    answer: { type: 'order', steps: ['B', 'A', 'C'] },
    canSend: false,
    touched: [false],
  });
  const { getByRole, getByText } = startEvaluation();

  expect(getByText('0 de 1 respondidos')).toBeTruthy();
  expect(getByRole('button', { name: 'Siguiente' }).props.accessibilityState).toEqual({
    disabled: true,
  });
});

it('confirma antes de calificar y permite seguir revisando', () => {
  mockEngine = makeEngine({ total: 1, isLast: true, canSend: true, touched: [true], answers: [{ type: 'mcq', chosen: 0 }], answer: { type: 'mcq', chosen: 0 } });
  const { getByRole } = startEvaluation();

  fireEvent.press(getByRole('button', { name: 'Finalizar evaluación' }));
  expect(mockSend).not.toHaveBeenCalled();
  fireEvent.press(getByRole('button', { name: 'Seguir revisando' }));
  expect(mockSend).not.toHaveBeenCalled();
  fireEvent.press(getByRole('button', { name: 'Finalizar evaluación' }));
  fireEvent.press(getByRole('button', { name: 'Calificar' }));
  expect(mockSend).toHaveBeenCalledTimes(1);
});

it('advierte al salir durante la evaluación con un modal y descarta el intento', () => {
  const { getByRole, getByText, queryByText } = startEvaluation();

  expect(queryByText('Salir de la evaluación')).toBeNull();

  fireEvent.press(getByRole('button', { name: 'Volver' }));
  expect(getByText('Salir de la evaluación')).toBeTruthy();

  fireEvent.press(getByRole('button', { name: 'Salir' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockEngine.restart).toHaveBeenCalledTimes(1);
});

it('conserva el intento si el alumno decide continuar', () => {
  const { getByRole, queryByText } = startEvaluation();

  fireEvent.press(getByRole('button', { name: 'Volver' }));
  fireEvent.press(getByRole('button', { name: 'Continuar' }));

  expect(mockBack).not.toHaveBeenCalled();
  expect(mockEngine.restart).not.toHaveBeenCalled();
  expect(queryByText('Salir de la evaluación')).toBeNull();
});

it('pide confirmación al cambiar de pestaña desde la evaluación y descarta el intento', () => {
  const next = jest.fn();
  const { getByRole, getByText } = startEvaluation();

  act(() => runOrGuardExit(next));
  expect(next).not.toHaveBeenCalled();
  expect(getByText('Salir de la evaluación')).toBeTruthy();

  fireEvent.press(getByRole('button', { name: 'Salir' }));
  expect(next).toHaveBeenCalledTimes(1);
  expect(mockEngine.restart).toHaveBeenCalledTimes(1);
});
