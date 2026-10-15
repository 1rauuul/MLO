export interface PasswordRequirementResult {
  id: 'minLength' | 'numberOrSpecial';
  texto: string;
  cumple: boolean;
}

export const PASSWORD_REQUIREMENTS = [
  { id: 'minLength' as const, texto: 'Mínimo 8 caracteres' },
  { id: 'numberOrSpecial' as const, texto: 'Al menos 1 número o carácter especial' },
];

export function validarPassword(password: string): {
  valida: boolean;
  resultados: PasswordRequirementResult[];
} {
  const resultados: PasswordRequirementResult[] = PASSWORD_REQUIREMENTS.map(requirement => ({
    ...requirement,
    cumple:
      requirement.id === 'minLength'
        ? password.length >= 8
        : /[\d\W_]/.test(password),
  }));

  return { valida: resultados.every(result => result.cumple), resultados };
}
