import { act, renderHook } from '@testing-library/react-native';

import { HttpError } from '@/shared/services/http/client';
import { useJoinClass } from '@/features/classes/viewmodel/useJoinClass';

const mockFetchPreview = jest.fn();
const mockJoinClass = jest.fn();
const mockRefreshClass = jest.fn(async () => false);
const mockSaveAccountClass = jest.fn(async () => {});
const mockRefreshClasses = jest.fn(async () => {});
const mockRefreshCourseList = jest.fn(async () => false);
const mockSelectCourse = jest.fn(async () => true);
const mockApplyStoredContent = jest.fn(async () => ({ failed: [] }));

jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({
    account: {
      id: 1,
      externalKey: '11111111-1111-4111-8111-111111111111',
      displayName: 'Ana Alumna',
    },
  }),
}));
jest.mock('@/features/classes/viewmodel/useClasses', () => ({
  useClasses: () => ({ refresh: mockRefreshClasses }),
}));
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => ({
    content: {
      fetchClassPreview: mockFetchPreview,
      joinClass: mockJoinClass,
      refreshClass: mockRefreshClass,
    },
    classes: { saveAccountClass: mockSaveAccountClass },
    courses: {
      refreshCourseList: mockRefreshCourseList,
      selectCourse: mockSelectCourse,
      applyStoredContent: mockApplyStoredContent,
    },
  }),
}));

const preview = {
  schemaVersion: 2 as const,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  published: null,
};

describe('useJoinClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchPreview.mockResolvedValue(preview);
    mockJoinClass.mockResolvedValue(preview);
  });

  it('busca la clase y normaliza el código', async () => {
    const { result } = renderHook(() => useJoinClass());

    await act(async () => {
      await result.current.lookup(' ab c123 ');
    });

    expect(mockFetchPreview).toHaveBeenCalledWith('ABC123');
    expect(result.current.preview).toEqual(preview);
    expect(result.current.phase).toBe('confirm');
  });

  it('guarda la membresía con la identidad estable y sincroniza', async () => {
    const { result } = renderHook(() => useJoinClass());

    await act(async () => {
      await result.current.lookup('ABC123');
    });
    await act(async () => {
      await expect(result.current.join()).resolves.toBe(true);
    });

    expect(mockJoinClass).toHaveBeenCalledWith(
      'ABC123',
      '11111111-1111-4111-8111-111111111111',
      'Ana Alumna',
    );
    expect(mockSaveAccountClass).toHaveBeenCalledWith(1, 'ABC123', preview, 'base', '');
    expect(mockRefreshClass).toHaveBeenCalledWith(
      'c1',
      'ABC123',
      '11111111-1111-4111-8111-111111111111',
      'base',
    );
    expect(mockSelectCourse).toHaveBeenCalledWith(1, 'base');
    expect(mockRefreshClasses).toHaveBeenCalled();
  });

  it('guarda el curso que asigna el CMS al unirse por código', async () => {
    const withCourse = {
      ...preview,
      course: { catalogId: 'k7f3q', title: 'Curso 2' },
    };
    mockJoinClass.mockResolvedValue(withCourse);
    const { result } = renderHook(() => useJoinClass());

    await act(async () => {
      await result.current.lookup('ABC123');
    });
    await act(async () => {
      await expect(result.current.join()).resolves.toBe(true);
    });

    expect(mockSaveAccountClass).toHaveBeenCalledWith(1, 'ABC123', withCourse, 'k7f3q', 'Curso 2');
    expect(mockRefreshClass).toHaveBeenCalledWith(
      'c1',
      'ABC123',
      '11111111-1111-4111-8111-111111111111',
      'k7f3q',
    );
    expect(mockSelectCourse).toHaveBeenCalledWith(1, 'k7f3q');
    expect(mockApplyStoredContent).toHaveBeenCalledWith('k7f3q');
  });

  it('clasifica una clase inexistente', async () => {
    mockFetchPreview.mockRejectedValue(new HttpError(404, ''));
    const { result } = renderHook(() => useJoinClass());

    await act(async () => {
      await result.current.lookup('ABC123');
    });

    expect(result.current.error).toBe('not_found');
  });
});
