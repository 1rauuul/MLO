import { validarPassword } from '@/features/auth/viewmodel/password.logic';

describe('validarPassword', () => {
  it('rechaza una contraseña corta sin número ni símbolo', () => {
    expect(validarPassword('abcdefg').valida).toBe(false);
  });

  it('acepta una contraseña de ocho caracteres con número', () => {
    expect(validarPassword('abcdefg1').valida).toBe(true);
  });

  it('rechaza una contraseña corta aunque tenga número', () => {
    expect(validarPassword('abc1').valida).toBe(false);
  });

  it('acepta una contraseña de ocho caracteres con símbolo', () => {
    expect(validarPassword('abcdefg!').valida).toBe(true);
  });
});
