import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/shared/services/data/DataProvider';
import type { EvaluationResult } from '@/shared/model/entities';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useCourses } from '@/features/modules/viewmodel/useCourses';

interface RecentResultsResult {
  results: EvaluationResult[];
  averageScore: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRecentResults(limit = 5): RecentResultsResult {
  const { evaluations } = useRepositories();
  const { account } = useAuth();
  const { activeCatalogId } = useCourses();
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const loaded = account && activeCatalogId
        ? await evaluations.selectRecentEvaluationResults(
            account.id,
            limit,
            activeCatalogId,
          )
        : [];
      setResults(loaded);
      setError(null);
    } catch {
      setError('No se pudo cargar el historial.');
    } finally {
      setIsLoading(false);
    }
  }, [evaluations, account, limit, activeCatalogId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const averageScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((total, result) => total + result.score, 0) / results.length);

  return { results, averageScore, isLoading, error, refresh };
}
