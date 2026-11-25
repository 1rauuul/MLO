import { act, fireEvent, render } from '@testing-library/react-native';

import ForgotPasswordScreen from '@/features/auth/view/ForgotPasswordScreen';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRequestPasswordReset = jest.fn();
const mockConfirmPasswordReset = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));
jest.mock('@/features/auth/model/remoteAuth', () => ({
  requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
  confirmPasswordReset: (...args: unknown[]) => mockConfirmPasswordReset(...args),
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

describe('ForgotPasswordScreen', () => {
  it('rechaza un correo inválido sin llamar al servidor', async () => {
    const { getByLabelText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByLabelText('Correo'), 'ana@');
    await act(async () => {
      fireEvent.press(getByText('Enviar código'));
    });

    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
    expect(getByText('Escribe un correo válido.')).toBeTruthy();
  });

  it('pasa al código y cambia la contraseña', async () => {
    mockRequestPasswordReset.mockResolvedValue({ ok: true });
    mockConfirmPasswordReset.mockResolvedValue({ ok: true });

    const { getByLabelText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByLabelText('Correo'), 'ana@escuela.mx');
    await act(async () => {
      fireEvent.press(getByText('Enviar código'));
    });

    expect(mockRequestPasswordReset).toHaveBeenCalledWith('ana@escuela.mx');
    expect(getByText('Enviamos un código a ana@escuela.mx. Vence en 15 minutos.')).toBeTruthy();

    fireEvent.changeText(getByLabelText('Código'), '123456');
    fireEvent.changeText(getByLabelText('Nueva contraseña'), 'Secreto1!');
    fireEvent.changeText(getByLabelText('Confirmar contraseña'), 'Secreto1!');
    await act(async () => {
      fireEvent.press(getByText('Cambiar contraseña'));
    });

    expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
      'ana@escuela.mx',
      '123456',
      'Secreto1!',
    );
    expect(getByText('Contraseña actualizada')).toBeTruthy();

    fireEvent.press(getByText('Iniciar sesión'));
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('muestra el código inválido que devuelve el servidor', async () => {
    mockRequestPasswordReset.mockResolvedValue({ ok: true });
    mockConfirmPasswordReset.mockResolvedValue({ ok: false, error: 'invalid_code' });

    const { getByLabelText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByLabelText('Correo'), 'ana@escuela.mx');
    await act(async () => {
      fireEvent.press(getByText('Enviar código'));
    });

    fireEvent.changeText(getByLabelText('Código'), '123456');
    fireEvent.changeText(getByLabelText('Nueva contraseña'), 'Secreto1!');
    fireEvent.changeText(getByLabelText('Confirmar contraseña'), 'Secreto1!');
    await act(async () => {
      fireEvent.press(getByText('Cambiar contraseña'));
    });

    expect(getByText('El código no es válido o venció. Solicita uno nuevo.')).toBeTruthy();
  });

  it('no envía si la nueva contraseña es débil', async () => {
    mockRequestPasswordReset.mockResolvedValue({ ok: true });

    const { getByLabelText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByLabelText('Correo'), 'ana@escuela.mx');
    await act(async () => {
      fireEvent.press(getByText('Enviar código'));
    });

    fireEvent.changeText(getByLabelText('Código'), '123456');
    fireEvent.changeText(getByLabelText('Nueva contraseña'), 'debil');
    fireEvent.changeText(getByLabelText('Confirmar contraseña'), 'debil');
    await act(async () => {
      fireEvent.press(getByText('Cambiar contraseña'));
    });

    expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
  });
});
