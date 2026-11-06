import { isRecord, isString } from '@/shared/utils/validate';

export const V3_SCHEMA_VERSION = 3;

export interface V3Envelope {
  schemaVersion: typeof V3_SCHEMA_VERSION;
  kind: 'course' | 'group';
  catalogId: string;
  releaseId: string;
  version: number;
  publishedAt: string;
  hash: string;
  references: unknown[];
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

function nonEmpty(value: unknown, field: string): string {
  if (!isString(value) || value.trim().length === 0) {
    throw new ContractV3Error(`${field} vacío`);
  }
  return value;
}

/**
 * Solo valida el envoltorio común de v3 (contrato `mlo-v3`). Recursos, jerarquía
 * y hashes internos pertenecen a X-02/X-03.
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
  if (!Array.isArray(value.references) || !Array.isArray(value.notices)) {
    throw new ContractV3Error('references y notices deben ser arrays');
  }
  return value as unknown as V3Envelope;
}
