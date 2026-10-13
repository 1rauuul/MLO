import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { selectExamplesByLesson } from '@/features/examples/model/exampleRepository';
import { selectLesson } from '@/features/modules/model/lessonRepository';
import type { Example, Lesson } from '@/shared/model/entities';

interface UseLessonContentResult {
  lesson: Lesson | null;
  examples: Example[];
  isLoading: boolean;
  error: string | null;
}

export function useLessonContent(lessonId: string | null): UseLessonContentResult {
  const db = useSQLiteContext();
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

    let active = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const [loadedLesson, loadedExamples] = await Promise.all([
          selectLesson(db, lessonId),
          selectExamplesByLesson(db, lessonId),
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
  }, [db, lessonId]);

  return { lesson, examples, isLoading, error };
}
