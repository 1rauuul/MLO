import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { selectEvaluationByLesson } from '@/data/repositories/evaluationRepository';
import { selectExercisesByLesson } from '@/data/repositories/exerciseRepository';
import { selectExamplesByLesson } from '@/data/repositories/exampleRepository';
import { selectLesson } from '@/data/repositories/lessonRepository';
import type { Evaluation, Example, Exercise, Lesson, Unit } from '@/models/entities';

import { useCatalog } from './useCatalog';
import { useModuleProgress } from './useModuleProgress';

interface LessonHubResult {
  lesson: Lesson | null;
  unit: Unit | null;
  examples: Example[];
  exercises: Exercise[];
  evaluation: Evaluation | null;
  completed: boolean;
  isLoading: boolean;
}

export function useLessonHub(lessonId: string | null): LessonHubResult {
  const db = useSQLiteContext();
  const { units } = useCatalog();
  const { progressMap } = useModuleProgress();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setExamples([]);
      setExercises([]);
      setEvaluation(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      const [loadedLesson, loadedExamples, loadedExercises, loadedEvaluation] = await Promise.all([
        selectLesson(db, lessonId),
        selectExamplesByLesson(db, lessonId),
        selectExercisesByLesson(db, lessonId),
        selectEvaluationByLesson(db, lessonId),
      ]);
      if (!active) {
        return;
      }
      setLesson(loadedLesson);
      setExamples(loadedExamples);
      setExercises(loadedExercises);
      setEvaluation(loadedEvaluation);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId]);

  const unit = units.find(item => item.id === lesson?.unitId) ?? null;

  return {
    lesson,
    unit,
    examples,
    exercises,
    evaluation,
    completed: lesson ? !!progressMap[lesson.id] : false,
    isLoading,
  };
}
