import { fireEvent, render } from '@testing-library/react-native';
import { useState, type ReactNode } from 'react';
import { View as MockAnimatedView, type ViewProps } from 'react-native';
import type { Exercise, Question } from '@/models/entities';
import type { AttemptSummary } from '@/viewmodels/analyticsLogic';
import type { EvaluationEngine } from '@/viewmodels/useQuizEngine';
import type { PracticeEngine } from '@/viewmodels/usePracticeEngine';
import type { ExamplesEngine } from '@/viewmodels/useExamplesEngine';
import type { CrosswordEngine, ExerciseEngine, FillEngine, MatchEngine } from '@/viewmodels/useExerciseEngine';

import ExamplesFlowScreen from '../../app/(app)/(modules)/ejemplos';
import PracticeScreen from '../../app/(app)/(modules)/ejercicios';
import { ActivityView } from '../activities/ActivityView';
import { CrosswordExercise } from '../activities/CrosswordExercise';
import { OrderExercise } from '../activities/OrderExercise';
import { FillExercise } from '../FillExercise';
import { MatchExercise } from '../MatchExercise';
import EvaluationFlow from '../evaluation/EvaluationFlow';

interface CapturedActivityProps {
  exercise: Exercise;
  onSubmit: (answer: string, correct: boolean) => void;
  allowReset?: boolean;
  locked?: boolean;
}

const mockBack = jest.fn();
const mockNavigate = jest.fn();
const mockPush = jest.fn();
const mockMarkCompleted = jest.fn();
const mockRecord = jest.fn(async () => {});
const noneSummary: AttemptSummary = { total: 0, correct: 0, accuracy: 1, byType: {} };
const fillExercise: Exercise = {
  id: 'fill-1',
  lessonId: 'lesson-2',
  type: 'fill',
  prompt: 'Completa el enunciado',
  instructions: '',
  correctOrder: [],
  config: { sentences: ['El {{requisito}} guía el trabajo del equipo.'], bank: [] },
  explanation: 'El requisito es la base del trabajo.',
};
const exampleExercise: Exercise = {
  id: 'example-1',
  lessonId: 'lesson-2',
  type: 'fill',
  prompt: 'Completa el ejemplo',
  instructions: '',
  correctOrder: [],
  config: { sentences: ['El {{requisito}} guía el trabajo.'] },
  explanation: 'El requisito define la necesidad.',
};
const fillQuestion: Question = {
  id: 'q-1',
  evaluationId: 'evaluation-2',
  orderIndex: 0,
  type: 'fill',
  config: { sentences: ['El {{requisito}} guía el trabajo.'] },
  prompt: 'Completa el reactivo',
  options: [],
  answer: 0,
  explanation: 'El requisito es la base.',
};

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: mockBack, navigate: mockNavigate, push: mockPush }),
  useFocusEffect: jest.fn(),
}));
jest.mock('@/viewmodels/useSession', () => ({
  useSession: () => ({
    location: { unitId: null, lessonId: null, lessonCode: null, section: null },
    record: jest.fn(),
    resumeHref: null,
    clear: jest.fn(),
  }),
}));
jest.mock('react-native-gesture-handler', () => {
  const chain = {
    activateAfterLongPress: () => chain,
    onBegin: () => chain,
    onUpdate: () => chain,
    onEnd: () => chain,
    onFinalize: () => chain,
  };
  return {
    Gesture: { Pan: () => chain },
    GestureDetector: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };
});
jest.mock('react-native-reanimated', () => {
  const Animated = {
    View: (props: ViewProps) => <MockAnimatedView {...props} />,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
    useAnimatedStyle: () => ({}),
    useSharedValue: (initial: unknown) => ({ value: initial }),
    withSpring: (value: unknown) => value,
  };
});
jest.mock('@/theme/theme-provider', () => ({
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
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/viewmodels/useLessonContent', () => ({
  useLessonContent: () => ({ lesson: { id: 'lesson-2', code: '2.1', title: 'Tema 2' } }),
}));
jest.mock('@/viewmodels/useModuleProgress', () => ({
  useModuleProgress: () => ({ markCompleted: mockMarkCompleted }),
}));
jest.mock('@/viewmodels/usePracticeEngine', () => ({
  usePracticeEngine: () => mockPracticeEngine,
}));
jest.mock('@/viewmodels/useQuizEngine', () => ({
  useEvaluationForLesson: () => ({
    evaluation: { id: 'evaluation-2', lessonId: 'lesson-2', title: 'Evaluación', description: '' },
    questions: [mockQuestion],
    isLoading: false,
  }),
  useEvaluationEngine: () => mockEvaluationEngine,
  useRecordEvaluationResult: () => mockRecord,
}));
jest.mock('@/viewmodels/useExerciseEngine', () => {
  const actual = jest.requireActual<typeof import('@/viewmodels/useExerciseEngine')>(
    '@/viewmodels/useExerciseEngine',
  );
  return { ...actual, useExercise: () => ({ exercise: mockExampleExercise, isLoading: false }) };
});
jest.mock('@/viewmodels/useExamplesEngine', () => ({
  useExamplesEngine: () => mockExamplesEngine,
}));
jest.mock('@/components/activities/ActivityView', () => ({
  ActivityView: (props: CapturedActivityProps) => {
    mockCapturedActivityProps = props;
    if (!mockActivityViewReal) {
      return null;
    }
    const actual = jest.requireActual<typeof import('@/components/activities/ActivityView')>(
      '@/components/activities/ActivityView',
    );
    return actual.ActivityView(props);
  },
}));

const makeOrderEngine = (): ExerciseEngine => ({
  steps: ['Analizar', 'Diseñar', 'Construir'],
  checked: false,
  isCorrect: false,
  move: jest.fn(),
  moveTo: jest.fn(),
  submit: jest.fn(() => true),
  solve: jest.fn(),
  reset: jest.fn(),
});

const makeFillEngine = (): FillEngine => ({
  sentences: [
    [
      { text: 'El ', blank: null },
      { text: '', blank: 0 },
      { text: ' guía el trabajo.', blank: null },
    ],
  ],
  answers: ['requisito'],
  bank: ['término', 'artefacto'],
  used: [false, false],
  assignment: ['requisito'],
  activeBlank: null,
  checked: false,
  isCorrect: false,
  selectBlank: jest.fn(),
  placeWord: jest.fn(),
  clearBlank: jest.fn(),
  submit: jest.fn(() => true),
  solve: jest.fn(),
  reset: jest.fn(),
});

const makeMatchEngine = (): MatchEngine => ({
  pairs: [
    { left: 'Requisito', right: 'Necesidad del usuario' },
    { left: 'Caso de uso', right: 'Interacción con el sistema' },
  ],
  lefts: ['Requisito', 'Caso de uso'],
  rights: ['Necesidad del usuario', 'Interacción con el sistema'],
  assignment: [0, 1],
  selectedLeft: null,
  checked: false,
  isCorrect: false,
  selectLeft: jest.fn(),
  selectRight: jest.fn(),
  submit: jest.fn(() => true),
  solve: jest.fn(),
  reset: jest.fn(),
});

const makeCrosswordEngine = (): CrosswordEngine => ({
  cells: [
    { row: 0, col: 0, entryIndexes: [0], solution: 'S' },
    { row: 0, col: 1, entryIndexes: [0], solution: 'O' },
    { row: 0, col: 2, entryIndexes: [0], solution: 'L' },
  ],
  entries: [{ word: 'SOL', clue: 'Estrella del día', row: 0, col: 0, direction: 'across' }],
  bank: ['MAR', 'LUNA'],
  rows: 1,
  cols: 3,
  letters: {},
  selectedEntry: 0,
  checked: false,
  isCorrect: false,
  selectEntry: jest.fn(),
  setLetter: jest.fn(),
  submit: jest.fn(() => true),
  solve: jest.fn(),
  reset: jest.fn(),
});

const makePracticeEngine = (answered: boolean): PracticeEngine => ({
  items: [fillExercise],
  phase: 'running',
  index: 0,
  total: 2,
  current: fillExercise,
  answered,
  lastCorrect: answered,
  summary: noneSummary,
  isLoading: false,
  submit: jest.fn(),
  next: jest.fn(),
});

const makeExamplesEngine = (): ExamplesEngine => ({
  items: [exampleExercise],
  index: 0,
  total: 1,
  current: exampleExercise,
  isLast: true,
  isLoading: false,
  next: jest.fn(),
});

const makeEvaluationEngine = (answered: boolean): EvaluationEngine => ({
  index: 0,
  total: 1,
  items: [fillQuestion],
  question: fillQuestion,
  phase: 'running',
  answered,
  lastCorrect: answered,
  correctCount: 0,
  outcomes: [answered],
  summary: noneSummary,
  submit: jest.fn(),
  next: jest.fn(),
  restart: jest.fn(),
});

let mockParams: Record<string, string> = { lesson: 'lesson-2' };
let mockActivityViewReal = false;
let mockCapturedActivityProps: CapturedActivityProps | null = null;
let mockQuestion: Question = fillQuestion;
let mockExampleExercise: Exercise = exampleExercise;
let mockPracticeEngine: PracticeEngine = makePracticeEngine(false);
let mockEvaluationEngine: EvaluationEngine = makeEvaluationEngine(false);
let mockExamplesEngine: ExamplesEngine = makeExamplesEngine();

beforeEach(() => {
  mockBack.mockClear();
  mockNavigate.mockClear();
  mockPush.mockClear();
  mockMarkCompleted.mockClear();
  mockRecord.mockClear();
  mockParams = { lesson: 'lesson-2' };
  mockActivityViewReal = false;
  mockCapturedActivityProps = null;
  mockQuestion = fillQuestion;
  mockExampleExercise = exampleExercise;
  mockPracticeEngine = makePracticeEngine(false);
  mockEvaluationEngine = makeEvaluationEngine(false);
  mockExamplesEngine = makeExamplesEngine();
});

describe('OrderExercise locking', () => {
  it('freezes arrows and Comprobar when locked', () => {
    const engine = makeOrderEngine();
    const onSubmit = jest.fn();
    const { getByRole } = render(<OrderExercise engine={engine} onSubmit={onSubmit} locked />);

    expect(getByRole('button', { name: 'Subir Diseñar' }).props.accessibilityState).toEqual({
      disabled: true,
    });
    expect(getByRole('button', { name: 'Bajar Analizar' }).props.accessibilityState).toEqual({
      disabled: true,
    });
    fireEvent.press(getByRole('button', { name: 'Bajar Analizar' }));
    expect(engine.move).not.toHaveBeenCalled();
    expect(engine.moveTo).not.toHaveBeenCalled();

    const check = getByRole('button', { name: 'Comprobar' });
    expect(check.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(check);
    expect(engine.submit).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps arrows and Comprobar active when unlocked', () => {
    const engine = makeOrderEngine();
    const onSubmit = jest.fn();
    const { getByRole } = render(<OrderExercise engine={engine} onSubmit={onSubmit} />);

    expect(getByRole('button', { name: 'Bajar Analizar' }).props.accessibilityState).toEqual({
      disabled: false,
    });
    fireEvent.press(getByRole('button', { name: 'Bajar Analizar' }));
    expect(engine.move).toHaveBeenCalledWith(0, 1);

    const check = getByRole('button', { name: 'Comprobar' });
    expect(check.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(check);
    expect(engine.submit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('labels the check action Comprobar and reveals the legend after checking', () => {
    function ControlledOrder() {
      const [checked, setChecked] = useState(false);
      const engine: ExerciseEngine = {
        ...makeOrderEngine(),
        checked,
        isCorrect: checked,
        submit: jest.fn(() => {
          setChecked(true);
          return true;
        }),
      };
      return <OrderExercise engine={engine} onSubmit={jest.fn()} />;
    }

    const { getByRole, getByText, queryByText } = render(<ControlledOrder />);

    expect(queryByText('✓ Secuencia correcta')).toBeNull();
    fireEvent.press(getByRole('button', { name: 'Comprobar' }));

    expect(getByText('✓ Secuencia correcta')).toBeTruthy();
  });
});

describe('FillExercise locking', () => {
  it('freezes blanks, chips and Comprobar when locked', () => {
    const engine = makeFillEngine();
    const onSubmit = jest.fn();
    const { getByRole, getByText } = render(<FillExercise engine={engine} onSubmit={onSubmit} locked />);

    fireEvent.press(getByText('requisito'));
    expect(engine.clearBlank).not.toHaveBeenCalled();
    expect(engine.selectBlank).not.toHaveBeenCalled();

    const chip = getByRole('button', { name: 'Palabra término' });
    expect(chip.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(chip);
    expect(engine.placeWord).not.toHaveBeenCalled();

    const check = getByRole('button', { name: 'Comprobar' });
    expect(check.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(check);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps blanks, chips and Comprobar active when unlocked', () => {
    const engine = makeFillEngine();
    const onSubmit = jest.fn();
    const { getByRole, getByText } = render(<FillExercise engine={engine} onSubmit={onSubmit} />);

    fireEvent.press(getByText('requisito'));
    expect(engine.clearBlank).toHaveBeenCalledWith(0);

    const chip = getByRole('button', { name: 'Palabra término' });
    expect(chip.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(chip);
    expect(engine.placeWord).toHaveBeenCalledWith(0);

    const check = getByRole('button', { name: 'Comprobar' });
    expect(check.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(check);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('MatchExercise locking', () => {
  it('freezes both columns and Comprobar when locked', () => {
    const engine = makeMatchEngine();
    const onSubmit = jest.fn();
    const { getByRole } = render(<MatchExercise engine={engine} onSubmit={onSubmit} locked />);

    const left = getByRole('button', { name: 'Concepto Requisito' });
    expect(left.props.accessibilityState).toEqual({ selected: false, disabled: true });
    fireEvent.press(left);
    expect(engine.selectLeft).not.toHaveBeenCalled();

    const right = getByRole('button', { name: 'Definición Interacción con el sistema' });
    expect(right.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(right);
    expect(engine.selectRight).not.toHaveBeenCalled();

    const check = getByRole('button', { name: 'Comprobar' });
    expect(check.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(check);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps both columns and Comprobar active when unlocked', () => {
    const engine = makeMatchEngine();
    const onSubmit = jest.fn();
    const { getByRole } = render(<MatchExercise engine={engine} onSubmit={onSubmit} />);

    const left = getByRole('button', { name: 'Concepto Requisito' });
    expect(left.props.accessibilityState).toEqual({ selected: false, disabled: false });
    fireEvent.press(left);
    expect(engine.selectLeft).toHaveBeenCalledWith(0);

    const right = getByRole('button', { name: 'Definición Interacción con el sistema' });
    expect(right.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(right);
    expect(engine.selectRight).toHaveBeenCalledWith(1);

    const check = getByRole('button', { name: 'Comprobar' });
    expect(check.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(check);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('CrosswordExercise locking', () => {
  it('freezes cells, clues, input, chips and Comprobar when locked', () => {
    const engine = makeCrosswordEngine();
    const onSubmit = jest.fn();
    const { getByRole, getByPlaceholderText } = render(
      <CrosswordExercise engine={engine} onSubmit={onSubmit} locked />,
    );

    const cell = getByRole('button', { name: 'Inicio H1' });
    expect(cell.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(cell);
    expect(engine.selectEntry).not.toHaveBeenCalled();

    const clue = getByRole('button', { name: 'H1 Estrella del día' });
    expect(clue.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(clue);
    expect(engine.selectEntry).not.toHaveBeenCalled();

    expect(getByPlaceholderText('3 letras · H1').props.editable).toBe(false);

    const chip = getByRole('button', { name: 'Usar MAR' });
    expect(chip.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(chip);
    expect(engine.setLetter).not.toHaveBeenCalled();

    const check = getByRole('button', { name: 'Comprobar crucigrama' });
    expect(check.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(check);
    expect(engine.submit).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps cells, clues, input, chips and Comprobar active when unlocked', () => {
    const engine = makeCrosswordEngine();
    const onSubmit = jest.fn();
    const { getByRole, getByPlaceholderText } = render(
      <CrosswordExercise engine={engine} onSubmit={onSubmit} />,
    );

    fireEvent.press(getByRole('button', { name: 'Inicio H1' }));
    expect(engine.selectEntry).toHaveBeenCalledWith(0);

    fireEvent.press(getByRole('button', { name: 'H1 Estrella del día' }));
    expect(engine.selectEntry).toHaveBeenCalledTimes(2);

    expect(getByPlaceholderText('3 letras · H1').props.editable).toBe(true);

    fireEvent.press(getByRole('button', { name: 'Usar MAR' }));
    expect(engine.setLetter).toHaveBeenCalledWith(0, 0, 'M');

    fireEvent.press(getByRole('button', { name: 'Comprobar crucigrama' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('ActivityView locked propagation', () => {
  it('locks the real fill activity when locked', () => {
    mockActivityViewReal = true;
    const onSubmit = jest.fn();
    const { getByRole } = render(<ActivityView exercise={fillExercise} onSubmit={onSubmit} locked />);

    const chip = getByRole('button', { name: 'Palabra requisito' });
    expect(chip.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(chip);

    const check = getByRole('button', { name: 'Comprobar' });
    expect(check.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(check);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the real fill activity interactive when locked is omitted', () => {
    mockActivityViewReal = true;
    const onSubmit = jest.fn();
    const { getByRole } = render(<ActivityView exercise={fillExercise} onSubmit={onSubmit} />);

    const chip = getByRole('button', { name: 'Palabra requisito' });
    expect(chip.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(chip);

    const check = getByRole('button', { name: 'Comprobar' });
    expect(check.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(check);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('Ejercicios screen wiring', () => {
  it('locks the activity after the exercise is answered', () => {
    mockPracticeEngine = makePracticeEngine(true);
    render(<PracticeScreen />);

    expect(mockCapturedActivityProps?.exercise.id).toBe('fill-1');
    expect(mockCapturedActivityProps?.allowReset).toBe(false);
    expect(mockCapturedActivityProps?.locked).toBe(true);
  });

  it('keeps the activity interactive before the exercise is answered', () => {
    mockPracticeEngine = makePracticeEngine(false);
    render(<PracticeScreen />);

    expect(mockCapturedActivityProps?.locked).toBe(false);
  });
});

describe('Evaluación flow wiring', () => {
  it('locks the activity after the reactivo is answered', () => {
    mockEvaluationEngine = makeEvaluationEngine(true);
    render(<EvaluationFlow />);

    expect(mockCapturedActivityProps?.exercise.id).toBe('q-1');
    expect(mockCapturedActivityProps?.allowReset).toBe(false);
    expect(mockCapturedActivityProps?.locked).toBe(true);
  });

  it('keeps the activity interactive before the reactivo is answered', () => {
    mockEvaluationEngine = makeEvaluationEngine(false);
    render(<EvaluationFlow />);

    expect(mockCapturedActivityProps?.locked).toBe(false);
  });
});

describe('Ejemplos exclusion', () => {
  it('never locks the guided example activity', () => {
    const { getByRole } = render(<ExamplesFlowScreen />);

    fireEvent.press(getByRole('button', { name: 'Ahora inténtalo tú' }));

    expect(mockCapturedActivityProps?.exercise.id).toBe('example-1');
    expect(mockCapturedActivityProps?.locked).toBeUndefined();
  });
});
