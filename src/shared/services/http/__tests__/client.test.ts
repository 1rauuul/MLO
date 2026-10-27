import {
  apiBaseUrl,
  ConfigError,
  createHttpClient,
  HttpError,
  NetworkError,
  ParseError,
} from '@/shared/services/http/client';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

function makeClient(fetchImpl: jest.Mock) {
  return createHttpClient({
    baseUrl: 'https://api.test',
    fetchImpl,
    retries: 2,
    retryBaseDelayMs: 0,
    getToken: () => 'token-1',
  });
}

describe('http client', () => {
  it('hace GET, envía el token y parsea el JSON', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse({ ok: true }));
    const client = makeClient(fetchImpl);

    await expect(client.get<{ ok: boolean }>('/content/manifest')).resolves.toEqual({ ok: true });

    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(fetchImpl).toHaveBeenCalledWith('https://api.test/content/manifest', expect.any(Object));
    expect(init.headers).toEqual(
      expect.objectContaining({ Accept: 'application/json', Authorization: 'Bearer token-1' }),
    );
  });

  it('no reintenta errores 4xx', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse({ error: 'nope' }, 404));
    const client = makeClient(fetchImpl);

    await expect(client.get('/content/manifest')).rejects.toBeInstanceOf(HttpError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reintenta 5xx y termina con éxito', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500))
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 502))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = makeClient(fetchImpl);

    await expect(client.get('/content/manifest')).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('reintenta errores de red y luego falla con NetworkError', async () => {
    const fetchImpl = jest.fn(async () => {
      throw new TypeError('network down');
    });
    const client = makeClient(fetchImpl);

    await expect(client.get('/content/manifest')).rejects.toBeInstanceOf(NetworkError);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('convierte una respuesta no JSON en ParseError', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('not json');
      },
      text: async () => '',
    }));
    const client = makeClient(fetchImpl);

    await expect(client.get('/content/manifest')).rejects.toBeInstanceOf(ParseError);
  });

  it('falla con ConfigError si falta la URL base y no reintenta', async () => {
    const fetchImpl = jest.fn();
    const client = createHttpClient({ baseUrl: '', fetchImpl });

    await expect(client.get('/content/manifest')).rejects.toBeInstanceOf(ConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('apiBaseUrl', () => {
  const previous = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = previous;
    }
  });

  it('quita espacios y barras finales', () => {
    process.env.EXPO_PUBLIC_API_URL = ' https://api.test/// ';
    expect(apiBaseUrl()).toBe('https://api.test');
  });

  it('devuelve vacío si no está configurada', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(apiBaseUrl()).toBe('');
  });
});
