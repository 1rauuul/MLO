import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render } from '@testing-library/react-native';

import TopicScreen from '@/features/modules/view/TopicScreen';
import { parseCourseManifest } from '@/shared/services/content/coursesV3';
import type {
  Evaluation,
  Example,
  Exercise,
  Lesson,
  Topic,
  Unit,
} from '@/shared/model/entities';

const fixture = JSON.parse(
  readFileSync(
    join(__dirname, '..', '..', '..', '..', 'shared', 'services', 'content', 'remote', '__fixtures__', 'v3', 'x03', 'manifest-topics.json'),
    'utf8',
  ),
) as unknown;
const release = parseCourseManifest(fixture, 'demo');

const topic: Topic = {
  id: 'demo-t1',
  unitId: 'demo-u1',
  title: 'Subtema con varias actividades',
  summary: 'Dos lecciones y dos evaluaciones.',
  position: 0,
};
const unit: Unit = {
  id: 'demo-u1',
  number: 1,
  title: 'Fundamentos',
  description: 'Unidad de ejemplo.',
  difficulty: 'Fundamental',
  color: 'blue',
};
const lessons = release.lessons as unknown as Lesson[];
const examples = release.examples as unknown as Example[];
const exercises = release.exercises as unknown as Exercise[];
const evaluations = release.evaluations as unknown as Evaluation[];

let mockHub: Record<string, unknown> = {};
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({ id: 'demo-t1' }),
}));
jest.mock('@/features/modules/viewmodel/useCourses', () => ({
  useCourses: () => ({ activeCatalogId: 'demo' }),
}));
jest.mock('@/features/modules/viewmodel/useLessonHub', () => ({
  useLessonHub: () => mockHub,
}));
jest.mock('@/features/auth/viewmodel/useSession', () => ({
  useSession: () => ({ record: jest.fn() }),
}));
jest.mock('@/shared/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#fff',
      card: '#fff',
      line: '#ddd',
      warning: '#f90',
      success: '#0a0',
      danger: '#f00',
      muted: '#777',
      text: '#111',
      primary: '#00f',
      soft: '#eee',
      onPrimary: '#fff',
    },
    scale: 1,
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    radius: { card: 12, control: 8, tile: 20, pill: 99 },
    fonts: { mono: 'monospace', sans: 'System' },
  }),
}));

function makeHub(overrides: Record<string, unknown> = {}) {
  mockHub = {
    topic,
    unit,
    lessons,
    examples,
    exercises,
    evaluations,
    completed: false,
    isLoading: false,
    error: null,
    refresh: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  mockPush.mockClear();
  makeHub();
});

describe('TopicScreen', () => {
  it('muestra el estado y las actividades como mosaicos', () => {
    const { getByText, getByLabelText, queryByLabelText } = render(<TopicScreen />);

    expect(getByText('Subtema con varias actividades')).toBeTruthy();
    expect(getByText('En progreso')).toBeTruthy();
    expect(getByLabelText('Ejemplos. Demostración guiada')).toBeTruthy();
    expect(getByLabelText('Ejercicios. Práctica lo aprendido')).toBeTruthy();
    expect(queryByLabelText('Lecciones. Concepto y síntesis')).toBeNull();
    expect(queryByLabelText('Evaluación. Comprueba tu avance')).toBeNull();
  });

  it('abre los ejemplos y ejercicios del subtema', () => {
    const { getByLabelText } = render(<TopicScreen />);

    fireEvent.press(getByLabelText('Ejemplos. Demostración guiada'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/ejemplos',
      params: { lesson: 'demo-l1.1' },
    });

    fireEvent.press(getByLabelText('Ejercicios. Práctica lo aprendido'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/ejercicios',
      params: { lesson: 'demo-l1.1' },
    });
  });

  it('lista las lecciones y evaluaciones cuando hay más de una', () => {
    const { getByText, getByLabelText } = render(<TopicScreen />);

    expect(getByText('Primera lección')).toBeTruthy();
    expect(getByText('Segunda lección')).toBeTruthy();
    expect(getByText('Evaluación uno')).toBeTruthy();
    expect(getByText('Evaluación dos')).toBeTruthy();

    fireEvent.press(getByLabelText('Evaluación: Evaluación dos'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/evaluacion',
      params: { lesson: 'demo-l1.1', evaluationId: 'demo-ev2', catalog: 'demo' },
    });
  });

  it('abre directo la única lección y la única evaluación', () => {
    makeHub({ lessons: [lessons[0]], evaluations: [evaluations[0]] });

    const { getByLabelText, queryByText } = render(<TopicScreen />);

    expect(queryByText('Primera lección')).toBeNull();
    fireEvent.press(getByLabelText('Lecciones. Concepto y síntesis'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/lecciones/[id]',
      params: { id: 'demo-l1.1' },
    });

    fireEvent.press(getByLabelText('Evaluación. Comprueba tu avance'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/evaluacion',
      params: { lesson: 'demo-l1.1', evaluationId: 'demo-ev1', catalog: 'demo' },
    });
  });

  it('marca el subtema completado', () => {
    makeHub({ completed: true });

    const { getByText } = render(<TopicScreen />);

    expect(getByText('Subtema completado')).toBeTruthy();
  });

  it('muestra un estado vacío cuando el subtema no tiene contenido', () => {
    makeHub({ lessons: [], examples: [], exercises: [], evaluations: [] });

    const { getByText } = render(<TopicScreen />);

    expect(getByText('Sin contenido')).toBeTruthy();
    expect(getByText('Este subtema aún no tiene lecciones ni actividades.')).toBeTruthy();
  });

  it('no rompe enlaces v2 antiguos que llegan sin subtema resoluble', () => {
    makeHub({ topic: null, unit: null, lessons: [], examples: [], exercises: [], evaluations: [] });

    const { getByText } = render(<TopicScreen />);

    expect(getByText('Subtema no encontrado')).toBeTruthy();
    expect(getByText('Este subtema ya no está disponible.')).toBeTruthy();
  });
});
