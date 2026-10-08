import { fireEvent, render } from '@testing-library/react-native';

import type { Lesson, Unit } from '@/models/entities';
import type { SessionLocation } from '@/viewmodels/useSession';

import ModulesScreen from '../../app/(app)/(modules)';

const mockPush = jest.fn();
const mockNavigate = jest.fn();

const mockUnit: Unit = {
  id: 'u1',
  number: 1,
  title: 'Unidad Uno',
  description: 'Descripción',
  difficulty: 'Fundamental',
  color: 'blue',
};
const mockLessonA: Lesson = {
  id: 'lesson-1',
  unitId: 'u1',
  code: '1.1',
  title: 'Lección Uno',
  eyebrow: '',
  body: '',
  codeSample: '',
  contextTitle: '',
  contextBody: '',
  synthesis: [],
  content: [],
  position: 0,
};
const mockLessonB: Lesson = {
  id: 'lesson-2',
  unitId: 'u1',
  code: '1.2',
  title: 'Lección Dos',
  eyebrow: '',
  body: '',
  codeSample: '',
  contextTitle: '',
  contextBody: '',
  synthesis: [],
  content: [],
  position: 1,
};

let mockLocation: SessionLocation = {
  unitId: null,
  lessonId: null,
  lessonCode: null,
  section: null,
};
let mockResumeHref: unknown = null;
let mockProgress: Record<string, boolean> = {};

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));
jest.mock('@/theme/theme-provider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#fff', card: '#fff', line: '#ddd', warning: '#f90', success: '#0a0', danger: '#f00',
      muted: '#777', text: '#111', primary: '#00f', soft: '#eee', onPrimary: '#fff',
    },
    scale: 1,
    spacing: { xl: 20, lg: 16, md: 12, sm: 8, xxl: 32 },
    radius: { card: 12, control: 8, pill: 99 },
    fonts: { mono: 'monospace' },
  }),
}));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/viewmodels/useAuth', () => ({
  useAuth: () => ({
    account: { id: 7, username: 'ana', displayName: 'Ana', createdAt: '' },
  }),
}));
jest.mock('@/viewmodels/useCatalog', () => ({
  useCatalog: () => ({
    units: [mockUnit],
    lessonsByUnit: { u1: [mockLessonA, mockLessonB] },
    progressMap: mockProgress,
    isLoading: false,
    refresh: jest.fn(),
  }),
}));
jest.mock('@/viewmodels/useSession', () => ({
  useSession: () => ({
    location: mockLocation,
    resumeHref: mockResumeHref,
    record: jest.fn(),
    clear: jest.fn(),
  }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockNavigate.mockClear();
  mockLocation = { unitId: null, lessonId: null, lessonCode: null, section: null };
  mockResumeHref = null;
  mockProgress = {};
});

it('resumes the stored section from the blue button when a location exists', () => {
  mockLocation = { unitId: 'u1', lessonId: 'lesson-2', lessonCode: '1.2', section: 'exercise' };
  mockResumeHref = { pathname: '/ejercicios', params: { lesson: 'lesson-2' } };

  const { getByRole, getByText } = render(<ModulesScreen />);

  expect(getByText(/Lección Dos/)).toBeTruthy();
  fireEvent.press(getByRole('button', { name: 'Continuar unidad' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/ejercicios', params: { lesson: 'lesson-2' } });
});

it('falls back to the first incomplete lesson without a stored location', () => {
  mockProgress = { 'lesson-1': true };

  const { getByRole } = render(<ModulesScreen />);

  fireEvent.press(getByRole('button', { name: 'Continuar unidad' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/tema/[id]', params: { id: 'lesson-2' } });
});
