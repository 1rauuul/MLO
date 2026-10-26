import type { SQLiteDatabase } from 'expo-sqlite';

import { applyRemoteContent } from '@/shared/services/db/seed';
import type { ExerciseSeed } from '@/shared/services/content/banks/types';
import type { ExampleSeed, QuestionSeed } from '@/shared/services/content/unit1.content';
import { DATA_MODE, type DataMode } from '@/shared/services/data/dataMode';
import type { HttpClient } from '@/shared/services/http/client';
import { ParseError } from '@/shared/services/http/client';
import {
  isRecord,
  isString,
  parseExampleSeed,
  parseExerciseSeed,
  parseQuestionSeed,
} from '@/shared/utils/validate';

export const REMOTE_CONTENT_HASH_KEY = 'remote_content_hash';

export interface ContentManifest {
  version: string;
  hash: string;
  lessons: { lessonId: string; hash: string }[];
}

export interface RemoteQuestion {
  evaluationId: string;
  question: QuestionSeed;
}

export interface RemoteLessonContent {
  lessonId: string;
  exercises: ExerciseSeed[];
  examples: ExampleSeed[];
  questions: RemoteQuestion[];
}

export interface RemoteContent {
  hash: string;
  lessons: RemoteLessonContent[];
}

export function parseManifest(value: unknown): ContentManifest {
  if (
    !isRecord(value) ||
    !isString(value.version) ||
    !isString(value.hash) ||
    !Array.isArray(value.lessons)
  ) {
    throw new ParseError('El manifiesto de contenido no es válido.');
  }
  const lessons = value.lessons.map(item => {
    if (!isRecord(item) || !isString(item.lessonId) || !isString(item.hash)) {
      throw new ParseError('El manifiesto de contenido no es válido.');
    }
    return { lessonId: item.lessonId, hash: item.hash };
  });
  return { version: value.version, hash: value.hash, lessons };
}

export function parseLessonContent(value: unknown, fallbackLessonId?: string): RemoteLessonContent {
  if (
    !isRecord(value) ||
    !isString(value.lessonId) ||
    !Array.isArray(value.exercises) ||
    !Array.isArray(value.examples) ||
    (value.questions !== undefined && !Array.isArray(value.questions))
  ) {
    throw new ParseError('El contenido de la lección no es válido.');
  }
  if (fallbackLessonId && value.lessonId !== fallbackLessonId) {
    throw new ParseError('El contenido no corresponde a la lección solicitada.');
  }
  const questions = Array.isArray(value.questions) ? value.questions : [];
  return {
    lessonId: value.lessonId,
    exercises: value.exercises.map(parseExerciseSeed),
    examples: value.examples.map(parseExampleSeed),
    questions: questions.map(entry => {
      if (!isRecord(entry) || !isString(entry.evaluationId)) {
        throw new ParseError('Las preguntas de la lección no son válidas.');
      }
      return { evaluationId: entry.evaluationId, question: parseQuestionSeed(entry.question) };
    }),
  };
}

/**
 * Descarga solo contenido publicado. Con DATA_MODE=local no toca la red.
 * Devuelve null si el hash remoto coincide con el último aplicado.
 */
export async function loadRemoteContent(
  client: HttpClient,
  appliedHash: string,
  mode: DataMode = DATA_MODE,
): Promise<RemoteContent | null> {
  if (mode !== 'hybrid') {
    return null;
  }
  const manifest = parseManifest(await client.get<unknown>('/content/manifest'));
  if (manifest.hash === appliedHash) {
    return null;
  }
  const lessons = await Promise.all(
    manifest.lessons.map(async entry => {
      const raw = await client.get<unknown>(
        `/content/lessons/${encodeURIComponent(entry.lessonId)}`,
      );
      return parseLessonContent(raw, entry.lessonId);
    }),
  );
  return { hash: manifest.hash, lessons };
}

export interface ContentSource {
  load: (appliedHash: string) => Promise<RemoteContent | null>;
}

export function createRemoteContentSource(client: HttpClient): ContentSource {
  return { load: appliedHash => loadRemoteContent(client, appliedHash) };
}

/**
 * Aplica contenido remoto válido y recuerda su hash. Cualquier fallo conserva
 * el contenido local. Se ejecuta al iniciar solo si DATA_MODE='hybrid'.
 */
export async function syncRemoteContent(
  db: SQLiteDatabase,
  client: HttpClient,
  mode: DataMode = DATA_MODE,
): Promise<boolean> {
  if (mode !== 'hybrid') {
    return false;
  }
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      REMOTE_CONTENT_HASH_KEY,
    );
    const remote = await loadRemoteContent(client, row?.value ?? '', mode);
    if (!remote) {
      return false;
    }
    await applyRemoteContent(db, remote.lessons);
    await db.runAsync(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      REMOTE_CONTENT_HASH_KEY,
      remote.hash,
    );
    return true;
  } catch (caught) {
    if (__DEV__) {
      console.warn('[content] contenido remoto descartado', caught);
    }
    return false;
  }
}
