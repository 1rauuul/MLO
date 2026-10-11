import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import {
  countCompletedByUnit,
  markLessonCompleted,
  selectProgressMap,
} from '@/data/repositories/progressRepository';

import { useAuth } from './useAuth';

interface ModuleProgressResult {
  progressMap: Record<string, boolean>;
  completed: number;
  total: number;
  error: string | null;
  markCompleted: (lessonId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useModuleProgress(unitId?: string): ModuleProgressResult {
  const db = useSQLiteContext();
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
      setProgressMap(await selectProgressMap(db, account.id));
      if (unitId) {
        const stats = await countCompletedByUnit(db, account.id, unitId);
        setCompleted(stats.completed);
        setTotal(stats.total);
      }
      setError(null);
    } catch {
      setError('No se pudo cargar el progreso.');
    }
  }, [db, account, unitId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markCompleted = useCallback(
    async (lessonId: string) => {
      if (!account) {
        return;
      }
      try {
        await markLessonCompleted(db, account.id, lessonId);
        await refresh();
      } catch {
        setError('No se pudo guardar el progreso.');
      }
    },
    [db, account, refresh],
  );

  return { progressMap, completed, total, error, markCompleted, refresh };
}
