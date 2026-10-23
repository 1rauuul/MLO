import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { Platform } from 'react-native';

/**
 * Native PBKDF2 on Android/iOS (fast), pure JS on web and as a fallback.
 */
export function deriveKey(
  password: string,
  salt: string,
  iterations: number,
  keyLength: number,
): Uint8Array {
  if (Platform.OS !== 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const quickCrypto = require('react-native-quick-crypto') as typeof import('react-native-quick-crypto');
      return new Uint8Array(
        quickCrypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256'),
      );
    } catch {
      // Fall through to the JS implementation if the native module is unavailable.
    }
  }
  return pbkdf2(sha256, password, salt, { c: iterations, dkLen: keyLength });
}
