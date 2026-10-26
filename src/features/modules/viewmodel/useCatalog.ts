import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Lesson, Unit } from '@/shared/model/entities';

import { useAuth } from '@/features/auth/viewmodel/useAuth';

interface CatalogResult {
  units: Unit[];
  lessonsByUnit: Record<string, Lesson[]>;
  progressMap: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCatalog(): CatalogResult {
  const { lessons, progress } = useRepositories();
  const { account } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedUnits = await lessons.selectUnits();
      const loadedLessons = await lessons.selectLessons();
      const grouped: Record<string, Lesson[]> = {};
      for (const lesson of loadedLessons) {
        (grouped[lesson.unitId] ??= []).push(lesson);
      }
      const loadedProgress = account ? await progress.selectProgressMap(account.id) : {};
      setUnits(loadedUnits);
      setLessonsByUnit(grouped);
      setProgressMap(loadedProgress);
      setError(null);
    } catch {
      setError('No se pudo cargar el catálogo de unidades.');
    } finally {
      setIsLoading(false);
    }
  }, [lessons, progress, account]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { units, lessonsByUnit, progressMap, isLoading, error, refresh };
}
