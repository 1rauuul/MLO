import { ParseError } from '@/shared/services/http/client';

import { parseClassPreview } from '../validateClassRelease';

const preview = {
  schemaVersion: 2,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  published: null,
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
