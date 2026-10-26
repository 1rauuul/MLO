import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/shared/services/data/DataProvider';

import { useAuth } from '@/features/auth/viewmodel/useAuth';

interface ModuleProgressResult {
  progressMap: Record<string, boolean>;
  completed: number;
  total: number;
  error: string | null;
  markCompleted: (lessonId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useModuleProgress(unitId?: string): ModuleProgressResult {
  const { progress } = useRepositories();
  const { account } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!account) {
      setProgressMap({});
      setCompleted(0);
      setTotal(0);
      return;
    }
    try {
      setProgressMap(await progress.selectProgressMap(account.id));
      if (unitId) {
        const stats = await progress.countCompletedByUnit(account.id, unitId);
        setCompleted(stats.completed);
        setTotal(stats.total);
      }
      setError(null);
    } catch {
      setError('No se pudo cargar el progreso.');
    }
  }, [progress, account, unitId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markCompleted = useCallback(
    async (lessonId: string) => {
      if (!account) {
        return;
      }
      try {
        await progress.markLessonCompleted(account.id, lessonId);
        await refresh();
      } catch {
        setError('No se pudo guardar el progreso.');
      }
    },
    [progress, account, refresh],
  );

  return { progressMap, completed, total, error, markCompleted, refresh };
}
