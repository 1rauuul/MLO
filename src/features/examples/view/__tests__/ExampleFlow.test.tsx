import { act, fireEvent, render } from '@testing-library/react-native';

import type { Exercise } from '@/shared/model/entities';
import type { ExamplesEngine } from '@/features/examples/viewmodel/useExamplesEngine';

import ExamplesScreen from '@/features/examples/view/ExamplesScreen';

interface CapturedActivityProps {
  exercise: Exercise;
  onSubmit: (answer: string, correct: boolean) => void;
  allowReset?: boolean;
  locked?: boolean;
  variant?: string;
  revealSignal?: number;
}

const mockBack = jest.fn();
const mockNavigate = jest.fn();
const mockPush = jest.fn();
const mockNext = jest.fn();

const firstExercise: Exercise = {
  id: 'ex-1',
  lessonId: 'lesson-2',
  type: 'fill',
  prompt: 'Completa el ejemplo',
  instructions: '',
  correctOrder: [],
  config: { sentences: ['El {{requisito}} guía el trabajo.'] },
  explanation: 'El requisito define la necesidad.',
};
const secondExercise: Exercise = {
  id: 'ex-2',
  lessonId: 'lesson-2',
  type: 'order',
  prompt: 'Ordena el segundo ejemplo',
  instructions: '',
  correctOrder: ['a', 'b'],
  config: {},
  explanation: 'Secuencia del segundo ejemplo.',
};

let mockCapturedActivityProps: CapturedActivityProps | null = null;

function makeEngine(items: Exercise[], index: number): ExamplesEngine {
  return {
    items,
    index,
    total: items.length,
    current: items[index] ?? null,
    isLast: index === items.length - 1,
    isLoading: false,
    next: () => mockNext(),
  };
}

let mockEngine: ExamplesEngine = makeEngine([firstExercise, secondExercise], 0);

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ lesson: 'lesson-2' }),
  useRouter: () => ({ back: mockBack, navigate: mockNavigate, push: mockPush }),
  useFocusEffect: jest.fn(),
}));
jest.mock('@/features/auth/viewmodel/useSession', () => ({
  useSession: () => ({
    location: { unitId: null, lessonId: null, lessonCode: null, section: null },
    record: jest.fn(),
    resumeHref: null,
    clear: jest.fn(),
  }),
}));
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      bg: '#fff', card: '#fff', line: '#ddd', warning: '#f90', success: '#0a0', danger: '#f00',
      muted: '#777', text: '#111', primary: '#00f', soft: '#eee', onPrimary: '#fff',
    },
    scale: 1,
    spacing: { xl: 20, lg: 16, md: 12, sm: 8, xxl: 32 },
    radius: { card: 12, control: 8, pill: 99 },
    fonts: { mono: 'monospace' },
  }),
}));
jest.mock('@/shared/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/features/modules/viewmodel/useLessonContent', () => ({
  useLessonContent: () => ({
    lesson: { id: 'lesson-2', code: '2.1', title: 'Tema 2' },
    examples: [],
    isLoading: false,
  }),
}));
jest.mock('@/features/examples/viewmodel/useExamplesEngine', () => ({
  useExamplesEngine: () => mockEngine,
}));
jest.mock('@/features/exercises/view/activities/ActivityView', () => ({
  ActivityView: (props: CapturedActivityProps) => {
    mockCapturedActivityProps = props;
    return null;
  },
}));

beforeEach(() => {
  mockBack.mockClear();
  mockNavigate.mockClear();
  mockPush.mockClear();
  mockNext.mockClear();
  mockCapturedActivityProps = null;
  mockEngine = makeEngine([firstExercise, secondExercise], 0);
});

describe('Ejemplos sequential flow', () => {
  it('arranca en la variante A del primer ejemplo', () => {
    const { getByRole } = render(<ExamplesScreen />);

    expect(getByRole('button', { name: 'Ahora inténtalo tú' })).toBeTruthy();
    expect(mockCapturedActivityProps).toBeNull();
  });

  it('muestra la práctica interactiva al pasar a la variante B', () => {
    const { getByRole } = render(<ExamplesScreen />);

    fireEvent.press(getByRole('button', { name: 'Ahora inténtalo tú' }));

    expect(mockCapturedActivityProps?.exercise.id).toBe('ex-1');
    expect(mockCapturedActivityProps?.locked).toBeUndefined();
    expect(mockCapturedActivityProps?.allowReset).toBe(true);
  });

  it('mantiene Siguiente deshabilitado hasta comprobar', () => {
    const { getByRole } = render(<ExamplesScreen />);

    fireEvent.press(getByRole('button', { name: 'Ahora inténtalo tú' }));

    const next = getByRole('button', { name: 'Siguiente ejemplo' });
    expect(next.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(next);
    expect(mockNext).not.toHaveBeenCalled();

    act(() => mockCapturedActivityProps?.onSubmit('respuesta', true));

    fireEvent.press(getByRole('button', { name: 'Siguiente ejemplo' }));
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('ofrece Ir a ejercicios en el último ejemplo solo tras comprobar', () => {
    mockEngine = makeEngine([firstExercise, secondExercise], 1);
    const { getByRole, queryByRole } = render(<ExamplesScreen />);

    fireEvent.press(getByRole('button', { name: 'Ahora inténtalo tú' }));

    expect(queryByRole('button', { name: 'Siguiente ejemplo' })).toBeNull();
    fireEvent.press(getByRole('button', { name: 'Ir a ejercicios' }));
    expect(mockPush).not.toHaveBeenCalled();

    act(() => mockCapturedActivityProps?.onSubmit('respuesta', true));

    fireEvent.press(getByRole('button', { name: 'Ir a ejercicios' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/ejercicios', params: { lesson: 'lesson-2' } });
  });

  it('revela pistas con Ver pista', () => {
    const { getByRole, getByText } = render(<ExamplesScreen />);

    fireEvent.press(getByRole('button', { name: 'Ahora inténtalo tú' }));
    fireEvent.press(getByRole('button', { name: 'Ver pista' }));

    expect(getByText('Pista 1: Lee la frase completa antes de colocar una palabra.')).toBeTruthy();
  });

  it('resuelve la actividad y muestra la explicación debajo del ejercicio con Ver solución', () => {
    const { getByRole, getByText } = render(<ExamplesScreen />);

    fireEvent.press(getByRole('button', { name: 'Ahora inténtalo tú' }));
    fireEvent.press(getByRole('button', { name: 'Ver solución' }));

    expect(mockCapturedActivityProps?.revealSignal).toBe(1);
    expect(getByText('Solución')).toBeTruthy();
    expect(getByText('El requisito define la necesidad.')).toBeTruthy();

    const next = getByRole('button', { name: 'Siguiente ejemplo' });
    expect(next.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(next);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('avanza al siguiente ejemplo y vuelve a la variante A', () => {
    const { getByRole, queryByRole, rerender } = render(<ExamplesScreen />);

    fireEvent.press(getByRole('button', { name: 'Ahora inténtalo tú' }));
    act(() => mockCapturedActivityProps?.onSubmit('respuesta', true));
    fireEvent.press(getByRole('button', { name: 'Siguiente ejemplo' }));

    expect(mockNext).toHaveBeenCalledTimes(1);

    mockEngine = makeEngine([firstExercise, secondExercise], 1);
    rerender(<ExamplesScreen />);

    expect(getByRole('button', { name: 'Ahora inténtalo tú' })).toBeTruthy();
    expect(queryByRole('button', { name: 'Siguiente ejemplo' })).toBeNull();
  });

  it('muestra Cargando mientras el motor carga', () => {
    mockEngine = { ...makeEngine([], 0), isLoading: true };
    const { getByText } = render(<ExamplesScreen />);

    expect(getByText('Cargando')).toBeTruthy();
  });

  it('muestra Sin ejemplos cuando el tema no tiene banco', () => {
    mockEngine = makeEngine([], 0);
    const { getByText } = render(<ExamplesScreen />);

    expect(getByText('Sin ejemplos')).toBeTruthy();
  });
});
