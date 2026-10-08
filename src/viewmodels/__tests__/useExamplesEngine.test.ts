import { act, renderHook, waitFor } from '@testing-library/react-native';

import { selectExercisesByLesson } from '@/data/repositories/exerciseRepository';
import type { Exercise, ExerciseType } from '@/models/entities';

import { useExamplesEngine } from '../useExamplesEngine';

const mockDb = {};

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

jest.mock('@/data/repositories/exerciseRepository', () => ({
  selectExercisesByLesson: jest.fn(),
}));

const mockSelect = jest.mocked(selectExercisesByLesson);

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

describe('useExamplesEngine', () => {
  beforeEach(() => {
    mockSelect.mockReset();
  });

  it('carga el mismo banco de ejercicios del tema en el orden del repositorio', async () => {
    mockSelect.mockResolvedValue(bank);
    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items.map(item => item.id)).toEqual(['e1', 'e2', 'e3', 'e4']);
    expect(result.current.total).toBe(4);
    expect(result.current.index).toBe(0);
    expect(result.current.current?.id).toBe('e1');
    expect(mockSelect).toHaveBeenCalledWith({}, 'lesson-1');
  });

  it('filtra a los tipos del banco de práctica', async () => {
    mockSelect.mockResolvedValue([...bank, buildExercise('e5', 'mcq' as ExerciseType)]);
    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items.map(item => item.id)).toEqual(['e1', 'e2', 'e3', 'e4']);
    expect(result.current.total).toBe(4);
  });

  it('avanza con next y marca isLast solo en el último ejemplo', async () => {
    mockSelect.mockResolvedValue(bank);
    const { result } = renderHook(() => useExamplesEngine('lesson-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLast).toBe(false);

    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    expect(result.current.current?.id).toBe('e2');
    expect(result.current.isLast).toBe(false);

    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(3);
    expect(result.current.current?.id).toBe('e4');
    expect(result.current.isLast).toBe(true);

    act(() => result.current.next());
    expect(result.current.index).toBe(3);
  });

  it('con lessonId nulo queda vacío y sin cargar', () => {
    const { result } = renderHook(() => useExamplesEngine(null));

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.current).toBeNull();
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
