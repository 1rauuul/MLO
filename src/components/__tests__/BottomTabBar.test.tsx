import { StyleSheet } from 'react-native';

import { fireEvent, render } from '@testing-library/react-native';

import { BottomTabBar } from '../BottomTabBar';

jest.mock('@/theme/theme-provider', () => ({
  useTheme: () => ({
    colors: {
      surface: '#fff', line: '#ddd', primary: '#00f', muted: '#777', text: '#111',
    },
    fonts: { mono: 'monospace' },
    scale: 1,
  }),
}));

it('exposes accessible tabs and reports the selected destination', () => {
  const onChange = jest.fn();
  const { getByRole } = render(<BottomTabBar active="modules" onChange={onChange} />);
  const modules = getByRole('tab', { name: 'Módulos' });
  const profile = getByRole('tab', { name: 'Perfil' });

  expect(modules.props.accessibilityState).toEqual({ selected: true });
  expect(getByRole('tab', { name: 'Evaluaciones' }).props.accessibilityState).toEqual({ selected: false });
  expect(profile.props.accessibilityState).toEqual({ selected: false });
  fireEvent.press(profile);
  expect(onChange).toHaveBeenCalledWith('profile');
});

it('reflects a nonzero bottom inset in the bar bottom padding', () => {
  const onChange = jest.fn();
  const { UNSAFE_getByProps } = render(
    <BottomTabBar active="modules" onChange={onChange} bottomInset={24} />,
  );
  const bar = UNSAFE_getByProps({ accessibilityRole: 'tablist' });
  expect(StyleSheet.flatten(bar.props.style).paddingBottom).toBe(24);
});
