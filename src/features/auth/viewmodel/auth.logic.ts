import { validarPassword } from './password.logic';
import { deriveKey } from './passwordKdf';

export type Digest = (input: string) => Promise<string>;

export const PBKDF2_ALGORITHM = 'pbkdf2-sha256';

export const PBKDF2_DEFAULT_ITERATIONS = 100_000;

export const PBKDF2_KEY_BYTES = 32;

const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirm: string;
}

export type RegisterError =
  | 'first_name_empty'
  | 'last_name_empty'
  | 'username_empty'
  | 'username_short'
  | 'username_invalid'
  | 'password_short'
  | 'password_weak'
  | 'password_mismatch';

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): Extract<RegisterError, 'username_empty' | 'username_short' | 'username_invalid'> | null {
  const username = normalizeUsername(raw);
  if (username.length === 0) {
    return 'username_empty';
  }
  if (username.length < 3) {
    return 'username_short';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'username_invalid';
  }
  return null;
}

export function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}

export function validateRegistration(input: RegistrationInput): RegisterError | null {
  if (input.firstName.trim().length === 0) {
    return 'first_name_empty';
  }
  if (input.lastName.trim().length === 0) {
    return 'last_name_empty';
  }
  const usernameError = validateUsername(input.username);
  if (usernameError) {
    return usernameError;
  }
  const password = validarPassword(input.password);
  if (!password.resultados.find(result => result.id === 'minLength')?.cumple) {
    return 'password_short';
  }
  if (!password.valida) {
    return 'password_weak';
  }
  if (input.password !== input.confirm) {
    return 'password_mismatch';
  }
  return null;
}

export function validateLogin(username: string, password: string): 'missing' | null {
  if (normalizeUsername(username).length === 0 || password.length === 0) {
    return 'missing';
  }
  return null;
}

export function passwordMaterial(salt: string, password: string): string {
  return `${salt}:${password}`;
}

export async function legacyHashPassword(
  password: string,
  salt: string,
  digest: Digest,
): Promise<string> {
  return digest(passwordMaterial(salt, password));
}

export function timingSafeEqual(actual: string, expected: string): boolean {
  const length = Math.max(actual.length, expected.length);
  let diff = actual.length ^ expected.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }
  return diff === 0;
}

export async function legacyVerifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
  digest: Digest,
): Promise<boolean> {
  const actual = await legacyHashPassword(password, salt, digest);
  return timingSafeEqual(actual, expectedHash);
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

export async function derivePasswordHash(
  password: string,
  salt: string,
  iterations: number,
): Promise<string> {
  const derived = deriveKey(password, salt, iterations, PBKDF2_KEY_BYTES);
  return `${PBKDF2_ALGORITHM}$${iterations}$${bytesToHex(derived)}`;
}

export function isLegacyPasswordHash(stored: string): boolean {
  return !stored.startsWith(`${PBKDF2_ALGORITHM}$`);
}

export async function verifyPasswordHash(
  password: string,
  salt: string,
  stored: string,
  hexDigest: Digest,
): Promise<boolean> {
  if (isLegacyPasswordHash(stored)) {
    return legacyVerifyPassword(password, salt, stored, hexDigest);
  }
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== PBKDF2_ALGORITHM) {
    return false;
  }
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1) {
    return false;
  }
  const expected = await derivePasswordHash(password, salt, iterations);
  return timingSafeEqual(expected, stored);
}
