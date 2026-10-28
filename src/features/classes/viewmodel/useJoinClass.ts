import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import type { ClassPreviewData } from '@/shared/services/content/remote/validateClassRelease';
import { useRepositories } from '@/shared/services/data/DataProvider';
import {
  canonicalClassCode,
  isClassError,
} from '@/shared/services/content/remoteContent';

import { useClasses } from './useClasses';

export type JoinClassError =
  | 'code'
  | 'not_found'
  | 'rate_limited'
  | 'config'
  | 'network'
  | 'invalid'
  | 'no_account'
  | null;

export type JoinClassPhase = 'idle' | 'looking' | 'confirm' | 'joining';

export function normalizeClassCode(raw: string): string {
  return canonicalClassCode(raw);
}

export function useJoinClass() {
  const { content, classes: classRepository } = useRepositories();
  const { account } = useAuth();
  const { refresh: refreshClasses } = useClasses();
  const [preview, setPreview] = useState<ClassPreviewData | null>(null);
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<JoinClassPhase>('idle');
  const [error, setError] = useState<JoinClassError>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setCode('');
    setPhase('idle');
    setError(null);
  }, []);

  const lookup = useCallback(
    async (raw: string) => {
      const code = normalizeClassCode(raw);
      if (code.length !== 6) {
        setError('code');
        return;
      }
      setError(null);
      setPreview(null);
      setCode(code);
      setPhase('looking');
      try {
        setPreview(await content.fetchClassPreview(code));
        setPhase('confirm');
      } catch (caught) {
        setError(isClassError(caught));
        setPhase('idle');
      }
    },
    [content],
  );

  const join = useCallback(async () => {
    if (!account || !preview) {
      setError('no_account');
      return false;
    }
    setError(null);
    setPhase('joining');
    try {
      const info = await content.joinClass(
        code,
        account.externalKey,
        account.displayName,
      );
      await classRepository.saveAccountClass(account.id, code, info);
      try {
        await content.refreshClass(info.class.id, code);
      } catch {
        // La membresía ya quedó guardada; el contenido se sincroniza después.
      }
      await refreshClasses();
      setPreview(info);
      setPhase('confirm');
      return true;
    } catch (caught) {
      setError(isClassError(caught));
      setPhase('confirm');
      return false;
    }
  }, [account, code, preview, content, classRepository, refreshClasses]);

  return { preview, code, phase, error, lookup, join, reset };
}
