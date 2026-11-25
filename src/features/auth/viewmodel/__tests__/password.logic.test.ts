import { validarPassword } from '@/features/auth/viewmodel/password.logic';

describe('validarPassword', () => {
  it('acepta las contraseñas que acepta el CMS', () => {
    expect(validarPassword('Abcdef1!').valida).toBe(true);
    expect(validarPassword('Clave2026#').valida).toBe(true);
    expect(validarPassword('A1!aaaaa').valida).toBe(true);
  });

  it('rechaza una contraseña sin mayúscula', () => {
    expect(validarPassword('abcdef1!').valida).toBe(false);
  });

  it('rechaza una contraseña sin minúscula', () => {
    expect(validarPassword('ABCDEF1!').valida).toBe(false);
  });

  it('rechaza una contraseña sin número', () => {
    expect(validarPassword('Abcdefg!').valida).toBe(false);
  });

  it('rechaza una contraseña sin símbolo', () => {
    expect(validarPassword('Abcdefg1').valida).toBe(false);
  });

  it('solo acepta los símbolos del CMS', () => {
    expect(validarPassword('Abcdef1€').valida).toBe(false);
    expect(validarPassword('Abcdef1!').valida).toBe(true);
    expect(validarPassword('Abcdef1`').valida).toBe(true);
  });

  it('no cuenta un espacio como símbolo', () => {
    expect(validarPassword('Abcdefg1 ').valida).toBe(false);
  });

  it('no cuenta una mayúscula acentuada', () => {
    expect(validarPassword('Ábcdef1!').valida).toBe(false);
  });

  it('rechaza una contraseña corta aunque cumpla lo demás', () => {
    expect(validarPassword('Ab1!').valida).toBe(false);
  });

  it('rechaza una contraseña de más de 128 caracteres', () => {
    expect(validarPassword(`A1!${'x'.repeat(126)}`).valida).toBe(false);
  });

  it('devuelve los cinco requisitos', () => {
    expect(validarPassword('Abcdef1!').resultados.map(result => result.id)).toEqual([
      'minLength',
      'uppercase',
      'lowercase',
      'number',
      'special',
    ]);
  });
});
