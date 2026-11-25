import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/viewmodel/useAuth';

const mockRepos = {
  accounts: {
    selectSessionAccountId: jest.fn(),
    selectAccountById: jest.fn(),
    selectAccountByExternalKey: jest.fn(),
    selectAccountByUsername: jest.fn(),
    insertAccount: jest.fn(),
    saveSession: jest.fn(),
    clearSession: jest.fn(),
    updateAccountIdentity: jest.fn(),
    updateAccountEmail: jest.fn(),
    updatePasswordHash: jest.fn(),
    updateExternalKey: jest.fn(),
  },
  profile: { createDefaultProfile: jest.fn() },
  progress: { resetAccountProgress: jest.fn() },
  remote: {
    select: jest.fn(),
    save: jest.fn(),
    updateSync: jest.fn(),
    clearToken: jest.fn(),
  },
  backup: {},
  classes: {},
  courses: {},
  content: {},
};

const mockRegisterRemote = jest.fn();
const mockLoginRemote = jest.fn();
const mockLinkRemote = jest.fn();
const mockLogoutRemote = jest.fn();
const mockUpdateEmailRemote = jest.fn();
const mockRestore = jest.fn();
const mockUpload = jest.fn();

jest.mock('@/shared/services/data/DataProvider', () => ({
  useRepositories: () => mockRepos,
}));
jest.mock('@/features/auth/model/remoteAuth', () => ({
  registerRemote: (...args: unknown[]) => mockRegisterRemote(...args),
  loginRemote: (...args: unknown[]) => mockLoginRemote(...args),
  linkRemote: (...args: unknown[]) => mockLinkRemote(...args),
  logoutRemote: (...args: unknown[]) => mockLogoutRemote(...args),
  updateEmailRemote: (...args: unknown[]) => mockUpdateEmailRemote(...args),
}));
jest.mock('@/features/auth/model/accountRestore', () => ({
  restoreAccountState: (...args: unknown[]) => mockRestore(...args),
  uploadAccountProgress: (...args: unknown[]) => mockUpload(...args),
}));
jest.mock('@/features/auth/viewmodel/auth.logic', () => {
  const actual = jest.requireActual('@/features/auth/viewmodel/auth.logic');
  return { ...actual, verifyPasswordHash: jest.fn(async () => true) };
});

const localRecord = {
  id: 7,
  username: 'valentina',
  externalKey: '11111111-1111-4111-8111-111111111111',
  displayName: 'Valentina Ríos',
  email: 'valentina@escuela.mx',
  passwordHash: 'scrypt$legacy',
  salt: 's1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const remoteResult = {
  token: 'tok',
  student: {
    externalKey: localRecord.externalKey,
    username: 'valentina',
    displayName: 'Valentina Ríos',
    email: localRecord.email,
  },
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRepos.accounts.selectSessionAccountId.mockResolvedValue(null);
  mockRepos.accounts.selectAccountById.mockResolvedValue(null);
  mockRepos.accounts.selectAccountByExternalKey.mockResolvedValue(null);
  mockRepos.accounts.selectAccountByUsername.mockResolvedValue(null);
  mockRepos.remote.select.mockResolvedValue(null);
  mockRepos.profile.createDefaultProfile.mockResolvedValue(undefined);
  mockRestore.mockResolvedValue('none');
  mockUpload.mockResolvedValue('2026-01-02T00:00:00.000Z');
  mockLogoutRemote.mockResolvedValue(undefined);
});

describe('useAuth remoto', () => {
  it('registra en el CMS y crea la cuenta local sin contraseña', async () => {
    mockRegisterRemote.mockResolvedValue({ ok: true, result: remoteResult });
    mockRepos.accounts.insertAccount.mockResolvedValue(7);
    mockRepos.accounts.selectAccountById.mockResolvedValue({
      ...localRecord,
      passwordHash: '',
      salt: '',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const outcome = await result.current.register({
        firstName: 'Valentina',
        lastName: 'Ríos',
        email: '  Valentina@Escuela.MX ',
        username: 'Valentina',
        password: 'Secreto1!',
        confirm: 'Secreto1!',
      });
      expect(outcome).toEqual({ ok: true });
    });

    expect(mockRegisterRemote).toHaveBeenCalledWith({
      username: 'valentina',
      password: 'Secreto1!',
      displayName: 'Valentina Ríos',
      email: 'valentina@escuela.mx',
    });
    expect(mockRepos.accounts.insertAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'valentina',
        externalKey: localRecord.externalKey,
        email: 'valentina@escuela.mx',
        passwordHash: '',
        salt: '',
      }),
    );
    expect(mockRepos.remote.save).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 7,
        token: 'tok',
        pendingRestore: true,
        forceRemote: true,
      }),
    );
    expect(mockRestore).toHaveBeenCalledWith(
      mockRepos,
      expect.objectContaining({ id: 7 }),
      { forceRemote: true },
    );
    expect(result.current.account?.externalKey).toBe(localRecord.externalKey);
    expect(result.current.needsRemoteLink).toBe(false);
  });

  it('entra contra el CMS y restaura antes de mostrar la cuenta', async () => {
    mockLoginRemote.mockResolvedValue({ ok: true, result: remoteResult });
    mockRepos.accounts.selectAccountByExternalKey.mockResolvedValue(localRecord);
    mockRepos.accounts.selectAccountById.mockResolvedValue(localRecord);
    mockRestore.mockResolvedValue('upload');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const outcome = await result.current.login('valentina', '1234567a');
      expect(outcome.ok).toBe(true);
    });

    expect(mockRepos.remote.save).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok', pendingRestore: false, forceRemote: false }),
    );
    expect(mockRestore).toHaveBeenCalledWith(
      mockRepos,
      expect.objectContaining({ id: 7 }),
      { forceRemote: false },
    );
    expect(mockUpload).toHaveBeenCalled();
    expect(result.current.account?.id).toBe(7);
  });

  it('adopta el correo remoto cuando el espejo local está viejo', async () => {
    mockLoginRemote.mockResolvedValue({ ok: true, result: remoteResult });
    mockRepos.accounts.selectAccountByExternalKey.mockResolvedValue({
      ...localRecord,
      email: 'viejo@escuela.mx',
    });
    mockRepos.accounts.selectAccountById.mockResolvedValue(localRecord);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const outcome = await result.current.login('valentina', '1234567a');
      expect(outcome.ok).toBe(true);
    });

    expect(mockRepos.accounts.updateAccountIdentity).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ email: 'valentina@escuela.mx' }),
    );
    expect(result.current.account?.email).toBe('valentina@escuela.mx');
  });

  it('deja entrar sin red a una cuenta local antigua no vinculada', async () => {
    mockLoginRemote.mockResolvedValue({ ok: false, error: 'network_error' });
    mockRepos.accounts.selectAccountByUsername.mockResolvedValue(localRecord);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const outcome = await result.current.login('valentina', '1234567a');
      expect(outcome.ok).toBe(true);
    });

    expect(mockRepos.accounts.saveSession).toHaveBeenCalledWith(7);
    expect(result.current.account?.id).toBe(7);
    expect(result.current.needsRemoteLink).toBe(true);
  });

  it('vincula la cuenta antigua con el código del docente', async () => {
    mockRepos.accounts.selectSessionAccountId.mockResolvedValue(7);
    mockRepos.accounts.selectAccountById.mockResolvedValue(localRecord);
    mockRepos.accounts.selectAccountByExternalKey.mockResolvedValue(localRecord);
    mockLinkRemote.mockResolvedValue({ ok: true, result: remoteResult });
    mockRestore.mockResolvedValue('upload');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.needsRemoteLink).toBe(true);

    await act(async () => {
      const outcome = await result.current.linkAccount(
        '1234567a',
        'Secreto1!',
        '123456',
      );
      expect(outcome.ok).toBe(true);
    });

    expect(mockLinkRemote).toHaveBeenCalledWith({
      externalKey: localRecord.externalKey,
      username: localRecord.username,
      password: 'Secreto1!',
      displayName: localRecord.displayName,
      code: '123456',
    });
    expect(mockRegisterRemote).not.toHaveBeenCalled();
    expect(mockUpload).toHaveBeenCalled();
    expect(result.current.needsRemoteLink).toBe(false);
  });

  it('deja entrar localmente si el CMS no reconoce la cuenta antigua', async () => {
    mockLoginRemote.mockResolvedValue({
      ok: false,
      error: 'invalid_credentials',
    });
    mockRepos.accounts.selectAccountByUsername.mockResolvedValue(localRecord);
    mockRepos.remote.select.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const outcome = await result.current.login('valentina', '1234567a');
      expect(outcome.ok).toBe(true);
    });

    expect(mockRegisterRemote).not.toHaveBeenCalled();
    expect(result.current.needsRemoteLink).toBe(true);
    expect(result.current.account?.id).toBe(7);
  });

  it('guarda el correo de recuperación con la contraseña actual', async () => {
    mockRepos.accounts.selectSessionAccountId.mockResolvedValue(7);
    mockRepos.accounts.selectAccountById.mockResolvedValue(localRecord);
    mockUpdateEmailRemote.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const outcome = await result.current.updateRecoveryEmail(
        '  Nueva@Escuela.MX ',
        'Secreto1!',
      );
      expect(outcome).toEqual({ ok: true });
    });

    expect(mockUpdateEmailRemote).toHaveBeenCalledWith(
      'nueva@escuela.mx',
      'Secreto1!',
    );
    expect(mockRepos.accounts.updateAccountEmail).toHaveBeenCalledWith(
      7,
      'nueva@escuela.mx',
    );
    expect(result.current.account?.email).toBe('nueva@escuela.mx');
  });

  it('no guarda el correo si la contraseña actual es incorrecta', async () => {
    mockRepos.accounts.selectSessionAccountId.mockResolvedValue(7);
    mockRepos.accounts.selectAccountById.mockResolvedValue(localRecord);
    mockUpdateEmailRemote.mockResolvedValue({
      ok: false,
      error: 'invalid_credentials',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const outcome = await result.current.updateRecoveryEmail(
        'nueva@escuela.mx',
        'mala',
      );
      expect(outcome).toEqual({ ok: false, error: 'invalid_credentials' });
    });

    expect(mockRepos.accounts.updateAccountEmail).not.toHaveBeenCalled();
    expect(result.current.account?.email).toBe(localRecord.email);
  });
});
