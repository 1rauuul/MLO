import { fireEvent, render } from '@testing-library/react-native';

import type { Lesson } from '@/shared/model/entities';

import LessonDetailScreen from '@/features/modules/view/LessonScreen';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockMarkCompleted = jest.fn(async () => {});

const lessonOne: Lesson = {
  id: 'lesson-1',
  unitId: 'u1',
  code: '1.1',
  title: 'Introducción',
  eyebrow: 'Módulo 01 · Lección 01',
  body: '',
  codeSample: '',
  contextTitle: '',
  contextBody: '',
  synthesis: ['La ingeniería cubre el ciclo de vida.', 'Un software de calidad es mantenible.'],
  content: [],
  position: 0,
};
const lessonTwo: Lesson = { ...lessonOne, id: 'lesson-2', code: '1.2', title: 'Lección 2', position: 1 };

let mockUnitLessons: Lesson[] = [lessonOne, lessonTwo];

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'lesson-1' }),
  useRouter: () => ({ back: mockBack, push: mockPush, navigate: mockNavigate }),
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
jest.mock('@/features/modules/view/RichContent', () => ({ RichContent: () => null }));
jest.mock('@/features/modules/viewmodel/useLessonContent', () => ({
  useLessonContent: () => ({ lesson: lessonOne, examples: [], isLoading: false }),
}));
jest.mock('@/features/exercises/viewmodel/useExerciseEngine', () => ({
  useExercisesForLesson: () => ({ exercises: [], isLoading: false }),
}));
jest.mock('@/features/evaluations/viewmodel/useQuizEngine', () => ({
  useEvaluationForLesson: () => ({ evaluation: null, questions: [], isLoading: false }),
}));
jest.mock('@/features/modules/viewmodel/useModuleProgress', () => ({
  useModuleProgress: () => ({ markCompleted: mockMarkCompleted }),
}));
jest.mock('@/features/modules/viewmodel/useCatalog', () => ({
  useCatalog: () => ({ lessonsByUnit: { u1: mockUnitLessons }, progressMap: {}, refresh: jest.fn() }),
}));
jest.mock('@/features/auth/viewmodel/useSession', () => ({
  useSession: () => ({ record: jest.fn() }),
}));

beforeEach(() => {
  mockBack.mockClear();
  mockPush.mockClear();
  mockNavigate.mockClear();
  mockMarkCompleted.mockClear();
  mockUnitLessons = [lessonOne, lessonTwo];
});

it('Terminar completa la lección y abre el hub del siguiente subtema', () => {
  const { getByRole } = render(<LessonDetailScreen />);

  fireEvent.press(getByRole('button', { name: 'Síntesis' }));
  fireEvent.press(getByRole('button', { name: 'Terminar' }));

  expect(mockMarkCompleted).toHaveBeenCalledWith('lesson-1');
  expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/tema/[id]', params: { id: 'lesson-2' } });
});

it('Terminar vuelve a la pantalla principal si no hay siguiente subtema', () => {
  mockUnitLessons = [lessonOne];
  const { getByRole } = render(<LessonDetailScreen />);

  fireEvent.press(getByRole('button', { name: 'Síntesis' }));
  fireEvent.press(getByRole('button', { name: 'Terminar' }));

  expect(mockNavigate).toHaveBeenCalledWith('/');
});
