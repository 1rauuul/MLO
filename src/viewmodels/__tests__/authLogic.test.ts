import {
  hashPassword,
  initials,
  normalizeUsername,
  passwordMaterial,
  validateLogin,
  validateRegistration,
  verifyPassword,
  type Digest,
} from '../authLogic';

const fakeDigest: Digest = async input => `h(${input})`;

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
  const base = { displayName: 'Ana', username: 'ana', password: 'secreto', confirm: 'secreto' };
  it('acepta datos válidos', () => {
    expect(validateRegistration(base)).toBeNull();
  });
  it('rechaza nombre vacío', () => {
    expect(validateRegistration({ ...base, displayName: '  ' })).toBe('name_empty');
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

describe('hash / verify', () => {
  it('construye el material como salt:password', () => {
    expect(passwordMaterial('s1', 'pw')).toBe('s1:pw');
  });
  it('hashea de forma determinista', async () => {
    await expect(hashPassword('pw', 's1', fakeDigest)).resolves.toBe('h(s1:pw)');
  });
  it('verifica correctamente', async () => {
    const hash = await hashPassword('pw', 's1', fakeDigest);
    await expect(verifyPassword('pw', 's1', hash, fakeDigest)).resolves.toBe(true);
    await expect(verifyPassword('otro', 's1', hash, fakeDigest)).resolves.toBe(false);
  });
});
