import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ActiveCatalogProvider, useActiveCatalog } from '@/features/groups/viewmodel/useActiveCatalog';

let mockAccount: { id: number } | null = { id: 7 };
const mockSelectAccountGroup = jest.fn();

jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({ account: mockAccount }),
}));
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => ({
    groups: { selectAccountGroup: mockSelectAccountGroup },
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <ActiveCatalogProvider>{children}</ActiveCatalogProvider>;
}

describe('useActiveCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = { id: 7 };
  });

  it('usa el curso base cuando la cuenta no tiene grupo', async () => {
    mockSelectAccountGroup.mockResolvedValue(null);
    const { result } = renderHook(() => useActiveCatalog(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.catalogId).toBe('base');
    expect(result.current.group).toBeNull();
  });

  it('expone el curso del grupo activo', async () => {
    mockSelectAccountGroup.mockResolvedValue({
      groupId: 'g1',
      groupCode: 'abc123',
      groupName: 'Grupo A',
      teacherName: 'Profesora Ríos',
      catalogId: 'k7f3q',
      joinedAt: '2026-10-26T00:00:00.000Z',
    });
    const { result } = renderHook(() => useActiveCatalog(), { wrapper });

    await waitFor(() => expect(result.current.catalogId).toBe('k7f3q'));
    expect(result.current.group?.groupName).toBe('Grupo A');
  });

  it('vuelve a base sin cuenta', async () => {
    mockAccount = null;
    const { result } = renderHook(() => useActiveCatalog(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.catalogId).toBe('base');
    expect(mockSelectAccountGroup).not.toHaveBeenCalled();
  });
});
