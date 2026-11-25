import {
  canonicalClassCode,
  fetchClassPreview,
  isClassError,
} from '@/shared/services/content/remoteContent';
import { ConfigError, HttpError, type HttpClient } from '@/shared/services/http/client';

const classPreviewFixture = {
  schemaVersion: 2,
  class: { id: 'c1', name: 'Grupo A', teacherName: 'Profesora Ríos' },
  published: null,
};

describe('contrato v2 de clases', () => {
  it('clasifica los errores de clase', () => {
    expect(isClassError(new HttpError(429, ''))).toBe('rate_limited');
    expect(isClassError(new HttpError(404, ''))).toBe('not_found');
    expect(isClassError(new HttpError(409, ''))).toBe('unpublished');
    expect(isClassError(new ConfigError())).toBe('config');
  });

  it('envía el código de la clase en mayúsculas', async () => {
    const get = jest.fn(async () => classPreviewFixture);
    const client = { get, post: jest.fn() } as unknown as HttpClient;

    expect(canonicalClassCode(' ab c123 ')).toBe('ABC123');
    await fetchClassPreview(client, ' ab c123 ');

    expect(get).toHaveBeenCalledWith('/classes/ABC123');
  });
});
