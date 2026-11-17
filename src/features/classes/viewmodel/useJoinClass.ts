import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import type { ClassPreviewData } from '@/shared/services/content/remote/validateClassRelease';
import {
  extractInvitationToken,
  isInvitationError,
  type InvitationClaim,
  type InvitationError,
} from '@/shared/services/content/invitations';
import { useRepositories } from '@/shared/services/data/DataProvider';
import {
  canonicalClassCode,
  isClassError,
} from '@/shared/services/content/remoteContent';

import { useClasses } from './useClasses';

export type JoinClassError =
  | InvitationError
  | 'invitation_invalid'
  | 'link'
  | 'code'
  | 'not_found'
  | 'unpublished'
  | 'rate_limited'
  | 'invalid'
  | 'no_account'
  | null;

export type JoinClassPhase = 'idle' | 'looking' | 'confirm' | 'joining' | 'claiming' | 'accepted';

/** El alta de invitación comparte los estados de error de contenido. */
function invitationError(error: InvitationError): JoinClassError {
  return error === 'invalid' ? 'invitation_invalid' : error;
}

export function normalizeClassCode(raw: string): string {
  return canonicalClassCode(raw);
}

export function useJoinClass() {
  const { content, classes: classRepository, courses: courseRepository } = useRepositories();
  const { account } = useAuth();
  const { refresh: refreshClasses } = useClasses();
  const [preview, setPreview] = useState<ClassPreviewData | null>(null);
  const [invitation, setInvitation] = useState<InvitationClaim | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<JoinClassPhase>('idle');
  const [error, setError] = useState<JoinClassError>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setInvitation(null);
    setToken(null);
    setCode('');
    setPhase('idle');
    setError(null);
  }, []);

  /** Descarga el curso recién autorizado y lo deja activo; nunca revierte la membresía. */
  const syncCourse = useCallback(
    async (accountId: number, catalogId: string) => {
      try {
        await courseRepository.refreshCourseList();
      } catch {
        // Sin red se conserva la tarjeta local con el nombre del CMS.
      }
      try {
        await courseRepository.selectCourse(accountId, catalogId);
        await courseRepository.applyStoredContent(catalogId);
      } catch {
        // El contenido se aplicará en el siguiente arranque.
      }
    },
    [courseRepository],
  );

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
      const catalogId = info.course?.catalogId ?? 'base';
      await classRepository.saveAccountClass(
        account.id,
        code,
        info,
        catalogId,
        info.course?.title ?? '',
      );
      await syncCourse(account.id, catalogId);
      try {
        await content.refreshClass(info.class.id, code, account.externalKey, catalogId);
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
  }, [account, code, preview, content, classRepository, refreshClasses, syncCourse]);

  const claimToken = useCallback(
    async (invitationToken: string) => {
      if (!account) {
        setError('no_account');
        return false;
      }
      setToken(invitationToken);
      setError(null);
      setPreview(null);
      setPhase('claiming');
      try {
        const claimed = await content.claimInvitation(
          invitationToken,
          account.externalKey,
          account.displayName,
        );
        const membership = claimed.membership;
        const catalogId = membership.courseCatalogId || 'base';
        await classRepository.saveAccountClass(
          account.id,
          membership.classCode,
          {
            schemaVersion: 2,
            class: {
              id: membership.classId,
              name: membership.className,
              teacherName: membership.teacherName,
            },
            published: claimed.published,
          },
          catalogId,
          membership.courseName ?? '',
        );
        await syncCourse(account.id, catalogId);
        if (claimed.published) {
          try {
            await content.refreshClass(
              membership.classId,
              membership.classCode,
              account.externalKey,
              catalogId,
            );
          } catch {
            // La membresía ya quedó guardada; el contenido se sincroniza después.
          }
        }
        await refreshClasses();
        setInvitation(claimed);
        setPhase('accepted');
        return true;
      } catch (caught) {
        setError(invitationError(isInvitationError(caught)));
        setPhase('idle');
        return false;
      }
    },
    [account, content, classRepository, refreshClasses, syncCourse],
  );

  const claim = useCallback(
    async (raw: string) => {
      const parsed = extractInvitationToken(raw);
      if (!parsed) {
        setError('link');
        setPhase('idle');
        return false;
      }
      return claimToken(parsed);
    },
    [claimToken],
  );

  const retry = useCallback(async () => {
    if (!token) {
      return false;
    }
    return claimToken(token);
  }, [claimToken, token]);

  const canRetry =
    token !== null &&
    (error === 'network' ||
      error === 'config' ||
      error === 'full' ||
      error === 'already_member');

  return {
    preview,
    invitation,
    code,
    phase,
    error,
    canRetry,
    lookup,
    join,
    claim,
    retry,
    reset,
  };
}
