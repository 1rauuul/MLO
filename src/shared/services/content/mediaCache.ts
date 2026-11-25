import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { ContentBlock, ImageMime } from '@/shared/model/entities';
import { mediaLocalUri, mediaRelativePath } from '@/shared/services/content/mediaPath';
import type { GroupManifest } from '@/shared/services/content/coursesV3';

const EXTENSIONS: Record<ImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const MEDIA_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mediaKey(block: Extract<ContentBlock, { type: 'image' }>): string | null {
  if (block.mediaId) return block.mediaId;
  try {
    const parts = new URL(block.src).pathname.split('/').filter(Boolean);
    const candidate = parts[parts.length - 1] ?? '';
    return MEDIA_ID.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

async function localCopy(
  db: SQLiteDatabase,
  block: Extract<ContentBlock, { type: 'image' }>,
): Promise<string | null> {
  const key = mediaKey(block);
  if (!key) return null;

  const row = await db.getFirstAsync<{ local_uri: string }>(
    'SELECT local_uri FROM media_cache WHERE url = ?',
    block.src,
  );
  if (row) {
    const cached = new File(mediaLocalUri(row.local_uri));
    if (cached.exists) return row.local_uri;
  }

  const directory = new Directory(Paths.document, 'media');
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  const extension = EXTENSIONS[block.mime];
  if (!extension) return null;
  const relative = mediaRelativePath(`${key}.${extension}`);
  const file = new File(Paths.document, relative);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    await File.downloadFileAsync(block.src, file, {
      idempotent: true,
      signal: controller.signal,
    });
  } catch (caught) {
    // Android puede dejar un archivo parcial; no debe reutilizarse.
    if (file.exists) file.delete();
    throw caught;
  } finally {
    clearTimeout(timer);
  }

  await db.runAsync(
    `INSERT INTO media_cache (url, local_uri, mime, fetched_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(url) DO UPDATE SET
       local_uri = excluded.local_uri, mime = excluded.mime, fetched_at = excluded.fetched_at`,
    block.src,
    relative,
    block.mime,
    new Date().toISOString(),
  );
  return relative;
}

/** Descarga las imágenes y deja `localSrc` para que la lección funcione offline. */
export async function cacheMediaBlocks(
  db: SQLiteDatabase,
  blocks: ContentBlock[],
): Promise<ContentBlock[]> {
  const result: ContentBlock[] = [];
  for (const block of blocks) {
    if (block.type !== 'image') {
      result.push(block);
      continue;
    }
    try {
      const localSrc = await localCopy(db, block);
      result.push(localSrc ? { ...block, localSrc } : block);
    } catch (caught) {
      if (__DEV__) {
        console.warn('[media] no se pudo cachear una imagen', caught);
      }
      result.push(block);
    }
  }
  return result;
}

async function cacheLessonContent(
  db: SQLiteDatabase,
  lesson: unknown,
): Promise<unknown> {
  if (!isRecord(lesson) || !Array.isArray(lesson.content)) return lesson;
  return {
    ...lesson,
    content: await cacheMediaBlocks(db, lesson.content as ContentBlock[]),
  };
}

export async function cacheMediaInManifest<T extends { lessons: unknown[] }>(
  db: SQLiteDatabase,
  manifest: T,
): Promise<T> {
  const lessons: unknown[] = [];
  for (const lesson of manifest.lessons) {
    lessons.push(await cacheLessonContent(db, lesson));
  }
  return { ...manifest, lessons };
}

export async function cacheMediaInGroupRelease(
  db: SQLiteDatabase,
  manifest: GroupManifest,
): Promise<GroupManifest> {
  const lessons: unknown[] = [];
  for (const lesson of manifest.lessons) {
    lessons.push(await cacheLessonContent(db, lesson));
  }
  const additions: GroupManifest['additions'] = [];
  for (const addition of manifest.additions) {
    additions.push({ ...addition, blocks: await cacheMediaBlocks(db, addition.blocks) });
  }
  return { ...manifest, lessons, additions };
}
