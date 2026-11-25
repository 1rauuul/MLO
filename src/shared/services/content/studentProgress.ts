import { httpAuth, ParseError } from '@/shared/services/http/client';
import {
  parseClassPreview,
  type ClassPreviewData,
} from '@/shared/services/content/remote/validateClassRelease';
import { isRecord, isString } from '@/shared/utils/validate';

import {
  parseProgressBackup,
  type ProgressBackup,
} from '@/features/profile/model/backup.logic';

export interface RemoteProgress {
  progress: ProgressBackup;
  updatedAt: string;
}

export interface RemoteClass {
  code: string;
  joinedAt: string;
  preview: ClassPreviewData;
}

export async function fetchRemoteProgress(): Promise<RemoteProgress | null> {
  const result = await httpAuth.get<
    { progress: unknown; updatedAt: string } | undefined
  >('/students/me/progress');
  if (!result) {
    return null;
  }
  if (!isRecord(result) || !isString(result.updatedAt)) {
    throw new ParseError('El progreso guardado no es válido.');
  }
  const rawProgress =
    typeof result.progress === 'string'
      ? result.progress
      : JSON.stringify(result.progress);
  return {
    progress: parseProgressBackup(rawProgress),
    updatedAt: result.updatedAt,
  };
}

export async function uploadRemoteProgress(
  studentName: string,
  progress: ProgressBackup,
): Promise<string> {
  const result = await httpAuth.put<{ updatedAt: string }>(
    '/students/me/progress',
    { studentName, progress },
  );
  if (!isRecord(result) || !isString(result.updatedAt)) {
    throw new ParseError('La confirmación del guardado no es válida.');
  }
  return result.updatedAt;
}

export async function fetchRemoteClasses(): Promise<RemoteClass[]> {
  const result = await httpAuth.get<{ classes: unknown[] }>(
    '/students/me/classes',
  );
  if (!isRecord(result) || !Array.isArray(result.classes)) {
    throw new ParseError('La lista de clases no es válida.');
  }
  return result.classes.map(entry => {
    if (!isRecord(entry) || !isString(entry.code) || !isString(entry.joinedAt)) {
      throw new ParseError('Una clase guardada no es válida.');
    }
    return {
      code: entry.code,
      joinedAt: entry.joinedAt,
      preview: parseClassPreview(entry.preview, entry.code),
    };
  });
}
