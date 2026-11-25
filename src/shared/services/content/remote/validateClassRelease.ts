import { ParseError } from '@/shared/services/http/client';
import { isNumber, isRecord, isString } from '@/shared/utils/validate';

export const CLASS_SCHEMA_VERSION = 2;

export interface ClassCourseInfo {
  catalogId: string;
  title: string;
}

export interface ClassPreviewData {
  schemaVersion: 2;
  class: { id: string; name: string; teacherName: string };
  /** Curso asignado a la clase en el CMS; ausente en servidores anteriores. */
  course?: ClassCourseInfo;
  published: {
    version: number;
    hash: string;
    publishedAt: string;
  } | null;
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

function parseCourseInfo(value: unknown): ClassCourseInfo | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!isRecord(value)) {
    fail('curso de la clase inválido');
  }
  return {
    catalogId: nonEmpty(value.catalogId, 'catalogId del curso'),
    title: nonEmpty(value.title, 'título del curso'),
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

  const course = parseCourseInfo(value.course);
  return {
    schemaVersion: CLASS_SCHEMA_VERSION,
    class: parseClassInfo(value.class),
    ...(course ? { course } : {}),
    published: normalizedPublished,
  };
}
