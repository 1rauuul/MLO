import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { EvaluationEngine } from '@/features/evaluations/viewmodel/useQuizEngine';

import EvaluationFlow from '@/features/evaluations/view/EvaluationFlow';

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
    summary: { total: 0, correct: 0, accuracy: 1, byType: {} },
    setAnswer: mockSetAnswer,
    goPrev: mockGoPrev,
    send: mockSend,
    restart: jest.fn(),
    ...overrides,
  };
}

let mockEngine = makeEngine();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ lesson: 'lesson-2' }),
  useRouter: () => ({ back: mockBack, push: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
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

it('deshabilita Enviar sin respuesta y Anterior en el primer reactivo', () => {
  const { getByRole } = render(<EvaluationFlow />);

  expect(getByRole('button', { name: 'Enviar' }).props.accessibilityState).toEqual({
    disabled: true,
  });
  expect(getByRole('button', { name: 'Anterior' }).props.accessibilityState).toEqual({
    disabled: true,
  });
});

it('envía el reactivo al pulsar Enviar cuando hay respuesta', () => {
  mockEngine = makeEngine({ canSend: true, answer: { type: 'mcq', chosen: 1 } });
  const { getByRole } = render(<EvaluationFlow />);

  fireEvent.press(getByRole('button', { name: 'Enviar' }));
  expect(mockSend).toHaveBeenCalledTimes(1);
});

it('permite regresar cuando no es el primer reactivo', () => {
  mockEngine = makeEngine({ index: 1 });
  const { getByRole } = render(<EvaluationFlow />);

  const prev = getByRole('button', { name: 'Anterior' });
  expect(prev.props.accessibilityState).toEqual({ disabled: false });
  fireEvent.press(prev);
  expect(mockGoPrev).toHaveBeenCalledTimes(1);
});

it('usa Calificar en el último reactivo', () => {
  mockEngine = makeEngine({ index: 1, isLast: true, canSend: true, answer: { type: 'mcq', chosen: 0 } });
  const { getByRole } = render(<EvaluationFlow />);

  fireEvent.press(getByRole('button', { name: 'Calificar' }));
  expect(mockSend).toHaveBeenCalledTimes(1);
});

it('advierte al salir durante la evaluación', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByRole } = render(<EvaluationFlow />);

  fireEvent.press(getByRole('button', { name: 'Volver' }));
  expect(alert).toHaveBeenCalled();
  alert.mockRestore();
});
