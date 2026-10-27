import { useEffect, useState } from 'react';

import { useActiveCatalog } from '@/features/groups/viewmodel/useActiveCatalog';
import { useRepositories } from '@/shared/services/data/DataProvider';
import type { Evaluation, Example, Exercise, Lesson, Unit } from '@/shared/model/entities';

import { useCatalog } from '@/features/modules/viewmodel/useCatalog';
import { useModuleProgress } from '@/features/modules/viewmodel/useModuleProgress';

interface LessonHubResult {
  lesson: Lesson | null;
  unit: Unit | null;
  examples: Example[];
  exercises: Exercise[];
  evaluation: Evaluation | null;
  completed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useLessonHub(lessonId: string | null): LessonHubResult {
  const { lessons, examples: exampleRepository, exercises: exerciseRepository, evaluations } =
    useRepositories();
  const { units } = useCatalog();
  const { progressMap } = useModuleProgress();
  const { catalogId, isLoading: catalogLoading } = useActiveCatalog();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setExamples([]);
      setExercises([]);
      setEvaluation(null);
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
        const [loadedLesson, loadedExamples, loadedExercises, loadedEvaluation] =
          await Promise.all([
            lessons.selectLesson(lessonId, catalogId),
            exampleRepository.selectExamplesByLesson(lessonId),
            exerciseRepository.selectExercisesByLesson(lessonId),
            evaluations.selectEvaluationByLesson(lessonId),
          ]);
        if (!active) {
          return;
        }
        setLesson(loadedLesson);
        setExamples(loadedExamples);
        setExercises(loadedExercises);
        setEvaluation(loadedEvaluation);
      } catch {
        if (active) {
          setError('No se pudo cargar el tema.');
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
  }, [
    lessons,
    exampleRepository,
    exerciseRepository,
    evaluations,
    lessonId,
    catalogId,
    catalogLoading,
  ]);

  const unit = units.find(item => item.id === lesson?.unitId) ?? null;

  return {
    lesson,
    unit,
    examples,
    exercises,
    evaluation,
    completed: lesson ? !!progressMap[lesson.id] : false,
    isLoading,
    error,
  };
}
