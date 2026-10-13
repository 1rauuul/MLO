import type { SQLiteDatabase } from 'expo-sqlite';

import { clearLocation, saveLocation, selectLocation } from '@/features/modules/model/locationRepository';

interface StoredRow {
  unit_id: string;
  lesson_id: string;
  lesson_code: string | null;
  section: string;
}

function makeDb() {
  let stored: StoredRow | null = null;
  const db = {
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      if (sql.startsWith('INSERT INTO last_location')) {
        stored = {
          unit_id: params[1] as string,
          lesson_id: params[2] as string,
          lesson_code: (params[3] as string | null) ?? null,
          section: params[4] as string,
        };
      } else if (sql.startsWith('DELETE FROM last_location')) {
        stored = null;
      }
      return { changes: 1, lastInsertRowId: 0 };
    }),
    getFirstAsync: jest.fn(async () => stored),
  };
  return { db: db as unknown as SQLiteDatabase, calls: db };
}

describe('locationRepository', () => {
  it('upserts and reads back the location for an account', async () => {
    const { db, calls } = makeDb();

    await saveLocation(db, 7, {
      unitId: 'u1',
      lessonId: 'lesson-2',
      lessonCode: '2.1',
      section: 'exercise',
    });
    const location = await selectLocation(db, 7);

    expect(location).toEqual({
      unitId: 'u1',
      lessonId: 'lesson-2',
      lessonCode: '2.1',
      section: 'exercise',
    });
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(account_id)'),
      7,
      'u1',
      'lesson-2',
      '2.1',
      'exercise',
      expect.any(String),
    );
    expect(calls.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('FROM last_location'),
      7,
    );
  });

  it('stores a missing lesson code as null', async () => {
    const { db } = makeDb();

    await saveLocation(db, 7, { unitId: 'u1', lessonId: 'lesson-2', section: 'hub' });

    expect(await selectLocation(db, 7)).toEqual({
      unitId: 'u1',
      lessonId: 'lesson-2',
      lessonCode: null,
      section: 'hub',
    });
  });

  it('returns null when there is no stored location', async () => {
    const { db } = makeDb();

    expect(await selectLocation(db, 7)).toBeNull();
  });

  it('clears the stored location', async () => {
    const { db, calls } = makeDb();
    await saveLocation(db, 7, {
      unitId: 'u1',
      lessonId: 'lesson-2',
      lessonCode: '2.1',
      section: 'quiz',
    });

    await clearLocation(db, 7);

    expect(await selectLocation(db, 7)).toBeNull();
    expect(calls.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM last_location'),
      7,
    );
  });
});
