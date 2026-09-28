import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectAttemptsByLesson } from '@/data/repositories/attemptRepository';
import type { Attempt } from '@/models/entities';

import { summarizeAttempts, type AttemptSummary } from './analyticsLogic';
import { useAuth } from './useAuth';

interface UseAttemptsResult {
  attempts: Attempt[];
  summary: AttemptSummary;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useAttempts(lessonId: string | null): UseAttemptsResult {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loaded = account && lessonId ? await selectAttemptsByLesson(db, account.id, lessonId) : [];
    setAttempts(loaded);
    setIsLoading(false);
  }, [db, account, lessonId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { attempts, summary: summarizeAttempts(attempts), isLoading, refresh };
}
