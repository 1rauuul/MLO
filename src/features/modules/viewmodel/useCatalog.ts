import { useCallback, useEffect, useState } from 'react';

import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Lesson, Topic, Unit } from '@/shared/model/entities';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';

interface CatalogResult {
  units: Unit[];
  topics: Topic[];
  lessonsByUnit: Record<string, Lesson[]>;
  completionMap: Record<string, boolean>;
  activeGroupId: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCatalog(catalogId: string = BASE_CATALOG_ID): CatalogResult {
  const { lessons, progress, classes } = useRepositories();
  const { account } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({});
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!catalogId) {
      setUnits([]);
      setTopics([]);
      setLessonsByUnit({});
      setCompletionMap({});
      setActiveGroupId(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const groupId = account ? await classes.selectActiveGroup(account.id, catalogId) : null;
      const loadedUnits = await lessons.selectUnits(catalogId, groupId);
      const loadedTopics = await lessons.selectTopics(catalogId, groupId);
      const loadedLessons = await lessons.selectLessons(catalogId, groupId);
      const grouped: Record<string, Lesson[]> = {};
      for (const lesson of loadedLessons) {
        (grouped[lesson.unitId] ??= []).push(lesson);
      }
      const loadedCompletion = account
        ? await progress.selectCompletionMap(account.id, catalogId)
        : {};
      setUnits(loadedUnits);
      setTopics(loadedTopics);
      setLessonsByUnit(grouped);
      setCompletionMap(loadedCompletion);
      setActiveGroupId(groupId);
      setError(null);
    } catch {
      setError('No se pudo cargar el catálogo de unidades.');
    } finally {
      setIsLoading(false);
    }
  }, [lessons, progress, classes, account, catalogId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { units, topics, lessonsByUnit, completionMap, activeGroupId, isLoading, error, refresh };
}
