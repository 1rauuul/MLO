export type Digest = (input: string) => Promise<string>;

export type ByteDigest = (input: Uint8Array) => Promise<Uint8Array>;

export const PBKDF2_ALGORITHM = 'pbkdf2-sha256';

export const PBKDF2_DEFAULT_ITERATIONS = 100_000;

export const PBKDF2_KEY_BYTES = 32;

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

export async function legacyHashPassword(
  password: string,
  salt: string,
  digest: Digest,
): Promise<string> {
  return digest(passwordMaterial(salt, password));
}

export async function legacyVerifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
  digest: Digest,
): Promise<boolean> {
  const actual = await legacyHashPassword(password, salt, digest);
  return actual === expectedHash;
}

export function utf8Encode(input: string): Uint8Array {
  const bytes: number[] = [];
  for (let index = 0; index < input.length; index += 1) {
    let code = input.codePointAt(index) ?? 0;
    if (code > 0xffff) {
      index += 1;
      const adjusted = code - 0x10000;
      bytes.push(
        0xf0 | (adjusted >> 18),
        0x80 | ((adjusted >> 12) & 0x3f),
        0x80 | ((adjusted >> 6) & 0x3f),
        0x80 | (adjusted & 0x3f),
      );
    } else if (code > 0x7ff) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else if (code > 0x7f) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(code);
    }
  }
  return new Uint8Array(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

const SHA256_BLOCK_BYTES = 64;
const SHA256_OUTPUT_BYTES = 32;

export async function hmacSha256(
  digest: ByteDigest,
  key: Uint8Array,
  message: Uint8Array,
): Promise<Uint8Array> {
  const normalizedKey =
    key.length > SHA256_BLOCK_BYTES ? new Uint8Array(await digest(key)) : key;
  const paddedKey = new Uint8Array(SHA256_BLOCK_BYTES);
  paddedKey.set(normalizedKey);
  const ipad = new Uint8Array(SHA256_BLOCK_BYTES);
  const opad = new Uint8Array(SHA256_BLOCK_BYTES);
  for (let index = 0; index < SHA256_BLOCK_BYTES; index += 1) {
    ipad[index] = paddedKey[index]! ^ 0x36;
    opad[index] = paddedKey[index]! ^ 0x5c;
  }
  const inner = new Uint8Array(SHA256_BLOCK_BYTES + message.length);
  inner.set(ipad);
  inner.set(message, SHA256_BLOCK_BYTES);
  const innerHash = new Uint8Array(await digest(inner));
  const outer = new Uint8Array(SHA256_BLOCK_BYTES + SHA256_OUTPUT_BYTES);
  outer.set(opad);
  outer.set(innerHash, SHA256_BLOCK_BYTES);
  return new Uint8Array(await digest(outer));
}

export async function pbkdf2Sha256(
  password: string,
  salt: string,
  iterations: number,
  digest: ByteDigest,
  keyLength = PBKDF2_KEY_BYTES,
): Promise<Uint8Array> {
  const passwordBytes = utf8Encode(password);
  const saltBytes = utf8Encode(salt);
  const blockCount = Math.ceil(keyLength / SHA256_OUTPUT_BYTES);
  const output = new Uint8Array(blockCount * SHA256_OUTPUT_BYTES);
  for (let blockIndex = 1; blockIndex <= blockCount; blockIndex += 1) {
    const blockSalt = new Uint8Array(saltBytes.length + 4);
    blockSalt.set(saltBytes);
    blockSalt[saltBytes.length] = (blockIndex >>> 24) & 0xff;
    blockSalt[saltBytes.length + 1] = (blockIndex >>> 16) & 0xff;
    blockSalt[saltBytes.length + 2] = (blockIndex >>> 8) & 0xff;
    blockSalt[saltBytes.length + 3] = blockIndex & 0xff;
    let u = await hmacSha256(digest, passwordBytes, blockSalt);
    const block = u.slice();
    for (let iteration = 1; iteration < iterations; iteration += 1) {
      u = await hmacSha256(digest, passwordBytes, u);
      for (let offset = 0; offset < SHA256_OUTPUT_BYTES; offset += 1) {
        block[offset] = block[offset]! ^ u[offset]!;
      }
    }
    output.set(block, (blockIndex - 1) * SHA256_OUTPUT_BYTES);
  }
  return output.subarray(0, keyLength);
}

export async function derivePasswordHash(
  password: string,
  salt: string,
  iterations: number,
  digest: ByteDigest,
): Promise<string> {
  const derived = await pbkdf2Sha256(password, salt, iterations, digest);
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
  byteDigest: ByteDigest,
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
  const expected = await derivePasswordHash(password, salt, iterations, byteDigest);
  return expected === stored;
}
