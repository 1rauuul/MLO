import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import ProfileScreen from '@/features/profile/view/ProfileScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockResetProgress = jest.fn(async () => {});
const mockClearLocation = jest.fn();
const mockRefreshCatalog = jest.fn(async () => {});
const mockRefreshResults = jest.fn(async () => {});

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
  }),
}));
jest.mock('@/features/modules/viewmodel/useCatalog', () => ({ useCatalog: () => mockCatalog }));
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
    style: 'Pragmático',
    setStyle: jest.fn(),
    darkMode: true,
    setDarkMode: jest.fn(),
    largeText: false,
    setLargeText: jest.fn(),
  }),
}));
jest.mock('@/features/profile/viewmodel/useRecentResults', () => ({
  useRecentResults: () => ({ averageScore: 75, refresh: mockRefreshResults }),
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

describe('ProfileScreen', () => {
  it('muestra estadísticas y cuenta', () => {
    const { getByText, getAllByText } = render(<ProfileScreen />);

    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getAllByText('@valentina').length).toBeGreaterThan(0);
  });

  it('reinicia progreso limpiando la ubicación de sesión', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Reiniciar mi progreso'));

    expect(alertSpy).toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0]![2] as { text: string; onPress?: () => void }[];
    const resetButton = buttons.find(button => button.text === 'Reiniciar');
    await act(async () => {
      resetButton?.onPress?.();
    });

    expect(mockResetProgress).toHaveBeenCalled();
    await waitFor(() => expect(mockClearLocation).toHaveBeenCalled());
    alertSpy.mockRestore();
  });
});
