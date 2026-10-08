import { StyleSheet } from 'react-native';

import { fireEvent, render } from '@testing-library/react-native';

import { SubtopicTabBar } from '../SubtopicTabBar';

jest.mock('@/theme/theme-provider', () => ({
  useTheme: () => ({
    colors: { surface: '#fff', line: '#ddd', primary: '#00f', muted: '#777', text: '#111' },
    fonts: { mono: 'monospace' },
    scale: 1,
  }),
}));

it('exposes Inicio and Tema tabs with their selected state and targets', () => {
  const onInicio = jest.fn();
  const onTema = jest.fn();
  const { getByRole } = render(
    <SubtopicTabBar active="tema" onInicio={onInicio} onTema={onTema} />,
  );

  expect(getByRole('tab', { name: 'Inicio' }).props.accessibilityState).toEqual({ selected: false });
  expect(getByRole('tab', { name: 'Tema' }).props.accessibilityState).toEqual({ selected: true });

  fireEvent.press(getByRole('tab', { name: 'Inicio' }));
  expect(onInicio).toHaveBeenCalledTimes(1);
  fireEvent.press(getByRole('tab', { name: 'Tema' }));
  expect(onTema).toHaveBeenCalledTimes(1);
});

it('omits Tema when no handler is available', () => {
  const { getByRole, queryByRole } = render(
    <SubtopicTabBar active={null} onInicio={jest.fn()} />,
  );

  expect(getByRole('tab', { name: 'Inicio' })).toBeTruthy();
  expect(queryByRole('tab', { name: 'Tema' })).toBeNull();
});

it('reflects a nonzero bottom inset in the bar bottom padding', () => {
  const { UNSAFE_getByProps } = render(
    <SubtopicTabBar active={null} onInicio={jest.fn()} onTema={jest.fn()} bottomInset={24} />,
  );
  const bar = UNSAFE_getByProps({ accessibilityRole: 'tablist' });
  expect(StyleSheet.flatten(bar.props.style).paddingBottom).toBe(24);
});
