import type { SQLiteDatabase } from 'expo-sqlite';

import { selectReferences } from '@/features/modules/model/referenceRepository';

const BASE_REFERENCE = {
  id: 'ref-sommerville-2011',
  text: 'Sommerville, I. (2011). Ingeniería de software (9.ª ed.). Pearson Educación.',
};

function makeDb() {
  const links = [
    {
      referenceIds: JSON.stringify([BASE_REFERENCE.id]),
      catalogId: 'base',
      groupId: null,
      archivedAt: null,
      kind: 'lesson',
      position: 0,
    },
  ];
  const catalog = [
    {
      id: BASE_REFERENCE.id,
      text: BASE_REFERENCE.text,
      url: null,
      catalogId: 'base',
      groupId: '',
    },
  ];
  return {
    getAllAsync: jest.fn(async (sql: string) => {
      if (sql.includes("'lesson' AS kind")) {
        return links;
      }
      if (sql.includes('FROM content_references')) {
        return catalog;
      }
      return [];
    }),
  } as unknown as SQLiteDatabase;
}

describe('selectReferences del curso base', () => {
  it('devuelve Sommerville 2011 con el ámbito del curso base', async () => {
    await expect(selectReferences(makeDb(), 'base', null)).resolves.toEqual([
      BASE_REFERENCE,
    ]);
  });

  it('incluye la referencia base cuando el alumno consulta desde un grupo', async () => {
    await expect(selectReferences(makeDb(), 'base', 'g1')).resolves.toEqual([
      BASE_REFERENCE,
    ]);
  });
});
