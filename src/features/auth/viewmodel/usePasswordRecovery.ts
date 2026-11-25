import { useCallback, useState } from 'react';

import {
  confirmPasswordReset,
  requestPasswordReset,
} from '@/features/auth/model/remoteAuth';
import { isValidEmail, normalizeEmail } from '@/features/auth/viewmodel/auth.logic';
import { validarPassword } from '@/features/auth/viewmodel/password.logic';

export type RecoveryStep = 'email' | 'code';

export function usePasswordRecovery() {
  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const requestCode = useCallback(async (rawEmail: string) => {
    const normalized = normalizeEmail(rawEmail);
    if (normalized.length === 0) {
      setError('email_empty');
      return false;
    }
    if (!isValidEmail(normalized)) {
      setError('email_invalid');
      return false;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await requestPasswordReset(normalized);
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setEmail(normalized);
      setStep('code');
      return true;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const confirm = useCallback(
    async (code: string, password: string) => {
      if (!/^\d{6}$/.test(code.trim())) {
        setError('invalid_code');
        return false;
      }
      if (!validarPassword(password).valida) {
        setError('password_weak');
        return false;
      }

      setSubmitting(true);
      setError(null);
      try {
        const result = await confirmPasswordReset(email, code, password);
        if (!result.ok) {
          setError(result.error);
          return false;
        }
        setSuccess(true);
        return true;
      } finally {
        setSubmitting(false);
      }
    },
    [email],
  );

  const backToEmail = useCallback(() => {
    setStep('email');
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    step,
    email,
    error,
    submitting,
    success,
    requestCode,
    confirm,
    backToEmail,
    clearError,
  };
}
