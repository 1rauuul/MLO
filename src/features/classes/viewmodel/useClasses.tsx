import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import type { AccountClass } from '@/shared/model/entities';
import { useRepositories } from '@/shared/services/data/DataProvider';

interface ClassesContextValue {
  classes: AccountClass[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  leaveClass: (klass: AccountClass) => Promise<void>;
}

const ClassesContext = createContext<ClassesContextValue | null>(null);

export function ClassesProvider({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const { classes: classRepository, content } = useRepositories();
  const [classes, setClasses] = useState<AccountClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!account) {
      setClasses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setClasses(await classRepository.selectAccountClasses(account.id));
    } finally {
      setIsLoading(false);
    }
  }, [account, classRepository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const leaveClass = useCallback(
    async (klass: AccountClass) => {
      if (!account) {
        return;
      }
      await content.leaveClass(klass.classCode, account.externalKey);
      await classRepository.removeAccountClass(account.id, klass.classId);
      await refresh();
    },
    [account, classRepository, content, refresh],
  );

  const value = useMemo<ClassesContextValue>(
    () => ({ classes, isLoading, refresh, leaveClass }),
    [classes, isLoading, refresh, leaveClass],
  );

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
}

export function useClasses(): ClassesContextValue {
  const context = useContext(ClassesContext);
  if (!context) {
    throw new Error('useClasses debe usarse dentro de ClassesProvider');
  }
  return context;
}
