import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ContractV3Error,
  V3_SCHEMA_VERSION,
  assertV3Envelope,
} from '@/shared/services/content/remote/contractV3';

const FIXTURES_DIR = join(__dirname, '..', '__fixtures__', 'v3');
const MANIFEST_FILE = 'fixtures.sha256.json';

/** Valores publicados por el productor en docs/contracts/fixtures/README.md. */
const EXPECTED_HASHES: Record<string, string> = {
  'invalid-activity.json': '5d248f2d833b7088a13ba390e503c2823baa9e5b0633fb8f38f6ab4c62d0477a',
  'invalid-duplicate-id.json': 'f721c922e3ab9746157ea2334c221ee8c56684437a7aa6e797a55f6aaee99384',
  'invalid-hash.json': '508d10866ea280de427ef72c12d9c1d4ad03e7612963bd1c5c8ef84a1a0181b4',
  'invalid-hierarchy.json': '422f591aab248764c54e7ac1117f9b52516283cd838ff9f8150ef62e4d835980',
  'invalid-version.json': '1b9401c45ad2b2713cf0237ab0fb6f336f0938af57020a5ad34bf254616644c0',
  'valid-course-base-ref.json': 'c76b52d56b37fb8d21e40004397e27c713566bc8dfee7cc21458572549ea7e8c',
  'valid-course-empty.json': 'effbe6a0276748824f10e5df850b8ee97da5b632eb8d4fbac6d80a709c8f7438',
  'valid-group-content.json': '6b1f655d43d5b6c4b6828336fc9d03bdbdf161e44d984e9069b90058ce3f84a7',
};

const EXPECTED_AGGREGATE = 'ee48d0412722756454423690184cbb3ea1f57a8dbdba1faae49a8821fbcc999c';
const EXPECTED_FILES = Object.keys(EXPECTED_HASHES).sort();

interface FixturesManifest {
  contract: string;
  schemaVersion: number;
  algorithm: string;
  aggregate: string;
  files: Record<string, string>;
}

function loadFixture(name: string) {
  const raw = readFileSync(join(FIXTURES_DIR, name));
  const text = raw.toString('utf8');
  // Política del contrato: UTF-8 sin BOM, LF y SHA-256 sobre bytes normalizados.
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  return { raw, text, normalized };
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function loadJson(name: string): Record<string, unknown> {
  return JSON.parse(loadFixture(name).normalized) as Record<string, unknown>;
}

describe('paridad de fixtures v3', () => {
  it.each(Object.entries(EXPECTED_HASHES))(
    '%s usa LF, no lleva BOM y coincide con el hash del productor',
    (name, expected) => {
      const fixture = loadFixture(name);

      expect(fixture.raw[0] === 0xef && fixture.raw[1] === 0xbb && fixture.raw[2] === 0xbf).toBe(
        false,
      );
      expect(fixture.text).toContain('\n');
      expect(fixture.normalized).not.toContain('\r');
      expect(sha256(fixture.normalized)).toBe(expected);
    },
  );

  it('el manifiesto declara contrato, versión, algoritmo y agregado', () => {
    const manifest = loadJson(MANIFEST_FILE) as unknown as FixturesManifest;

    expect(manifest.contract).toBe('mlo-v3');
    expect(manifest.schemaVersion).toBe(V3_SCHEMA_VERSION);
    expect(manifest.algorithm).toBe('sha256');
    expect(manifest.aggregate).toBe(EXPECTED_AGGREGATE);
  });

  it('el manifiesto lista exactamente los ocho fixtures de datos', () => {
    const manifest = loadJson(MANIFEST_FILE) as unknown as FixturesManifest;

    expect(Object.keys(manifest.files).sort()).toEqual(EXPECTED_FILES);
    expect(manifest.files).toEqual(EXPECTED_HASHES);
    expect(manifest.files[MANIFEST_FILE]).toBeUndefined();
  });

  it('el agregado es el SHA-256 del JSON canónico del mapa de archivos', () => {
    const manifest = loadJson(MANIFEST_FILE) as unknown as FixturesManifest;

    expect(sha256(canonicalJson(manifest.files))).toBe(EXPECTED_AGGREGATE);
  });
});

describe('assertV3Envelope', () => {
  it.each(['valid-course-empty.json', 'valid-course-base-ref.json', 'valid-group-content.json'])(
    'acepta %s',
    name => {
      const fixture = loadJson(name);

      expect(assertV3Envelope(fixture)).toEqual(
        expect.objectContaining({ schemaVersion: V3_SCHEMA_VERSION }),
      );
    },
  );

  it('el grupo declara unidades, subtemas, lecciones y evaluaciones propias', () => {
    const fixture = loadJson('valid-group-content.json');

    expect(assertV3Envelope(fixture).kind).toBe('group');
    for (const key of ['units', 'topics', 'lessons', 'evaluations']) {
      expect(Array.isArray(fixture[key])).toBe(true);
      expect((fixture[key] as unknown[]).length).toBeGreaterThan(0);
    }
  });

  it('rechaza invalid-version.json e informa la versión recibida', () => {
    const fixture = loadJson('invalid-version.json');

    expect(() => assertV3Envelope(fixture)).toThrow(ContractV3Error);
    expect(() => assertV3Envelope(fixture)).toThrow('schemaVersion no soportada: 4');
  });

  it('rechaza un payload v2 y uno v4', () => {
    const fixture = loadJson('valid-course-empty.json');

    expect(() => assertV3Envelope({ ...fixture, schemaVersion: 2 })).toThrow(
      'schemaVersion no soportada: 2',
    );
    expect(() => assertV3Envelope({ ...fixture, schemaVersion: 4 })).toThrow(
      'schemaVersion no soportada: 4',
    );
  });
});
