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

import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Account } from '@/shared/model/entities';

import {
  derivePasswordHash,
  isLegacyPasswordHash,
  normalizeUsername,
  PBKDF2_DEFAULT_ITERATIONS,
  validateLogin,
  validateRegistration,
  verifyPasswordHash,
  type Digest,
} from '@/features/auth/viewmodel/auth.logic';

const sha256Hex: Digest = input => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);

export type AuthOutcome = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  account: Account | null;
  isLoading: boolean;
  register: (input: {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    confirm: string;
  }) => Promise<AuthOutcome>;
  login: (username: string, password: string) => Promise<AuthOutcome>;
  logout: () => Promise<void>;
  resetProgress: () => Promise<void>;
  reloadAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { accounts, profile: profileRepository, progress } = useRepositories();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const accountId = await accounts.selectSessionAccountId();
        const loaded = accountId ? await accounts.selectAccountById(accountId) : null;
        if (!active) {
          return;
        }
        setAccount(
          loaded
            ? {
                id: loaded.id,
                username: loaded.username,
                externalKey: loaded.externalKey,
                displayName: loaded.displayName,
                createdAt: loaded.createdAt,
              }
            : null,
        );
      } catch {
        if (active) {
          setAccount(null);
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
  }, [accounts]);

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
        const salt = Crypto.randomUUID();
        const passwordHash = await derivePasswordHash(
          input.password,
          salt,
          PBKDF2_DEFAULT_ITERATIONS,
        );
        const displayName = `${input.firstName.trim()} ${input.lastName.trim()}`;
        const externalKey = Crypto.randomUUID();
        const id = await accounts.insertAccount({
          username,
          externalKey,
          displayName,
          passwordHash,
          salt,
        });
        await profileRepository.createDefaultProfile(id);
        await accounts.saveSession(id);
        setAccount({
          id,
          username,
          externalKey,
          displayName,
          createdAt: new Date().toISOString(),
        });
        return { ok: true };
      } catch (error) {
        if (__DEV__) {
          console.error('[auth] register failed', error);
        }
        return { ok: false, error: 'storage_error' };
      }
    },
    [accounts, profileRepository],
  );

  const login = useCallback<AuthContextValue['login']>(
    async (username, password) => {
      if (validateLogin(username, password)) {
        return { ok: false, error: 'missing' };
      }
      try {
        const found = await accounts.selectAccountByUsername(normalizeUsername(username));
        if (!found) {
          return { ok: false, error: 'invalid_credentials' };
        }
        const valid = await verifyPasswordHash(
          password,
          found.salt,
          found.passwordHash,
          sha256Hex,
        );
        if (!valid) {
          return { ok: false, error: 'invalid_credentials' };
        }
        if (isLegacyPasswordHash(found.passwordHash)) {
          const upgraded = await derivePasswordHash(
            password,
            found.salt,
            PBKDF2_DEFAULT_ITERATIONS,
          );
          await accounts.updatePasswordHash(found.id, upgraded, found.salt);
        }
        await accounts.saveSession(found.id);
        setAccount({
          id: found.id,
          username: found.username,
          externalKey: found.externalKey,
          displayName: found.displayName,
          createdAt: found.createdAt,
        });
        return { ok: true };
      } catch {
        return { ok: false, error: 'storage_error' };
      }
    },
    [accounts],
  );

  const logout = useCallback(async () => {
    await accounts.clearSession();
    setAccount(null);
  }, [accounts]);

  const resetProgress = useCallback(async () => {
    if (!account) {
      return;
    }
    await progress.resetAccountProgress(account.id);
  }, [account, progress]);

  const reloadAccount = useCallback(async () => {
    const accountId = await accounts.selectSessionAccountId();
    const loaded = accountId ? await accounts.selectAccountById(accountId) : null;
    setAccount(
      loaded
        ? {
            id: loaded.id,
            username: loaded.username,
            externalKey: loaded.externalKey,
            displayName: loaded.displayName,
            createdAt: loaded.createdAt,
          }
        : null,
    );
  }, [accounts]);

  const value = useMemo<AuthContextValue>(
    () => ({ account, isLoading, register, login, logout, resetProgress, reloadAccount }),
    [account, isLoading, register, login, logout, resetProgress, reloadAccount],
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
