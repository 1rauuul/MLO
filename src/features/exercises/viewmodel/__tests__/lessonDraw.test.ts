import type { Repositories } from '@/shared/services/data/DataProvider';
import type { ExampleState } from '@/features/exercises/model/exampleStateRepository';
import type { Exercise } from '@/shared/model/entities';

import { ensureLessonDraw } from '@/features/exercises/viewmodel/lessonDraw';
import { selectExercisesByLesson } from '@/features/exercises/model/exerciseRepository';
import { selectExampleState, saveExampleState } from '@/features/exercises/model/exampleStateRepository';

jest.mock('@/features/exercises/model/exerciseRepository', () => ({
  selectExercisesByLesson: jest.fn(),
}));
jest.mock('@/features/exercises/model/exampleStateRepository', () => ({
  selectExampleState: jest.fn(),
  saveExampleState: jest.fn(async () => {}),
}));
jest.mock('@/shared/services/data/DataProvider', () => ({}));

const mockSelectExercises = jest.mocked(selectExercisesByLesson);
const mockSelectState = jest.mocked(selectExampleState);
const mockSaveState = jest.mocked(saveExampleState);
const repositories = {
  exercises: { selectExercisesByLesson: mockSelectExercises },
  exampleState: { selectExampleState: mockSelectState, saveExampleState: mockSaveState },
} as unknown as Pick<Repositories, 'exercises' | 'exampleState'>;

const emptyState: ExampleState = {
  drawExampleIds: [],
  drawExerciseIds: [],
  seenExampleIds: [],
  exampleIndex: 0,
};

function buildExercise(id: string): Exercise {
  return {
    id,
    lessonId: 'l1.2',
    type: 'order',
    prompt: id,
    instructions: '',
    correctOrder: [],
    config: {},
    explanation: '',
  };
}

describe('ensureLessonDraw', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectExercises.mockResolvedValue(
      Array.from({ length: 20 }, (_, index) => buildExercise(`e${index}`)),
    );
    mockSelectState.mockResolvedValue(emptyState);
  });

  it('guarda un sorteo sin intersección entre ejemplos y ejercicios', async () => {
    const draw = await ensureLessonDraw(repositories, 1, 'l1.2');

    expect(draw.drawExampleIds.length).toBeGreaterThan(0);
    expect(draw.drawExerciseIds.length).toBeGreaterThan(0);
    expect(draw.drawExampleIds.filter(id => draw.drawExerciseIds.includes(id))).toEqual([]);
    expect(mockSaveState).toHaveBeenCalledTimes(1);
  });

  it('reutiliza el sorteo vigente en vez de redibujar', async () => {
    const stored: ExampleState = {
      drawExampleIds: ['e1', 'e2'],
      drawExerciseIds: ['e3', 'e4'],
      seenExampleIds: [],
      exampleIndex: 1,
    };
    mockSelectState.mockResolvedValue(stored);

    await expect(ensureLessonDraw(repositories, 1, 'l1.2')).resolves.toEqual(stored);
    expect(mockSaveState).not.toHaveBeenCalled();
  });

  it('reparte también cuando el pool es pequeño', async () => {
    mockSelectExercises.mockResolvedValue([buildExercise('a'), buildExercise('b'), buildExercise('c')]);

    const draw = await ensureLessonDraw(repositories, 1, 'l1.2');

    expect(draw.drawExampleIds.length).toBe(1);
    expect(draw.drawExerciseIds.length).toBe(2);
    expect(draw.drawExampleIds.filter(id => draw.drawExerciseIds.includes(id))).toEqual([]);
  });
});
