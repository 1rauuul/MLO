import {
  bytesToHex,
  derivePasswordHash,
  isLegacyPasswordHash,
  legacyHashPassword,
  initials,
  normalizeUsername,
  passwordMaterial,
  timingSafeEqual,
  validateLogin,
  validateRegistration,
  verifyPasswordHash,
  type Digest,
} from '@/features/auth/viewmodel/auth.logic';

jest.mock('react-native-quick-crypto', () => ({
  pbkdf2Sync: (
    password: string,
    salt: string,
    iterations: number,
    keyLength: number,
    digest: string,
  ) => (
    jest.requireActual('crypto') as {
      pbkdf2Sync: (
        password: string,
        salt: string,
        iterations: number,
        keyLength: number,
        digest: string,
      ) => Uint8Array;
    }
  ).pbkdf2Sync(password, salt, iterations, keyLength, digest),
}));

const fakeDigest: Digest = async input => `h(${input})`;

const nodeCrypto = jest.requireActual('crypto') as {
  createHash: (algorithm: string) => {
    update: (input: Uint8Array | string) => { digest: () => Uint8Array };
  };
  pbkdf2Sync: (
    password: string,
    salt: string,
    iterations: number,
    keyLength: number,
    algorithm: string,
  ) => Uint8Array;
};

const realSha256Hex: Digest = async input =>
  bytesToHex(new Uint8Array(nodeCrypto.createHash('sha256').update(input).digest()));

describe('normalizeUsername', () => {
  it('recorta y pasa a minúsculas', () => {
    expect(normalizeUsername('  Valentina.Rios ')).toBe('valentina.rios');
  });
});

describe('initials', () => {
  it('toma la primera y la última palabra', () => {
    expect(initials('Valentina Ríos')).toBe('VR');
  });
  it('usa dos letras si hay una sola palabra', () => {
    expect(initials('Valentina')).toBe('VA');
  });
  it('devuelve ? si está vacío', () => {
    expect(initials('   ')).toBe('?');
  });
});

describe('validateRegistration', () => {
  const base = {
    firstName: 'Ana',
    lastName: 'Pérez',
    username: 'ana',
    password: 'secreto1',
    confirm: 'secreto1',
  };
  it('acepta datos válidos', () => {
    expect(validateRegistration(base)).toBeNull();
  });
  it('rechaza nombre vacío', () => {
    expect(validateRegistration({ ...base, firstName: '  ' })).toBe('first_name_empty');
  });
  it('rechaza apellidos vacíos', () => {
    expect(validateRegistration({ ...base, lastName: '  ' })).toBe('last_name_empty');
  });
  it('rechaza usuario corto', () => {
    expect(validateRegistration({ ...base, username: 'ab' })).toBe('username_short');
  });
  it('rechaza usuario con caracteres inválidos', () => {
    expect(validateRegistration({ ...base, username: 'ana ríos' })).toBe('username_invalid');
  });
  it('rechaza contraseña corta', () => {
    expect(validateRegistration({ ...base, password: '123', confirm: '123' })).toBe('password_short');
  });
  it('rechaza confirmación distinta', () => {
    expect(validateRegistration({ ...base, confirm: 'otro' })).toBe('password_mismatch');
  });
});

describe('validateLogin', () => {
  it('rechaza credenciales vacías', () => {
    expect(validateLogin('', 'x')).toBe('missing');
    expect(validateLogin('ana', '')).toBe('missing');
  });
  it('acepta credenciales presentes', () => {
    expect(validateLogin('ana', 'secreto')).toBeNull();
  });
});

describe('timingSafeEqual', () => {
  it('acepta hashes iguales y rechaza distintos o de otra longitud', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
    expect(timingSafeEqual('abc', 'abc123')).toBe(false);
    expect(timingSafeEqual('', '')).toBe(true);
  });
});

describe('legacy hash / verify', () => {
  it('construye el material como salt:password', () => {
    expect(passwordMaterial('s1', 'pw')).toBe('s1:pw');
  });
  it('hashea de forma determinista', async () => {
    await expect(legacyHashPassword('pw', 's1', fakeDigest)).resolves.toBe('h(s1:pw)');
  });
});

describe('derivePasswordHash', () => {
  it('coincide con la implementación de referencia de node:crypto', async () => {
    const iterations = 1000;
    const expected = nodeCrypto.pbkdf2Sync('secreto', 's1', iterations, 32, 'sha256');

    const stored = await derivePasswordHash('secreto', 's1', iterations);

    expect(stored).toBe(`pbkdf2-sha256$${iterations}$${bytesToHex(expected)}`);
  });

  it('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const stored = await derivePasswordHash('secreto', 's1', 10);

    await expect(verifyPasswordHash('secreto', 's1', stored, realSha256Hex)).resolves.toBe(true);
    await expect(verifyPasswordHash('otra', 's1', stored, realSha256Hex)).resolves.toBe(false);
  });

  it('verifica hashes legacy con el digest hexadecimal', async () => {
    const legacy = await legacyHashPassword('pw', 's1', realSha256Hex);

    expect(isLegacyPasswordHash(legacy)).toBe(true);
    await expect(verifyPasswordHash('pw', 's1', legacy, realSha256Hex)).resolves.toBe(true);
    await expect(verifyPasswordHash('otra', 's1', legacy, realSha256Hex)).resolves.toBe(false);
  });

  it('rechaza formatos malformados', async () => {
    await expect(
      verifyPasswordHash('pw', 's1', 'pbkdf2-sha256$mal$abc', realSha256Hex),
    ).resolves.toBe(false);
    await expect(verifyPasswordHash('pw', 's1', 'otro-formato', realSha256Hex)).resolves.toBe(false);
  });

  it('no marca el formato pbkdf2 como legacy', async () => {
    const stored = await derivePasswordHash('pw', 's1', 10);
    expect(isLegacyPasswordHash(stored)).toBe(false);
  });
});
