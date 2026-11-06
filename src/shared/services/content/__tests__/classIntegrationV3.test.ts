import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SQLiteDatabase } from 'expo-sqlite';

import { saveAccountClass } from '@/features/classes/model/classRepository';
import { applyV3GroupRelease } from '@/shared/services/content/applyV3Content';
import { parseGroupRelease } from '@/shared/services/content/coursesV3';

const DIR = join(__dirname, '..', 'remote', '__fixtures__', 'v3', 'x04');

function loadRelease() {
  const raw = readFileSync(join(DIR, 'group-release.json'));
  return {
    raw,
    release: parseGroupRelease(JSON.parse(raw.toString('utf8')) as unknown, 'demo'),
  };
}

function makeDb() {
  const statements: { sql: string; params: unknown[] }[] = [];
  const db = {
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      statements.push({ sql, params });
      return { changes: 1, lastInsertRowId: 0 };
    }),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => ({ id: 'demo-l1.1' })),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  } as unknown as SQLiteDatabase;
  return { db, statements };
}

describe('fixture x04', () => {
  it('conserva el hash LF del productor', () => {
    const { raw } = loadRelease();
    const text = raw
      .toString('utf8')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n/g, '\n');
    expect(createHash('sha256').update(text, 'utf8').digest('hex')).toBe(
      'd9fde2c6acade448dd59c67c6389b1dbb6ea733bcf0f8835ad6a41bfc91a04e6',
    );
  });
});

describe('applyV3GroupRelease', () => {
  it('aplica jerarquía propia, actividades y additions con group_id', async () => {
    const { release } = loadRelease();
    const { db, statements } = makeDb();

    await applyV3GroupRelease(db, release, 'class-demo');

    const inserts = (prefix: string) =>
      statements.filter(statement => statement.sql.startsWith(prefix));
    expect(inserts('INSERT INTO units')).toHaveLength(1);
    expect(inserts('INSERT INTO topics')).toHaveLength(1);
    expect(inserts('INSERT INTO lessons')).toHaveLength(1);
    expect(inserts('INSERT INTO exercises')).toHaveLength(1);
    expect(inserts('INSERT INTO examples')).toHaveLength(1);
    expect(inserts('INSERT INTO evaluations')).toHaveLength(1);
    expect(inserts('INSERT INTO questions')).toHaveLength(1);
    expect(inserts('INSERT INTO evaluation_exercises')).toHaveLength(1);

    expect(inserts('INSERT INTO lessons')[0]?.params.at(-2)).toBe('class-demo');
    expect(inserts('INSERT INTO exercises')[0]?.params.at(-2)).toBe('class-demo');
    expect(inserts('INSERT INTO examples')[0]?.params.at(-2)).toBe('class-demo');
    expect(inserts('INSERT INTO evaluations')[0]?.params.at(-2)).toBe('class-demo');

    const addition = inserts('INSERT INTO class_extras_cache')[0];
    expect(addition?.params[0]).toBe('class-demo');
    expect(addition?.params[1]).toBe('v3-class-demo-demo-l1.1');
    expect(addition?.params[2]).toBe('demo-l1.1');
    expect(String(addition?.params[3])).toContain('Bloque adicional del grupo');

    const cache = statements.find(statement =>
      statement.sql.startsWith('UPDATE class_cache SET'),
    );
    expect(cache?.params).toContain('class-demo');
    expect(cache?.params).toContain(release.hash);
  });

  it('es idempotente y solo limpia el scope del grupo', async () => {
    const { release } = loadRelease();
    const { db, statements } = makeDb();

    await applyV3GroupRelease(db, release, 'class-demo');
    const first = statements.length;
    await applyV3GroupRelease(db, release, 'class-demo');

    expect(statements.length).toBe(first * 2);
    for (const prefix of [
      'INSERT INTO units',
      'INSERT INTO topics',
      'INSERT INTO lessons',
      'INSERT INTO examples',
      'INSERT INTO exercises',
      'INSERT INTO evaluations',
    ]) {
      expect(
        statements
          .filter(statement => statement.sql.startsWith(prefix))
          .every(statement => statement.sql.includes('group_id = excluded.group_id')),
      ).toBe(true);
    }
    expect(
      statements
        .filter(statement => statement.sql.startsWith('DELETE FROM examples'))
        .every(statement => statement.params[0] === 'class-demo'),
    ).toBe(true);
    expect(
      statements
        .filter(statement => statement.sql.startsWith('UPDATE lessons SET archived_at'))
        .every(statement => statement.params[1] === 'class-demo'),
    ).toBe(true);
  });
});

describe('membresía única por curso', () => {
  it('desactiva la membresía anterior del mismo curso antes de activar la nueva', async () => {
    const { db, statements } = makeDb();

    await saveAccountClass(
      db,
      7,
      'DEF456',
      {
        schemaVersion: 2,
        class: { id: 'c2', name: 'Grupo B', teacherName: 'Docente' },
        published: null,
      },
      'base',
    );

    const deactivate = statements.find(statement =>
      statement.sql.startsWith('UPDATE account_classes SET active = 0'),
    );
    expect(deactivate?.params).toEqual([7, 'base', 'c2']);
    expect(
      statements.some(
        statement =>
          statement.sql.startsWith('INSERT INTO account_classes') &&
          statement.params[3] === 'base' &&
          statement.sql.includes('1, ?'),
      ),
    ).toBe(true);
  });
});
