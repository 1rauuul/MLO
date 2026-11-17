import { parseContentBlocks } from '@/shared/services/content/remote/validateLessonPayload';

describe('parseContentBlocks multimedia', () => {
  it('acepta imagen con localSrc y video de YouTube', () => {
    const blocks = parseContentBlocks([
      {
        type: 'image',
        src: 'https://cms.test/api/media/abc?sig=xyz',
        localSrc: 'file:///media/abc.webp',
        mediaId: 'abc',
        mime: 'image/webp',
        width: 1280,
        height: 720,
        alt: 'Diagrama',
        caption: 'Figura 1',
      },
      {
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Clase',
      },
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: 'image', localSrc: 'file:///media/abc.webp' });
    expect(blocks[1]).toMatchObject({ type: 'video', title: 'Clase' });
  });

  it('rechaza imagen sin dimensiones y video sin título', () => {
    expect(() =>
      parseContentBlocks([
        {
          type: 'image',
          src: 'https://cms.test/api/media/abc',
          mime: 'image/webp',
          width: 0,
          height: 720,
          alt: 'x',
        },
      ]),
    ).toThrow();
    expect(() =>
      parseContentBlocks([{ type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }]),
    ).toThrow();
  });
});
