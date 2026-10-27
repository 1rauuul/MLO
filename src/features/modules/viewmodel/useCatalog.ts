import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Lesson, Unit } from '@/shared/model/entities';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useActiveCatalog } from '@/features/groups/viewmodel/useActiveCatalog';

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
  const { catalogId, isLoading: catalogLoading } = useActiveCatalog();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    if (catalogLoading) {
      return;
    }
    try {
      const loadedUnits = await lessons.selectUnits(catalogId);
      const loadedLessons = await lessons.selectLessons(catalogId);
      const grouped: Record<string, Lesson[]> = {};
      for (const lesson of loadedLessons) {
        (grouped[lesson.unitId] ??= []).push(lesson);
      }
      const loadedProgress = account
        ? await progress.selectProgressMap(account.id, catalogId)
        : {};
      setUnits(loadedUnits);
      setLessonsByUnit(grouped);
      setProgressMap(loadedProgress);
      setError(null);
    } catch {
      setError('No se pudo cargar el catálogo de unidades.');
    } finally {
      setIsLoading(false);
    }
  }, [lessons, progress, account, catalogId, catalogLoading]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { units, lessonsByUnit, progressMap, isLoading, error, refresh };
}
