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

describe('TopicScreen v3', () => {
  it('muestra las dos lecciones y las actividades del fixture en orden', () => {
    const { getByText, getAllByRole, getByLabelText } = render(<TopicScreen />);

    expect(getByText('Subtema con varias actividades')).toBeTruthy();
    expect(getByText('Primera lección')).toBeTruthy();
    expect(getByText('Segunda lección')).toBeTruthy();
    expect(lessons).toHaveLength(2);

    const labels = getAllByRole('button')
      .map(button => String(button.props.accessibilityLabel))
      .filter(label =>
        label.startsWith('Ejemplo:') ||
        label.startsWith('Ejercicio:') ||
        label.startsWith('Evaluación:'),
      );

    expect(labels).toEqual([
      'Ejemplo: Ejemplo de relación',
      'Ejemplo: Ejemplo de completar',
      'Ejercicio: Ordena el proceso',
      'Ejercicio: Completa la definición',
      'Evaluación: Evaluación uno',
      'Evaluación: Evaluación dos',
    ]);

    fireEvent.press(getByLabelText('Evaluación: Evaluación dos'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/evaluacion',
      params: { lesson: 'demo-l1.1', evaluationId: 'demo-ev2', catalog: 'demo' },
    });
  });

  it('respeta el orden de posición aunque los ids no sean alfabéticos', () => {
    makeHub({
      lessons: [],
      exercises: [],
      evaluations: [],
      examples: [
        { ...examples[1], id: 'z-demo-ex', title: 'Primero por posición', position: 0 },
        { ...examples[0], id: 'a-demo-ex', title: 'Segundo por posición', position: 1 },
      ],
    });

    const { getAllByRole } = render(<TopicScreen />);

    const labels = getAllByRole('button')
      .map(button => String(button.props.accessibilityLabel))
      .filter(label => label.startsWith('Ejemplo:'));

    expect(labels).toEqual([
      'Ejemplo: Primero por posición',
      'Ejemplo: Segundo por posición',
    ]);
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
