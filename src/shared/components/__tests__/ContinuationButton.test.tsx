import { render } from '@testing-library/react-native';

import { ContinuationButton } from '@/shared/components/ContinuationButton';

const mockReveal = jest.fn();
jest.mock('@/shared/components/Screen', () => ({ useRevealElement: () => mockReveal }));
jest.mock('@/shared/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: { text: '#fff', muted: '#aaa', primaryStrong: '#3563D9', onPrimary: '#fff' },
    fonts: { sans: 'System' }, radius: { control: 12 }, scale: 1,
  }),
}));

beforeEach(() => mockReveal.mockClear());

it('revela la continuación tras cada comprobación, sin hacerlo al editar o repetir un render', () => {
  const onPress = jest.fn();
  const { rerender } = render(
    <ContinuationButton label="Siguiente ejemplo" onPress={onPress} revealSignal={0} disabled />,
  );
  expect(mockReveal).not.toHaveBeenCalled();

  rerender(<ContinuationButton label="Siguiente ejemplo" onPress={onPress} revealSignal={1} />);
  expect(mockReveal).toHaveBeenCalledTimes(1);
  rerender(<ContinuationButton label="Siguiente ejemplo" onPress={onPress} revealSignal={1} />);
  expect(mockReveal).toHaveBeenCalledTimes(1);
  rerender(<ContinuationButton label="Siguiente ejemplo" onPress={onPress} revealSignal={2} />);
  expect(mockReveal).toHaveBeenCalledTimes(2);
  expect(onPress).not.toHaveBeenCalled();
});

it('revela el resumen cuando el último ejercicio acaba de ser comprobado', () => {
  render(<ContinuationButton label="Ver resumen" onPress={jest.fn()} revealSignal={1} />);
  expect(mockReveal).toHaveBeenCalledTimes(1);
});
