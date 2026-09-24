export type Digest = (input: string) => Promise<string>;

const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export interface RegistrationInput {
  displayName: string;
  username: string;
  password: string;
  confirm: string;
}

export type RegisterError =
  | 'name_empty'
  | 'username_empty'
  | 'username_short'
  | 'username_invalid'
  | 'password_short'
  | 'password_mismatch';

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
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
  if (input.displayName.trim().length === 0) {
    return 'name_empty';
  }
  const username = normalizeUsername(input.username);
  if (username.length === 0) {
    return 'username_empty';
  }
  if (username.length < 3) {
    return 'username_short';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'username_invalid';
  }
  if (input.password.length < 6) {
    return 'password_short';
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

export async function hashPassword(password: string, salt: string, digest: Digest): Promise<string> {
  return digest(passwordMaterial(salt, password));
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
  digest: Digest,
): Promise<boolean> {
  const actual = await hashPassword(password, salt, digest);
  return actual === expectedHash;
}
