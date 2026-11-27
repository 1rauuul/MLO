import { render } from '@testing-library/react-native';

import { UnitCard } from '@/features/modules/view/UnitCard';

jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      card: '#fff',
      line: '#ddd',
      text: '#111',
      muted: '#777',
      soft: '#eee',
      primary: '#00f',
      onPrimary: '#fff',
      success: '#0a0',
    },
    radius: { card: 16, control: 14, tile: 20, pill: 999 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    scale: 1,
    fonts: { sans: 'System', mono: 'monospace' },
  }),
}));

it('usa el singular cuando la unidad tiene un solo subtema', () => {
  const { getByText, queryByText } = render(
    <UnitCard
      unit={{
        id: 'unit-1',
        number: 1,
        title: 'Fundamentos',
        description: 'Descripción',
        difficulty: 'Fundamental',
        color: 'blue',
      }}
      subtopicCount={1}
      progress={0}
      expanded={false}
      onToggle={jest.fn()}
    />,
  );

  expect(getByText('1 subtema')).toBeTruthy();
  expect(queryByText('1 subtemas')).toBeNull();
});
