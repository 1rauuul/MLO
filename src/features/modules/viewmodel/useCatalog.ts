import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Lesson, Unit } from '@/shared/model/entities';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';

interface CatalogResult {
  units: Unit[];
  lessonsByUnit: Record<string, Lesson[]>;
  completionMap: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCatalog(catalogId: string = BASE_CATALOG_ID): CatalogResult {
  const { lessons, progress } = useRepositories();
  const { account } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!catalogId) {
      setUnits([]);
      setLessonsByUnit({});
      setCompletionMap({});
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const loadedUnits = await lessons.selectUnits(catalogId);
      const loadedLessons = await lessons.selectLessons(catalogId);
      const grouped: Record<string, Lesson[]> = {};
      for (const lesson of loadedLessons) {
        (grouped[lesson.unitId] ??= []).push(lesson);
      }
      const loadedCompletion = account
        ? await progress.selectCompletionMap(account.id, catalogId)
        : {};
      setUnits(loadedUnits);
      setLessonsByUnit(grouped);
      setCompletionMap(loadedCompletion);
      setError(null);
    } catch {
      setError('No se pudo cargar el catálogo de unidades.');
    } finally {
      setIsLoading(false);
    }
  }, [lessons, progress, account, catalogId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { units, lessonsByUnit, completionMap, isLoading, error, refresh };
}
