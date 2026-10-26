import { act, renderHook } from '@testing-library/react-native';

import { runOrGuardExit } from '@/shared/services/navigation/exitGuard';
import { useExitGuard } from '@/shared/hooks/useExitGuard';

const mockListeners: ((event: { preventDefault: () => void; data: { action: unknown } }) => void)[] = [];
const mockDispatch = jest.fn();
const mockSetOptions = jest.fn();
const mockAddListener = jest.fn(
  (_name: string, callback: (event: { preventDefault: () => void; data: { action: unknown } }) => void) => {
    mockListeners.push(callback);
    return () => {};
  },
);

const mockNavigation = {
  addListener: mockAddListener,
  setOptions: mockSetOptions,
  dispatch: mockDispatch,
};

jest.mock('expo-router', () => ({
  useNavigation: () => mockNavigation,
}));

function emitBeforeRemove() {
  const event = { preventDefault: jest.fn(), data: { action: { type: 'GO_BACK' } } };
  act(() => {
    mockListeners.forEach(listener => listener(event));
  });
  return event;
}

describe('useExitGuard', () => {
  beforeEach(() => {
    mockListeners.length = 0;
    mockDispatch.mockClear();
    mockSetOptions.mockClear();
    mockAddListener.mockClear();
  });

  it('intercepta beforeRemove, muestra el modal y despacha al confirmar', () => {
    const { result } = renderHook(() => useExitGuard(true));
    const event = emitBeforeRemove();

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.visible).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();

    act(() => result.current.confirm());
    expect(result.current.visible).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith(event.data.action);

    const retried = emitBeforeRemove();
    expect(retried.preventDefault).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(false);
  });

  it('sin progreso navega directo y deja el gesto activo', () => {
    const { result } = renderHook(() => useExitGuard(false));
    const next = jest.fn();

    act(() => result.current.request(next));
    emitBeforeRemove();

    expect(next).toHaveBeenCalledTimes(1);
    expect(result.current.visible).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
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
  });
});
