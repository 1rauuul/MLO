import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { LocationRecord } from '@/features/modules/model/locationRepository';
import * as locationRepository from '@/features/modules/model/locationRepository';

import { SessionProvider, useSession } from '@/features/auth/viewmodel/useSession';

const mockDb = { marker: 'db' };
let mockAccountState: { id: number } | null = { id: 7 };

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('@/features/auth/viewmodel/useAuth', () => ({ useAuth: () => ({ account: mockAccountState }) }));
jest.mock('@/features/modules/model/locationRepository');

const selectLocation = locationRepository.selectLocation as jest.MockedFunction<
  typeof locationRepository.selectLocation
>;
const saveLocation = locationRepository.saveLocation as jest.MockedFunction<
  typeof locationRepository.saveLocation
>;
const clearLocation = locationRepository.clearLocation as jest.MockedFunction<
  typeof locationRepository.clearLocation
>;

function wrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAccountState = { id: 7 };
  selectLocation.mockResolvedValue(null);
});

it('loads the persisted location for the current account', async () => {
  const persisted: LocationRecord = {
    unitId: 'u1',
    lessonId: 'lesson-2',
    lessonCode: '2.1',
    section: 'lesson',
  };
  selectLocation.mockResolvedValue(persisted);

  const { result } = renderHook(() => useSession(), { wrapper });

  await waitFor(() => expect(result.current.location).toEqual(persisted));
  expect(selectLocation).toHaveBeenCalledWith(mockDb, 7);
});

it('records a location in state and persists it', async () => {
  const { result } = renderHook(() => useSession(), { wrapper });
  await waitFor(() => expect(selectLocation).toHaveBeenCalled());

  act(() => {
    result.current.record({
      unitId: 'u1',
      lessonId: 'lesson-2',
      lessonCode: '2.1',
      section: 'example',
    });
  });

  expect(result.current.location).toEqual({
    unitId: 'u1',
    lessonId: 'lesson-2',
    lessonCode: '2.1',
    section: 'example',
  });
  expect(saveLocation).toHaveBeenCalledWith(mockDb, 7, {
    unitId: 'u1',
    lessonId: 'lesson-2',
    lessonCode: '2.1',
    section: 'example',
  });
});

it('derives resumeHref from the recorded location', async () => {
  selectLocation.mockResolvedValue({
    unitId: 'u1',
    lessonId: 'lesson-2',
    lessonCode: '2.1',
    section: 'quiz',
  });

  const { result } = renderHook(() => useSession(), { wrapper });

  await waitFor(() =>
    expect(result.current.resumeHref).toEqual({
      pathname: '/evaluacion',
      params: { lesson: 'lesson-2' },
    }),
  );
});

it('clears the location in state and storage', async () => {
  selectLocation.mockResolvedValue({
    unitId: 'u1',
    lessonId: 'lesson-2',
    lessonCode: '2.1',
    section: 'lesson',
  });

  const { result } = renderHook(() => useSession(), { wrapper });
  await waitFor(() => expect(result.current.location.lessonId).toBe('lesson-2'));

  act(() => result.current.clear());

  expect(result.current.location).toEqual({
    unitId: null,
    lessonId: null,
    lessonCode: null,
    section: null,
  });
  expect(result.current.resumeHref).toBeNull();
  expect(clearLocation).toHaveBeenCalledWith(mockDb, 7);
});

it('does not touch storage when there is no account', async () => {
  mockAccountState = null;

  const { result } = renderHook(() => useSession(), { wrapper });

  act(() => {
    result.current.record({ unitId: 'u1', lessonId: 'lesson-2', section: 'hub' });
  });

  expect(selectLocation).not.toHaveBeenCalled();
  expect(saveLocation).not.toHaveBeenCalled();
});
