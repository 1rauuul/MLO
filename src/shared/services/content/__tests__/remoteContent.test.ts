import type { SQLiteDatabase } from 'expo-sqlite';

import {
  canonicalClassCode,
  fetchClassPreview,
  isClassError,
  isContentError,
  parseCatalogManifest,
  refreshCatalog,
  refreshCatalogs,
} from '@/shared/services/content/remoteContent';
import { validateLessonPayload } from '@/shared/services/content/remote/validateLessonPayload';
import { ConfigError, HttpError, type HttpClient } from '@/shared/services/http/client';
import {
  lessonAllTypesFixture,
  lessonFixture,
  manifestFixture,
} from '@/shared/services/http/fixtures';

function makeDb() {
  const statements: { sql: string; params: unknown[] }[] = [];
  const db = {
    getFirstAsync: jest.fn(async () => null),
    getAllAsync: jest.fn(async () => []),
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      statements.push({ sql, params });
      return { changes: 1, lastInsertRowId: 0 };
    }),
    withTransactionAsync: async (task: () => Promise<void>) => task(),
  } as unknown as SQLiteDatabase;
  return { db, statements };
}

function clientFor(payload: unknown = lessonFixture): HttpClient {
  return {
    get: jest.fn(async (path: string) =>
      path.endsWith('/manifest') ? manifestFixture : payload,
    ),
    post: jest.fn(),
  } as unknown as HttpClient;
}

const classPreviewFixture = {
  schemaVersion: 2,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  published: null,
};

describe('contrato v2', () => {
  it('parsea la vista previa de clase y el manifiesto', () => {
    expect(canonicalClassCode(' ab c123 ')).toBe('ABC123');
    expect(parseCatalogManifest(manifestFixture, 'k7f3q').lessons[0]?.lessonId).toBe(
      'k7f3q-l1.2',
    );
  });

  it('rechaza un manifiesto de otro curso, schemaVersion o vacío', () => {
    expect(() => parseCatalogManifest(manifestFixture, 'otro')).toThrow(
      'El manifiesto del curso no es válido.',
    );
    expect(() => parseCatalogManifest({ ...manifestFixture, schemaVersion: 1 }, 'k7f3q')).toThrow(
      'El manifiesto del curso no es válido.',
    );
    expect(() => parseCatalogManifest({ ...manifestFixture, lessons: [] }, 'k7f3q')).toThrow(
      'El manifiesto del curso está vacío.',
    );
  });

  it('acepta la versión entera del plan maestro y la normaliza', () => {
    expect(parseCatalogManifest({ ...manifestFixture, version: 3 }, 'k7f3q').version).toBe('3');
  });

  it('rechaza hash vacío y lecciones repetidas', () => {
    expect(() => parseCatalogManifest({ ...manifestFixture, hash: ' ' }, 'k7f3q')).toThrow(
      'El manifiesto del curso no es válido.',
    );
    expect(() =>
      parseCatalogManifest(
        {
          ...manifestFixture,
          lessons: [manifestFixture.lessons[0], manifestFixture.lessons[0]],
        },
        'k7f3q',
      ),
    ).toThrow('El manifiesto repite lecciones.');
  });

  it('clasifica los errores de clase y de contenido por separado', () => {
    expect(isClassError(new HttpError(429, ''))).toBe('rate_limited');
    expect(isClassError(new HttpError(404, ''))).toBe('not_found');
    expect(isContentError(new HttpError(404, ''))).toBe('content_missing');
    expect(isContentError(new HttpError(429, ''))).toBe('rate_limited');
    expect(isClassError(new ConfigError())).toBe('config');
    expect(isContentError(new ConfigError())).toBe('config');
  });

  it('envía el código de la clase en mayúsculas', async () => {
    const get = jest.fn(async () => classPreviewFixture);
    const client = { get, post: jest.fn() } as unknown as HttpClient;

    await fetchClassPreview(client, ' ab c123 ');

    expect(get).toHaveBeenCalledWith('/classes/ABC123');
  });
});

describe('validateLessonPayload', () => {
  const expected = { catalogId: 'k7f3q', lessonId: 'k7f3q-l1.2' };

  it('acepta el fixture completo', () => {
    const payload = validateLessonPayload(lessonFixture, expected);
    expect(payload.exercises).toHaveLength(1);
    expect(payload.questions[0]?.question.id).toBe('k7f3q-q1');
  });

  it('acepta los cinco tipos de actividad del contrato', () => {
    const payload = validateLessonPayload(lessonAllTypesFixture, expected);
    expect(payload.exercises.map(exercise => exercise.type).sort()).toEqual([
      'crossword',
      'fill',
      'match',
      'order',
    ]);
    expect(payload.questions.map(entry => entry.question.type).sort()).toEqual(['mcq', 'order']);
    expect(payload.exercises.find(exercise => exercise.type === 'fill')?.example?.title).toBe(
      'Ejemplo de completar',
    );
  });

  it('normaliza los campos vacíos que el serializador puede omitir', () => {
    const payload = validateLessonPayload(
      {
        ...lessonFixture,
        examples: undefined,
        lesson: {
          ...lessonFixture.lesson,
          codeSample: undefined,
          contextTitle: undefined,
          contextBody: undefined,
          synthesis: undefined,
        },
        exercises: [
          {
            ...lessonFixture.exercises[0],
            type: 'fill',
            correctOrder: undefined,
            config: {
              sentences: ['El {{requisito}} describe una necesidad.'],
              bank: ['requisito'],
            },
          },
        ],
        questions: [
          {
            evaluationId: 'k7f3q-ev1.2',
            question: {
              id: 'k7f3q-q2',
              type: 'fill',
              prompt: 'Completa',
              config: {
                sentences: ['El {{requisito}} describe una necesidad.'],
                bank: ['requisito'],
              },
            },
          },
        ],
      },
      expected,
    );
    expect(payload.examples).toEqual([]);
    expect(payload.lesson.codeSample).toBe('');
    expect(payload.lesson.synthesis).toEqual([]);
    expect(payload.exercises[0]?.correctOrder).toEqual([]);
    expect(payload.questions[0]?.question.options).toEqual([]);
    expect(payload.questions[0]?.question.answer).toBe(0);
    expect(payload.questions[0]?.question.explanation).toBe('');
  });

  it('rechaza encabezados incoherentes', () => {
    expect(() => validateLessonPayload({ ...lessonFixture, catalogId: 'otro' }, expected)).toThrow();
    expect(() =>
      validateLessonPayload({ ...lessonFixture, lessonId: 'otro' }, expected),
    ).toThrow();
    expect(() =>
      validateLessonPayload(
        { ...lessonFixture, exercises: [{ ...lessonFixture.exercises[0], lessonId: 'otro' }] },
        expected,
      ),
    ).toThrow('Contenido remoto inválido');
  });

  it('rechaza ids repetidos o de otro curso en cualquier entidad', () => {
    const repeated = {
      ...lessonFixture,
      examples: [{ ...lessonFixture.examples[0], id: 'k7f3q-ord1' }],
    };
    expect(() => validateLessonPayload(repeated, expected)).toThrow('ids repetidos');
    for (const foreignId of ['k7f3q-l1.2', 'k7f3q-u1', 'k7f3q-ev1.2', 'k7f3q-ord1', 'k7f3q-ex1', 'k7f3q-q1']) {
      expect(() =>
        validateLessonPayload(lessonFixture, expected, new Set([foreignId])),
      ).toThrow('ya usado por otro curso');
    }
  });

  it('acepta lecciones de solo lectura y exige preguntas solo si hay evaluación', () => {
    const readOnly = validateLessonPayload(
      {
        ...lessonFixture,
        exercises: [],
        examples: [],
        questions: [],
        evaluation: null,
      },
      expected,
    );
    expect(readOnly.exercises).toEqual([]);
    expect(readOnly.evaluation).toBeNull();

    expect(() =>
      validateLessonPayload({ ...lessonFixture, questions: [] }, expected),
    ).toThrow('no tiene preguntas');
  });

  it('rechaza unidad y lección inválidas', () => {
    expect(() =>
      validateLessonPayload(
        { ...lessonFixture, unit: { ...lessonFixture.unit, difficulty: 'Fácil' } },
        expected,
      ),
    ).toThrow('dificultad inválida');
    expect(() =>
      validateLessonPayload(
        {
          ...lessonFixture,
          lesson: { ...lessonFixture.lesson, content: [{ type: 'table', header: ['a'], rows: [['b', 'c']] }] },
        },
        expected,
      ),
    ).toThrow('tabla de contenido inválida');
  });

  it('rechaza ejercicios y ejemplos mal formados', () => {
    expect(() =>
      validateLessonPayload(
        {
          ...lessonFixture,
          exercises: [{ ...lessonFixture.exercises[0], correctOrder: ['a'] }],
        },
        expected,
      ),
    ).toThrow('al menos 2 elementos');
    expect(() =>
      validateLessonPayload(
        {
          ...lessonFixture,
          exercises: [
            {
              ...lessonFixture.exercises[0],
              type: 'fill',
              correctOrder: [],
              config: { sentences: ['Sin espacio.'], bank: [] },
            },
          ],
        },
        expected,
      ),
    ).toThrow('sin espacio');
    expect(() =>
      validateLessonPayload(
        {
          ...lessonFixture,
          exercises: [
            {
              ...lessonFixture.exercises[0],
              type: 'match',
              correctOrder: [],
              config: {
                pairs: [
                  { left: 'a', right: '1' },
                  { left: 'a', right: '2' },
                ],
              },
            },
          ],
        },
        expected,
      ),
    ).toThrow('par repetido');
    expect(() =>
      validateLessonPayload(
        { ...lessonFixture, examples: [{ ...lessonFixture.examples[0], steps: [] }] },
        expected,
      ),
    ).toThrow('ejemplo sin pasos');
  });

  it('rechaza crucigramas con conflicto y mcq fuera de rango', () => {
    expect(() =>
      validateLessonPayload(
        {
          ...lessonFixture,
          exercises: [
            {
              ...lessonFixture.exercises[0],
              type: 'crossword',
              correctOrder: [],
              config: {
                crossword: {
                  rows: 2,
                  cols: 2,
                  entries: [
                    { word: 'AB', clue: 'uno', row: 0, col: 0, direction: 'across' },
                    { word: 'CB', clue: 'dos', row: 0, col: 0, direction: 'down' },
                  ],
                },
              },
            },
          ],
        },
        expected,
      ),
    ).toThrow('cruce de crucigrama');
    expect(() =>
      validateLessonPayload(
        {
          ...lessonFixture,
          questions: [
            {
              evaluationId: 'k7f3q-ev1.2',
              question: { ...lessonFixture.questions[0]!.question, answer: 5 },
            },
          ],
        },
        expected,
      ),
    ).toThrow('respuesta fuera de rango');
  });

  it('exige id en preguntas y evaluación con tamaños positivos', () => {
    expect(() =>
      validateLessonPayload(
        {
          ...lessonFixture,
          questions: [
            { evaluationId: 'k7f3q-ev1.2', question: { ...lessonFixture.questions[0]!.question, id: undefined } },
          ],
        },
        expected,
      ),
    ).toThrow('pregunta sin id');
    expect(() =>
      validateLessonPayload(
        { ...lessonFixture, evaluation: { ...lessonFixture.evaluation, questionCount: 0 } },
        expected,
      ),
    ).toThrow('evaluación inválida');
  });
});

describe('refreshCatalog', () => {
  it('guarda en remote_lessons y no en las tablas de contenido', async () => {
    const { db, statements } = makeDb();
    const client = clientFor();

    await expect(refreshCatalog(db, client, 'k7f3q')).resolves.toBe(true);

    const sql = statements.map(statement => statement.sql);
    expect(sql.some(statement => statement.includes('INSERT INTO remote_lessons'))).toBe(true);
    expect(sql.some(statement => statement.includes('INSERT INTO remote_catalogs'))).toBe(true);
    expect(sql.some(statement => statement.includes('INSERT INTO exercises'))).toBe(false);
  });

  it('no guarda el manifest si una lección es inválida', async () => {
    const { db, statements } = makeDb();
    const manifest = {
      ...manifestFixture,
      lessons: [
        ...manifestFixture.lessons,
        { lessonId: 'otra', unitId: 'k7f3q-u1', hash: 'otro-hash' },
      ],
    };
    const client: HttpClient = {
      get: jest.fn(async (path: string) =>
        path.endsWith('/manifest') ? manifest : path.endsWith('/otra') ? { schemaVersion: 1 } : lessonFixture,
      ),
      post: jest.fn(),
    } as unknown as HttpClient;

    await expect(refreshCatalog(db, client, 'k7f3q')).rejects.toThrow();
    expect(statements).toHaveLength(0);
  });

  it('rechaza una misma versión con otro hash', async () => {
    const runAsync = jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 }));
    const db = {
      getFirstAsync: jest.fn(async (sql: string) =>
        sql.includes('remote_catalogs')
          ? { manifest_hash: 'otro-hash', version: manifestFixture.version }
          : null,
      ),
      getAllAsync: jest.fn(async () => []),
      runAsync,
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;

    await expect(refreshCatalog(db, clientFor(), 'k7f3q')).rejects.toThrow('repite versión');
    expect(runAsync).not.toHaveBeenCalled();
  });

  it('rechaza una versión numérica que retrocede', async () => {
    const runAsync = jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 }));
    const db = {
      getFirstAsync: jest.fn(async () => ({ manifest_hash: 'otro-hash', version: '5' })),
      getAllAsync: jest.fn(async () => []),
      runAsync,
      withTransactionAsync: async (task: () => Promise<void>) => task(),
    } as unknown as SQLiteDatabase;
    const client: HttpClient = {
      get: jest.fn(async (path: string) =>
        path.endsWith('/manifest') ? { ...manifestFixture, version: '4' } : lessonFixture,
      ),
      post: jest.fn(),
    } as unknown as HttpClient;

    await expect(refreshCatalog(db, client, 'k7f3q')).rejects.toThrow('retrocede de versión');
    expect(runAsync).not.toHaveBeenCalled();
  });

  it('rechaza una lección cuyo hash no coincide con el manifest', async () => {
    const { db, statements } = makeDb();
    const client = clientFor({ ...lessonFixture, hash: 'otro-hash' });

    await expect(refreshCatalog(db, client, 'k7f3q')).rejects.toThrow(
      'no coincide con el hash del manifiesto',
    );
    expect(statements).toHaveLength(0);
  });

  it('rechaza ids compartidos entre lecciones del mismo curso', async () => {
    const { db, statements } = makeDb();
    const manifest = {
      ...manifestFixture,
      lessons: [
        manifestFixture.lessons[0],
        { lessonId: 'k7f3q-l1.3', unitId: 'k7f3q-u1', hash: 'lesson-hash-2' },
      ],
    };
    const second = {
      ...lessonFixture,
      lessonId: 'k7f3q-l1.3',
      hash: 'lesson-hash-2',
      lesson: { ...lessonFixture.lesson, id: 'k7f3q-l1.3' },
      evaluation: null,
      questions: [],
      examples: [],
      exercises: [{ ...lessonFixture.exercises[0], lessonId: 'k7f3q-l1.3' }],
    };
    const client: HttpClient = {
      get: jest.fn(async (path: string) => {
        if (path.endsWith('/manifest')) return manifest;
        if (path.endsWith('k7f3q-l1.3')) return second;
        return lessonFixture;
      }),
      post: jest.fn(),
    } as unknown as HttpClient;

    await expect(refreshCatalog(db, client, 'k7f3q')).rejects.toThrow(
      'ya pertenece a otra lección',
    );
    expect(statements).toHaveLength(0);
  });

  it('en modo local no hace ninguna petición', async () => {
    const { db } = makeDb();
    const client = clientFor();

    await refreshCatalogs(db, client, 'local');

    expect(client.get).not.toHaveBeenCalled();
  });
});
