import { act, renderHook } from '@testing-library/react-native';

import { normalizeGroupCode, useJoinGroup } from '@/features/groups/viewmodel/useJoinGroup';
import { HttpError } from '@/shared/services/http/client';
import { groupFixture } from '@/shared/services/http/fixtures';

const mockFetchGroup = jest.fn();
const mockRefreshCatalog = jest.fn(async () => true);
const mockApplyStaged = jest.fn(async (): Promise<{ failed: string[] }> => ({ failed: [] }));
const mockSaveGroup = jest.fn(async () => {});
const mockClearLocation = jest.fn(async () => {});

jest.mock('@/features/auth/viewmodel/useAuth', () => ({
  useAuth: () => ({ account: { id: 7 } }),
}));
jest.mock('@/features/groups/viewmodel/useActiveCatalog', () => ({
  useActiveCatalog: () => ({ refresh: jest.fn() }),
}));
jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => ({
    content: {
      fetchGroup: mockFetchGroup,
      refreshCatalog: mockRefreshCatalog,
      applyStagedContent: mockApplyStaged,
    },
    groups: { saveAccountGroup: mockSaveGroup },
    locations: { clearLocation: mockClearLocation },
  }),
}));

describe('useJoinGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normaliza el código quitando espacios y pasándolo a mayúsculas', () => {
    expect(normalizeGroupCode(' ab c123 ')).toBe('ABC123');
  });

  it('busca el grupo y lo confirma', async () => {
    mockFetchGroup.mockResolvedValue(groupFixture);
    const { result } = renderHook(() => useJoinGroup());

    await act(async () => {
      await result.current.lookup(' AB C123 ');
    });

    expect(mockFetchGroup).toHaveBeenCalledWith('ABC123');
    expect(result.current.preview?.catalog.id).toBe('k7f3q');
    expect(result.current.phase).toBe('confirm');
  });

  it('valida el largo del código sin llamar al servidor', async () => {
    const { result } = renderHook(() => useJoinGroup());

    await act(async () => {
      await result.current.lookup('abc');
    });

    expect(result.current.error).toBe('code');
    expect(mockFetchGroup).not.toHaveBeenCalled();
  });

  it('mapea 404 y 410 a mensajes propios', async () => {
    mockFetchGroup.mockRejectedValueOnce(new HttpError(404, ''));
    const first = renderHook(() => useJoinGroup());
    await act(async () => {
      await first.result.current.lookup('abc123');
    });
    expect(first.result.current.error).toBe('not_found');

    mockFetchGroup.mockRejectedValueOnce(new HttpError(410, ''));
    const second = renderHook(() => useJoinGroup());
    await act(async () => {
      await second.result.current.lookup('abc123');
    });
    expect(second.result.current.error).toBe('closed');

    mockFetchGroup.mockRejectedValueOnce(new HttpError(429, ''));
    const third = renderHook(() => useJoinGroup());
    await act(async () => {
      await third.result.current.lookup('abc123');
    });
    expect(third.result.current.error).toBe('rate_limited');
  });

  it('descarga, aplica y guarda el grupo al confirmar', async () => {
    mockFetchGroup.mockResolvedValue(groupFixture);
    const { result } = renderHook(() => useJoinGroup());

    await act(async () => {
      await result.current.lookup('abc123');
    });
    await act(async () => {
      await expect(result.current.join()).resolves.toBe(true);
    });

    expect(mockRefreshCatalog).toHaveBeenCalledWith('k7f3q', true);
    expect(mockApplyStaged).toHaveBeenCalledWith('k7f3q');
    expect(mockSaveGroup).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ groupId: 'g1', catalogId: 'k7f3q' }),
    );
    expect(mockClearLocation).toHaveBeenCalledWith(7);
  });

  it('no confunde un curso sin publicar con un código inexistente', async () => {
    mockFetchGroup.mockResolvedValue(groupFixture);
    mockRefreshCatalog.mockRejectedValueOnce(new HttpError(404, ''));
    const { result } = renderHook(() => useJoinGroup());

    await act(async () => {
      await result.current.lookup('ABC123');
    });
    await act(async () => {
      await expect(result.current.join()).resolves.toBe(false);
    });

    expect(result.current.error).toBe('content_missing');
    expect(mockSaveGroup).not.toHaveBeenCalled();
  });

  it('no guarda el grupo si una lección no se pudo aplicar', async () => {
    mockFetchGroup.mockResolvedValue(groupFixture);
    mockApplyStaged.mockResolvedValueOnce({ failed: ['k7f3q-l1.2'] });
    const { result } = renderHook(() => useJoinGroup());

    await act(async () => {
      await result.current.lookup('abc123');
    });
    await act(async () => {
      await expect(result.current.join()).resolves.toBe(false);
    });

    expect(result.current.error).toBe('incomplete');
    expect(mockSaveGroup).not.toHaveBeenCalled();
    expect(mockClearLocation).not.toHaveBeenCalled();
  });
});
