import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AccountGroup } from '@/features/groups/model/groupRepository';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useRepositories } from '@/shared/services/data/DataProvider';

export interface ActiveCatalog {
  catalogId: string;
  group: AccountGroup | null;
  isLoading: boolean;
  refresh: () => void;
}

const ActiveCatalogContext = createContext<ActiveCatalog | null>(null);

export function ActiveCatalogProvider({ children }: { children: ReactNode }) {
  const { groups } = useRepositories();
  const { account } = useAuth();
  const [group, setGroup] = useState<AccountGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    if (!account) {
      setGroup(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }
    setIsLoading(true);
    (async () => {
      try {
        const loaded = await groups.selectAccountGroup(account.id);
        if (active) {
          setGroup(loaded);
        }
      } catch {
        if (active) {
          setGroup(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [groups, account, version]);

  const refresh = useCallback(() => setVersion(current => current + 1), []);

  const value = useMemo<ActiveCatalog>(
    () => ({ catalogId: group?.catalogId ?? 'base', group, isLoading, refresh }),
    [group, isLoading, refresh],
  );

  return <ActiveCatalogContext.Provider value={value}>{children}</ActiveCatalogContext.Provider>;
}

export function useActiveCatalog(): ActiveCatalog {
  const context = useContext(ActiveCatalogContext);
  if (!context) {
    throw new Error('useActiveCatalog debe usarse dentro de ActiveCatalogProvider');
  }
  return context;
}
