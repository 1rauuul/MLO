import { httpV3, ParseError } from '@/shared/services/http/client';
import {
  parseClassPreview,
  type ClassPreviewData,
} from '@/shared/services/content/remote/validateClassRelease';
import { isRecord, isString } from '@/shared/utils/validate';

import {
  parseProgressBackup,
  type ProgressBackup,
} from '@/features/profile/model/backup.logic';

const STUDENT_KEY_HEADER = 'X-MLO-Student-Key';

export interface RemoteProgress {
  progress: ProgressBackup;
  updatedAt: string;
}

export interface RemoteClass {
  code: string;
  joinedAt: string;
  preview: ClassPreviewData;
}

function headers(externalKey: string): Record<string, string> {
  return { [STUDENT_KEY_HEADER]: externalKey };
}

export async function fetchRemoteProgress(
  externalKey: string,
): Promise<RemoteProgress | null> {
  const result = await httpV3.get<{ progress: unknown; updatedAt: string } | undefined>(
    '/students/me/progress',
    { headers: headers(externalKey) },
  );
  if (!result) {
    return null;
  }
  if (!isRecord(result) || !isString(result.updatedAt)) {
    throw new ParseError('El progreso guardado no es válido.');
  }
  return {
    progress: parseProgressBackup(JSON.stringify(result.progress)),
    updatedAt: result.updatedAt,
  };
}

export async function uploadRemoteProgress(
  externalKey: string,
  studentName: string,
  progress: ProgressBackup,
): Promise<string> {
  const result = await httpV3.put<{ updatedAt: string }>(
    '/students/me/progress',
    { studentName, progress },
    { headers: headers(externalKey) },
  );
  if (!isRecord(result) || !isString(result.updatedAt)) {
    throw new ParseError('La confirmación del guardado no es válida.');
  }
  return result.updatedAt;
}

export async function fetchRemoteClasses(externalKey: string): Promise<RemoteClass[]> {
  const result = await httpV3.get<{ classes: unknown[] }>('/students/me/classes', {
    headers: headers(externalKey),
  });
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
