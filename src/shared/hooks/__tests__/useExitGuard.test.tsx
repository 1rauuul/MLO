import { act, renderHook } from '@testing-library/react-native';

import { runOrGuardExit } from '@/shared/services/navigation/exitGuard';
import { useExitGuard } from '@/shared/hooks/useExitGuard';

const mockSetOptions = jest.fn();
const mockDisablePrevention = jest.fn();
const mockRepeat = jest.fn();
let mockPreventActive = false;
let mockPreventCallback:
  | ((options: { data: { action: unknown }; repeat: () => void }) => void)
  | null = null;

jest.mock('expo-router', () => ({
  useNavigation: () => ({ setOptions: mockSetOptions }),
  useFocusEffect: () => {},
  usePreventRemove: (
    preventRemove: boolean,
    callback: (options: { data: { action: unknown }; repeat: () => void }) => void,
  ) => {
    mockPreventActive = preventRemove;
    mockPreventCallback = preventRemove ? callback : null;
    return mockDisablePrevention;
  },
}));

describe('useExitGuard', () => {
  beforeEach(() => {
    mockSetOptions.mockClear();
    mockDisablePrevention.mockClear();
    mockRepeat.mockClear();
    mockPreventActive = false;
    mockPreventCallback = null;
  });

  it('intercepta la salida, muestra el modal y reintenta al confirmar', () => {
    const { result } = renderHook(() => useExitGuard(true));

    act(() => {
      mockPreventCallback?.({ data: { action: { type: 'GO_BACK' } }, repeat: mockRepeat });
    });

    expect(mockPreventActive).toBe(true);
    expect(result.current.visible).toBe(true);

    act(() => result.current.confirm());
    expect(result.current.visible).toBe(false);
    expect(mockDisablePrevention).toHaveBeenCalled();
    expect(mockRepeat).toHaveBeenCalled();
  });

  it('sin progreso navega directo y deja el gesto activo', () => {
    const { result } = renderHook(() => useExitGuard(false));
    const next = jest.fn();

    act(() => result.current.request(next));

    expect(next).toHaveBeenCalledTimes(1);
    expect(result.current.visible).toBe(false);
    expect(mockSetOptions).toHaveBeenCalledWith({ gestureEnabled: true });
  });

  it('desactiva el gesto nativo mientras hay progreso', () => {
    renderHook(() => useExitGuard(true));
    expect(mockSetOptions).toHaveBeenCalledWith({ gestureEnabled: false });
  });

  it('registra el guard para la barra inferior', () => {
    const { result } = renderHook(() => useExitGuard(true));
    const next = jest.fn();

    act(() => runOrGuardExit(next));

    expect(next).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(true);

    act(() => result.current.confirm());
    expect(next).toHaveBeenCalledTimes(1);
  });
});
