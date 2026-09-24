import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
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
  clearSession,
  insertAccount,
  saveSession,
  selectAccountById,
  selectAccountByUsername,
  selectSessionAccountId,
} from '@/data/repositories/accountRepository';
import { createDefaultProfile } from '@/data/repositories/profileRepository';
import { resetAccountProgress } from '@/data/repositories/progressRepository';
import type { Account } from '@/models/entities';

import {
  hashPassword,
  normalizeUsername,
  validateLogin,
  validateRegistration,
  verifyPassword,
  type Digest,
} from './authLogic';

const sha256: Digest = input => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);

export type AuthOutcome = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  account: Account | null;
  isLoading: boolean;
  register: (input: {
    displayName: string;
    username: string;
    password: string;
    confirm: string;
  }) => Promise<AuthOutcome>;
  login: (username: string, password: string) => Promise<AuthOutcome>;
  logout: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const accountId = await selectSessionAccountId(db);
      const loaded = accountId ? await selectAccountById(db, accountId) : null;
      if (!active) {
        return;
      }
      setAccount(
        loaded
          ? {
              id: loaded.id,
              username: loaded.username,
              displayName: loaded.displayName,
              createdAt: loaded.createdAt,
            }
          : null,
      );
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db]);

  const register = useCallback<AuthContextValue['register']>(
    async input => {
      const error = validateRegistration(input);
      if (error) {
        return { ok: false, error };
      }
      const username = normalizeUsername(input.username);
      const existing = await selectAccountByUsername(db, username);
      if (existing) {
        return { ok: false, error: 'username_taken' };
      }
      const salt = Crypto.randomUUID();
      const passwordHash = await hashPassword(input.password, salt, sha256);
      const displayName = input.displayName.trim();
      const id = await insertAccount(db, { username, displayName, passwordHash, salt });
      await createDefaultProfile(db, id);
      await saveSession(db, id);
      setAccount({ id, username, displayName, createdAt: new Date().toISOString() });
      return { ok: true };
    },
    [db],
  );

  const login = useCallback<AuthContextValue['login']>(
    async (username, password) => {
      if (validateLogin(username, password)) {
        return { ok: false, error: 'missing' };
      }
      const found = await selectAccountByUsername(db, normalizeUsername(username));
      if (!found) {
        return { ok: false, error: 'invalid_credentials' };
      }
      const valid = await verifyPassword(password, found.salt, found.passwordHash, sha256);
      if (!valid) {
        return { ok: false, error: 'invalid_credentials' };
      }
      await saveSession(db, found.id);
      setAccount({
        id: found.id,
        username: found.username,
        displayName: found.displayName,
        createdAt: found.createdAt,
      });
      return { ok: true };
    },
    [db],
  );

  const logout = useCallback(async () => {
    await clearSession(db);
    setAccount(null);
  }, [db]);

  const resetProgress = useCallback(async () => {
    if (!account) {
      return;
    }
    await resetAccountProgress(db, account.id);
  }, [account, db]);

  const value = useMemo<AuthContextValue>(
    () => ({ account, isLoading, register, login, logout, resetProgress }),
    [account, isLoading, register, login, logout, resetProgress],
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
