import type { SQLiteDatabase } from 'expo-sqlite';

import type { Account } from '@/shared/model/entities';

export interface AccountRecord extends Account {
  passwordHash: string;
  salt: string;
}

interface AccountRow {
  id: number;
  username: string;
  external_key: string;
  display_name: string;
  password_hash: string;
  salt: string;
  created_at: string;
}

function mapAccount(row: AccountRow): AccountRecord {
  return {
    id: row.id,
    username: row.username,
    externalKey: row.external_key,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    salt: row.salt,
    createdAt: row.created_at,
  };
}

export async function insertAccount(
  db: SQLiteDatabase,
  input: {
    username: string;
    externalKey: string;
    displayName: string;
    passwordHash: string;
    salt: string;
  },
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO accounts (username, external_key, display_name, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    input.username,
    input.externalKey,
    input.displayName,
    input.passwordHash,
    input.salt,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

export async function selectAccountByUsername(
  db: SQLiteDatabase,
  username: string,
): Promise<AccountRecord | null> {
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE username = ?', username);
  return row ? mapAccount(row) : null;
}

export async function selectAccountById(db: SQLiteDatabase, id: number): Promise<AccountRecord | null> {
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?', id);
  return row ? mapAccount(row) : null;
}

export async function selectSessionAccountId(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ account_id: number }>(
    'SELECT account_id FROM auth_session WHERE id = 1',
  );
  return row?.account_id ?? null;
}

export async function saveSession(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO auth_session (id, account_id) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET account_id = excluded.account_id`,
    accountId,
  );
}

export async function updatePasswordHash(
  db: SQLiteDatabase,
  accountId: number,
  passwordHash: string,
  salt: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE accounts SET password_hash = ?, salt = ? WHERE id = ?',
    passwordHash,
    salt,
    accountId,
  );
}

export async function updateExternalKey(
  db: SQLiteDatabase,
  accountId: number,
  externalKey: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE accounts SET external_key = ? WHERE id = ?',
    externalKey,
    accountId,
  );
}

export async function selectAccountByExternalKey(
  db: SQLiteDatabase,
  externalKey: string,
): Promise<AccountRecord | null> {
  const row = await db.getFirstAsync<AccountRow>(
    'SELECT * FROM accounts WHERE external_key = ?',
    externalKey,
  );
  return row ? mapAccount(row) : null;
}

export async function clearSession(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM auth_session WHERE id = 1');
}
