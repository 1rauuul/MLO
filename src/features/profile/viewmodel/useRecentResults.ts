import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectRecentEvaluationResults } from '@/features/evaluations/model/evaluationRepository';
import type { EvaluationResult } from '@/shared/model/entities';

import { useAuth } from '@/features/auth/viewmodel/useAuth';

interface RecentResultsResult {
  results: EvaluationResult[];
  averageScore: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRecentResults(limit = 5): RecentResultsResult {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const loaded = account ? await selectRecentEvaluationResults(db, account.id, limit) : [];
      setResults(loaded);
      setError(null);
    } catch {
      setError('No se pudo cargar el historial.');
    } finally {
      setIsLoading(false);
    }
  }, [db, account, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const averageScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((total, result) => total + result.score, 0) / results.length);

  return { results, averageScore, isLoading, error, refresh };
}
