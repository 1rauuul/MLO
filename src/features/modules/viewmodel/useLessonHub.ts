import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';
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
  const { account } = useAuth();
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
    let active = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const [loadedLesson, loadedExamples, loadedExercises, loadedEvaluation] =
          await Promise.all([
            lessons.selectLesson(lessonId, BASE_CATALOG_ID),
            account
              ? exampleRepository.selectExamplesWithExtras(account.id, lessonId)
              : exampleRepository.selectExamplesByLesson(lessonId),
            account
              ? exerciseRepository.selectPracticeExercisesByLesson(account.id, lessonId)
              : exerciseRepository.selectExercisesByLesson(lessonId),
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
    account,
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
