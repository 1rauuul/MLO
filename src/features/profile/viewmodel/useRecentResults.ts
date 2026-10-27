import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/shared/services/data/DataProvider';
import type { EvaluationResult } from '@/shared/model/entities';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useActiveCatalog } from '@/features/groups/viewmodel/useActiveCatalog';

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
  const { catalogId, isLoading: catalogLoading } = useActiveCatalog();
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (catalogLoading) {
      setIsLoading(true);
      return;
    }
    try {
      const loaded = account
        ? await evaluations.selectRecentEvaluationResults(account.id, limit, catalogId)
        : [];
      setResults(loaded);
      setError(null);
    } catch {
      setError('No se pudo cargar el historial.');
    } finally {
      setIsLoading(false);
    }
  }, [evaluations, account, limit, catalogId, catalogLoading]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const averageScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((total, result) => total + result.score, 0) / results.length);

  return { results, averageScore, isLoading, error, refresh };
}
