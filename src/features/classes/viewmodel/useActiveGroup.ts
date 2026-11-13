import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useRepositories } from '@/shared/services/data/DataProvider';

/** Grupo activo de la cuenta para un curso; `null` si no hay membresía vigente. */
export function useActiveGroup(catalogId = 'base'): string | null {
  const { classes } = useRepositories();
  const { account } = useAuth();
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!account) {
      setGroupId(null);
      return;
    }
    let active = true;
    classes
      .selectActiveGroup(account.id, catalogId)
      .then(id => {
        if (active) setGroupId(id);
      })
      .catch(() => {
        if (active) setGroupId(null);
      });
    return () => {
      active = false;
    };
  }, [classes, account, catalogId]);

  return groupId;
}

/** Catálogo de la lección; una clase puede vivir en un curso distinto de base. */
export function useLessonCatalogId(lessonId: string | null): string {
  const { lessons } = useRepositories();
  const [catalogId, setCatalogId] = useState('base');

  useEffect(() => {
    if (!lessonId) {
      setCatalogId('base');
      return;
    }
    let active = true;
    lessons
      .selectLessonCatalogId(lessonId)
      .then(id => {
        if (active) setCatalogId(id);
      })
      .catch(() => {
        if (active) setCatalogId('base');
      });
    return () => {
      active = false;
    };
  }, [lessons, lessonId]);

  return catalogId;
}

/** Atajo para los motores de actividades, que solo conocen el id de la lección. */
export function useActiveGroupForLesson(lessonId: string | null): string | null {
  return useActiveGroup(useLessonCatalogId(lessonId));
}
