import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectLessonsByUnit, selectUnits } from '@/data/repositories/lessonRepository';
import { selectProgressMap } from '@/data/repositories/progressRepository';
import type { Lesson, Unit } from '@/models/entities';

import { useAuth } from './useAuth';

interface CatalogResult {
  units: Unit[];
  lessonsByUnit: Record<string, Lesson[]>;
  progressMap: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCatalog(): CatalogResult {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const loadedUnits = await selectUnits(db);
      const grouped: Record<string, Lesson[]> = {};
      for (const unit of loadedUnits) {
        grouped[unit.id] = await selectLessonsByUnit(db, unit.id);
      }
      const progress = account ? await selectProgressMap(db, account.id) : {};
      setUnits(loadedUnits);
      setLessonsByUnit(grouped);
      setProgressMap(progress);
      setError(null);
    } catch {
      setError('No se pudo cargar el catálogo de unidades.');
    } finally {
      setIsLoading(false);
    }
  }, [db, account]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { units, lessonsByUnit, progressMap, isLoading, error, refresh };
}
