import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SQLiteDatabase } from 'expo-sqlite';

import {
  fetchCourseList,
  fetchCourseManifest,
  loadAccountCourses,
  parseCourseList,
  parseCourseManifest,
  refreshCourseList,
  selectCourse,
} from '@/shared/services/content/coursesV3';
import type { HttpClient } from '@/shared/services/http/client';

const FIXTURES_DIR = join(__dirname, '..', 'remote', '__fixtures__', 'v3', 'x02');
const STUDENT_KEY = '11111111-1111-4111-8111-111111111111';

const EXPECTED_HASHES: Record<string, string> = {
  'course-list.json': '1cd49563defad51f900b709a5154be3c9d89957fa2a7ab4a54768b2a61cbd6f6',
  'manifest-empty.json': '016248a4ed7b8d5d77aa42889a12ce21cd808c6412518af3092fdad1008b8729',
};

function readFixture(name: string) {
  const raw = readFileSync(join(FIXTURES_DIR, name));
  const text = raw.toString('utf8');
  return {
    raw,
    text,
    normalized: text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'),
  };
}

function readJson(name: string): Record<string, unknown> {
  return JSON.parse(readFixture(name).normalized) as Record<string, unknown>;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

interface DbOptions {
  session?: { id: number; external_key: string } | null;
  membership?: boolean;
  membershipCount?: number;
  previous?: { catalog_id: string; active: number }[];
  rows?: Record<string, unknown>[];
  synced?: boolean;
}

function makeDb(options: DbOptions = {}) {
  const statements: { sql: string; params: unknown[] }[] = [];
  const db = {
    getFirstAsync: jest.fn(async (sql: string) => {
      if (sql.includes('FROM auth_session')) {
        return options.session ?? null;
      }
      if (sql.includes('FROM meta')) {
        return options.synced ? { key: 'courses_synced:1' } : null;
      }
      if (sql.includes('COUNT(*)')) {
        return { count: options.membershipCount ?? 0 };
      }
      if (sql.includes('FROM account_courses WHERE account_id = ? AND catalog_id = ?')) {
        return options.membership ? { present: 1 } : null;
      }
      return null;
    }),
    getAllAsync: jest.fn(async (sql: string) => {
      if (sql.includes('SELECT catalog_id, active FROM account_courses')) {
        return options.previous ?? [];
      }
      if (sql.includes('JOIN remote_courses')) {
        return options.rows ?? [];
      }
      if (sql.includes('FROM remote_courses')) {
        return options.rows ?? [];
      }
      return [];
    }),
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      statements.push({ sql, params });
      return { changes: 1, lastInsertRowId: 0 };
    }),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  } as unknown as SQLiteDatabase;
  return { db, statements };
}

function makeClient(
  list: unknown,
  manifests: Record<string, unknown> = {},
): HttpClient & { get: jest.Mock } {
  return {
    get: jest.fn(async (path: string) => {
      if (path === '/courses') {
        return list;
      }
      const catalogId = path.split('/')[2] ?? '';
      const manifest = manifests[catalogId];
      if (!manifest) {
        throw new Error(`sin manifiesto para ${catalogId}`);
      }
      return manifest;
    }),
    post: jest.fn(),
    delete: jest.fn(),
  } as unknown as HttpClient & { get: jest.Mock };
}

describe('fixtures x02', () => {
  it.each(Object.entries(EXPECTED_HASHES))(
    '%s usa LF, no lleva BOM y coincide con el hash del productor',
    (name, expected) => {
      const fixture = readFixture(name);

      expect(fixture.raw[0] === 0xef && fixture.raw[1] === 0xbb && fixture.raw[2] === 0xbf).toBe(
        false,
      );
      expect(fixture.normalized).not.toContain('\r');
      expect(sha256(fixture.normalized)).toBe(expected);
    },
  );
});

describe('parseCourseList', () => {
  it('acepta la lista del productor y normaliza la versión', () => {
    const list = parseCourseList(readJson('course-list.json'));

    expect(list.courses).toHaveLength(2);
    expect(list.courses[0]?.catalogId).toBe('base');
    expect(list.courses[0]?.version).toBe('7');
    expect(list.courses[1]?.empty).toBe(true);
  });

  it('rechaza versión, estado, duplicados y campos inválidos', () => {
    const fixture = readJson('course-list.json');
    const courses = fixture.courses as Record<string, unknown>[];

    expect(() => parseCourseList({ ...fixture, schemaVersion: 2 })).toThrow('schemaVersion');
    expect(() => parseCourseList({ ...fixture, schemaVersion: '3' })).toThrow('schemaVersion');
    expect(() =>
      parseCourseList({ ...fixture, courses: [{ ...courses[0], status: 'draft' }] }),
    ).toThrow('estado no publicado');
    expect(() =>
      parseCourseList({ ...fixture, courses: [courses[0], courses[0]] }),
    ).toThrow('cursos repetidos');
    expect(() =>
      parseCourseList({ ...fixture, courses: [{ ...courses[0], version: 0 }] }),
    ).toThrow('version inválida');
    expect(() =>
      parseCourseList({ ...fixture, courses: [{ ...courses[0], hash: '' }] }),
    ).toThrow('hash de base vacío');
  });
});

describe('parseCourseManifest', () => {
  it('acepta el manifiesto vacío del productor', () => {
    const manifest = parseCourseManifest(readJson('manifest-empty.json'), 'demo');

    expect(manifest.kind).toBe('course');
    expect(manifest.catalogId).toBe('demo');
    expect(manifest.baseRef).toBeNull();
    expect(manifest.units).toEqual([]);
  });

  it('rechaza otro catálogo, otro kind y colecciones ausentes', () => {
    const fixture = readJson('manifest-empty.json');

    expect(() => parseCourseManifest(fixture, 'otro')).toThrow('catalogId no coincide');
    expect(() => parseCourseManifest({ ...fixture, kind: 'group' }, 'demo')).toThrow(
      'kind distinto de course',
    );
    expect(() => parseCourseManifest({ ...fixture, units: undefined }, 'demo')).toThrow(
      'units no es un arreglo',
    );
  });
});

describe('cabecera de identidad', () => {
  it('envía X-MLO-Student-Key en la lista y en el manifiesto', async () => {
    const client = makeClient(readJson('course-list.json'), {
      demo: readJson('manifest-empty.json'),
    });

    await fetchCourseList(client, STUDENT_KEY);
    await fetchCourseManifest(client, 'demo', STUDENT_KEY);

    const headers = { headers: { 'X-MLO-Student-Key': STUDENT_KEY } };
    expect(client.get).toHaveBeenNthCalledWith(1, '/courses', headers);
    expect(client.get).toHaveBeenNthCalledWith(2, '/catalogs/demo/manifest', headers);
  });
});

describe('refreshCourseList', () => {
  it('sin cuenta no hace peticiones', async () => {
    const { db, statements } = makeDb({ session: null });
    const client = makeClient(readJson('course-list.json'));

    await refreshCourseList(db, client);

    expect(client.get).not.toHaveBeenCalled();
    expect(statements).toHaveLength(0);
  });

  it('una lista vacía deja cero accesos y escribe la marca de sincronización', async () => {
    const { db, statements } = makeDb({
      session: { id: 1, external_key: STUDENT_KEY },
      previous: [{ catalog_id: 'base', active: 1 }],
    });
    const client = makeClient({ schemaVersion: 3, courses: [] });

    await refreshCourseList(db, client);

    expect(
      statements.some(statement => statement.sql.startsWith('INSERT INTO remote_courses')),
    ).toBe(false);
    const remove = statements.find(statement =>
      statement.sql.startsWith('DELETE FROM account_courses'),
    );
    expect(remove?.params).toEqual([1]);
    expect(
      statements.some(statement => statement.sql.startsWith('INSERT INTO account_courses')),
    ).toBe(false);
    const marker = statements.find(statement => statement.sql.startsWith('INSERT INTO meta'));
    expect(marker?.params).toEqual(['courses_synced:1', expect.any(String)]);
  });

  it('guarda la lista y el manifiesto no-base conservando el curso activo', async () => {
    const { db, statements } = makeDb({
      session: { id: 1, external_key: STUDENT_KEY },
      previous: [{ catalog_id: 'demo', active: 1 }],
    });
    const client = makeClient(readJson('course-list.json'), {
      demo: readJson('manifest-empty.json'),
    });

    await refreshCourseList(db, client);

    const inserts = statements.filter(statement =>
      statement.sql.startsWith('INSERT INTO remote_courses'),
    );
    expect(inserts).toHaveLength(2);
    const base = inserts.find(statement => statement.params[0] === 'base');
    const demo = inserts.find(statement => statement.params[0] === 'demo');
    expect(base?.params[8]).toBe(1);
    expect(base?.params[9]).toBeNull();
    expect(demo?.params[8]).toBe(0);
    expect(String(demo?.params[9])).toContain('"kind":"course"');
    expect(demo?.params[7]).toBe(1);

    const active = statements.find(
      statement =>
        statement.sql.startsWith('INSERT INTO account_courses') &&
        statement.params[0] === 1,
    );
    expect(active?.params.slice(0, 2)).toEqual([1, 'demo']);
  });

  it('reemplaza accesos y cae al base si el activo anterior desaparece', async () => {
    const { db, statements } = makeDb({
      session: { id: 7, external_key: STUDENT_KEY },
      previous: [{ catalog_id: 'demo', active: 1 }],
    });
    const list = readJson('course-list.json');
    const baseOnly = {
      ...list,
      courses: [(list.courses as unknown[])[0]],
    };
    const client = makeClient(baseOnly);

    await refreshCourseList(db, client);

    const remove = statements.find(statement =>
      statement.sql.startsWith('DELETE FROM account_courses'),
    );
    expect(remove?.params).toEqual([7, 'base']);
    const active = statements.find(
      statement =>
        statement.sql.startsWith('INSERT INTO account_courses') &&
        statement.params[0] === 7,
    );
    expect(active?.params.slice(0, 2)).toEqual([7, 'base']);
  });

  it('un error de red o parseo no escribe ni borra la caché', async () => {
    const { db, statements } = makeDb({
      session: { id: 1, external_key: STUDENT_KEY },
      previous: [{ catalog_id: 'base', active: 1 }],
    });
    const client = makeClient(readJson('course-list.json'), {});

    await expect(refreshCourseList(db, client)).rejects.toThrow('sin manifiesto para demo');
    expect(statements).toHaveLength(0);
    expect(statements.some(statement => statement.sql.includes('INSERT INTO meta'))).toBe(false);
  });
});

describe('membresías y curso activo', () => {
  it('una cuenta ya sincronizada sin cursos no recupera el base', async () => {
    const { db, statements } = makeDb({ synced: true, rows: [] });

    await expect(loadAccountCourses(db, 1)).resolves.toEqual({
      courses: [],
      activeCatalogId: '',
    });
    expect(statements).toHaveLength(0);
  });

  it('loadAccountCourses asegura el base cuando la cuenta no tiene filas', async () => {
    const baseRow = {
      catalog_id: 'base',
      title: 'Contenido base',
      status: 'published',
      uses_base: 0,
      version: '',
      hash: '',
      published_at: null,
      empty: 0,
      active: 1,
    };
    const { db, statements } = makeDb({
      membershipCount: 0,
      rows: [baseRow],
    });

    const result = await loadAccountCourses(db, 3);

    expect(result.activeCatalogId).toBe('base');
    expect(result.courses).toHaveLength(1);
    expect(
      statements.some(statement => statement.sql.startsWith('INSERT INTO remote_courses')),
    ).toBe(true);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('INSERT INTO account_courses') &&
          statement.params[0] === 3,
      ),
    ).toBe(true);
  });

  it('selectCourse cambia el activo solo si hay acceso', async () => {
    const allowed = makeDb({ membership: true });
    await expect(selectCourse(allowed.db, 1, 'demo')).resolves.toBe(true);
    expect(allowed.statements).toHaveLength(2);
    expect(allowed.statements[0]?.sql).toContain('SET active = 0');
    expect(allowed.statements[1]?.params).toEqual([1, 'demo']);

    const denied = makeDb({ membership: false });
    await expect(selectCourse(denied.db, 1, 'demo')).resolves.toBe(false);
    expect(denied.statements).toHaveLength(0);
  });
});
