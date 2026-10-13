import { fireEvent, render } from '@testing-library/react-native';

import ModulesScreen from '@/features/modules/view/ModulesScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockRefreshCatalog = jest.fn(async () => {});

let mockCatalog: Record<string, unknown> = {};

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
  lessonsByUnit: { u1: lessons },
  progressMap: { 'l1.1': true },
  error: null,
  refresh: mockRefreshCatalog,
};

function makeCatalog(overrides: Record<string, unknown>) {
  mockCatalog = { ...baseCatalog, ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  makeCatalog({});
});

describe('ModulesScreen', () => {
  it('saluda al estudiante y lista las unidades', () => {
    const { getByText } = render(<ModulesScreen />);

    expect(getByText('Hola, Valentina Ríos')).toBeTruthy();
    expect(getByText('Introducción')).toBeTruthy();
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
});
