import {
  ConfigError,
  HttpError,
  NetworkError,
  ParseError,
  httpAuth,
  httpRecovery,
} from '@/shared/services/http/client';
import { isRecord, isString } from '@/shared/utils/validate';

export interface RemoteStudent {
  externalKey: string;
  username: string;
  displayName: string;
  email: string | null;
}

export interface RemoteAuthResult {
  token: string;
  student: RemoteStudent;
}

export type RemoteAuthError =
  | 'invalid_credentials'
  | 'username_taken'
  | 'email_taken'
  | 'email_invalid'
  | 'already_registered'
  | 'invalid_code'
  | 'password_weak'
  | 'rate_limited'
  | 'network_error'
  | 'server_error'
  | 'invalid'
  | 'storage_error';

export type RemoteAuthOutcome =
  | { ok: true; result: RemoteAuthResult }
  | { ok: false; error: RemoteAuthError };

export type RemoteRecoveryError =
  | 'invalid_email'
  | 'invalid_code'
  | 'password_weak'
  | 'rate_limited'
  | 'email_unavailable'
  | 'network_error'
  | 'server_error'
  | 'invalid';

export type RemoteRecoveryOutcome =
  | { ok: true }
  | { ok: false; error: RemoteRecoveryError };

export type RemoteEmailError =
  | 'email_taken'
  | 'email_invalid'
  | 'invalid_credentials'
  | 'session_expired'
  | 'network_error'
  | 'server_error'
  | 'invalid';

export type RemoteEmailOutcome =
  | { ok: true }
  | { ok: false; error: RemoteEmailError };

function parseStudent(value: unknown): RemoteStudent {
  if (
    !isRecord(value) ||
    !isString(value.externalKey) ||
    !isString(value.username) ||
    !isString(value.displayName)
  ) {
    throw new ParseError('La cuenta del servidor no es válida.');
  }
  if (value.email !== undefined && value.email !== null && !isString(value.email)) {
    throw new ParseError('La cuenta del servidor no es válida.');
  }
  return {
    externalKey: value.externalKey,
    username: value.username,
    displayName: value.displayName,
    email: isString(value.email) ? value.email : null,
  };
}

function parseAuth(value: unknown): RemoteAuthResult {
  if (!isRecord(value) || !isString(value.token)) {
    throw new ParseError('La sesión del servidor no es válida.');
  }
  return { token: value.token, student: parseStudent(value.student) };
}

function serverCode(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body);
    return isRecord(parsed) && isString(parsed.error) ? parsed.error : null;
  } catch {
    return null;
  }
}

function mapError(error: unknown): RemoteAuthError {
  if (error instanceof NetworkError || error instanceof ConfigError) {
    return 'network_error';
  }
  if (error instanceof ParseError) {
    return 'invalid';
  }
  if (error instanceof HttpError) {
    if (error.status === 401) return 'invalid_credentials';
    if (error.status === 429) return 'rate_limited';
    if (error.status === 409) {
      const code = serverCode(error.body);
      if (code === 'already_registered') return 'already_registered';
      if (code === 'email_taken') return 'email_taken';
      return 'username_taken';
    }
    if (error.status === 400) {
      return serverCode(error.body) === 'email_invalid' ? 'email_invalid' : 'invalid';
    }
    return 'server_error';
  }
  return 'storage_error';
}

function mapRecoveryError(
  error: unknown,
  mode: 'request' | 'verify',
): RemoteRecoveryError {
  if (error instanceof NetworkError || error instanceof ConfigError) {
    return 'network_error';
  }
  if (error instanceof ParseError) {
    return 'invalid';
  }
  if (error instanceof HttpError) {
    if (error.status === 429) return 'rate_limited';
    if (error.status === 503) return 'email_unavailable';
    if (error.status === 400) {
      if (mode === 'request') return 'invalid_email';
      const code = serverCode(error.body);
      if (code === 'password_invalid') return 'password_weak';
      if (code === 'invalid_code') return 'invalid_code';
      return 'invalid_code';
    }
    if (error.status >= 500) return 'server_error';
    return 'invalid';
  }
  return 'server_error';
}

function mapLinkError(error: unknown): RemoteAuthError {
  if (error instanceof NetworkError || error instanceof ConfigError) {
    return 'network_error';
  }
  if (error instanceof ParseError) {
    return 'invalid';
  }
  if (error instanceof HttpError) {
    if (error.status === 429) return 'rate_limited';
    if (error.status === 409) {
      const code = serverCode(error.body);
      if (code === 'already_registered') return 'already_registered';
      if (code === 'username_taken') return 'username_taken';
      return 'invalid';
    }
    if (error.status === 400) {
      const code = serverCode(error.body);
      if (code === 'invalid_code') return 'invalid_code';
      if (code === 'password_invalid') return 'password_weak';
      if (code === 'username_taken') return 'username_taken';
      return 'invalid';
    }
    if (error.status >= 500) return 'server_error';
    return 'invalid';
  }
  return 'server_error';
}

function mapEmailError(error: unknown): RemoteEmailError {
  if (error instanceof NetworkError || error instanceof ConfigError) {
    return 'network_error';
  }
  if (error instanceof ParseError) {
    return 'invalid';
  }
  if (error instanceof HttpError) {
    if (error.status === 401) return 'session_expired';
    if (error.status === 409) return 'email_taken';
    if (error.status === 400) {
      const code = serverCode(error.body);
      if (code === 'invalid_credentials') return 'invalid_credentials';
      if (code === 'email_invalid') return 'email_invalid';
      return 'invalid';
    }
    if (error.status >= 500) return 'server_error';
    return 'invalid';
  }
  return 'server_error';
}

export async function registerRemote(input: {
  username: string;
  password: string;
  displayName: string;
  email?: string;
}): Promise<RemoteAuthOutcome> {
  try {
    const value = await httpAuth.post<unknown>('/auth/register', input);
    return { ok: true, result: parseAuth(value) };
  } catch (error) {
    return { ok: false, error: mapError(error) };
  }
}

export async function linkRemote(input: {
  externalKey: string;
  username: string;
  password: string;
  displayName: string;
  code: string;
}): Promise<RemoteAuthOutcome> {
  try {
    const value = await httpAuth.post<unknown>('/auth/link', input);
    return { ok: true, result: parseAuth(value) };
  } catch (error) {
    return { ok: false, error: mapLinkError(error) };
  }
}

export async function loginRemote(
  username: string,
  password: string,
): Promise<RemoteAuthOutcome> {
  try {
    const value = await httpAuth.post<unknown>('/auth/login', {
      username,
      password,
    });
    return { ok: true, result: parseAuth(value) };
  } catch (error) {
    return { ok: false, error: mapError(error) };
  }
}

/** Best-effort: si falla, la sesión local se cierra igual. */
export async function logoutRemote(): Promise<void> {
  try {
    await httpAuth.post('/auth/logout', {});
  } catch {
    // Sin red no hay nada que revocar desde este equipo.
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<RemoteRecoveryOutcome> {
  try {
    await httpRecovery.post('/auth/recover', { email });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapRecoveryError(error, 'request') };
  }
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  password: string,
): Promise<RemoteRecoveryOutcome> {
  try {
    await httpRecovery.post('/auth/recover/verify', {
      email,
      code: code.trim(),
      password,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapRecoveryError(error, 'verify') };
  }
}

export async function updateEmailRemote(
  email: string,
  password: string,
): Promise<RemoteEmailOutcome> {
  try {
    await httpAuth.put('/students/me/email', { email, password });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapEmailError(error) };
  }
}
