import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useActiveCatalog } from '@/features/groups/viewmodel/useActiveCatalog';
import { useRepositories } from '@/shared/services/data/DataProvider';
import {
  canonicalGroupCode,
  isContentError,
  isGroupError,
  type GroupInfo,
} from '@/shared/services/content/remoteContent';

export type JoinError =
  | 'code'
  | 'not_found'
  | 'closed'
  | 'rate_limited'
  | 'content_missing'
  | 'config'
  | 'network'
  | 'invalid'
  | 'incomplete'
  | 'no_account'
  | null;

export type JoinPhase = 'idle' | 'looking' | 'confirm' | 'joining';

export function normalizeGroupCode(raw: string): string {
  return canonicalGroupCode(raw);
}

export function useJoinGroup() {
  const { content, groups, locations } = useRepositories();
  const { account } = useAuth();
  const { refresh: refreshActiveCatalog } = useActiveCatalog();
  const [preview, setPreview] = useState<GroupInfo | null>(null);
  const [phase, setPhase] = useState<JoinPhase>('idle');
  const [error, setError] = useState<JoinError>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setPhase('idle');
    setError(null);
  }, []);

  const lookup = useCallback(
    async (raw: string) => {
      const code = normalizeGroupCode(raw);
      if (code.length !== 6) {
        setError('code');
        return;
      }
      setError(null);
      setPreview(null);
      setPhase('looking');
      try {
        const found = await content.fetchGroup(code);
        setPreview(found);
        setPhase('confirm');
      } catch (caught) {
        setError(isGroupError(caught));
        setPhase('idle');
      }
    },
    [content],
  );

  const join = useCallback(async () => {
    if (!account) {
      setError('no_account');
      return false;
    }
    if (!preview) {
      return false;
    }
    setError(null);
    setPhase('joining');
    try {
      await content.refreshCatalog(preview.catalog.id, true);
      const { failed } = await content.applyStagedContent(preview.catalog.id);
      if (failed.length > 0) {
        setError('incomplete');
        setPhase('confirm');
        return false;
      }
      await groups.saveAccountGroup(account.id, {
        groupId: preview.group.id,
        groupCode: preview.code,
        groupName: preview.group.name,
        teacherName: preview.group.teacherName,
        catalogId: preview.catalog.id,
      });
      await locations.clearLocation(account.id);
      refreshActiveCatalog();
      setPhase('confirm');
      return true;
    } catch (caught) {
      setError(isContentError(caught));
      setPhase('confirm');
      return false;
    }
  }, [account, content, groups, locations, preview, refreshActiveCatalog]);

  return { preview, phase, error, lookup, join, reset };
}
