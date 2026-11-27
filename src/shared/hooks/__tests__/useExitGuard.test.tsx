import { act, renderHook } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import { runOrGuardExit } from '@/shared/services/navigation/exitGuard';
import { useExitGuard } from '@/shared/hooks/useExitGuard';

const mockSetOptions = jest.fn();
const mockGoBack = jest.fn();
const mockDisablePrevention = jest.fn();
const mockRepeat = jest.fn();
let mockBackHandler: (() => boolean) | null = null;
let mockPreventActive = false;
let mockPreventCallback:
  | ((options: { data: { action: unknown }; repeat: () => void }) => void)
  | null = null;
let mockFocusEffect: (() => void | (() => void)) | null = null;
let mockFocusCleanup: (() => void) | null = null;

jest.mock('expo-router', () => ({
  useNavigation: () => ({ setOptions: mockSetOptions, goBack: mockGoBack }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    mockFocusEffect = effect;
  },
  usePreventRemove: (
    preventRemove: boolean,
    callback: (options: { data: { action: unknown }; repeat: () => void }) => void,
  ) => {
    mockPreventActive = preventRemove;
    mockPreventCallback = preventRemove ? callback : null;
    return mockDisablePrevention;
  },
}));

function focus() {
  act(() => {
    const cleanup = mockFocusEffect?.();
    mockFocusCleanup = typeof cleanup === 'function' ? cleanup : null;
  });
}

function blur() {
  act(() => {
    mockFocusCleanup?.();
    mockFocusCleanup = null;
  });
}

describe('useExitGuard', () => {
  beforeEach(() => {
    mockSetOptions.mockClear();
    mockGoBack.mockClear();
    mockDisablePrevention.mockClear();
    mockRepeat.mockClear();
    mockPreventActive = false;
    mockPreventCallback = null;
    mockFocusEffect = null;
    mockFocusCleanup = null;
    mockBackHandler = null;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation(
      ((_event, handler) => {
        mockBackHandler = handler as () => boolean;
        return { remove: jest.fn() };
      }) as typeof BackHandler.addEventListener,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    focus();
    const next = jest.fn();

    act(() => runOrGuardExit(next));

    expect(next).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(true);

    act(() => result.current.confirm());
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('intercepta el gesto de atrás de Android mientras hay progreso', () => {
    const { result } = renderHook(() => useExitGuard(true));
    focus();

    expect(mockBackHandler).not.toBeNull();
    act(() => {
      expect(mockBackHandler?.()).toBe(true);
    });
    expect(result.current.visible).toBe(true);

    act(() => result.current.confirm());
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('deja pasar el atrás de Android cuando no hay progreso', () => {
    const { result } = renderHook(() => useExitGuard(false));
    focus();

    act(() => {
      expect(mockBackHandler?.()).toBe(true);
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(result.current.visible).toBe(false);
  });

  it('retira el guard y cierra el modal al perder el foco', () => {
    const { result } = renderHook(() => useExitGuard(true));
    focus();

    const first = jest.fn();
    act(() => runOrGuardExit(first));
    expect(first).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(true);

    act(() => result.current.confirm());
    expect(first).toHaveBeenCalledTimes(1);

    blur();

    const second = jest.fn();
    act(() => runOrGuardExit(second));
    expect(second).toHaveBeenCalledTimes(1);
    expect(result.current.visible).toBe(false);
  });
});
