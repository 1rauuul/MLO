import { fireEvent, render } from '@testing-library/react-native';

import { Bibliography } from '@/features/modules/view/Bibliography';
import type { BibliographyReference } from '@/features/modules/model/bibliography.logic';

jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#fff',
      card: '#fff',
      line: '#ddd',
      warning: '#f90',
      success: '#0a0',
      danger: '#f00',
      muted: '#777',
      text: '#111',
      primary: '#00f',
      soft: '#eee',
      onPrimary: '#fff',
    },
    scale: 1,
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    radius: { card: 12, control: 8, tile: 20, pill: 99 },
    fonts: { mono: 'monospace', sans: 'System' },
  }),
}));

const references: BibliographyReference[] = [
  {
    id: 'demo-ref-apa-2',
    text: 'Pressman, R. S., & Maxim, B. R. (s. f.). Software Engineering. McGraw-Hill.',
  },
  {
    id: 'demo-ref-apa-1',
    text: 'Sommerville, I. (2016). Software Engineering (10.ª ed.). Pearson.',
  },
];

describe('Bibliography', () => {
  it('inicia contraído y no muestra la lista', () => {
    const { getByLabelText, getByText, queryByText } = render(
      <Bibliography references={references} />,
    );

    expect(getByText('Referencias bibliográficas')).toBeTruthy();
    expect(getByText('2 referencias en APA 7')).toBeTruthy();
    expect(queryByText(references[0]!.text)).toBeNull();
    expect(getByLabelText('Ver referencias bibliográficas').props.accessibilityState).toEqual({
      expanded: false,
    });
  });

  it('expande y lista las referencias consolidadas', () => {
    const { getByLabelText, getByText } = render(<Bibliography references={references} />);

    fireEvent.press(getByLabelText('Ver referencias bibliográficas'));

    expect(getByText(references[0]!.text)).toBeTruthy();
    expect(getByText(references[1]!.text)).toBeTruthy();
    expect(getByLabelText('Ocultar referencias bibliográficas').props.accessibilityState).toEqual({
      expanded: true,
    });
  });

  it('contrae la lista al pulsar de nuevo', () => {
    const { getByLabelText, queryByText } = render(<Bibliography references={references} />);

    fireEvent.press(getByLabelText('Ver referencias bibliográficas'));
    fireEvent.press(getByLabelText('Ocultar referencias bibliográficas'));

    expect(queryByText(references[0]!.text)).toBeNull();
  });

  it('muestra el estado vacío cuando no hay referencias', () => {
    const { getByLabelText, getByText } = render(<Bibliography references={[]} />);

    expect(getByText('Sin referencias')).toBeTruthy();
    fireEvent.press(getByLabelText('Ver referencias bibliográficas'));

    expect(getByText('Este curso aún no tiene referencias bibliográficas.')).toBeTruthy();
  });
});
