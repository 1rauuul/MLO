import { renderHook, waitFor } from '@testing-library/react-native';

import type { Evaluation, Exercise, Question } from '@/shared/model/entities';

import { useEvaluationForLesson } from '@/features/evaluations/viewmodel/useQuizEngine';

const mockRepositories = {
  evaluations: {
    selectEvaluationById: jest.fn(),
    selectEvaluationByLesson: jest.fn(),
    selectSelectedExercises: jest.fn(),
    selectQuestions: jest.fn(),
  },
  exercises: {
    selectExercisesByLesson: jest.fn(),
  },
};

jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => mockRepositories,
}));

const evaluation: Evaluation = {
  id: 'demo-ev2',
  lessonId: 'demo-l1.1',
  title: 'Evaluación dos',
  description: '',
  questionCount: 10,
  exerciseCount: 5,
};

const questions: Question[] = Array.from({ length: 10 }, (_, index) => ({
    id: `demo-q${index}`,
    evaluationId: 'demo-ev2',
    orderIndex: index,
    type: 'mcq',
    config: {},
    prompt: `Pregunta ${index}`,
    options: ['Especificar', 'Validar'],
    answer: 0,
    explanation: '',
  }));

const selected: Exercise = {
  id: 'demo-fill1',
  lessonId: 'demo-l1.1',
  type: 'fill',
  prompt: 'Completa la definición',
  instructions: '',
  correctOrder: [],
  config: { sentences: ['El {{requisito}}'], bank: ['requisito'] },
  explanation: '',
};

const secondSelected: Exercise = {
  ...selected,
  id: 'demo-order1',
  type: 'order',
  prompt: 'Ordena los pasos',
  correctOrder: ['Uno', 'Dos'],
  config: {},
};

const selectedExercises: Exercise[] = [
  selected,
  secondSelected,
  ...Array.from({ length: 3 }, (_, index) => ({
    ...secondSelected,
    id: `demo-order${index + 2}`,
    prompt: `Ordena los pasos ${index + 2}`,
  })),
];

const lessonExercise: Exercise = {
  id: 'lesson-only',
  lessonId: 'demo-l1.1',
  type: 'order',
  prompt: 'Ejercicio de la lección',
  instructions: '',
  correctOrder: ['A', 'B'],
  config: {},
  explanation: '',
};

const lessonExercises = Array.from({ length: 5 }, (_, index) => ({
  ...lessonExercise,
  id: `lesson-only-${index}`,
  prompt: `Ejercicio de la lección ${index}`,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRepositories.evaluations.selectEvaluationById.mockResolvedValue(evaluation);
  mockRepositories.evaluations.selectEvaluationByLesson.mockResolvedValue(evaluation);
  mockRepositories.evaluations.selectSelectedExercises.mockResolvedValue(selectedExercises);
  mockRepositories.evaluations.selectQuestions.mockResolvedValue(questions);
  mockRepositories.exercises.selectExercisesByLesson.mockResolvedValue(lessonExercises);
});

describe('useEvaluationForLesson con id explícito', () => {
  it('carga la evaluación del subtema por id y sus preguntas', async () => {
    const { result } = renderHook(() =>
      useEvaluationForLesson('demo-l1.1', 'demo-ev2', 'demo'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepositories.evaluations.selectEvaluationById).toHaveBeenCalledWith(
      'demo-ev2',
      'demo',
      null,
    );
    expect(mockRepositories.evaluations.selectEvaluationByLesson).not.toHaveBeenCalled();
    expect(result.current.evaluation?.id).toBe('demo-ev2');
    expect(result.current.questions).toHaveLength(15);
    expect(result.current.questions.map(question => question.id)).toContain('demo-fill1');
    expect(result.current.questions.map(question => question.id)).toContain('demo-q0');
  });

  it('dos evaluaciones del mismo subtema cargan preguntas distintas por id', async () => {
    mockRepositories.evaluations.selectEvaluationById.mockImplementation(async (id: string) => ({
      ...evaluation,
      id,
    }));
    mockRepositories.evaluations.selectQuestions.mockImplementation(async (id: string) =>
      questions.map((question, index) => ({ ...question, id: `${id}-q${index}` })),
    );

    const first = renderHook(() => useEvaluationForLesson('demo-l1.1', 'demo-ev1', 'demo'));
    const second = renderHook(() => useEvaluationForLesson('demo-l1.1', 'demo-ev2', 'demo'));

    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(first.result.current.evaluation?.id).toBe('demo-ev1');
    expect(first.result.current.questions.map(question => question.id)).toContain('demo-ev1-q0');
    expect(second.result.current.evaluation?.id).toBe('demo-ev2');
    expect(second.result.current.questions.map(question => question.id)).toContain('demo-ev2-q0');
  });

  it('no inicia una evaluación que no cumple el cupo pedagógico completo', async () => {
    mockRepositories.evaluations.selectEvaluationById.mockResolvedValue({
      ...evaluation,
      exerciseCount: 0,
    });
    mockRepositories.evaluations.selectSelectedExercises.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useEvaluationForLesson('demo-l1.1', 'demo-ev2', 'demo'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.questions).toEqual([]);
    expect(result.current.error).toContain('5 ejercicios disponibles');
  });

  it('una evaluación mixta usa solo los ejercicios seleccionados', async () => {
    mockRepositories.evaluations.selectSelectedExercises.mockResolvedValue(selectedExercises);

    const { result } = renderHook(() =>
      useEvaluationForLesson('demo-l1.1', 'demo-ev2', 'demo'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ids = result.current.questions.map(question => question.id);
    expect(ids).toContain('demo-fill1');
    expect(ids).toContain('demo-order1');
    expect(ids).not.toContain('lesson-only-0');
    expect(mockRepositories.exercises.selectExercisesByLesson).not.toHaveBeenCalled();
  });

  it('no inicia una evaluación si el release declara más ejercicios de los publicados', async () => {
    mockRepositories.evaluations.selectSelectedExercises.mockResolvedValue([selected]);

    const { result } = renderHook(() =>
      useEvaluationForLesson('demo-l1.1', 'demo-ev2', 'demo'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.questions).toEqual([]);
    expect(result.current.error).toContain('5 ejercicios disponibles');
  });

  it('sin id mantiene el fallback v2 por lección y cupo', async () => {
    const v2Evaluation = { ...evaluation, id: 'ev1' };
    mockRepositories.evaluations.selectEvaluationByLesson.mockResolvedValue(v2Evaluation);
    mockRepositories.evaluations.selectSelectedExercises.mockResolvedValue([]);

    const { result } = renderHook(() => useEvaluationForLesson('l1.2'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepositories.evaluations.selectEvaluationById).not.toHaveBeenCalled();
    expect(mockRepositories.evaluations.selectEvaluationByLesson).toHaveBeenCalledWith('l1.2', null);
    expect(mockRepositories.exercises.selectExercisesByLesson).toHaveBeenCalledWith('l1.2', null);
    expect(result.current.questions.some(question => question.id === 'lesson-only-0')).toBe(true);
  });
});
