import type { SQLiteDatabase } from 'expo-sqlite';

export interface AccountGroup {
  /** Id remoto del grupo; null si se restauró sin red desde un respaldo. */
  groupId: string | null;
  groupCode: string;
  groupName: string;
  /** Nombre del maestro; null si se restauró sin red. */
  teacherName: string | null;
  catalogId: string;
  joinedAt: string;
}

interface AccountGroupRow {
  group_id: string | null;
  group_code: string;
  group_name: string;
  teacher_name: string | null;
  catalog_id: string;
  joined_at: string;
}

function mapGroup(row: AccountGroupRow): AccountGroup {
  return {
    groupId: row.group_id,
    groupCode: row.group_code,
    groupName: row.group_name,
    teacherName: row.teacher_name,
    catalogId: row.catalog_id,
    joinedAt: row.joined_at,
  };
}

export async function selectAccountGroup(
  db: SQLiteDatabase,
  accountId: number,
): Promise<AccountGroup | null> {
  const row = await db.getFirstAsync<AccountGroupRow>(
    'SELECT * FROM account_group WHERE account_id = ?',
    accountId,
  );
  return row ? mapGroup(row) : null;
}

export async function saveAccountGroup(
  db: SQLiteDatabase,
  accountId: number,
  group: Omit<AccountGroup, 'joinedAt'>,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO account_group (account_id, group_id, group_code, group_name, teacher_name, catalog_id, joined_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_id) DO UPDATE SET
       group_id = excluded.group_id, group_code = excluded.group_code,
       group_name = excluded.group_name, teacher_name = excluded.teacher_name,
       catalog_id = excluded.catalog_id, joined_at = excluded.joined_at`,
    accountId,
    group.groupId,
    group.groupCode,
    group.groupName,
    group.teacherName,
    group.catalogId,
    new Date().toISOString(),
  );
}

export async function clearAccountGroup(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.runAsync('DELETE FROM account_group WHERE account_id = ?', accountId);
}

export async function selectActiveCatalogId(
  db: SQLiteDatabase,
  accountId: number,
): Promise<string> {
  const row = await db.getFirstAsync<{ catalog_id: string }>(
    'SELECT catalog_id FROM account_group WHERE account_id = ?',
    accountId,
  );
  return row?.catalog_id ?? 'base';
}
