import type { SQLiteDatabase } from 'expo-sqlite';

import { selectReferences } from '@/features/modules/model/referenceRepository';
import { SCHEMA_DDL } from '@/shared/services/db/schema';

// Solo Node >= 22.5 trae node:sqlite; en otros entornos se omite.
const { DatabaseSync } = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:sqlite') as typeof import('node:sqlite');
  } catch {
    return { DatabaseSync: null };
  }
})();

function realSchemaDb(): SQLiteDatabase {
  const db = new DatabaseSync!(':memory:');
  db.exec(SCHEMA_DDL);
  db.exec(`
    INSERT INTO units (id, number, title, description, difficulty, color)
    VALUES ('u1', 1, 'Unidad', 'D', 'basic', 'blue');
    INSERT INTO lessons (id, unit_id, code, title, eyebrow, body, reference_ids)
    VALUES ('l1', 'u1', '1.1', 'Lección', 'e', 'b', '["ref1","ref2"]');
    INSERT INTO examples (id, lesson_id, type, title, prompt, reference_ids)
    VALUES ('x1', 'l1', 'demo', 'Ejemplo', 'P', '["ref2"]');
    INSERT INTO content_references (id, catalog_id, group_id, text) VALUES
      ('ref1', 'base', '', 'Sommerville, I. (2011).'),
      ('ref2', 'base', '', 'Pressman, R. (2020).');
  `);
  return {
    getAllAsync: async (sql: string, ...params: unknown[]) =>
      db.prepare(sql).all(...(params as never[])),
  } as unknown as SQLiteDatabase;
}

const maybe = DatabaseSync ? it : it.skip;

describe('selectReferences sobre el esquema real', () => {
  maybe('consulta las columnas que existen en las tablas núcleo', async () => {
    await expect(selectReferences(realSchemaDb(), 'base', null)).resolves.toEqual([
      { id: 'ref2', text: 'Pressman, R. (2020).' },
      { id: 'ref1', text: 'Sommerville, I. (2011).' },
    ]);
  });
});
