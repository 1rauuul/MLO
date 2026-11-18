import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppThemeProvider, useTheme } from '@/shared/theme/ThemeProvider';

jest.mock('@/features/profile/viewmodel/useLearnerProfile', () => ({
  useLearnerProfile: () => ({ darkMode: true, largeText: false }),
}));

function Probe() {
  const { scale, largeText } = useTheme();
  return <Text>{`${scale}|${String(largeText)}`}</Text>;
}

it('fuerza el texto ampliado aunque el perfil tenga largeText apagado', () => {
  const { getByText } = render(
    <AppThemeProvider>
      <Probe />
    </AppThemeProvider>,
  );

  expect(getByText('1.15|true')).toBeTruthy();
});
