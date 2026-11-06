import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useRepositories } from '@/shared/services/data/DataProvider';

/** Grupo activo de la cuenta para un curso; `null` si no hay membresía vigente. */
export function useActiveGroup(catalogId = 'base'): string | null {
  const { classes } = useRepositories();
  const { account } = useAuth();
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!account) {
      setGroupId(null);
      return;
    }
    let active = true;
    classes
      .selectActiveGroup(account.id, catalogId)
      .then(id => {
        if (active) setGroupId(id);
      })
      .catch(() => {
        if (active) setGroupId(null);
      });
    return () => {
      active = false;
    };
  }, [classes, account, catalogId]);

  return groupId;
}
