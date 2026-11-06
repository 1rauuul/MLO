import { useEffect, useState } from 'react';

import { useRepositories } from '@/shared/services/data/DataProvider';
import type {
  Evaluation,
  Example,
  Exercise,
  Lesson,
  Topic,
  Unit,
} from '@/shared/model/entities';

import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';
import { useCatalog } from '@/features/modules/viewmodel/useCatalog';

interface TopicHubResult {
  topic: Topic | null;
  unit: Unit | null;
  lessons: Lesson[];
  examples: Example[];
  exercises: Exercise[];
  evaluations: Evaluation[];
  completed: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hub de subtema. Acepta un id de subtema o, por compatibilidad con enlaces
 * antiguos, un id de lección: en ese caso resuelve su `topicId` (o `t-<id>`).
 */
export function useLessonHub(
  topicId: string | null,
  catalogId: string = BASE_CATALOG_ID,
): TopicHubResult {
  const {
    lessons,
    examples: exampleRepository,
    exercises: exerciseRepository,
    evaluations,
  } = useRepositories();
  const { units, completionMap, refresh } = useCatalog(catalogId);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lessonsByTopic, setLessonsByTopic] = useState<Lesson[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [evaluationsByTopic, setEvaluationsByTopic] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) {
      setTopic(null);
      setLessonsByTopic([]);
      setExamples([]);
      setExercises([]);
      setEvaluationsByTopic([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        let loadedTopic = await lessons.selectTopic(topicId, catalogId);
        if (!loadedTopic) {
          const legacyLesson = await lessons.selectLesson(topicId, catalogId);
          const resolvedId = legacyLesson?.topicId ?? (legacyLesson ? `t-${legacyLesson.id}` : null);
          if (resolvedId) {
            loadedTopic = await lessons.selectTopic(resolvedId, catalogId);
          }
        }
        if (!loadedTopic) {
          if (active) {
            setTopic(null);
            setLessonsByTopic([]);
            setExamples([]);
            setExercises([]);
            setEvaluationsByTopic([]);
          }
          return;
        }
        const [loadedLessons, loadedExamples, loadedExercises, loadedEvaluations] =
          await Promise.all([
            lessons.selectLessonsByTopic(loadedTopic.id, catalogId),
            exampleRepository.selectExamplesByTopic(loadedTopic.id, catalogId),
            exerciseRepository.selectExercisesByTopic(loadedTopic.id, catalogId),
            evaluations.selectEvaluationsByTopic(loadedTopic.id, catalogId),
          ]);
        if (!active) {
          return;
        }
        setTopic(loadedTopic);
        setLessonsByTopic(loadedLessons);
        setExamples(loadedExamples);
        setExercises(loadedExercises);
        setEvaluationsByTopic(loadedEvaluations);
      } catch {
        if (active) {
          setError('No se pudo cargar el subtema.');
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
    topicId,
    catalogId,
  ]);

  const unit = units.find(item => item.id === topic?.unitId) ?? null;
  const completed =
    lessonsByTopic.length > 0 &&
    lessonsByTopic.every(lesson => !!completionMap[lesson.id]);

  return {
    topic,
    unit,
    lessons: lessonsByTopic,
    examples,
    exercises,
    evaluations: evaluationsByTopic,
    completed,
    isLoading,
    error,
    refresh,
  };
}
