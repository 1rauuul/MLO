import { act, renderHook, waitFor } from '@testing-library/react-native';

import { selectExercisesByLesson } from '@/features/exercises/model/exerciseRepository';
import { selectExamplesByLesson } from '@/features/examples/model/exampleRepository';
import { saveExampleState } from '@/features/exercises/model/exampleStateRepository';
import { splitDraw } from '@/features/exercises/viewmodel/lessonDraw';
import type { Exercise, ExerciseType } from '@/shared/model/entities';

import { useExamplesEngine } from '@/features/examples/viewmodel/useExamplesEngine';

const mockDb = {};
let mockAccount: { id: number } | null = null;

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

jest.mock('@/features/exercises/model/exerciseRepository', () => ({
  selectExercisesByLesson: jest.fn(),
}));

jest.mock('@/features/examples/model/exampleRepository', () => ({
  selectExamplesByLesson: jest.fn(async () => []),
}));

jest.mock('@/features/auth/viewmodel/useAuth', () => ({ useAuth: () => ({ account: mockAccount }) }));

jest.mock('@/features/exercises/model/exampleStateRepository', () => ({
  selectExampleState: jest.fn(async () => ({
    drawExampleIds: [],
    drawExerciseIds: [],
    seenExampleIds: [],
    exampleIndex: 0,
  })),
  saveExampleState: jest.fn(async () => {}),
}));

const mockSelect = jest.mocked(selectExercisesByLesson);
const mockSelectExamples = jest.mocked(selectExamplesByLesson);
const mockSaveState = jest.mocked(saveExampleState);
const fixedRandom = () => 0.5;

function buildExercise(id: string, type: ExerciseType, lessonId = 'lesson-1'): Exercise {
  return {
    id,
    lessonId,
    type,
    prompt: `Ejercicio ${id}`,
    instructions: '',
    correctOrder: [],
    config: {},
    explanation: `Explicación ${id}`,
  };
}

const bank: Exercise[] = [
  buildExercise('e1', 'order'),
  buildExercise('e2', 'fill'),
  buildExercise('e3', 'match'),
  buildExercise('e4', 'crossword'),
];

function expectedExampleIds(ids: string[]): string[] {
  return splitDraw(ids, 10, fixedRandom).exampleIds;
}

describe('useExamplesEngine', () => {
  beforeEach(() => {
    mockAccount = null;
    mockSelect.mockReset();
    mockSelectExamples.mockReset();
    mockSelectExamples.mockResolvedValue([]);
    mockSaveState.mockClear();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reparte el banco en ejemplos y ejercicios sin repetir ids', async () => {
    mockSelect.mockResolvedValue(bank);
    const expected = expectedExampleIds(['e1', 'e2', 'e3', 'e4']);
    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items.map(item => item.id)).toEqual(expected);
    expect(result.current.total).toBe(expected.length);
    expect(result.current.current?.id).toBe(expected[0]);
    expect(mockSelect).toHaveBeenCalledWith({}, 'lesson-1');
  });

  it('filtra a los tipos del banco de práctica', async () => {
    mockSelect.mockResolvedValue([...bank, buildExercise('e5', 'mcq' as ExerciseType)]);
    const expected = expectedExampleIds(['e1', 'e2', 'e3', 'e4']);
    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items.map(item => item.id)).toEqual(expected);
  });

  it('adjunta el ejemplo curado del ejercicio actual', async () => {
    mockSelect.mockResolvedValue(bank);
    const expected = expectedExampleIds(['e1', 'e2', 'e3', 'e4']);
    mockSelectExamples.mockResolvedValue([
      {
        id: expected[0]!,
        lessonId: 'lesson-1',
        type: 'fill',
        title: 'Ejemplo curado',
        prompt: 'Completa',
        config: {},
        steps: [{ text: 'paso', why: 'porqué' }],
        hints: ['pista'],
        explanation: '',
      },
    ]);

    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentExample?.title).toBe('Ejemplo curado');
  });

  it('avanza con next y marca isLast solo en el último ejemplo', async () => {
    mockSelect.mockResolvedValue(bank);
    const expected = expectedExampleIds(['e1', 'e2', 'e3', 'e4']);
    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLast).toBe(false);

    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    expect(result.current.current?.id).toBe(expected[1]);
    expect(result.current.isLast).toBe(true);

    act(() => result.current.next());
    expect(result.current.index).toBe(1);
  });

  it('guarda el estado una sola vez por cada Siguiente', async () => {
    mockAccount = { id: 7 };
    mockSelect.mockResolvedValue(bank);
    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    mockSaveState.mockClear();

    act(() => result.current.next());

    expect(mockSaveState).toHaveBeenCalledTimes(1);
  });

  it('redibuja con Nuevo sorteo y reinicia el índice', async () => {
    mockSelect.mockResolvedValue(bank);
    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.next());
    expect(result.current.index).toBe(1);

    act(() => result.current.redraw());
    expect(result.current.index).toBe(0);
  });

  it('con lessonId nulo queda vacío y sin cargar', () => {
    const { result } = renderHook(() => useExamplesEngine(null));

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.current).toBeNull();
    expect(result.current.currentExample).toBeNull();
    expect(result.current.isLast).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('reinicia el índice al cambiar de tema', async () => {
    mockSelect.mockResolvedValue(bank);
    const { result, rerender } = renderHook(
      ({ lessonId }: { lessonId: string }) => useExamplesEngine(lessonId),
      { initialProps: { lessonId: 'lesson-1' } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.next());
    expect(result.current.index).toBe(1);

    mockSelect.mockResolvedValue([buildExercise('e9', 'order', 'lesson-2')]);
    rerender({ lessonId: 'lesson-2' });

    await waitFor(() => expect(result.current.index).toBe(0));
    expect(result.current.current?.id).toBe('e9');
    expect(result.current.total).toBe(1);
    expect(result.current.isLast).toBe(true);
  });
});
