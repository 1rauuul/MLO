import { isRecord, isString } from '@/shared/utils/validate';

export const V3_SCHEMA_VERSION = 3;

export interface V3Reference {
  id: string;
  text: string;
  url?: string;
}

export interface V3Envelope {
  schemaVersion: typeof V3_SCHEMA_VERSION;
  kind: 'course' | 'group';
  catalogId: string;
  releaseId: string;
  version: number;
  publishedAt: string;
  hash: string;
  references: V3Reference[];
  notices: unknown[];
}

export class ContractV3Error extends Error {
  constructor(message: string) {
    super(`Contrato v3 inválido: ${message}`);
    this.name = 'ContractV3Error';
  }
}

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;

/** Colecciones que pueden adjuntar `referenceIds` (contrato §3.4-§3.8). */
const REFERENCE_COLLECTIONS = [
  'lessons',
  'evaluations',
  'questions',
  'exercises',
  'examples',
] as const;

function nonEmpty(value: unknown, field: string): string {
  if (!isString(value) || value.trim().length === 0) {
    throw new ContractV3Error(`${field} vacío`);
  }
  return value;
}

export function parseV3References(value: unknown): V3Reference[] {
  if (!Array.isArray(value)) {
    throw new ContractV3Error('references debe ser un array');
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new ContractV3Error(`references[${index}] no es un objeto`);
    }
    const id = nonEmpty(item.id, `references[${index}].id`);
    const text = nonEmpty(item.text, `references[${index}].text`);
    if (item.url !== undefined && !isString(item.url)) {
      throw new ContractV3Error(`references[${index}].url no es un string`);
    }
    return item.url === undefined ? { id, text } : { id, text, url: item.url };
  });
}

/** DEC-07: cada `referenceIds` debe resolver a una referencia del mismo release. */
function assertReferenceIds(value: Record<string, unknown>, references: V3Reference[]): void {
  const known = new Set(references.map(reference => reference.id));
  for (const key of REFERENCE_COLLECTIONS) {
    const items = value[key];
    if (!Array.isArray(items)) {
      continue;
    }
    for (const item of items) {
      if (!isRecord(item) || item.referenceIds === undefined) {
        continue;
      }
      if (!Array.isArray(item.referenceIds) || !item.referenceIds.every(isString)) {
        throw new ContractV3Error(`${key}[].referenceIds debe ser un arreglo de ids`);
      }
      for (const id of item.referenceIds) {
        if (!known.has(id)) {
          throw new ContractV3Error(`${key} referencia inexistente: ${id}`);
        }
      }
    }
  }
}

/**
 * Valida el envoltorio común de v3 (contrato `mlo-v3`) y las referencias que
 * DEC-07 adjunta a las cinco colecciones. Jerarquía y hashes internos no se
 * validan aquí: son responsabilidad de X-02/X-03.
 */
export function assertV3Envelope(value: unknown): V3Envelope {
  if (!isRecord(value)) {
    throw new ContractV3Error('el release no es un objeto');
  }
  if (value.schemaVersion !== V3_SCHEMA_VERSION) {
    throw new ContractV3Error(
      `schemaVersion no soportada: ${String(value.schemaVersion)} (se esperaba ${V3_SCHEMA_VERSION})`,
    );
  }
  if (value.kind !== 'course' && value.kind !== 'group') {
    throw new ContractV3Error(`kind inválido: ${String(value.kind)}`);
  }
  nonEmpty(value.catalogId, 'catalogId');
  nonEmpty(value.releaseId, 'releaseId');
  if (typeof value.version !== 'number' || !Number.isInteger(value.version) || value.version < 1) {
    throw new ContractV3Error('version debe ser un entero >= 1');
  }
  if (
    !isString(value.publishedAt) ||
    !ISO_UTC.test(value.publishedAt) ||
    Number.isNaN(Date.parse(value.publishedAt))
  ) {
    throw new ContractV3Error('publishedAt no es ISO-8601 UTC con Z');
  }
  if (!isString(value.hash) || !SHA256_HEX.test(value.hash)) {
    throw new ContractV3Error('hash no es SHA-256 en hex minúsculas');
  }
  if (!Array.isArray(value.notices)) {
    throw new ContractV3Error('notices debe ser un array');
  }
  const references = parseV3References(value.references);
  assertReferenceIds(value, references);
  return { ...value, references } as unknown as V3Envelope;
}
