import type { SQLiteDatabase } from 'expo-sqlite';

import {
  clearAccountGroup,
  saveAccountGroup,
  selectAccountGroup,
  selectActiveCatalogId,
} from '@/features/groups/model/groupRepository';

function makeDb(overrides: Record<string, jest.Mock> = {}) {
  const calls = {
    getFirstAsync: jest.fn(async () => null),
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 })),
    ...overrides,
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

const row = {
  group_id: 'g1',
  group_code: 'abc123',
  group_name: 'Grupo A',
  teacher_name: 'Profesora Ríos',
  catalog_id: 'k7f3q',
  joined_at: '2026-10-26T00:00:00.000Z',
};

describe('groupRepository', () => {
  it('selecciona y mapea el grupo de la cuenta', async () => {
    const { db, calls } = makeDb({ getFirstAsync: jest.fn(async () => row) });

    await expect(selectAccountGroup(db, 7)).resolves.toEqual({
      groupId: 'g1',
      groupCode: 'abc123',
      groupName: 'Grupo A',
      teacherName: 'Profesora Ríos',
      catalogId: 'k7f3q',
      joinedAt: '2026-10-26T00:00:00.000Z',
    });
    expect(calls.getFirstAsync).toHaveBeenCalledWith(expect.any(String), 7);
  });

  it('devuelve base cuando la cuenta no tiene grupo', async () => {
    const { db } = makeDb();
    await expect(selectActiveCatalogId(db, 7)).resolves.toBe('base');
  });

  it('guarda y borra el grupo', async () => {
    const { db, calls } = makeDb();

    await saveAccountGroup(db, 7, {
      groupId: 'g1',
      groupCode: 'abc123',
      groupName: 'Grupo A',
      teacherName: 'Profesora Ríos',
      catalogId: 'k7f3q',
    });
    await clearAccountGroup(db, 7);

    expect(calls.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO account_group'),
      7,
      'g1',
      'abc123',
      'Grupo A',
      'Profesora Ríos',
      'k7f3q',
      expect.any(String),
    );
    expect(calls.runAsync).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM account_group WHERE account_id = ?',
      7,
    );
  });
});
