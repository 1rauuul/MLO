import type { SQLiteDatabase } from 'expo-sqlite';

import { selectLesson, selectLessons, selectUnits } from '@/features/modules/model/lessonRepository';

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
    expect(calls.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY number'),
      'base',
    );
  });

  it('selectLessons parsea synthesis sin cargar content', async () => {
    const { db, calls } = makeDb({
      getAllAsync: jest.fn(async (_sql: string) => {
        const { content: _content, ...summary } = lessonRow;
        return [summary];
      }),
    });

    const lessons = await selectLessons(db);

    expect(lessons[0]!.synthesis).toEqual(['a', 'b']);
    expect(lessons[0]!.content).toEqual([]);
    const firstCall = calls.getAllAsync.mock.calls[0] as unknown as [string];
    expect(firstCall[0]).not.toContain('content');
  });

  it('selectLessons tolera JSON inválido', async () => {
    const { db } = makeDb({
      getAllAsync: jest.fn(async () => [{ ...lessonRow, synthesis: 'no-json', content: undefined }]),
    });

    const lessons = await selectLessons(db);

    expect(lessons[0]!.synthesis).toEqual([]);
    expect(lessons[0]!.content).toEqual([]);
  });

  it('selectLesson sí carga el content completo', async () => {
    const { db } = makeDb({ getFirstAsync: jest.fn(async () => lessonRow) });

    const lesson = await selectLesson(db, 'l1.2');

    expect(lesson!.content).toEqual([{ type: 'p', text: 'hola' }]);
  });

  it('selectLesson devuelve null sin fila', async () => {
    const { db } = makeDb();
    await expect(selectLesson(db, 'l1.1')).resolves.toBeNull();
  });
});
