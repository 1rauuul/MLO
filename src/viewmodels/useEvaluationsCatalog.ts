import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import {
  selectEvaluationSummaries,
  type EvaluationSummary,
} from '@/data/repositories/evaluationRepository';

interface EvaluationsCatalogResult {
  summaries: EvaluationSummary[];
  isLoading: boolean;
}

export function useEvaluationsCatalog(): EvaluationsCatalogResult {
  const db = useSQLiteContext();
  const [summaries, setSummaries] = useState<EvaluationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const loaded = await selectEvaluationSummaries(db);
      if (!active) {
        return;
      }
      setSummaries(loaded);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db]);

  return { summaries, isLoading };
}
