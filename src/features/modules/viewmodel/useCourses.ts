import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';
import type { RemoteCourse } from '@/features/modules/model/courseRepository';
import { useRepositories } from '@/shared/services/data/DataProvider';
import { isHybrid } from '@/shared/services/data/dataMode';

export interface CoursesResult {
  courses: RemoteCourse[];
  activeCatalogId: string;
  selectCourse: (catalogId: string) => Promise<void>;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useCourses(): CoursesResult {
  const { courses: repository } = useRepositories();
  const { account } = useAuth();
  const [courses, setCourses] = useState<RemoteCourse[]>([]);
  const [activeCatalogId, setActiveCatalogId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await repository.loadAccountCourses(account?.id);
      setCourses(result.courses);
      setActiveCatalogId(result.activeCatalogId);
      setError(null);
    } catch {
      setError('No se pudieron cargar los cursos.');
    } finally {
      setIsLoading(false);
    }
  }, [repository, account]);

  const refresh = useCallback(async () => {
    if (isHybrid()) {
      try {
        await repository.refreshCourseList();
      } catch {
        // Sin red se conserva la lista y el curso activo ya guardados.
      }
    }
    await load();
  }, [repository, load]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectCourse = useCallback(
    async (catalogId: string) => {
      const changed = account
        ? await repository.selectCourse(account.id, catalogId)
        : catalogId === BASE_CATALOG_ID;
      if (changed) {
        try {
          await repository.applyStoredContent(catalogId);
        } catch {
          // La selección se mantiene; el release se reintenta en el próximo arranque.
        }
        setActiveCatalogId(catalogId);
      }
    },
    [repository, account],
  );

  return { courses, activeCatalogId, selectCourse, refresh, isLoading, error };
}
