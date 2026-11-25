export type PasswordRequirementId =
  | 'minLength'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'special';

export interface PasswordRequirementResult {
  id: PasswordRequirementId;
  texto: string;
  cumple: boolean;
}

/** Misma lista que `lib/password-policy.ts` del CMS. */
const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;

export const PASSWORD_REQUIREMENTS = [
  { id: 'minLength' as const, texto: 'Entre 8 y 128 caracteres' },
  { id: 'uppercase' as const, texto: 'Al menos una mayúscula' },
  { id: 'lowercase' as const, texto: 'Al menos una minúscula' },
  { id: 'number' as const, texto: 'Al menos un número' },
  { id: 'special' as const, texto: 'Al menos un carácter especial' },
];

export function validarPassword(password: string): {
  valida: boolean;
  resultados: PasswordRequirementResult[];
} {
  const cumple: Record<PasswordRequirementId, boolean> = {
    minLength: password.length >= 8 && password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: SPECIAL.test(password),
  };
  const resultados: PasswordRequirementResult[] = PASSWORD_REQUIREMENTS.map(
    requirement => ({
      ...requirement,
      cumple: cumple[requirement.id],
    }),
  );

  return { valida: resultados.every(result => result.cumple), resultados };
}
