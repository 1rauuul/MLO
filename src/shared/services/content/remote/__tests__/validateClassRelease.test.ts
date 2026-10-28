import { ParseError } from '@/shared/services/http/client';

import {
  parseClassPreview,
  parseClassRelease,
} from '../validateClassRelease';

const preview = {
  schemaVersion: 2,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  published: null,
};

const release = {
  schemaVersion: 2,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  version: 2,
  hash: 'hash-2',
  publishedAt: '2026-10-27T00:00:00.000Z',
  lessons: [
    {
      lessonId: 'l1.2',
      code: '1.2',
      extras: [
        {
          id: 'x-lesson',
          type: 'lesson',
          content: {
            title: 'Contexto de clase',
            blocks: [{ type: 'p', text: 'Texto extra' }],
          },
        },
        {
          id: 'x-exercise',
          type: 'exercise',
          content: {
            type: 'order',
            prompt: 'Ordena',
            instructions: '',
            correctOrder: ['uno', 'dos'],
            config: {},
            explanation: '',
            example: null,
          },
        },
        {
          id: 'x-example',
          type: 'example',
          content: {
            type: 'match',
            title: 'Ejemplo',
            prompt: 'Relaciona',
            config: {
              pairs: [
                { left: 'a', right: '1' },
                { left: 'b', right: '2' },
              ],
            },
            steps: [{ text: 'Paso', why: 'Porque sí' }],
            hints: [],
            explanation: '',
          },
        },
      ],
    },
  ],
};

describe('parseClassPreview', () => {
  it('acepta una clase sin publicar y con publicación', () => {
    expect(parseClassPreview(preview, 'ABC123').published).toBeNull();
    const published = parseClassPreview(
      {
        ...preview,
        published: {
          version: 2,
          hash: 'hash-2',
          publishedAt: '2026-10-27T00:00:00.000Z',
        },
      },
      'ABC123',
    );
    expect(published.published?.version).toBe(2);
  });

  it('rechaza clases y publicaciones mal formadas', () => {
    expect(() => parseClassPreview({ ...preview, schemaVersion: 1 }, 'ABC123')).toThrow(ParseError);
    expect(() =>
      parseClassPreview({ ...preview, class: { ...preview.class, name: '' } }, 'ABC123'),
    ).toThrow('nombre de clase vacío');
    expect(() =>
      parseClassPreview(
        { ...preview, published: { version: 0, hash: 'x', publishedAt: 'x' } },
        'ABC123',
      ),
    ).toThrow(ParseError);
  });
});

describe('parseClassRelease', () => {
  it('normaliza bloques, ejercicios y ejemplos', () => {
    const parsed = parseClassRelease(release, 'ABC123');
    const extras = parsed.lessons[0]?.extras ?? [];

    expect(parsed.version).toBe(2);
    expect(extras.map(extra => extra.type)).toEqual(['lesson', 'exercise', 'example']);
    expect(extras[0]).toEqual({
      id: 'x-lesson',
      type: 'lesson',
      content: {
        title: 'Contexto de clase',
        blocks: [{ type: 'p', text: 'Texto extra' }],
      },
    });
    expect(extras[1]).toEqual(
      expect.objectContaining({
        id: 'x-exercise',
        type: 'exercise',
        content: expect.objectContaining({
          id: 'x-exercise',
          lessonId: 'l1.2',
          type: 'order',
          correctOrder: ['uno', 'dos'],
        }),
      }),
    );
    expect(extras[2]).toEqual(
      expect.objectContaining({
        id: 'x-example',
        type: 'example',
        content: expect.objectContaining({ id: 'x-example', lessonId: 'l1.2' }),
      }),
    );
  });

  it('rechaza releases incompletos, ids repetidos y contenido inválido', () => {
    expect(() => parseClassRelease({ ...release, hash: ' ' }, 'ABC123')).toThrow(ParseError);
    expect(() =>
      parseClassRelease(
        {
          ...release,
          lessons: [
            {
              ...release.lessons[0],
              extras: [
                release.lessons[0].extras[0],
                release.lessons[0].extras[0],
              ],
            },
          ],
        },
        'ABC123',
      ),
    ).toThrow('extra repetido');

    const invalidBlock = {
      ...release,
      lessons: [
        {
          ...release.lessons[0],
          extras: [
            {
              id: 'x',
              type: 'lesson',
              content: { title: '', blocks: [{ type: 'image', src: 'x' }] },
            },
          ],
        },
      ],
    };
    expect(() => parseClassRelease(invalidBlock, 'ABC123')).toThrow(ParseError);

    const invalidExercise = {
      ...release,
      lessons: [
        {
          ...release.lessons[0],
          extras: [
            {
              id: 'x',
              type: 'exercise',
              content: {
                type: 'order',
                prompt: 'Ordena',
                instructions: '',
                correctOrder: ['uno'],
                config: {},
                explanation: '',
              },
            },
          ],
        },
      ],
    };
    expect(() => parseClassRelease(invalidExercise, 'ABC123')).toThrow(ParseError);
  });
});
