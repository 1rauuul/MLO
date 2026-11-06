import type { SQLiteDatabase } from 'expo-sqlite';

import { selectExamplesByLesson, selectExamplesByTopic } from '@/features/examples/model/exampleRepository';

function makeDb(rows: unknown[]) {
  const getAllAsync = jest.fn(async () => rows);
  return { db: { getAllAsync } as unknown as SQLiteDatabase, getAllAsync };
}

const exampleRow = {
  id: 'ex1.2',
  lesson_id: 'l1.2',
  type: 'match',
  title: 'Ejemplo',
  prompt: 'Enlaza',
  config: '{"pairs":[{"left":"a","right":"b"}]}',
  steps: '[{"text":"paso","why":"razón"}]',
  hints: '["pista 1"]',
  explanation: 'explica',
};

describe('exampleRepository', () => {
  it('selectExamplesByLesson mapea y parsea steps/hints/config', async () => {
    const { db, getAllAsync } = makeDb([exampleRow]);

    const examples = await selectExamplesByLesson(db, 'l1.2');

    expect(examples[0]).toEqual({
      id: 'ex1.2',
      lessonId: 'l1.2',
      type: 'match',
      title: 'Ejemplo',
      prompt: 'Enlaza',
      config: { pairs: [{ left: 'a', right: 'b' }] },
      steps: [{ text: 'paso', why: 'razón' }],
      hints: ['pista 1'],
      explanation: 'explica',
    });
    expect(getAllAsync).toHaveBeenCalledWith(expect.any(String), 'l1.2');
    expect(String((getAllAsync.mock.calls as unknown[][])[0]?.[0])).toContain('ORDER BY position, rowid');
  });

  it('selectExamplesByLesson filtra por grupo activo', async () => {
    const { db, getAllAsync } = makeDb([exampleRow]);

    await selectExamplesByLesson(db, 'l1.2', 'class-demo');

    const [sql, ...params] = (getAllAsync.mock.calls as unknown[][])[0] ?? [];
    expect(String(sql)).toContain('OR group_id = ?');
    expect(params).toEqual(['l1.2', 'class-demo']);
  });

  it('selectExamplesByTopic ordena por posición editorial', async () => {    const { db, getAllAsync } = makeDb([exampleRow]);

    await selectExamplesByTopic(db, 't1', 'base');

    expect(String((getAllAsync.mock.calls as unknown[][])[0]?.[0])).toContain('ORDER BY e.position, e.rowid');
    expect(getAllAsync).toHaveBeenCalledWith(expect.any(String), 't1', 'base');
  });

  it('tolera JSON inválido en steps/hints/config', async () => {
    const { db } = makeDb([{ ...exampleRow, config: 'x', steps: 'x', hints: 'x' }]);

    const examples = await selectExamplesByLesson(db, 'l1.2');

    expect(examples[0]!.config).toEqual({});
    expect(examples[0]!.steps).toEqual([]);
    expect(examples[0]!.hints).toEqual([]);
  });

  it('descarta steps sin forma esperada', async () => {
    const { db } = makeDb([{ ...exampleRow, steps: '[{"text":"solo"}]' }]);

    const examples = await selectExamplesByLesson(db, 'l1.2');

    expect(examples[0]!.steps).toEqual([]);
  });
});
