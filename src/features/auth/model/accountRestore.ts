import type { ProgressBackup } from '@/features/profile/model/backup.logic';
import {
  progressFingerprint,
  progressHasData,
} from '@/features/profile/model/progressFingerprint';
import type { Repositories } from '@/shared/services/data/DataProvider';
import type { Account } from '@/shared/model/entities';
import {
  fetchRemoteClasses,
  fetchRemoteProgress,
  uploadRemoteProgress,
} from '@/shared/services/content/studentProgress';

export type AccountRestoreAction = 'restored' | 'upload' | 'none';

function emptyProgress(): ProgressBackup {
  return {
    version: 5,
    exportedAt: new Date().toISOString(),
    student: null,
    classes: [],
    moduleProgress: [],
    attempts: [],
    evaluationResults: [],
    exampleState: [],
    lastLocation: null,
  };
}

/**
 * Descarga clases y contenido antes de tocar el progreso, para que las
 * lecciones ya existan cuando se importa el respaldo.
 *
 * Devuelve `upload` cuando el progreso local tiene cambios pendientes; el
 * llamador decide subirlo (login) o dejarlo al proveedor (segundo plano).
 */
export async function restoreAccountState(
  repos: Repositories,
  account: Account,
  options: { forceRemote?: boolean } = {},
): Promise<AccountRestoreAction> {
  const remoteClasses = await fetchRemoteClasses();
  const remoteClassIds = new Set<string>();
  for (const item of remoteClasses) {
    remoteClassIds.add(item.preview.class.id);
    await repos.classes.saveAccountClass(
      account.id,
      item.code,
      item.preview,
      item.preview.course?.catalogId ?? 'base',
      item.preview.course?.title ?? '',
    );
  }
  // El servidor manda: una clase que se dejó en otro equipo deja de estar activa aquí.
  const localClasses = await repos.classes.selectAccountClasses(account.id);
  for (const local of localClasses) {
    if (!remoteClassIds.has(local.classId)) {
      await repos.classes.removeAccountClass(account.id, local.classId);
    }
  }

  await repos.courses.refreshCourseList();
  await repos.content.refreshClassContent();
  await repos.courses.applyStoredContent();

  const local = await repos.backup.selectProgressBackup(account.id);
  const localFingerprint = await progressFingerprint(local);
  const session = await repos.remote.select(account.id);
  const localPending =
    progressHasData(local) &&
    (!session?.lastUploadedHash ||
      session.lastUploadedHash !== localFingerprint);

  if (!options.forceRemote && localPending) {
    return 'upload';
  }

  const remote = await fetchRemoteProgress();
  if (remote) {
    if (
      remote.progress.student &&
      remote.progress.student.externalKey !== account.externalKey
    ) {
      throw new Error('El progreso remoto pertenece a otra cuenta.');
    }
    await repos.backup.replaceProgressFromBackup(account.id, {
      ...remote.progress,
      student: null,
      classes: [],
    });
  } else if (options.forceRemote && progressHasData(local)) {
    await repos.backup.replaceProgressFromBackup(account.id, emptyProgress());
  }

  const applied = await repos.backup.selectProgressBackup(account.id);
  await repos.remote.updateSync(account.id, {
    lastUploadedHash: await progressFingerprint(applied),
    lastSyncedAt: remote?.updatedAt ?? new Date().toISOString(),
    pendingRestore: false,
    forceRemote: false,
  });
  return remote ? 'restored' : 'none';
}

export async function uploadAccountProgress(
  repos: Repositories,
  account: Account,
): Promise<string> {
  const snapshot = await repos.backup.selectProgressBackup(account.id);
  const hash = await progressFingerprint(snapshot);
  const updatedAt = await uploadRemoteProgress(account.displayName, snapshot);
  await repos.remote.updateSync(account.id, {
    lastUploadedHash: hash,
    lastSyncedAt: updatedAt,
    pendingRestore: false,
    forceRemote: false,
  });
  return updatedAt;
}
