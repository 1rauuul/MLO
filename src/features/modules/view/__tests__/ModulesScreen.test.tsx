import { fireEvent, render } from '@testing-library/react-native';

import ModulesScreen from '@/features/modules/view/ModulesScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockRefreshCatalog = jest.fn(async () => {});
const mockSelectCourse = jest.fn(async () => {});
const mockRefreshCourses = jest.fn(async () => {});

let mockCatalog: Record<string, unknown> = {};
let mockCourses: Record<string, unknown> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate, back: jest.fn() }),
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({
    account: { displayName: 'Valentina Ríos', username: 'valentina' },
    logout: jest.fn(),
    resetProgress: jest.fn(),
  }),
}));
jest.mock('@/features/modules/viewmodel/useCatalog', () => ({ useCatalog: () => mockCatalog }));
jest.mock('@/features/modules/viewmodel/useCourses', () => ({ useCourses: () => mockCourses }));
jest.mock('@/features/auth/viewmodel/useSession', () => ({
  useSession: () => ({
    location: { unitId: null, lessonId: null, lessonCode: null, section: null },
    resumeHref: null,
    clear: jest.fn(),
    record: jest.fn(),
  }),
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

const lessons = [
  {
    id: 'l1.1',
    unitId: 'u1',
    code: '1.1',
    title: 'Introducción a la ISW',
    eyebrow: '',
    body: '',
    codeSample: '',
    contextTitle: '',
    contextBody: '',
    synthesis: [],
    content: [],
    position: 0,
  },
  {
    id: 'l1.2',
    unitId: 'u1',
    code: '1.2',
    title: 'Desarrollo profesional',
    eyebrow: '',
    body: '',
    codeSample: '',
    contextTitle: '',
    contextBody: '',
    synthesis: [],
    content: [],
    position: 1,
  },
];

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
    { id: 't-l1.1', unitId: 'u1', title: 'Subtema A', summary: '', position: 0 },
    { id: 't-l1.2', unitId: 'u1', title: 'Subtema B', summary: '', position: 1 },
  ],
  lessonsByUnit: { u1: lessons },
  completionMap: { 'l1.1': true },
  isLoading: false,
  error: null,
  refresh: mockRefreshCatalog,
};

function makeCatalog(overrides: Record<string, unknown>) {
  mockCatalog = { ...baseCatalog, ...overrides };
}

const courseList = [
  {
    catalogId: 'base',
    title: 'Ingeniería de Software',
    status: 'published',
    usesBase: false,
    version: '7',
    hash: 'hash-base',
    publishedAt: '2026-11-05T00:00:00.000Z',
    empty: false,
  },
  {
    catalogId: 'demo',
    title: 'Curso vacío (demo)',
    status: 'published',
    usesBase: false,
    version: '1',
    hash: 'hash-demo',
    publishedAt: '2026-11-06T00:00:00.000Z',
    empty: true,
  },
];

function makeCourses(overrides: Record<string, unknown>) {
  mockCourses = {
    courses: courseList,
    activeCatalogId: 'base',
    selectCourse: mockSelectCourse,
    refresh: mockRefreshCourses,
    isLoading: false,
    error: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  makeCatalog({});
  makeCourses({});
});

describe('ModulesScreen', () => {
  it('saluda al estudiante y lista las unidades', () => {
    const { getByText } = render(<ModulesScreen />);

    expect(getByText('Hola, Valentina Ríos')).toBeTruthy();
    expect(getByText('Introducción')).toBeTruthy();
    expect(getByText('2 subtemas')).toBeTruthy();
  });

  it('navega al continuar', () => {
    const { getByLabelText } = render(<ModulesScreen />);

    fireEvent.press(getByLabelText('Continuar unidad'));

    expect(mockPush).toHaveBeenCalled();
  });

  it('muestra el error cuando el catálogo no carga', () => {
    makeCatalog({ units: [], error: 'No se pudo cargar el catálogo de unidades.' });

    const { getByText } = render(<ModulesScreen />);

    expect(getByText('No se pudo cargar')).toBeTruthy();
    expect(getByText('No se pudo cargar el catálogo de unidades.')).toBeTruthy();
  });

  it('muestra un indicador mientras carga el catálogo', () => {
    makeCatalog({ units: [], isLoading: true });

    const { getByLabelText, getByText } = render(<ModulesScreen />);

    expect(getByText('Cargando catálogo')).toBeTruthy();
    expect(getByLabelText('Cargando')).toBeTruthy();
  });

  it('permite reintentar cuando el catálogo termina vacío', () => {
    makeCatalog({ units: [], isLoading: false });

    const { getByText } = render(<ModulesScreen />);

    expect(getByText('Sin contenido')).toBeTruthy();
    fireEvent.press(getByText('Reintentar'));
    expect(mockRefreshCatalog).toHaveBeenCalled();
  });

  it('muestra el selector de cursos y cambia el curso activo', () => {
    const { getByText, getByLabelText } = render(<ModulesScreen />);

    expect(getByText('Mis cursos')).toBeTruthy();
    fireEvent.press(getByLabelText('Curso Curso vacío (demo)'));

    expect(mockSelectCourse).toHaveBeenCalledWith('demo');
  });

  it('muestra sin cursos habilitados cuando la cuenta sincronizó sin acceso', () => {
    makeCatalog({ units: [] });
    makeCourses({ courses: [], activeCatalogId: '', isLoading: false });

    const { getByText, queryByText } = render(<ModulesScreen />);

    expect(getByText('Sin cursos habilitados')).toBeTruthy();
    expect(getByText('No tienes cursos disponibles.')).toBeTruthy();
    expect(queryByText('Introducción')).toBeNull();
  });

  it('muestra el estado vacío de un curso no-base sin contenido', () => {
    makeCatalog({ units: [] });
    makeCourses({ activeCatalogId: 'demo' });

    const { getByText } = render(<ModulesScreen />);

    expect(getByText('Sin contenido')).toBeTruthy();
    expect(getByText('Este curso aún no tiene contenido publicado.')).toBeTruthy();
  });

  it('muestra contenido en preparación para un curso no-base con metadata', () => {
    makeCatalog({ units: [] });
    makeCourses({
      activeCatalogId: 'demo',
      courses: [{ ...courseList[1], empty: false }, courseList[0]],
    });

    const { getByText } = render(<ModulesScreen />);

    expect(getByText('Contenido en preparación')).toBeTruthy();
    expect(getByText('Este curso todavía no tiene unidades disponibles.')).toBeTruthy();
  });
});
