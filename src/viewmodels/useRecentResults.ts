import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectRecentEvaluationResults } from '@/data/repositories/evaluationRepository';
import type { EvaluationResult } from '@/models/entities';

interface RecentResultsResult {
  results: EvaluationResult[];
  averageScore: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useRecentResults(limit = 5): RecentResultsResult {
  const db = useSQLiteContext();
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loaded = await selectRecentEvaluationResults(db, limit);
    setResults(loaded);
    setIsLoading(false);
  }, [db, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const averageScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((total, result) => total + result.score, 0) / results.length);

  return { results, averageScore, isLoading, refresh };
}
