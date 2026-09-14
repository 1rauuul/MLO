import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { selectExamplesByLesson } from '@/data/repositories/exampleRepository';
import { selectLesson } from '@/data/repositories/lessonRepository';
import type { Example, Lesson } from '@/models/entities';

interface UseLessonContentResult {
  lesson: Lesson | null;
  examples: Example[];
  isLoading: boolean;
}

export function useLessonContent(lessonId: string | null): UseLessonContentResult {
  const db = useSQLiteContext();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setExamples([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    (async () => {
      const [loadedLesson, loadedExamples] = await Promise.all([
        selectLesson(db, lessonId),
        selectExamplesByLesson(db, lessonId),
      ]);
      if (!active) {
        return;
      }
      setLesson(loadedLesson);
      setExamples(loadedExamples);
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [db, lessonId]);

  return { lesson, examples, isLoading };
}
