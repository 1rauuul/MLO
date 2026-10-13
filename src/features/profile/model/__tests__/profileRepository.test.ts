import type { SQLiteDatabase } from 'expo-sqlite';

import { createDefaultProfile, saveProfile, selectProfile } from '@/features/profile/model/profileRepository';

function makeDb(overrides: Record<string, jest.Mock> = {}) {
  const calls = {
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 })),
    getFirstAsync: jest.fn(async () => null),
    ...overrides,
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

const profileRow = {
  id: 3,
  account_id: 7,
  learning_style: 'Activo',
  dark_mode: 1,
  large_text: 0,
};

describe('profileRepository', () => {
  it('selectProfile mapea enteros a booleanos', async () => {
    const { db, calls } = makeDb({ getFirstAsync: jest.fn(async () => profileRow) });

    await expect(selectProfile(db, 7)).resolves.toEqual({
      id: 3,
      accountId: 7,
      learningStyle: 'Activo',
      darkMode: true,
      largeText: false,
    });
    expect(calls.getFirstAsync).toHaveBeenCalledWith(expect.any(String), 7);
  });

  it('selectProfile devuelve null sin fila', async () => {
    const { db } = makeDb();
    await expect(selectProfile(db, 7)).resolves.toBeNull();
  });

  it('saveProfile hace upsert con booleanos como enteros', async () => {
    const { db, calls } = makeDb();

    await saveProfile(db, {
      id: 3,
      accountId: 7,
      learningStyle: 'Teórico',
      darkMode: false,
      largeText: true,
    });

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(account_id) DO UPDATE'),
      7,
      'Teórico',
      0,
      1,
    );
  });

  it('createDefaultProfile usa Pragmático y modo oscuro', async () => {
    const { db, calls } = makeDb();

    await createDefaultProfile(db, 7);

    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(account_id) DO NOTHING'),
      7,
    );
  });
});
