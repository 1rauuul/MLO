import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';
import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Example, Lesson, LessonClassExtra } from '@/shared/model/entities';

interface UseLessonContentResult {
  lesson: Lesson | null;
  examples: Example[];
  lessonExtras: LessonClassExtra[];
  isLoading: boolean;
  error: string | null;
}

export function useLessonContent(lessonId: string | null): UseLessonContentResult {
  const { lessons, examples: exampleRepository, classes } = useRepositories();
  const { account } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [lessonExtras, setLessonExtras] = useState<LessonClassExtra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setExamples([]);
      setLessonExtras([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const [loadedLesson, loadedExamples, loadedExtras] = await Promise.all([
          lessons.selectLesson(lessonId, BASE_CATALOG_ID),
          exampleRepository.selectExamplesByLesson(lessonId),
          account ? classes.selectLessonExtras(account.id, lessonId) : Promise.resolve([]),
        ]);
        if (!active) {
          return;
        }
        setLesson(loadedLesson);
        setExamples(loadedExamples);
        setLessonExtras(loadedExtras);
      } catch {
        if (active) {
          setError('No se pudo cargar la lección.');
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
  }, [lessons, exampleRepository, classes, account, lessonId]);

  return { lesson, examples, lessonExtras, isLoading, error };
}
