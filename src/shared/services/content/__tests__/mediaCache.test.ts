import type { SQLiteDatabase } from 'expo-sqlite';

import type { ContentBlock } from '@/shared/model/entities';
import {
  cacheMediaBlocks,
  cacheMediaInGroupRelease,
} from '@/shared/services/content/mediaCache';
import type { GroupManifest } from '@/shared/services/content/coursesV3';

jest.mock('expo-file-system', () => {
  const downloadFileAsync = jest.fn(async (_url: string, file: { uri: string }) => {
    file.uri = 'file:///media/abc.webp';
    return file;
  });
  class Directory {
    uri: string;
    exists = true;
    constructor(base: { uri: string }, name = '') {
      this.uri = `${base.uri}/${name}`;
    }
    create() {}
  }
  class File {
    uri: string;
    get exists() {
      return this.uri === 'file:///media/abc.webp' || this.uri === 'file:///doc/media/abc.webp';
    }
    constructor(base: { uri: string } | string, name = '') {
      this.uri = typeof base === 'string' ? base : `${base.uri}/${name}`;
    }
    delete() {}
    static downloadFileAsync = downloadFileAsync;
  }
  return {
    Paths: { document: { uri: 'file:///doc' } },
    Directory,
    File,
    __downloadFileAsync: downloadFileAsync,
  };
});

const fs = jest.requireMock('expo-file-system') as {
  __downloadFileAsync: jest.Mock;
};

function makeDb(existing: { local_uri: string } | null = null) {
  const db = {
    getFirstAsync: jest.fn(async () => existing),
    runAsync: jest.fn(async () => ({ changes: 1 })),
  } as unknown as SQLiteDatabase;
  return db;
}

const image: ContentBlock = {
  type: 'image',
  src: 'https://cms.test/api/media/abc?sig=xyz',
  mediaId: 'abc',
  mime: 'image/webp',
  width: 10,
  height: 10,
  alt: 'Diagrama',
};

describe('mediaCache', () => {
  beforeEach(() => fs.__downloadFileAsync.mockClear());

  it('descarga y añade localSrc', async () => {
    const blocks = await cacheMediaBlocks(makeDb(), [image]);
    expect(fs.__downloadFileAsync).toHaveBeenCalledTimes(1);
    expect(blocks[0]).toMatchObject({ type: 'image', localSrc: 'media/abc.webp' });
  });

  it('reutiliza la copia local sin volver a descargar', async () => {
    const blocks = await cacheMediaBlocks(makeDb({ local_uri: 'media/abc.webp' }), [image]);
    expect(fs.__downloadFileAsync).not.toHaveBeenCalled();
    expect(blocks[0]).toMatchObject({ localSrc: 'media/abc.webp' });
  });

  it('vuelve a descargar si la copia local ya no existe', async () => {
    const blocks = await cacheMediaBlocks(makeDb({ local_uri: 'media/missing.webp' }), [image]);
    expect(fs.__downloadFileAsync).toHaveBeenCalledTimes(1);
    expect(blocks[0]).toMatchObject({ localSrc: 'media/abc.webp' });
  });

  it('conserva la URL remota si la descarga falla', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fs.__downloadFileAsync.mockRejectedValueOnce(new Error('sin red'));
    const blocks = await cacheMediaBlocks(makeDb(), [image]);
    expect(blocks[0]).toEqual(image);
    warn.mockRestore();
  });

  it('no altera el hash del release de grupo', async () => {
    const release = {
      hash: 'abc123',
      lessons: [],
      additions: [{ lessonId: 'l1', blocks: [image] }],
    } as unknown as GroupManifest;
    const cached = await cacheMediaInGroupRelease(makeDb(), release);
    expect(cached.hash).toBe('abc123');
    expect(cached.additions[0]?.blocks[0]).toMatchObject({ localSrc: 'media/abc.webp' });
  });
});
