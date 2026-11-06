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
  questionCount: 2,
  exerciseCount: 2,
};

const questions: Question[] = [
  {
    id: 'demo-q2',
    evaluationId: 'demo-ev2',
    orderIndex: 0,
    type: 'fill',
    config: { sentences: ['El {{requisito}}'], bank: ['requisito'] },
    prompt: 'Completa la frase',
    options: [],
    answer: 0,
    explanation: '',
  },
  {
    id: 'demo-q3',
    evaluationId: 'demo-ev2',
    orderIndex: 1,
    type: 'mcq',
    config: {},
    prompt: '¿Qué se hace primero?',
    options: ['Especificar', 'Validar'],
    answer: 0,
    explanation: '',
  },
];

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

beforeEach(() => {
  jest.clearAllMocks();
  mockRepositories.evaluations.selectEvaluationById.mockResolvedValue(evaluation);
  mockRepositories.evaluations.selectEvaluationByLesson.mockResolvedValue(evaluation);
  mockRepositories.evaluations.selectSelectedExercises.mockResolvedValue([]);
  mockRepositories.evaluations.selectQuestions.mockResolvedValue(questions);
  mockRepositories.exercises.selectExercisesByLesson.mockResolvedValue([lessonExercise]);
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
    expect(result.current.questions.map(question => question.id).sort()).toEqual([
      'demo-q2',
      'demo-q3',
    ]);
  });

  it('dos evaluaciones del mismo subtema cargan preguntas distintas por id', async () => {
    mockRepositories.evaluations.selectEvaluationById.mockImplementation(async (id: string) => ({
      ...evaluation,
      id,
    }));
    mockRepositories.evaluations.selectQuestions.mockImplementation(async (id: string) =>
      id === 'demo-ev1' ? [questions[0]!] : [questions[1]!],
    );

    const first = renderHook(() => useEvaluationForLesson('demo-l1.1', 'demo-ev1', 'demo'));
    const second = renderHook(() => useEvaluationForLesson('demo-l1.1', 'demo-ev2', 'demo'));

    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));

    expect(first.result.current.evaluation?.id).toBe('demo-ev1');
    expect(first.result.current.questions.map(question => question.id)).toEqual(['demo-q2']);
    expect(second.result.current.evaluation?.id).toBe('demo-ev2');
    expect(second.result.current.questions.map(question => question.id)).toEqual(['demo-q3']);
  });

  it('una evaluación solo de preguntas no añade ejercicios', async () => {
    mockRepositories.evaluations.selectEvaluationById.mockResolvedValue({
      ...evaluation,
      exerciseCount: 0,
    });
    mockRepositories.evaluations.selectSelectedExercises.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useEvaluationForLesson('demo-l1.1', 'demo-ev2', 'demo'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepositories.exercises.selectExercisesByLesson).not.toHaveBeenCalled();
    expect(result.current.questions).toHaveLength(2);
    expect(result.current.questions.every(question => question.type !== 'order')).toBe(true);
  });

  it('una evaluación mixta usa solo los ejercicios seleccionados', async () => {
    mockRepositories.evaluations.selectSelectedExercises.mockResolvedValue([selected]);

    const { result } = renderHook(() =>
      useEvaluationForLesson('demo-l1.1', 'demo-ev2', 'demo'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ids = result.current.questions.map(question => question.id);
    expect(ids).toContain('demo-fill1');
    expect(ids).not.toContain('lesson-only');
    expect(mockRepositories.exercises.selectExercisesByLesson).not.toHaveBeenCalled();
  });

  it('sin id mantiene el fallback v2 por lección y cupo', async () => {
    const v2Evaluation = { ...evaluation, id: 'ev1', exerciseCount: 5 };
    mockRepositories.evaluations.selectEvaluationByLesson.mockResolvedValue(v2Evaluation);

    const { result } = renderHook(() => useEvaluationForLesson('l1.2'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepositories.evaluations.selectEvaluationById).not.toHaveBeenCalled();
    expect(mockRepositories.evaluations.selectEvaluationByLesson).toHaveBeenCalledWith('l1.2', null);
    expect(mockRepositories.exercises.selectExercisesByLesson).toHaveBeenCalledWith('l1.2', null);
    expect(result.current.questions.some(question => question.id === 'lesson-only')).toBe(true);
  });
});
