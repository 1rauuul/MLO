import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { selectExample } from '@/data/repositories/exampleRepository';
import type { Example } from '@/models/entities';

interface UseExampleResult {
  example: Example | null;
  isLoading: boolean;
}

export function useExample(exampleId: string | null): UseExampleResult {
  const db = useSQLiteContext();
  const [example, setExample] = useState<Example | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!exampleId) {
      setExample(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      const loaded = await selectExample(db, exampleId);
      if (!active) {
        return;
      }
      setExample(loaded);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, exampleId]);

  return { example, isLoading };
}
