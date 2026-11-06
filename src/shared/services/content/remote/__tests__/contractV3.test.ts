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
  'invalid-activity.json': '4aec932fcad97da49eac1a5d57956bbf0b3f59752810da08fd8d3c0b0f0992cd',
  'invalid-duplicate-id.json': '23b3c17e83a1c212eea830103de602423d8dbbcfebb05d8eef6dd534211ed055',
  'invalid-hash.json': 'edb9b5330bc86543f311296e1334a7978b90464f05c3912db9d053a74ea05622',
  'invalid-hierarchy.json': 'a94fe811d7b9253944b37fde1286bcc2f1a559d013c5cd304ea88a84526db413',
  'invalid-version.json': '89659f6e4a70c862316fbda0548235a9d23c2065967aa966e878377649dd89dd',
  'valid-course-base-ref.json': '43438502451ef142c4fb92d3d4a9a5ed1131007588224940ad440bee00270095',
  'valid-course-empty.json': 'effbe6a0276748824f10e5df850b8ee97da5b632eb8d4fbac6d80a709c8f7438',
  'valid-group-content.json': '9a4093dedd029db3a44aed992e0aab8f0c27add6e3f84aff719d920da9994b46',
};

const EXPECTED_AGGREGATE = 'ef7ef257fa0b898c5c8d54d161426780aa4e80b7036c544ed3befbfb0d85ce8b';
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

type JsonObject = Record<string, unknown>;

function collection(fixture: JsonObject, key: string): JsonObject[] {
  const value = fixture[key];
  if (!Array.isArray(value)) {
    throw new Error(`${key} no es un array`);
  }
  return value as JsonObject[];
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

describe('estructura de la jerarquía v3', () => {
  it('el subtema del curso agrupa al menos 2 lecciones, ejemplos, ejercicios y evaluaciones', () => {
    const fixture = loadJson('valid-course-base-ref.json');

    expect(collection(fixture, 'topics').map(topic => topic.id)).toContain('t1');
    for (const key of ['lessons', 'examples', 'exercises', 'evaluations']) {
      const items = collection(fixture, key).filter(item => item.topicId === 't1');
      expect(items.length).toBeGreaterThanOrEqual(2);
    }

    for (const lesson of collection(fixture, 'lessons')) {
      expect(lesson.topicId).toBe('t1');
      for (const field of ['hash', 'exercises', 'examples', 'evaluations']) {
        expect(field in lesson).toBe(false);
      }
    }

    for (const key of ['examples', 'exercises', 'evaluations']) {
      for (const item of collection(fixture, key)) {
        expect(item.topicId).toBe('t1');
        expect('lessonId' in item).toBe(false);
      }
    }
  });

  it('el grupo declara un subtema propio con las cuatro colecciones y recursos sobre t1', () => {
    const fixture = loadJson('valid-group-content.json');

    expect(collection(fixture, 'topics').map(topic => topic.id)).toContain('g-t1');
    for (const key of ['lessons', 'examples', 'exercises', 'evaluations']) {
      const items = collection(fixture, key);
      expect(items.some(item => item.topicId === 'g-t1')).toBe(true);
      expect(items.some(item => item.topicId === 't1')).toBe(true);
    }

    const additions = collection(fixture, 'additions');
    expect(additions.length).toBeGreaterThan(0);
    for (const addition of additions) {
      expect(Object.keys(addition).sort()).toEqual(['blocks', 'lessonId']);
    }
  });

  it.each(['valid-course-base-ref.json', 'valid-group-content.json'])(
    'cada evaluación de %s apunta a su subtema y a ejercicios del mismo subtema',
    name => {
      const fixture = loadJson(name);
      const exercises = collection(fixture, 'exercises');
      const evaluations = collection(fixture, 'evaluations');

      expect(evaluations.length).toBeGreaterThan(0);
      for (const evaluation of evaluations) {
        expect(typeof evaluation.topicId).toBe('string');
        expect(evaluation.topicId).not.toBe('');

        const questionIds = evaluation.questionIds;
        expect(Array.isArray(questionIds)).toBe(true);
        expect((questionIds as unknown[]).length).toBeGreaterThan(0);

        const exerciseIds = evaluation.exerciseIds;
        expect(Array.isArray(exerciseIds)).toBe(true);
        for (const exerciseId of exerciseIds as unknown[]) {
          const exercise = exercises.find(item => item.id === exerciseId);
          expect(exercise).toBeDefined();
          expect(exercise?.topicId).toBe(evaluation.topicId);
        }
      }
    },
  );
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
