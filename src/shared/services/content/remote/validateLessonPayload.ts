import type { ContentBlock, ImageMime } from '@/shared/model/entities';
import { isRecord, isString, isStringArray } from '@/shared/utils/validate';
import { youtubeVideoId } from '@/shared/utils/youtube';

function fail(message: string): never {
  throw new Error(`Contenido remoto inválido: ${message}`);
}

function nonEmpty(value: unknown, label: string): string {
  if (!isString(value) || value.trim().length === 0) {
    fail(`${label} vacío`);
  }
  return value;
}

function defaultString(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (!isString(value)) {
    fail('texto inválido');
  }
  return value;
}

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function imageMime(value: unknown): ImageMime {
  if (typeof value !== 'string' || !(IMAGE_MIMES as readonly string[]).includes(value)) {
    fail('formato de imagen no permitido');
  }
  return value as ImageMime;
}

export function parseContentBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) {
    fail('content no es un arreglo');
  }
  return value.map(block => {
    if (!isRecord(block) || !isString(block.type)) {
      fail('bloque de contenido inválido');
    }
    switch (block.type) {
      case 'p':
      case 'h':
        if (!isString(block.text)) {
          fail('bloque de texto inválido');
        }
        return { type: block.type, text: block.text };
      case 'bullets':
      case 'numbers':
        if (!isStringArray(block.items)) {
          fail('lista de contenido inválida');
        }
        return { type: block.type, items: block.items };
      case 'table': {
        if (!isStringArray(block.header) || !Array.isArray(block.rows)) {
          fail('tabla de contenido inválida');
        }
        const header = block.header;
        if (!block.rows.every(row => isStringArray(row) && row.length === header.length)) {
          fail('tabla de contenido inválida');
        }
        return { type: 'table', header, rows: block.rows as string[][] };
      }
      case 'image': {
        if (
          !isString(block.src) ||
          !/^https?:\/\//i.test(block.src) ||
          !Number.isInteger(block.width) ||
          !Number.isInteger(block.height) ||
          Number(block.width) < 1 ||
          Number(block.height) < 1 ||
          Number(block.width) > 10000 ||
          Number(block.height) > 10000
        ) {
          fail('imagen de contenido inválida');
        }
        const alt = nonEmpty(block.alt, 'alt de imagen');
        const caption = block.caption === undefined ? undefined : defaultString(block.caption);
        const localSrc = block.localSrc === undefined ? undefined : defaultString(block.localSrc);
        const mediaId = block.mediaId === undefined ? undefined : defaultString(block.mediaId);
        return {
          type: 'image',
          src: block.src,
          ...(localSrc ? { localSrc } : {}),
          mime: imageMime(block.mime),
          width: Number(block.width),
          height: Number(block.height),
          alt,
          ...(caption ? { caption } : {}),
          ...(mediaId ? { mediaId } : {}),
        };
      }
      case 'video': {
        const url = nonEmpty(block.url, 'url de video');
        if (!youtubeVideoId(url)) fail('video de YouTube inválido');
        return {
          type: 'video',
          url,
          title: nonEmpty(block.title, 'título de video'),
        };
      }
      default:
        fail(`tipo de bloque desconocido: ${String(block.type)}`);
    }
  });
}
