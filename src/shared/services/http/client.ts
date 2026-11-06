export class NetworkError extends Error {
  constructor(message = 'No se pudo conectar con el servidor.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`El servidor respondió ${status}.`);
    this.name = 'HttpError';
  }
}

export class ParseError extends Error {
  constructor(message = 'La respuesta del servidor no es válida.') {
    super(message);
    this.name = 'ParseError';
  }
}

export class ConfigError extends Error {
  constructor(message = 'Falta configurar EXPO_PUBLIC_API_URL.') {
    super(message);
    this.name = 'ConfigError';
  }
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export interface HttpClientConfig {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  retryBaseDelayMs?: number;
  getToken?: () => string | null;
}

export interface HttpClient {
  get: <T>(path: string, options?: HttpRequestOptions) => Promise<T>;
  post: <T>(path: string, body: unknown, options?: HttpRequestOptions) => Promise<T>;
  delete: <T>(path: string, options?: HttpRequestOptions) => Promise<T>;
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 300;

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof ConfigError) {
    return false;
  }
  if (error instanceof NetworkError) {
    return true;
  }
  return error instanceof HttpError && error.status >= 500;
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const fetchImpl = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = config.retries ?? DEFAULT_RETRIES;
  const retryBaseDelayMs = config.retryBaseDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  async function attempt<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: unknown,
    headers: Record<string, string>,
  ): Promise<T> {
    if (!config.baseUrl) {
      throw new ConfigError();
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const token = config.getToken?.() ?? null;
    try {
      let response: Response;
      try {
        response = await fetchImpl(`${config.baseUrl}${path}`, {
          method,
          headers: {
            Accept: 'application/json',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        throw new NetworkError(error instanceof Error && error.name === 'AbortError'
          ? 'El servidor tardó demasiado en responder.'
          : undefined);
      }

      if (!response.ok) {
        throw new HttpError(response.status, await response.text().catch(() => ''));
      }
      if (response.status === 204) {
        return undefined as T;
      }
      try {
        return (await response.json()) as T;
      } catch {
        throw new ParseError();
      }
    } finally {
      clearTimeout(timer);
    }
  }

  async function request<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<T> {
    let lastError: unknown;
    for (let attemptIndex = 0; attemptIndex <= retries; attemptIndex += 1) {
      try {
        return await attempt<T>(path, method, body, headers);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error) || attemptIndex === retries) {
          throw error;
        }
        await wait(retryBaseDelayMs * 2 ** attemptIndex);
      }
    }
    throw lastError;
  }

  return {
    get: <T>(path: string, options?: HttpRequestOptions) =>
      request<T>(path, 'GET', undefined, options?.headers),
    post: <T>(path: string, body: unknown, options?: HttpRequestOptions) =>
      request<T>(path, 'POST', body, options?.headers),
    delete: <T>(path: string, options?: HttpRequestOptions) =>
      request<T>(path, 'DELETE', undefined, options?.headers),
  };
}

export function apiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
}

/** La base v2 sigue vigente; v3 vive en el mismo host, una versión al lado. */
export function apiV3BaseUrl(): string {
  const base = apiBaseUrl();
  if (!base) {
    return '';
  }
  return base.endsWith('/v2') ? `${base.slice(0, -3)}v3` : `${base}/api/mlo/v3`;
}

export const http = createHttpClient({ baseUrl: apiBaseUrl() });
export const httpV3 = createHttpClient({ baseUrl: apiV3BaseUrl() });
