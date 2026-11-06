import { renderHook, waitFor } from '@testing-library/react-native';

import { useLessonContent } from '@/features/modules/viewmodel/useLessonContent';

const mockRepositories = {
  lessons: { selectLesson: jest.fn() },
  examples: { selectExamplesByLesson: jest.fn() },
  classes: {
    selectActiveGroup: jest.fn(),
    selectLessonExtras: jest.fn(async () => []),
  },
};

jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => mockRepositories,
}));
jest.mock('@/features/auth/viewmodel/useAuth', () => {
  const account = { id: 7 };
  return { useAuth: () => ({ account }) };
});

const lesson = {
  id: 'g-lesson',
  unitId: 'u1',
  code: 'G1.1',
  title: 'Lección del grupo',
  eyebrow: '',
  body: '',
  codeSample: '',
  contextTitle: '',
  contextBody: '',
  synthesis: [],
  content: [],
  position: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRepositories.lessons.selectLesson.mockResolvedValue(lesson);
  mockRepositories.examples.selectExamplesByLesson.mockResolvedValue([]);
});

describe('useLessonContent y visibilidad de grupo', () => {
  it('carga una lección de grupo solo con grupo activo', async () => {
    mockRepositories.classes.selectActiveGroup.mockResolvedValue('class-demo');

    const { result } = renderHook(() => useLessonContent('g-lesson'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepositories.lessons.selectLesson).toHaveBeenCalledWith(
      'g-lesson',
      'base',
      'class-demo',
    );
    expect(mockRepositories.examples.selectExamplesByLesson).toHaveBeenCalledWith(
      'g-lesson',
      'class-demo',
    );
    expect(result.current.lesson?.id).toBe('g-lesson');
  });

  it('sin grupo activo solo consulta contenido del curso', async () => {
    mockRepositories.classes.selectActiveGroup.mockResolvedValue(null);

    const { result } = renderHook(() => useLessonContent('l1.2'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepositories.lessons.selectLesson).toHaveBeenCalledWith('l1.2', 'base', null);
    expect(result.current.lesson?.id).toBe('g-lesson');
  });

  it('una membresía retirada o grupo archivado no devuelve la lección de grupo', async () => {
    mockRepositories.classes.selectActiveGroup.mockResolvedValue(null);
    mockRepositories.lessons.selectLesson.mockImplementation(
      async (_id: string, _catalog: string, groupId: string | null) =>
        groupId ? lesson : null,
    );

    const { result } = renderHook(() => useLessonContent('g-lesson'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockRepositories.lessons.selectLesson).toHaveBeenCalledWith(
      'g-lesson',
      'base',
      null,
    );
    expect(result.current.lesson).toBeNull();
  });
});
