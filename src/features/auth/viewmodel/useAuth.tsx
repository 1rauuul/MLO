import * as Crypto from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  restoreAccountState,
  uploadAccountProgress,
} from '@/features/auth/model/accountRestore';
import type { AccountRecord } from '@/features/auth/model/accountRepository';
import {
  linkRemote,
  loginRemote,
  logoutRemote,
  registerRemote,
  updateEmailRemote,
  type RemoteAuthResult,
} from '@/features/auth/model/remoteAuth';
import {
  isValidEmail,
  normalizeEmail,
  normalizeUsername,
  validateLogin,
  validateRegistration,
  verifyPasswordHash,
  type Digest,
} from '@/features/auth/viewmodel/auth.logic';
import { setAuthToken } from '@/shared/services/http/authToken';
import type { Repositories } from '@/shared/services/data/DataProvider';
import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Account } from '@/shared/model/entities';

const sha256Hex: Digest = input =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);

const REMOTE_SESSION_DAYS = 30;
const NO_LOCAL_PASSWORD = '';

export type AuthOutcome = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  account: Account | null;
  isLoading: boolean;
  /** La cuenta local no tiene fila remota: nunca estuvo en la nube. */
  needsRemoteLink: boolean;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    confirm: string;
  }) => Promise<AuthOutcome>;
  login: (username: string, password: string) => Promise<AuthOutcome>;
  linkAccount: (
    currentPassword: string,
    newPassword: string,
    code: string,
  ) => Promise<AuthOutcome>;
  updateRecoveryEmail: (email: string, password: string) => Promise<AuthOutcome>;
  logout: () => Promise<void>;
  resetProgress: () => Promise<void>;
  reloadAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAccount(record: AccountRecord): Account {
  return {
    id: record.id,
    username: record.username,
    externalKey: record.externalKey,
    displayName: record.displayName,
    email: record.email,
    createdAt: record.createdAt,
  };
}

function expiresAt(): string {
  return new Date(
    Date.now() + REMOTE_SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

async function verifyLocalPassword(
  local: AccountRecord,
  password: string,
): Promise<boolean> {
  if (!local.passwordHash) {
    return false;
  }
  return verifyPasswordHash(password, local.salt, local.passwordHash, sha256Hex);
}

/**
 * Crea o adopta la cuenta local que corresponde a la identidad remota.
 * Devuelve `forceRemote` cuando el identificador cambió: el progreso de la
 * nube manda y no se sube el de la identidad anterior.
 */
async function reconcileAccount(
  repos: Repositories,
  result: RemoteAuthResult,
): Promise<{ record: AccountRecord; forceRemote: boolean }> {
  const { student } = result;
  let record = await repos.accounts.selectAccountByExternalKey(student.externalKey);
  let forceRemote = false;

  if (!record) {
    record = await repos.accounts.selectAccountByUsername(student.username);
    if (record) {
      forceRemote = record.externalKey !== student.externalKey;
      await repos.accounts.updateAccountIdentity(record.id, {
        externalKey: student.externalKey,
        displayName: student.displayName,
        email: student.email,
      });
    } else {
      const id = await repos.accounts.insertAccount({
        username: student.username,
        externalKey: student.externalKey,
        displayName: student.displayName,
        email: student.email,
        passwordHash: NO_LOCAL_PASSWORD,
        salt: '',
      });
      await repos.profile.createDefaultProfile(id);
      record = await repos.accounts.selectAccountById(id);
      forceRemote = true;
    }
  } else if (
    record.displayName !== student.displayName ||
    record.email !== student.email
  ) {
    await repos.accounts.updateAccountIdentity(record.id, {
      externalKey: record.externalKey,
      displayName: student.displayName,
      email: student.email,
    });
  }

  if (!record) {
    throw new Error('No se pudo guardar la cuenta local.');
  }
  const refreshed = await repos.accounts.selectAccountById(record.id);
  if (!refreshed) {
    throw new Error('No se pudo guardar la cuenta local.');
  }
  return { record: refreshed, forceRemote };
}

async function persistRemoteLogin(
  repos: Repositories,
  result: RemoteAuthResult,
  options: { restore: boolean },
): Promise<Account> {
  const { record, forceRemote } = await reconcileAccount(repos, result);
  const account = toAccount(record);

  await repos.accounts.saveSession(record.id);
  await repos.remote.save({
    accountId: record.id,
    token: result.token,
    expiresAt: expiresAt(),
    pendingRestore: options.restore ? forceRemote : false,
    forceRemote: options.restore ? forceRemote : false,
  });
  setAuthToken(result.token);

  if (options.restore) {
    try {
      const action = await restoreAccountState(repos, account, { forceRemote });
      if (action === 'upload') {
        // Si falla, la huella queda vieja y el proveedor reintenta.
        await uploadAccountProgress(repos, account).catch(() => undefined);
      }
    } catch {
      await repos.remote.updateSync(record.id, { pendingRestore: true });
    }
  }

  return account;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const { accounts, progress, remote } = repos;
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRemoteLink, setNeedsRemoteLink] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const accountId = await accounts.selectSessionAccountId();
        const loaded = accountId
          ? await accounts.selectAccountById(accountId)
          : null;
        const remoteSession = loaded ? await remote.select(loaded.id) : null;
        if (!active) {
          return;
        }
        setAuthToken(remoteSession?.token ?? null);
        setAccount(loaded ? toAccount(loaded) : null);
        setNeedsRemoteLink(Boolean(loaded && !remoteSession));
      } catch {
        if (active) {
          setAuthToken(null);
          setAccount(null);
          setNeedsRemoteLink(false);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [accounts, remote]);

  const register = useCallback<AuthContextValue['register']>(
    async input => {
      const error = validateRegistration(input);
      if (error) {
        return { ok: false, error };
      }
      try {
        const username = normalizeUsername(input.username);
        const existing = await accounts.selectAccountByUsername(username);
        if (existing) {
          return { ok: false, error: 'username_taken' };
        }
        const displayName = `${input.firstName.trim()} ${input.lastName.trim()}`;
        const result = await registerRemote({
          username,
          password: input.password,
          displayName,
          email: normalizeEmail(input.email),
        });
        if (!result.ok) {
          return { ok: false, error: result.error };
        }
        const created = await persistRemoteLogin(repos, result.result, {
          restore: true,
        });
        setAccount(created);
        setNeedsRemoteLink(false);
        return { ok: true };
      } catch (error) {
        if (__DEV__) console.error('[auth] register failed', error);
        return { ok: false, error: 'storage_error' };
      }
    },
    [accounts, repos],
  );

  const login = useCallback<AuthContextValue['login']>(
    async (username, password) => {
      if (validateLogin(username, password)) {
        return { ok: false, error: 'missing' };
      }
      const normalized = normalizeUsername(username);
      try {
        const remoteResult = await loginRemote(normalized, password);

        if (remoteResult.ok) {
          const logged = await persistRemoteLogin(repos, remoteResult.result, {
            restore: true,
          });
          setAccount(logged);
          setNeedsRemoteLink(false);
          return { ok: true };
        }

        if (remoteResult.error === 'network_error') {
          const local = await accounts.selectAccountByUsername(normalized);
          const remoteSession = local ? await remote.select(local.id) : null;
          if (
            local &&
            !remoteSession?.token &&
            !remoteSession?.lastUploadedHash &&
            (await verifyLocalPassword(local, password))
          ) {
            await accounts.saveSession(local.id);
            setAuthToken(null);
            setAccount(toAccount(local));
            setNeedsRemoteLink(true);
            return { ok: true };
          }
          return { ok: false, error: 'network_error' };
        }

        if (remoteResult.error === 'invalid_credentials') {
          const local = await accounts.selectAccountByUsername(normalized);
          const remoteSession = local ? await remote.select(local.id) : null;
          if (
            local &&
            !remoteSession?.token &&
            !remoteSession?.lastUploadedHash &&
            (await verifyLocalPassword(local, password))
          ) {
            await accounts.saveSession(local.id);
            setAuthToken(null);
            setAccount(toAccount(local));
            setNeedsRemoteLink(true);
            return { ok: true };
          }
          return { ok: false, error: 'invalid_credentials' };
        }

        return { ok: false, error: remoteResult.error };
      } catch (error) {
        if (__DEV__) console.error('[auth] login failed', error);
        return { ok: false, error: 'storage_error' };
      }
    },
    [accounts, remote, repos],
  );

  const linkAccount = useCallback<AuthContextValue['linkAccount']>(
    async (currentPassword, newPassword, code) => {
      if (!account) {
        return { ok: false, error: 'missing' };
      }
      try {
        const local = await accounts.selectAccountById(account.id);
        if (!local) {
          return { ok: false, error: 'storage_error' };
        }
        if (!(await verifyLocalPassword(local, currentPassword))) {
          return { ok: false, error: 'invalid_credentials' };
        }

        const result = await linkRemote({
          externalKey: local.externalKey,
          username: local.username,
          password: newPassword,
          displayName: local.displayName,
          code,
        });
        if (!result.ok) {
          return { ok: false, error: result.error };
        }

        const linked = await persistRemoteLogin(repos, result.result, {
          restore: true,
        });
        setAccount(linked);
        setNeedsRemoteLink(false);
        return { ok: true };
      } catch (error) {
        if (__DEV__) console.error('[auth] link failed', error);
        return { ok: false, error: 'storage_error' };
      }
    },
    [account, accounts, repos],
  );

  const updateRecoveryEmail = useCallback<AuthContextValue['updateRecoveryEmail']>(
    async (email, password) => {
      if (!account) {
        return { ok: false, error: 'missing' };
      }
      const normalized = normalizeEmail(email);
      if (normalized.length === 0) {
        return { ok: false, error: 'email_empty' };
      }
      if (!isValidEmail(normalized)) {
        return { ok: false, error: 'email_invalid' };
      }
      if (password.length === 0) {
        return { ok: false, error: 'invalid_credentials' };
      }
      try {
        const result = await updateEmailRemote(normalized, password);
        if (!result.ok) {
          return { ok: false, error: result.error };
        }
        await accounts.updateAccountEmail(account.id, normalized);
        setAccount(current => (current ? { ...current, email: normalized } : current));
        return { ok: true };
      } catch (error) {
        if (__DEV__) console.error('[auth] recovery email failed', error);
        return { ok: false, error: 'storage_error' };
      }
    },
    [account, accounts],
  );

  const logout = useCallback(async () => {
    if (account) {
      await remote.clearToken(account.id);
    }
    // No bloquea el cierre local si no hay red; el token ya se leyó.
    void logoutRemote();
    setAuthToken(null);
    await accounts.clearSession();
    setAccount(null);
    setNeedsRemoteLink(false);
  }, [account, accounts, remote]);

  const resetProgress = useCallback(async () => {
    if (!account) {
      return;
    }
    await progress.resetAccountProgress(account.id);
  }, [account, progress]);

  const reloadAccount = useCallback(async () => {
    const accountId = await accounts.selectSessionAccountId();
    const loaded = accountId ? await accounts.selectAccountById(accountId) : null;
    const remoteSession = loaded ? await remote.select(loaded.id) : null;
    setAuthToken(remoteSession?.token ?? null);
    setAccount(loaded ? toAccount(loaded) : null);
    setNeedsRemoteLink(Boolean(loaded && !remoteSession));
  }, [accounts, remote]);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      isLoading,
      needsRemoteLink,
      register,
      login,
      linkAccount,
      updateRecoveryEmail,
      logout,
      resetProgress,
      reloadAccount,
    }),
    [
      account,
      isLoading,
      needsRemoteLink,
      register,
      login,
      linkAccount,
      updateRecoveryEmail,
      logout,
      resetProgress,
      reloadAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
