import type { SQLiteDatabase } from 'expo-sqlite';

import {
  clearRemoteToken,
  saveRemoteSession,
  selectRemoteSession,
  updateRemoteSync,
} from '@/features/auth/model/remoteSessionRepository';

function makeDb(overrides: { row?: unknown } = {}) {
  const calls = {
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 })),
    getFirstAsync: jest.fn(async () => overrides.row ?? null),
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

const row = {
  account_id: 7,
  token: 'tok',
  expires_at: '2026-12-24T00:00:00.000Z',
  last_uploaded_hash: 'abc',
  last_synced_at: '2026-11-24T00:00:00.000Z',
  pending_restore: 1,
  force_remote: 1,
  created_at: '2026-11-24T00:00:00.000Z',
};

describe('remoteSessionRepository', () => {
  it('mapea la sesión remota', async () => {
    const { db } = makeDb({ row });
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
  });

  it('devuelve null si la cuenta no tiene sesión remota', async () => {
    const { db } = makeDb();
    await expect(selectRemoteSession(db, 7)).resolves.toBeNull();
  });

  it('guarda o reemplaza el token sin perder el hash', async () => {
    const { db, calls } = makeDb();
    await saveRemoteSession(db, {
      accountId: 7,
      token: 'tok',
      expiresAt: '2026-12-24T00:00:00.000Z',
      pendingRestore: true,
      forceRemote: true,
    });
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(account_id) DO UPDATE'),
      7,
      'tok',
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

  it('borra el token al cerrar sesión y conserva la fila', async () => {
    const { db, calls } = makeDb();
    await clearRemoteToken(db, 7);
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET token = NULL'),
      7,
    );
  });
});
