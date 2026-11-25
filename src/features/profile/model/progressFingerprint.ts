import * as Crypto from 'expo-crypto';

import type { ProgressBackup } from '@/features/profile/model/backup.logic';

/** Huella estable del contenido: `exportedAt` cambia en cada snapshot. */
export function progressFingerprintSource(backup: ProgressBackup): string {
  const { exportedAt: _exportedAt, ...content } = backup;
  return JSON.stringify(content);
}

export async function progressFingerprint(
  backup: ProgressBackup,
): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    progressFingerprintSource(backup),
  );
}

export function progressHasData(backup: ProgressBackup): boolean {
  return (
    backup.moduleProgress.length > 0 ||
    backup.attempts.length > 0 ||
    backup.evaluationResults.length > 0 ||
    backup.exampleState.length > 0 ||
    backup.lastLocation !== null
  );
}
