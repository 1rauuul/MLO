import { useEffect, useState } from 'react';

import { useActiveCatalog } from '@/features/groups/viewmodel/useActiveCatalog';
import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Example, Lesson } from '@/shared/model/entities';

interface UseLessonContentResult {
  lesson: Lesson | null;
  examples: Example[];
  isLoading: boolean;
  error: string | null;
}

export function useLessonContent(lessonId: string | null): UseLessonContentResult {
  const { lessons, examples: exampleRepository } = useRepositories();
  const { catalogId, isLoading: catalogLoading } = useActiveCatalog();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setExamples([]);
      setIsLoading(false);
      return;
    }
    if (catalogLoading) {
      setIsLoading(true);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const [loadedLesson, loadedExamples] = await Promise.all([
          lessons.selectLesson(lessonId, catalogId),
          exampleRepository.selectExamplesByLesson(lessonId),
        ]);
        if (!active) {
          return;
        }
        setLesson(loadedLesson);
        setExamples(loadedExamples);
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
  }, [lessons, exampleRepository, lessonId, catalogId, catalogLoading]);

  return { lesson, examples, isLoading, error };
}
