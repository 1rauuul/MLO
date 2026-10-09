import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import type { FillEngine } from '@/viewmodels/useExerciseEngine';

import { FillExercise } from '../FillExercise';

jest.mock('@/theme/theme-provider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#ffffff', surface: '#ffffff', card: '#ffffff', text: '#111111', muted: '#777777',
      line: '#dddddd', primary: '#0000ff', success: '#00ff00', warning: '#ff9900',
      danger: '#ff0000', soft: '#eeeeee', code: '#000000', onPrimary: '#ffffff',
    },
    radius: { card: 12, control: 8, pill: 99, tile: 20 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    fonts: { mono: 'monospace' },
    scale: 1,
  }),
}));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));

function makeEngine(overrides: Partial<FillEngine>): FillEngine {
  return {
    sentences: [[{ text: 'El ', blank: null }, { text: '', blank: 0 }]],
    answers: ['bueno'],
    bank: [],
    used: [],
    assignment: ['malo'],
    activeBlank: null,
    checked: true,
    isCorrect: false,
    selectBlank: jest.fn(),
    placeWord: jest.fn(),
    clearBlank: jest.fn(),
    submit: jest.fn(() => false),
    solve: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  };
}

it('marca en rojo el espacio incorrecto tras comprobar', () => {
  const { getByText } = render(<FillExercise engine={makeEngine({})} onSubmit={jest.fn()} />);

  const style = StyleSheet.flatten(getByText('malo').props.style);
  expect(style.borderColor).toBe('#ff0000');
  expect(style.backgroundColor).toBe('#ff000022');
});

it('marca en verde el espacio correcto tras comprobar', () => {
  const { getByText } = render(
    <FillExercise
      engine={makeEngine({ assignment: ['bueno'], isCorrect: true })}
      onSubmit={jest.fn()}
    />,
  );

  const style = StyleSheet.flatten(getByText('bueno').props.style);
  expect(style.borderColor).toBe('#00ff00');
  expect(style.backgroundColor).toBe('#00ff0022');
});
