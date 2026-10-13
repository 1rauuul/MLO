import { act, fireEvent, render } from '@testing-library/react-native';

import LoginScreen from '@/features/auth/view/LoginScreen';
import RegisterScreen from '@/features/auth/view/RegisterScreen';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockLogin = jest.fn();
const mockRegister = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack }),
}));
jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({ login: mockLogin, register: mockRegister }),
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('muestra el mensaje de credenciales inválidas', async () => {
    mockLogin.mockResolvedValue({ ok: false, error: 'invalid_credentials' });

    const { getByText } = render(<LoginScreen />);
    await act(async () => {
      fireEvent.press(getByText('Entrar'));
    });

    expect(getByText('Usuario o contraseña incorrectos.')).toBeTruthy();
  });

  it('navega al inicio cuando el login es correcto', async () => {
    mockLogin.mockResolvedValue({ ok: true });

    const { getByText } = render(<LoginScreen />);
    await act(async () => {
      fireEvent.press(getByText('Entrar'));
    });

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('ignora una segunda pulsación mientras está enviando', async () => {
    const pending = deferred<{ ok: boolean }>();
    mockLogin.mockReturnValue(pending.promise);

    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Entrar'));
    fireEvent.press(getByText('Entrar'));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve({ ok: false });
      await pending.promise;
    });
  });
});

describe('RegisterScreen', () => {
  it('muestra el error de almacenamiento', async () => {
    mockRegister.mockResolvedValue({ ok: false, error: 'storage_error' });

    const { getByText } = render(<RegisterScreen />);
    await act(async () => {
      fireEvent.press(getByText('Crear cuenta'));
    });

    expect(
      getByText('Ocurrió un error al guardar en este dispositivo. Inténtalo de nuevo.'),
    ).toBeTruthy();
  });

  it('ignora una segunda pulsación mientras está enviando', async () => {
    const pending = deferred<{ ok: boolean }>();
    mockRegister.mockReturnValue(pending.promise);

    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Crear cuenta'));
    fireEvent.press(getByText('Crear cuenta'));

    expect(mockRegister).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve({ ok: false });
      await pending.promise;
    });
  });
});
