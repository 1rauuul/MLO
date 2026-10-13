import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import {
  selectEvaluationSummaries,
  type EvaluationSummary,
} from '@/features/evaluations/model/evaluationRepository';

interface EvaluationsCatalogResult {
  summaries: EvaluationSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useEvaluationsCatalog(): EvaluationsCatalogResult {
  const db = useSQLiteContext();
  const [summaries, setSummaries] = useState<EvaluationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loaded = await selectEvaluationSummaries(db);
        if (!active) {
          return;
        }
        setSummaries(loaded);
      } catch {
        if (active) {
          setError('No se pudo cargar las evaluaciones.');
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
  }, [db]);

  return { summaries, isLoading, error };
}
