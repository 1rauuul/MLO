import { fireEvent, render } from '@testing-library/react-native';

import PersonalizationScreen from '@/features/profile/view/PersonalizationScreen';
import { CHA_ITEMS } from '@/features/modules/viewmodel/cha.logic';

const mockBack = jest.fn();
const mockSaveQuestionnaire = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));
jest.mock('@/features/profile/viewmodel/useLearnerProfile', () => ({
  useLearnerProfile: () => ({ saveQuestionnaire: mockSaveQuestionnaire }),
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PersonalizationScreen', () => {
  it('guarda el estilo dominante al completar el cuestionario', () => {
    const { getAllByText, getByText } = render(<PersonalizationScreen />);

    const agreeButtons = getAllByText('De acuerdo');
    expect(agreeButtons).toHaveLength(CHA_ITEMS.length);
    agreeButtons.forEach(button => fireEvent.press(button));

    fireEvent.press(getByText('Ver mi estilo'));

    expect(mockSaveQuestionnaire).toHaveBeenCalledWith('Activo');
    expect(getByText('Estilo predominante')).toBeTruthy();
  });

  it('no permite enviar el cuestionario incompleto', () => {
    const { getByText } = render(<PersonalizationScreen />);

    fireEvent.press(getByText('Ver mi estilo'));

    expect(mockSaveQuestionnaire).not.toHaveBeenCalled();
  });
});
