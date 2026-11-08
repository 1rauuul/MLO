import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ModulesScreen from '@/features/modules/view/ModulesScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockRefreshCatalog = jest.fn(async () => {});
const mockRefreshLibrary = jest.fn(async () => {});
const mockSelectCourse = jest.fn(async () => {});

let mockCatalog: Record<string, unknown> = {};
let mockLibrary: Record<string, unknown> = {};

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
jest.mock('@/features/auth/viewmodel/useSession', () => ({
  useSession: () => ({
    location: { unitId: null, lessonId: null, lessonCode: null, section: null },
    resumeHref: null,
    clear: jest.fn(),
    record: jest.fn(),
  }),
}));
jest.mock('@/features/modules/viewmodel/useCatalog', () => ({ useCatalog: () => mockCatalog }));
jest.mock('@/features/modules/viewmodel/useCourseLibrary', () => ({
  useCourseLibrary: () => mockLibrary,
}));
jest.mock('@/shared/services/data/dataMode', () => ({ isHybrid: () => true }));
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
    topicId: 't1',
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
    topicId: 't1',
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
  topics: [{ id: 't1', unitId: 'u1', title: 'Subtema A', summary: '', position: 0 }],
  lessonsByUnit: { u1: lessons },
  completionMap: { 'l1.1': true },
  isLoading: false,
  error: null,
  refresh: mockRefreshCatalog,
};

function makeCatalog(overrides: Record<string, unknown>) {
  mockCatalog = { ...baseCatalog, ...overrides };
}

const entries = [
  {
    catalogId: 'demo',
    title: 'Diseño de experiencias',
    percent: 25,
    className: 'QA Fase 6',
    isActive: true,
    isBase: false,
  },
  {
    catalogId: 'base',
    title: 'Ingeniería de Software',
    percent: 0,
    className: null,
    isActive: false,
    isBase: true,
  },
];

function makeLibrary(overrides: Record<string, unknown>) {
  mockLibrary = {
    entries,
    activeCatalogId: 'demo',
    selectCourse: mockSelectCourse,
    refresh: mockRefreshLibrary,
    isLoading: false,
    error: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  makeCatalog({});
  makeLibrary({});
});

describe('ModulesScreen', () => {
  it('saluda al estudiante y lista sus cursos con la clase y el avance', () => {
    const { getByText } = render(<ModulesScreen />);

    expect(getByText('Hola, Valentina Ríos')).toBeTruthy();
    expect(getByText('Mis cursos')).toBeTruthy();
    expect(getByText('02')).toBeTruthy();
    expect(getByText('Diseño de experiencias')).toBeTruthy();
    expect(getByText('Clase · QA Fase 6 · 25%')).toBeTruthy();
    expect(getByText('Ingeniería de Software')).toBeTruthy();
    expect(getByText('Curso disponible · 0%')).toBeTruthy();
  });

  it('abre el curso seleccionado y lo marca como activo', async () => {
    const { getByLabelText } = render(<ModulesScreen />);

    fireEvent.press(getByLabelText('Curso Diseño de experiencias, Clase · QA Fase 6 · 25%'));

    expect(mockSelectCourse).toHaveBeenCalledWith('demo');
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/curso/[id]',
        params: { id: 'demo' },
      }),
    );
  });

  it('permite unirse a una clase desde la biblioteca', () => {
    const { getByLabelText } = render(<ModulesScreen />);

    fireEvent.press(getByLabelText('Unirme a una clase'));

    expect(mockPush).toHaveBeenCalledWith('/join-class');
  });

  it('continúa desde el hero hacia el subtema pendiente', () => {
    const { getByLabelText } = render(<ModulesScreen />);

    fireEvent.press(getByLabelText('Continuar unidad'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tema/[id]', params: { id: 't1' } });
  });

  it('muestra el error del catálogo sin ocultar la biblioteca', () => {
    makeCatalog({ units: [], error: 'No se pudo cargar el catálogo de unidades.' });

    const { getByText } = render(<ModulesScreen />);

    expect(getByText('No se pudo cargar')).toBeTruthy();
    expect(getByText('No se pudo cargar el catálogo de unidades.')).toBeTruthy();
    expect(getByText('Diseño de experiencias')).toBeTruthy();
  });

  it('muestra un estado vacío y permite reintentar cuando la cuenta no tiene cursos', () => {
    makeLibrary({ entries: [], activeCatalogId: '', isLoading: false });

    const { getByText, getByLabelText } = render(<ModulesScreen />);

    expect(getByText('Sin cursos habilitados')).toBeTruthy();
    expect(getByText('No tienes cursos disponibles.')).toBeTruthy();
    expect(getByLabelText('Unirme a una clase')).toBeTruthy();
    fireEvent.press(getByText('Reintentar'));
    expect(mockRefreshLibrary).toHaveBeenCalled();
  });

  it('muestra el error de carga de cursos', () => {
    makeLibrary({ entries: [], activeCatalogId: '', error: 'No se pudieron cargar los cursos.' });

    const { getByText } = render(<ModulesScreen />);

    expect(getByText('No se pudieron cargar los cursos')).toBeTruthy();
    expect(getByText('No se pudieron cargar los cursos.')).toBeTruthy();
  });
});
