import type { ContentBlock } from '@/shared/model/entities';
import type { ExerciseSeed } from '@/shared/services/content/banks/types';
import type { ExampleSeed } from '@/shared/services/content/unit1.content';
import { ParseError } from '@/shared/services/http/client';
import {
  isNumber,
  isRecord,
  isString,
  parseExampleSeed,
  parseExerciseSeed,
} from '@/shared/utils/validate';

import { parseContentBlocks } from './validateLessonPayload';

export const CLASS_SCHEMA_VERSION = 2;

export interface ClassPreviewData {
  schemaVersion: 2;
  class: { id: string; name: string; teacherName: string };
  published: {
    version: number;
    hash: string;
    publishedAt: string;
  } | null;
}

export type RemoteClassExtra =
  | { id: string; type: 'lesson'; content: { title: string; blocks: ContentBlock[] } }
  | { id: string; type: 'exercise'; content: ExerciseSeed }
  | { id: string; type: 'example'; content: ExampleSeed };

export interface RemoteClassRelease {
  schemaVersion: 2;
  class: { id: string; name: string; teacherName: string };
  version: number;
  hash: string;
  publishedAt: string;
  lessons: {
    lessonId: string;
    code: string;
    extras: RemoteClassExtra[];
  }[];
}

function fail(message: string): never {
  throw new ParseError(`Contenido de clase inválido: ${message}`);
}

function nonEmpty(value: unknown, label: string): string {
  if (!isString(value) || value.trim().length === 0) {
    fail(`${label} vacío`);
  }
  return value;
}

function parseClassInfo(value: unknown): ClassPreviewData['class'] {
  if (!isRecord(value)) fail('clase inválida');
  return {
    id: nonEmpty(value.id, 'id de clase'),
    name: nonEmpty(value.name, 'nombre de clase'),
    teacherName: nonEmpty(value.teacherName, 'nombre del docente'),
  };
}

export function parseClassPreview(value: unknown, code: string): ClassPreviewData {
  if (!isRecord(value) || value.schemaVersion !== CLASS_SCHEMA_VERSION) {
    fail(`respuesta de la clase ${code}`);
  }
  const published = value.published;
  let normalizedPublished: ClassPreviewData['published'] = null;
  if (published !== null && published !== undefined) {
    if (
      !isRecord(published) ||
      !isNumber(published.version) ||
      !Number.isInteger(published.version) ||
      published.version <= 0 ||
      !isString(published.hash) ||
      published.hash.trim().length === 0 ||
      !isString(published.publishedAt)
    ) {
      fail(`publicación de la clase ${code}`);
    }
    normalizedPublished = {
      version: published.version,
      hash: published.hash,
      publishedAt: published.publishedAt,
    };
  }

  return {
    schemaVersion: CLASS_SCHEMA_VERSION,
    class: parseClassInfo(value.class),
    published: normalizedPublished,
  };
}

function parseLessonExtra(
  value: unknown,
  lessonId: string,
): RemoteClassExtra {
  if (!isRecord(value)) fail('extra inválido');
  const id = nonEmpty(value.id, 'id de extra');
  const type = value.type;
  const content = value.content;

  if (type === 'lesson') {
    if (!isRecord(content)) fail(`bloques de ${lessonId}`);
    const title = content.title === undefined ? '' : content.title;
    if (!isString(title)) fail(`título de ${lessonId}`);
    try {
      return {
        id,
        type,
        content: { title, blocks: parseContentBlocks(content.blocks) },
      };
    } catch {
      fail(`bloques de ${lessonId}`);
    }
  }

  if (type === 'exercise') {
    if (!isRecord(content)) fail(`ejercicio de ${lessonId}`);
    try {
      const parsed = parseExerciseSeed({
        ...content,
        id,
        lessonId,
        example: content.example ?? undefined,
      });
      if (parsed.type === 'order' && parsed.correctOrder.length < 2) {
        fail(`orden de ${lessonId}`);
      }
      return { id, type, content: parsed };
    } catch (caught) {
      if (caught instanceof ParseError) throw caught;
      fail(`ejercicio de ${lessonId}`);
    }
  }

  if (type === 'example') {
    if (!isRecord(content)) fail(`ejemplo de ${lessonId}`);
    try {
      const parsed = parseExampleSeed({ ...content, id, lessonId });
      return { id, type, content: parsed };
    } catch {
      fail(`ejemplo de ${lessonId}`);
    }
  }

  return fail(`tipo de extra desconocido en ${lessonId}`);
}

export function parseClassRelease(value: unknown, code: string): RemoteClassRelease {
  if (!isRecord(value) || value.schemaVersion !== CLASS_SCHEMA_VERSION) {
    fail(`release de la clase ${code}`);
  }
  if (
    !isNumber(value.version) ||
    !Number.isInteger(value.version) ||
    value.version <= 0 ||
    !isString(value.hash) ||
    value.hash.trim().length === 0 ||
    !isString(value.publishedAt) ||
    !Array.isArray(value.lessons)
  ) {
    fail(`release de la clase ${code}`);
  }

  const seen = new Set<string>();
  const lessons = value.lessons.map(item => {
    if (!isRecord(item)) fail(`lección de la clase ${code}`);
    const lessonId = nonEmpty(item.lessonId, 'id de lección');
    const lessonCode = nonEmpty(item.code, 'código de lección');
    if (!Array.isArray(item.extras)) fail(`extras de ${lessonId}`);
    const extras = item.extras.map(extra => {
      const parsed = parseLessonExtra(extra, lessonId);
      if (seen.has(parsed.id)) fail(`extra repetido ${parsed.id}`);
      seen.add(parsed.id);
      return parsed;
    });
    return { lessonId, code: lessonCode, extras };
  });

  return {
    schemaVersion: CLASS_SCHEMA_VERSION,
    class: parseClassInfo(value.class),
    version: value.version,
    hash: value.hash,
    publishedAt: value.publishedAt,
    lessons,
  };
}
