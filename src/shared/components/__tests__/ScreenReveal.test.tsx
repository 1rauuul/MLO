import { act, fireEvent, render } from '@testing-library/react-native';
import { Keyboard, Pressable, type KeyboardEvent, type ScrollViewInstance, type ViewInstance } from 'react-native';

import { Screen, useRevealElement } from '@/shared/components/Screen';

jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(function MockScrollView(props: { children?: React.ReactNode }, _ref) {
      return <View {...props} testID="viewport" />;
    }),
  };
});
jest.mock('@/shared/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: { bg: '#10171E' }, spacing: { lg: 16, xl: 24, xxl: 32 } }),
}));

function Probe({ target }: { target: { current: ViewInstance | null } }) {
  const reveal = useRevealElement();
  return <Pressable accessibilityRole="button" accessibilityLabel="Comprobar" onPress={() => reveal(target)} />;
}

afterEach(() => jest.restoreAllMocks());

it('revela el botón al pie del área visible sin avanzar y respeta movimiento reducido', () => {
  const content = {} as ViewInstance;
  const scrollTo = jest.fn();
  const viewport = { current: { getInnerViewRef: () => content, scrollTo } as unknown as ScrollViewInstance };
  const measureLayout = jest.fn((_relative, success) => success(0, 900, 300, 48));
  const target = { current: { measureLayout } as unknown as ViewInstance };
  let frame: FrameRequestCallback | undefined;
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => { frame = callback; return 1; });
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);

  const screen = render(<Screen scrollRef={viewport}><Probe target={target} /></Screen>);
  fireEvent(screen.getByTestId('viewport'), 'layout', { nativeEvent: { layout: { height: 600 } } });
  fireEvent.press(screen.getByRole('button', { name: 'Comprobar' }));
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(scrollTo).not.toHaveBeenCalled();
  act(() => frame?.(0));
  expect(scrollTo).toHaveBeenCalledWith({ y: 372, animated: false });
});

it('descarta mediciones tardías si se abandona la pantalla antes de terminar el desplazamiento', () => {
  const scrollTo = jest.fn();
  const viewport = { current: { getInnerViewRef: () => ({}), scrollTo } as unknown as ScrollViewInstance };
  let measured: ((x: number, y: number, width: number, height: number) => void) | undefined;
  const target = { current: { measureLayout: (_relative: unknown, success: typeof measured) => { measured = success; } } as unknown as ViewInstance };
  let frame: FrameRequestCallback | undefined;
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => { frame = callback; return 1; });
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

  const screen = render(<Screen scrollRef={viewport}><Probe target={target} /></Screen>);
  fireEvent.press(screen.getByRole('button', { name: 'Comprobar' }));
  act(() => frame?.(0));
  screen.unmount();
  act(() => measured?.(0, 900, 300, 48));
  expect(scrollTo).not.toHaveBeenCalled();
});

it('recalcula la posición cuando termina de cerrarse el teclado', () => {
  const scrollTo = jest.fn();
  const viewport = { current: { getInnerViewRef: () => ({}), scrollTo } as unknown as ScrollViewInstance };
  const target = { current: { measureLayout: (_relative: unknown, success: (x: number, y: number, width: number, height: number) => void) => success(0, 900, 300, 48) } as unknown as ViewInstance };
  let frame: FrameRequestCallback | undefined;
  let hidden: (() => void) | undefined;
  let keyboardVisible = true;
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => { frame = callback; return 1; });
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'isVisible').mockImplementation(() => keyboardVisible);
  jest.spyOn(Keyboard, 'addListener').mockImplementation((name, listener) => {
    if (name === 'keyboardDidHide') hidden = () => listener({} as KeyboardEvent);
    return { remove: jest.fn() };
  });

  const screen = render(<Screen scrollRef={viewport}><Probe target={target} /></Screen>);
  fireEvent(screen.getByTestId('viewport'), 'layout', { nativeEvent: { layout: { height: 300 } } });
  fireEvent.press(screen.getByRole('button', { name: 'Comprobar' }));
  act(() => frame?.(0));
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 672, animated: false });

  keyboardVisible = false;
  fireEvent(screen.getByTestId('viewport'), 'layout', { nativeEvent: { layout: { height: 500 } } });
  act(() => { hidden?.(); frame?.(0); });
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 472, animated: false });
});
