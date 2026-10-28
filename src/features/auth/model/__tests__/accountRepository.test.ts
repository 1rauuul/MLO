import type { SQLiteDatabase } from 'expo-sqlite';

import {
  clearSession,
  insertAccount,
  saveSession,
  selectAccountByExternalKey,
  selectAccountById,
  selectAccountByUsername,
  selectSessionAccountId,
  updateExternalKey,
  updatePasswordHash,
} from '@/features/auth/model/accountRepository';

interface Calls {
  runAsync: jest.Mock;
  getFirstAsync: jest.Mock;
}

function makeDb(overrides: Partial<Calls> = {}) {
  const calls: Calls = {
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 42 })),
    getFirstAsync: jest.fn(async () => null),
    ...overrides,
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

const accountRow = {
  id: 7,
  username: 'valentina',
  external_key: '11111111-1111-4111-8111-111111111111',
  display_name: 'Valentina Ríos',
  password_hash: 'abc',
  salt: 's1',
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('accountRepository', () => {
  it('insertAccount inserta y devuelve el id generado', async () => {
    const { db, calls } = makeDb();

    const id = await insertAccount(db, {
      username: 'valentina',
      externalKey: '11111111-1111-4111-8111-111111111111',
      displayName: 'Valentina',
      passwordHash: 'hash',
      salt: 's1',
    });

    expect(id).toBe(42);
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO accounts'),
      'valentina',
      '11111111-1111-4111-8111-111111111111',
      'Valentina',
      'hash',
      's1',
      expect.any(String),
    );
  });

  it('selectAccountByUsername mapea la fila', async () => {
    const { db, calls } = makeDb({ getFirstAsync: jest.fn(async () => accountRow) });

    await expect(selectAccountByUsername(db, 'valentina')).resolves.toEqual({
      id: 7,
      username: 'valentina',
      externalKey: '11111111-1111-4111-8111-111111111111',
      displayName: 'Valentina Ríos',
      passwordHash: 'abc',
      salt: 's1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(calls.getFirstAsync).toHaveBeenCalledWith(expect.any(String), 'valentina');
  });

  it('selectAccountByUsername devuelve null sin fila', async () => {
    const { db } = makeDb();
    await expect(selectAccountByUsername(db, 'nadie')).resolves.toBeNull();
  });

  it('selectAccountById consulta por id', async () => {
    const { db } = makeDb({ getFirstAsync: jest.fn(async () => accountRow) });

    const account = await selectAccountById(db, 7);

    expect(account?.username).toBe('valentina');
  });

  it('selectSessionAccountId devuelve null sin sesión', async () => {
    const { db } = makeDb();
    await expect(selectSessionAccountId(db)).resolves.toBeNull();
  });

  it('selectSessionAccountId devuelve el id de la sesión', async () => {
    const { db } = makeDb({ getFirstAsync: jest.fn(async () => ({ account_id: 7 })) });
    await expect(selectSessionAccountId(db)).resolves.toBe(7);
  });

  it('saveSession hace upsert de la fila id=1', async () => {
    const { db, calls } = makeDb();

    await saveSession(db, 7);

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(id) DO UPDATE'),
      7,
    );
  });

  it('clearSession borra la fila id=1', async () => {
    const { db, calls } = makeDb();

    await clearSession(db);

    expect(calls.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM auth_session'), );
  });

  it('updatePasswordHash actualiza hash y salt', async () => {
    const { db, calls } = makeDb();

    await updatePasswordHash(db, 7, 'nuevo-hash', 'nueva-salt');

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE accounts SET password_hash'),
      'nuevo-hash',
      'nueva-salt',
      7,
    );
  });

  it('updateExternalKey cambia la identidad de la persona', async () => {
    const { db, calls } = makeDb();

    await updateExternalKey(db, 7, '22222222-2222-4222-8222-222222222222');

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE accounts SET external_key'),
      '22222222-2222-4222-8222-222222222222',
      7,
    );
  });

  it('selectAccountByExternalKey consulta por la identidad estable', async () => {
    const { db, calls } = makeDb({ getFirstAsync: jest.fn(async () => accountRow) });

    const account = await selectAccountByExternalKey(
      db,
      '11111111-1111-4111-8111-111111111111',
    );

    expect(account?.username).toBe('valentina');
    expect(calls.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE external_key'),
      '11111111-1111-4111-8111-111111111111',
    );
  });
});
