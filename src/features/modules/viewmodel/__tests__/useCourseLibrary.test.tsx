import { renderHook, waitFor } from '@testing-library/react-native';

import { useCourseLibrary } from '@/features/modules/viewmodel/useCourseLibrary';

const mockSelectCourse = jest.fn(async () => {});
const mockRefreshCourses = jest.fn(async () => {});
const mockRefreshClasses = jest.fn(async () => {});
const mockSelectLessons = jest.fn(async (catalogId: string) =>
  catalogId === 'base'
    ? [{ id: 'b1' }, { id: 'b2' }]
    : [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }, { id: 'd4' }],
);
const mockSelectCompletionMap = jest.fn(async (_accountId: number, catalogId: string) =>
  catalogId === 'base' ? { b1: true } : { d1: true },
);

jest.mock('@/features/auth/viewmodel/useAuth', () => {
  const account = { id: 7 };
  return { useAuth: () => ({ account }) };
});
jest.mock('@/features/classes/viewmodel/useClasses', () => {
  const classes = [
    {
      classId: 'c1',
      classCode: 'QA1234',
      className: 'QA Fase 6',
      teacherName: 'Docente',
      version: 1,
      joinedAt: '2026-01-01',
      courseCatalogId: 'demo',
    },
  ];
  return { useClasses: () => ({ classes, refresh: mockRefreshClasses }) };
});
jest.mock('@/features/modules/viewmodel/useCourses', () => {
  const courses = [
    {
      catalogId: 'base',
      title: 'Contenido base',
      status: 'published' as const,
      usesBase: false,
      version: '1',
      hash: 'hash',
      publishedAt: '2026-01-01',
      empty: false,
    },
    {
      catalogId: 'demo',
      title: 'Diseño de experiencias',
      status: 'published' as const,
      usesBase: true,
      version: '1',
      hash: 'hash-demo',
      publishedAt: '2026-01-01',
      empty: false,
    },
  ];
  return {
    useCourses: () => ({
      courses,
      activeCatalogId: 'demo',
      selectCourse: mockSelectCourse,
      refresh: mockRefreshCourses,
      isLoading: false,
      error: null,
    }),
  };
});
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => ({
    lessons: { selectLessons: mockSelectLessons },
    progress: { selectCompletionMap: mockSelectCompletionMap },
  }),
}));

describe('useCourseLibrary', () => {
  it('calcula el avance por curso y pone las clases primero', async () => {
    const { result } = renderHook(() => useCourseLibrary());

    await waitFor(() => expect(result.current.entries[0]?.percent).toBe(25));

    expect(result.current.entries).toEqual([
      {
        catalogId: 'demo',
        title: 'Diseño de experiencias',
        percent: 25,
        className: 'QA Fase 6',
        isActive: true,
        isBase: false,
      },
      {
        catalogId: 'base',
        title: 'Ingeniería de Software',
        percent: 50,
        className: null,
        isActive: false,
        isBase: true,
      },
    ]);
  });

  it('refresca cursos y clases juntos', async () => {
    const { result } = renderHook(() => useCourseLibrary());
    await waitFor(() => expect(result.current.entries[0]?.percent).toBe(25));

    await result.current.refresh();

    expect(mockRefreshCourses).toHaveBeenCalled();
    expect(mockRefreshClasses).toHaveBeenCalled();
  });

  it('expone la selección de curso del repositorio', async () => {
    const { result } = renderHook(() => useCourseLibrary());
    await waitFor(() => expect(result.current.entries[0]?.percent).toBe(25));

    await result.current.selectCourse('base');

    expect(mockSelectCourse).toHaveBeenCalledWith('base');
  });
});
