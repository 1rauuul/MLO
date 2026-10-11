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
  updatePasswordHash,
} from '@/data/repositories/accountRepository';
import { createDefaultProfile } from '@/data/repositories/profileRepository';
import { resetAccountProgress } from '@/data/repositories/progressRepository';
import type { Account } from '@/models/entities';

import {
  derivePasswordHash,
  isLegacyPasswordHash,
  normalizeUsername,
  PBKDF2_DEFAULT_ITERATIONS,
  validateLogin,
  validateRegistration,
  verifyPasswordHash,
  type ByteDigest,
  type Digest,
} from './authLogic';

const sha256Hex: Digest = input => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
const sha256Bytes: ByteDigest = async input => {
  const buffer = input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength,
  ) as ArrayBuffer;
  return new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, buffer));
};

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
      try {
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
  }, [db]);

  const register = useCallback<AuthContextValue['register']>(
    async input => {
      const error = validateRegistration(input);
      if (error) {
        return { ok: false, error };
      }
      try {
        const username = normalizeUsername(input.username);
        const existing = await selectAccountByUsername(db, username);
        if (existing) {
          return { ok: false, error: 'username_taken' };
        }
        const salt = Crypto.randomUUID();
        const passwordHash = await derivePasswordHash(
          input.password,
          salt,
          PBKDF2_DEFAULT_ITERATIONS,
          sha256Bytes,
        );
        const displayName = input.displayName.trim();
        const id = await insertAccount(db, { username, displayName, passwordHash, salt });
        await createDefaultProfile(db, id);
        await saveSession(db, id);
        setAccount({ id, username, displayName, createdAt: new Date().toISOString() });
        return { ok: true };
      } catch {
        return { ok: false, error: 'storage_error' };
      }
    },
    [db],
  );

  const login = useCallback<AuthContextValue['login']>(
    async (username, password) => {
      if (validateLogin(username, password)) {
        return { ok: false, error: 'missing' };
      }
      try {
        const found = await selectAccountByUsername(db, normalizeUsername(username));
        if (!found) {
          return { ok: false, error: 'invalid_credentials' };
        }
        const valid = await verifyPasswordHash(
          password,
          found.salt,
          found.passwordHash,
          sha256Hex,
          sha256Bytes,
        );
        if (!valid) {
          return { ok: false, error: 'invalid_credentials' };
        }
        if (isLegacyPasswordHash(found.passwordHash)) {
          const upgraded = await derivePasswordHash(
            password,
            found.salt,
            PBKDF2_DEFAULT_ITERATIONS,
            sha256Bytes,
          );
          await updatePasswordHash(db, found.id, upgraded, found.salt);
        }
        await saveSession(db, found.id);
        setAccount({
          id: found.id,
          username: found.username,
          displayName: found.displayName,
          createdAt: found.createdAt,
        });
        return { ok: true };
      } catch {
        return { ok: false, error: 'storage_error' };
      }
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
