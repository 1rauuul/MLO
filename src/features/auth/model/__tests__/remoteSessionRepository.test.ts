import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import {
  clearRemoteToken,
  saveRemoteSession,
  selectRemoteSession,
  updateRemoteSync,
} from '@/features/auth/model/remoteSessionRepository';

const secure = jest.mocked(SecureStore);

function makeDb(overrides: { row?: unknown } = {}) {
  const calls = {
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 })),
    getFirstAsync: jest.fn(async () => overrides.row ?? null),
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

const row = {
  account_id: 7,
  token: null,
  expires_at: '2026-12-24T00:00:00.000Z',
  last_uploaded_hash: 'abc',
  last_synced_at: '2026-11-24T00:00:00.000Z',
  pending_restore: 1,
  force_remote: 1,
  created_at: '2026-11-24T00:00:00.000Z',
};

describe('remoteSessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    secure.getItemAsync.mockResolvedValue(null);
    secure.setItemAsync.mockResolvedValue(undefined);
    secure.deleteItemAsync.mockResolvedValue(undefined);
  });

  it('mapea la sesión remota con el token de SecureStore', async () => {
    const { db } = makeDb({ row });
    secure.getItemAsync.mockResolvedValue('tok');
    await expect(selectRemoteSession(db, 7)).resolves.toEqual({
      accountId: 7,
      token: 'tok',
      expiresAt: '2026-12-24T00:00:00.000Z',
      lastUploadedHash: 'abc',
      lastSyncedAt: '2026-11-24T00:00:00.000Z',
      pendingRestore: true,
      forceRemote: true,
      createdAt: '2026-11-24T00:00:00.000Z',
    });
    expect(secure.getItemAsync).toHaveBeenCalledWith('mlo.remote.token.7');
  });

  it('devuelve null si la cuenta no tiene sesión remota', async () => {
    const { db } = makeDb();
    await expect(selectRemoteSession(db, 7)).resolves.toBeNull();
    expect(secure.getItemAsync).not.toHaveBeenCalled();
  });

  it('migra el token antiguo de SQLite a SecureStore y lo borra', async () => {
    const { db, calls } = makeDb({ row: { ...row, token: 'legacy-tok' } });
    const session = await selectRemoteSession(db, 7);
    expect(session?.token).toBe('legacy-tok');
    expect(secure.setItemAsync).toHaveBeenCalledWith('mlo.remote.token.7', 'legacy-tok');
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET token = NULL'),
      7,
    );
  });

  it('conserva el token en SQLite si falla la migración a SecureStore', async () => {
    const { db, calls } = makeDb({ row: { ...row, token: 'legacy-tok' } });
    secure.setItemAsync.mockRejectedValue(new Error('keychain unavailable'));
    await expect(selectRemoteSession(db, 7)).rejects.toThrow('keychain unavailable');
    expect(calls.runAsync).not.toHaveBeenCalled();
  });

  it('guarda el token en SecureStore y deja NULL en SQLite', async () => {
    const { db, calls } = makeDb();
    await saveRemoteSession(db, {
      accountId: 7,
      token: 'tok',
      expiresAt: '2026-12-24T00:00:00.000Z',
      pendingRestore: true,
      forceRemote: true,
    });
    expect(secure.setItemAsync).toHaveBeenCalledWith('mlo.remote.token.7', 'tok');
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(account_id) DO UPDATE'),
      7,
      null,
      '2026-12-24T00:00:00.000Z',
      1,
      1,
      expect.any(String),
    );
  });

  it('actualiza solo los campos indicados', async () => {
    const { db, calls } = makeDb();
    await updateRemoteSync(db, 7, {
      lastUploadedHash: 'hash',
      pendingRestore: false,
      forceRemote: false,
    });
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('last_uploaded_hash = CASE'),
      1,
      'hash',
      0,
      null,
      1,
      0,
      1,
      0,
      7,
    );
  });

  it('borra el token seguro al cerrar sesión y conserva la fila', async () => {
    const { db, calls } = makeDb();
    await clearRemoteToken(db, 7);
    expect(secure.deleteItemAsync).toHaveBeenCalledWith('mlo.remote.token.7');
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE remote_session SET token = NULL'),
      7,
    );
    expect(calls.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM remote_session'),
      expect.anything(),
    );
  });

  describe('en web', () => {
    const originalOS = Platform.OS;

    beforeEach(() => {
      (Platform as unknown as { OS: string }).OS = 'web';
    });

    afterEach(() => {
      (Platform as unknown as { OS: string }).OS = originalOS;
    });

    it('guarda, lee y limpia el token en SQLite sin tocar SecureStore', async () => {
      const { db, calls } = makeDb({ row: { ...row, token: 'web-tok' } });
      await saveRemoteSession(db, {
        accountId: 7,
        token: 'web-tok',
        expiresAt: '2026-12-24T00:00:00.000Z',
      });
      expect(calls.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT(account_id) DO UPDATE'),
        7,
        'web-tok',
        '2026-12-24T00:00:00.000Z',
        0,
        0,
        expect.any(String),
      );
      await expect(selectRemoteSession(db, 7)).resolves.toMatchObject({ token: 'web-tok' });
      await clearRemoteToken(db, 7);
      expect(secure.setItemAsync).not.toHaveBeenCalled();
      expect(secure.getItemAsync).not.toHaveBeenCalled();
      expect(secure.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});
