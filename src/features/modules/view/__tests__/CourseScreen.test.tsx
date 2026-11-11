import { fireEvent, render } from '@testing-library/react-native';

import CourseScreen from '@/features/modules/view/CourseScreen';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockCatalog: Record<string, unknown> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({ id: 'base' }),
}));
jest.mock('@/features/modules/viewmodel/useCourses', () => ({
  useCourses: () => ({
    courses: [
      {
        catalogId: 'base',
        title: 'Contenido base',
        status: 'published',
        usesBase: false,
        version: '7',
        hash: 'hash-base',
        publishedAt: '2026-11-05T00:00:00.000Z',
        empty: false,
      },
    ],
  }),
}));
jest.mock('@/features/modules/viewmodel/useCatalog', () => ({
  useCatalog: () => mockCatalog,
}));
jest.mock('@/shared/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#fff', card: '#fff', line: '#ddd', warning: '#f90', success: '#0a0', danger: '#f00',
      muted: '#777', text: '#111', primary: '#00f', soft: '#eee', onPrimary: '#fff',
    },
    scale: 1,
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    radius: { card: 12, control: 8, tile: 20, pill: 99 },
    fonts: { mono: 'monospace', sans: 'System' },
  }),
}));

const baseCatalog = {
  units: [
    {
      id: 'u1',
      number: 1,
      title: 'Introducción',
      description: 'desc',
      difficulty: 'Fundamental',
      color: 'blue',
    },
  ],
  topics: [
    { id: 't1', unitId: 'u1', title: 'Subtema A', summary: '', position: 0 },
    { id: 't2', unitId: 'u1', title: 'Subtema B', summary: '', position: 1 },
  ],
  lessonsByUnit: {
    u1: [
      { id: 'l1', unitId: 'u1', topicId: 't1', code: '1.1', title: 'Lección 1', position: 0 },
      { id: 'l2', unitId: 'u1', topicId: 't2', code: '1.2', title: 'Lección 2', position: 1 },
      { id: 'l3', unitId: 'u1', topicId: 't2', code: '1.3', title: 'Lección 3', position: 2 },
    ],
  },
  completionMap: { l1: true, l2: true },
  references: [],
  isLoading: false,
  error: null,
  refresh: jest.fn(),
};

function makeCatalog(overrides: Record<string, unknown>) {
  mockCatalog = { ...baseCatalog, ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  makeCatalog({});
});

describe('CourseScreen', () => {
  it('muestra el curso, sus unidades y el avance de cada subtema', () => {
    const { getByText, getByLabelText, queryByText } = render(<CourseScreen />);

    expect(getByText('Ingeniería de Software')).toBeTruthy();
    expect(getByText('Tus unidades')).toBeTruthy();
    expect(queryByText('Ruta de aprendizaje')).toBeNull();
    expect(getByLabelText('67% completado')).toBeTruthy();

    fireEvent.press(getByText('Ver temas'));

    expect(getByText('Subtema A')).toBeTruthy();
    expect(getByText('Subtema B')).toBeTruthy();
    expect(getByText('1.1')).toBeTruthy();
    expect(getByText('1.2')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
    expect(queryByText('1 lecciones')).toBeNull();
    expect(queryByText('2 lecciones')).toBeNull();
  });

  it('abre el subtema seleccionado', () => {
    const { getByText } = render(<CourseScreen />);

    fireEvent.press(getByText('Ver temas'));
    fireEvent.press(getByText('Subtema B'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tema/[id]',
      params: { id: 't2' },
    });
  });

  it('muestra el error del catálogo', () => {
    makeCatalog({ units: [], error: 'No se pudo cargar el catálogo de unidades.' });

    const { getByText } = render(<CourseScreen />);

    expect(getByText('No se pudo cargar')).toBeTruthy();
    expect(getByText('No se pudo cargar el catálogo de unidades.')).toBeTruthy();
  });

  it('muestra el estado vacío del curso base', () => {
    makeCatalog({ units: [] });

    const { getByText } = render(<CourseScreen />);

    expect(getByText('Sin contenido')).toBeTruthy();
    expect(getByText('No hay unidades disponibles en este dispositivo.')).toBeTruthy();
  });
});
