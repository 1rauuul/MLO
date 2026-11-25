import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ProfileScreen from '@/features/profile/view/ProfileScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockResetProgress = jest.fn(async () => {});
const mockClearLocation = jest.fn();
const mockRefreshCatalog = jest.fn(async () => {});
const mockRefreshResults = jest.fn(async () => {});
const mockSyncNow = jest.fn(async () => {});

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
    resetProgress: mockResetProgress,
    needsRemoteLink: false,
  }),
}));
jest.mock('@/features/modules/viewmodel/useCatalog', () => ({ useCatalog: () => mockCatalog }));
jest.mock('@/features/modules/viewmodel/useCourses', () => ({
  useCourses: () => ({
    courses: [],
    activeCatalogId: 'demo',
    selectCourse: jest.fn(),
    refresh: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));
jest.mock('@/features/auth/viewmodel/useSession', () => ({
  useSession: () => ({
    location: { unitId: null, lessonId: null, lessonCode: null, section: null },
    resumeHref: null,
    clear: mockClearLocation,
    record: jest.fn(),
  }),
}));
jest.mock('@/features/profile/viewmodel/useLearnerProfile', () => ({
  useLearnerProfile: () => ({
    darkMode: true,
    setDarkMode: jest.fn(),
  }),
}));
jest.mock('@/features/profile/viewmodel/useRecentResults', () => ({
  useRecentResults: () => ({ averageScore: 75, refresh: mockRefreshResults }),
}));
jest.mock('@/features/profile/viewmodel/useProgressSync', () => ({
  useProgressSync: () => ({
    status: 'synced',
    lastSyncedAt: null,
    error: null,
    isSyncing: false,
    isLinked: true,
    syncNow: mockSyncNow,
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
  completionMap: { 'l1.1': true },
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

describe('ProfileScreen', () => {
  it('muestra estadísticas y cuenta sin clases ni estilo de aprendizaje', () => {
    const { getByText, getAllByText, queryByText } = render(<ProfileScreen />);

    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getAllByText('@valentina').length).toBeGreaterThan(0);
    expect(queryByText('Grupo A')).toBeNull();
    expect(queryByText('Unirme a una clase')).toBeNull();
    expect(queryByText('Estilo de aprendizaje')).toBeNull();
    expect(queryByText('Texto ampliado')).toBeNull();
  });

  it('ya no muestra el ajuste del curso base', () => {
    const { queryByText } = render(<ProfileScreen />);

    expect(queryByText('Mostrar curso base')).toBeNull();
    expect(queryByText('Curso base')).toBeNull();
  });

  it('permite sincronizar el progreso ahora', () => {
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Sincronizar ahora'));
    expect(mockSyncNow).toHaveBeenCalled();
  });

  it('reinicia progreso limpiando la ubicación de sesión', async () => {
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Reiniciar mi progreso'));
    fireEvent.press(getByText('Reiniciar'));

    expect(mockResetProgress).toHaveBeenCalled();
    await waitFor(() => expect(mockClearLocation).toHaveBeenCalled());
  });

  it('cancelar el reinicio no borra el progreso', () => {
    const { getByText, queryByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Reiniciar mi progreso'));
    fireEvent.press(getByText('Cancelar'));

    expect(mockResetProgress).not.toHaveBeenCalled();
    expect(queryByText('Reiniciar')).toBeNull();
  });
});
