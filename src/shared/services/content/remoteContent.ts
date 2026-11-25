import type { HttpClient } from '@/shared/services/http/client';
import { ConfigError, HttpError, ParseError } from '@/shared/services/http/client';

import {
  parseClassPreview,
  type ClassPreviewData,
} from '@/shared/services/content/remote/validateClassRelease';

/** El alfabeto del panel es en mayúsculas; el alumno puede escribir minúsculas. */
export function canonicalClassCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export function fetchClassPreview(
  client: HttpClient,
  code: string,
): Promise<ClassPreviewData> {
  const normalized = canonicalClassCode(code);
  return client
    .get<unknown>(`/classes/${encodeURIComponent(normalized)}`)
    .then(value => parseClassPreview(value, normalized));
}

export function joinClassRequest(
  client: HttpClient,
  code: string,
  studentKey: string,
  studentName: string,
): Promise<ClassPreviewData> {
  const normalized = canonicalClassCode(code);
  return client
    .post<unknown>(`/classes/${encodeURIComponent(normalized)}/join`, {
      studentKey,
      studentName,
    })
    .then(value => parseClassPreview(value, normalized));
}

export function leaveClassRequest(
  client: HttpClient,
  code: string,
  studentKey: string,
): Promise<void> {
  const normalized = canonicalClassCode(code);
  return client.delete<void>(
    `/classes/${encodeURIComponent(normalized)}/members/${encodeURIComponent(studentKey)}`,
  );
}

export type ClassError =
  | 'not_found'
  | 'unpublished'
  | 'rate_limited'
  | 'config'
  | 'network'
  | 'invalid';

export function isClassError(error: unknown): ClassError {
  if (error instanceof ConfigError) {
    return 'config';
  }
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return 'not_found';
    }
    if (error.status === 409) {
      return 'unpublished';
    }
    if (error.status === 429) {
      return 'rate_limited';
    }
    return 'network';
  }
  if (error instanceof ParseError) {
    return 'invalid';
  }
  return 'network';
}
