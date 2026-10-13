import { fireEvent, render } from '@testing-library/react-native';
import type { AttemptSummary } from '@/features/evaluations/viewmodel/analytics.logic';

import PracticeScreen from '@/features/exercises/view/ExercisesScreen';
import EvaluationFlow from '@/features/evaluations/view/EvaluationFlow';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockRecord = jest.fn(async () => {});
const mockMarkCompleted = jest.fn(async () => {});
const lessonSummary: AttemptSummary = {
  total: 5,
  correct: 1,
  accuracy: 0.2,
  byType: { order: { total: 5, correct: 1 } },
};
const noneSummary: AttemptSummary = { total: 0, correct: 0, accuracy: 1, byType: {} };
const practiceSummary: AttemptSummary = {
  total: 4,
  correct: 3,
  accuracy: 0.75,
  byType: { order: { total: 3, correct: 0 }, fill: { total: 1, correct: 1 } },
};
let mockEvaluationSummary = noneSummary;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ lesson: 'lesson-2' }),
  useRouter: () => ({ back: mockBack, navigate: jest.fn(), push: mockPush }),
  useFocusEffect: jest.fn(),
}));
jest.mock('@/features/auth/viewmodel/useSession', () => ({
  useSession: () => ({
    location: { unitId: null, lessonId: null, lessonCode: null, section: null },
    record: jest.fn(),
    resumeHref: null,
    clear: jest.fn(),
  }),
}));
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#fff', card: '#fff', line: '#ddd', warning: '#f90', success: '#0a0', danger: '#f00',
      muted: '#777', text: '#111', primary: '#00f', soft: '#eee', onPrimary: '#fff',
    },
    scale: 1,
    spacing: { xl: 20, lg: 16, md: 12, sm: 8, xxl: 32 },
    radius: { card: 12, control: 8 },
    fonts: { mono: 'monospace' },
  }),
}));
jest.mock('@/shared/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/features/modules/viewmodel/useLessonContent', () => ({
  useLessonContent: () => ({ lesson: { id: 'lesson-2', code: '2.1', title: 'Tema 2' } }),
}));
jest.mock('@/features/exercises/viewmodel/usePracticeEngine', () => ({
  usePracticeEngine: () => ({ phase: 'summary', summary: lessonSummary }),
}));
jest.mock('@/features/modules/viewmodel/useModuleProgress', () => ({
  useModuleProgress: () => ({ markCompleted: mockMarkCompleted }),
}));
jest.mock('@/features/evaluations/viewmodel/useQuizEngine', () => ({
  useEvaluationForLesson: () => ({
    evaluation: { id: 'evaluation-2', lessonId: 'lesson-2', title: 'Evaluación', description: '' },
    questions: [],
    isLoading: false,
  }),
  useEvaluationEngine: () => ({
    phase: 'summary',
    total: 4,
    correctCount: 3,
    summary: mockEvaluationSummary,
    items: [],
    outcomes: [],
  }),
  useRecordEvaluationResult: () => mockRecord,
}));
jest.mock('@/features/exercises/view/activities/ActivityView', () => ({ ActivityView: () => null }));
jest.mock('@/features/exercises/view/QuizOption', () => ({ QuizOption: () => null }));

beforeEach(() => {
  mockBack.mockClear();
  mockPush.mockClear();
  mockRecord.mockClear();
  mockMarkCompleted.mockClear();
  mockEvaluationSummary = noneSummary;
});

it('keeps the lesson recommendation and shows no exit button in the exercise summary', () => {
  const { getByRole, queryByRole } = render(<PracticeScreen />);

  expect(getByRole('button', { name: 'Repasar la lección' })).toBeTruthy();
  expect(queryByRole('button', { name: 'Regresar al tema' })).toBeNull();
  expect(queryByRole('button', { name: 'Volver a módulos' })).toBeNull();
});

it('shows no review action for an evaluation result with no recommendation', () => {
  const { queryByRole } = render(<EvaluationFlow />);

  expect(queryByRole('button', { name: 'Repasar la lección' })).toBeNull();
  expect(queryByRole('button', { name: 'Resolver ejercicios' })).toBeNull();
});

it('routes the practice recommendation to exercises in the module group', () => {
  mockEvaluationSummary = practiceSummary;
  const { getByRole } = render(<EvaluationFlow />);

  fireEvent.press(getByRole('button', { name: 'Resolver ejercicios' }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/(app)/(modules)/ejercicios',
    params: { lesson: 'lesson-2' },
  });
});

it('retains the lesson review action for a lesson recommendation', () => {
  mockEvaluationSummary = lessonSummary;
  const { getByRole, queryByRole } = render(<EvaluationFlow />);

  expect(queryByRole('button', { name: 'Resolver ejercicios' })).toBeNull();
  fireEvent.press(getByRole('button', { name: 'Repasar la lección' }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/(app)/(modules)/lecciones/[id]',
    params: { id: 'lesson-2' },
  });
});
