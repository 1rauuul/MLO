import type { SQLiteDatabase } from 'expo-sqlite';

import { selectLesson, selectLessonsByUnit, selectUnits } from './lessonRepository';

function makeDb(overrides: Record<string, jest.Mock> = {}) {
  const calls = {
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
    ...overrides,
  };
  return { db: calls as unknown as SQLiteDatabase, calls };
}

const unitRow = {
  id: 'u1',
  number: 1,
  title: 'Introducción',
  description: 'desc',
  difficulty: 'Fundamental',
  color: 'blue',
};

const lessonRow = {
  id: 'l1.2',
  unit_id: 'u1',
  code: '1.2',
  title: 'Desarrollo',
  eyebrow: 'Módulo 01',
  body: 'cuerpo',
  code_sample: '',
  context_title: '',
  context_body: '',
  synthesis: '["a","b"]',
  content: '[{"type":"p","text":"hola"}]',
  position: 1,
};

describe('lessonRepository', () => {
  it('selectUnits ordena por número y mapea', async () => {
    const { db, calls } = makeDb({ getAllAsync: jest.fn(async () => [unitRow]) });

    const units = await selectUnits(db);

    expect(units[0]).toEqual({
      id: 'u1',
      number: 1,
      title: 'Introducción',
      description: 'desc',
      difficulty: 'Fundamental',
      color: 'blue',
    });
    expect(calls.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY number'));
  });

  it('selectLessonsByUnit parsea synthesis y content', async () => {
    const { db } = makeDb({ getAllAsync: jest.fn(async () => [lessonRow]) });

    const lessons = await selectLessonsByUnit(db, 'u1');

    expect(lessons[0]!.synthesis).toEqual(['a', 'b']);
    expect(lessons[0]!.content).toEqual([{ type: 'p', text: 'hola' }]);
  });

  it('selectLessonsByUnit tolera JSON inválido', async () => {
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [
        { ...lessonRow, synthesis: 'no-json', content: 'no-json' },
      ]),
    });

    const lessons = await selectLessonsByUnit(db, 'u1');

    expect(lessons[0]!.synthesis).toEqual([]);
    expect(lessons[0]!.content).toEqual([]);
  });

  it('selectLesson devuelve null sin fila', async () => {
    const { db } = makeDb();
    await expect(selectLesson(db, 'l1.1')).resolves.toBeNull();
  });
});
