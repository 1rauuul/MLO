import type { SQLiteDatabase } from 'expo-sqlite';

export interface RemoteSession {
  accountId: number;
  token: string | null;
  expiresAt: string | null;
  lastUploadedHash: string | null;
  lastSyncedAt: string | null;
  pendingRestore: boolean;
  forceRemote: boolean;
  createdAt: string;
}

interface RemoteSessionRow {
  account_id: number;
  token: string | null;
  expires_at: string | null;
  last_uploaded_hash: string | null;
  last_synced_at: string | null;
  pending_restore: number;
  force_remote: number;
  created_at: string;
}

function mapRemoteSession(row: RemoteSessionRow): RemoteSession {
  return {
    accountId: row.account_id,
    token: row.token,
    expiresAt: row.expires_at,
    lastUploadedHash: row.last_uploaded_hash,
    lastSyncedAt: row.last_synced_at,
    pendingRestore: row.pending_restore === 1,
    forceRemote: row.force_remote === 1,
    createdAt: row.created_at,
  };
}

export async function selectRemoteSession(
  db: SQLiteDatabase,
  accountId: number,
): Promise<RemoteSession | null> {
  const row = await db.getFirstAsync<RemoteSessionRow>(
    'SELECT * FROM remote_session WHERE account_id = ?',
    accountId,
  );
  return row ? mapRemoteSession(row) : null;
}

export async function saveRemoteSession(
  db: SQLiteDatabase,
  input: {
    accountId: number;
    token: string;
    expiresAt: string;
    pendingRestore?: boolean;
    forceRemote?: boolean;
  },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO remote_session
       (account_id, token, expires_at, pending_restore, force_remote, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_id) DO UPDATE SET
       token = excluded.token,
       expires_at = excluded.expires_at,
       pending_restore = excluded.pending_restore,
       force_remote = excluded.force_remote`,
    input.accountId,
    input.token,
    input.expiresAt,
    input.pendingRestore ? 1 : 0,
    input.forceRemote ? 1 : 0,
    new Date().toISOString(),
  );
}

export async function updateRemoteSync(
  db: SQLiteDatabase,
  accountId: number,
  input: {
    lastUploadedHash?: string | null;
    lastSyncedAt?: string | null;
    pendingRestore?: boolean;
    forceRemote?: boolean;
  },
): Promise<void> {
  await db.runAsync(
    `UPDATE remote_session SET
       last_uploaded_hash = CASE WHEN ? THEN ? ELSE last_uploaded_hash END,
       last_synced_at = CASE WHEN ? THEN ? ELSE last_synced_at END,
       pending_restore = CASE WHEN ? THEN ? ELSE pending_restore END,
       force_remote = CASE WHEN ? THEN ? ELSE force_remote END
     WHERE account_id = ?`,
    input.lastUploadedHash === undefined ? 0 : 1,
    input.lastUploadedHash ?? null,
    input.lastSyncedAt === undefined ? 0 : 1,
    input.lastSyncedAt ?? null,
    input.pendingRestore === undefined ? 0 : 1,
    input.pendingRestore ? 1 : 0,
    input.forceRemote === undefined ? 0 : 1,
    input.forceRemote ? 1 : 0,
    accountId,
  );
}

export async function clearRemoteToken(
  db: SQLiteDatabase,
  accountId: number,
): Promise<void> {
  await db.runAsync(
    'UPDATE remote_session SET token = NULL, expires_at = NULL WHERE account_id = ?',
    accountId,
  );
}
