import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import {
  countCompletedByUnit,
  markLessonCompleted,
  selectProgressMap,
} from '@/data/repositories/progressRepository';

interface ModuleProgressResult {
  progressMap: Record<string, boolean>;
  completed: number;
  total: number;
  markCompleted: (lessonId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useModuleProgress(unitId?: string): ModuleProgressResult {
  const db = useSQLiteContext();
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    const map = await selectProgressMap(db);
    setProgressMap(map);
    if (unitId) {
      const stats = await countCompletedByUnit(db, unitId);
      setCompleted(stats.completed);
      setTotal(stats.total);
    }
  }, [db, unitId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markCompleted = useCallback(
    async (lessonId: string) => {
      await markLessonCompleted(db, lessonId);
      await refresh();
    },
    [db, refresh],
  );

  return { progressMap, completed, total, markCompleted, refresh };
}
