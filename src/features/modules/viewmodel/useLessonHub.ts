import { useCallback, useEffect, useState } from 'react';

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
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { computeTopicProgress, topicSection, type TopicProgress } from '@/features/modules/viewmodel/topicProgress.logic';

interface TopicHubResult {
  topic: Topic | null;
  unit: Unit | null;
  lessons: Lesson[];
  examples: Example[];
  exercises: Exercise[];
  evaluations: Evaluation[];
  completed: boolean;
  completionMap: Record<string, boolean>;
  progress: TopicProgress | null;
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
    attempts,
  } = useRepositories();
  const { account } = useAuth();
  const { units, completionMap, activeGroupId, refresh } = useCatalog(catalogId);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lessonsByTopic, setLessonsByTopic] = useState<Lesson[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [evaluationsByTopic, setEvaluationsByTopic] = useState<Evaluation[]>([]);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) {
      setTopic(null);
      setLessonsByTopic([]);
      setExamples([]);
      setExercises([]);
      setEvaluationsByTopic([]);
      setProgress(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        let loadedTopic = await lessons.selectTopic(topicId, catalogId, activeGroupId);
        if (!loadedTopic) {
          const legacyLesson = await lessons.selectLesson(topicId, catalogId, activeGroupId);
          const resolvedId = legacyLesson?.topicId ?? (legacyLesson ? `t-${legacyLesson.id}` : null);
          if (resolvedId) {
            loadedTopic = await lessons.selectTopic(resolvedId, catalogId, activeGroupId);
          }
        }
        if (!loadedTopic) {
          if (active) {
            setTopic(null);
            setLessonsByTopic([]);
            setExamples([]);
            setExercises([]);
            setEvaluationsByTopic([]);
            setProgress(null);
          }
          return;
        }
        const [loadedLessons, loadedExamples, loadedExercises, loadedEvaluations] =
          await Promise.all([
            lessons.selectLessonsByTopic(loadedTopic.id, catalogId, activeGroupId),
            exampleRepository.selectExamplesByTopic(loadedTopic.id, catalogId, activeGroupId),
            exerciseRepository.selectExercisesByTopic(loadedTopic.id, catalogId, activeGroupId),
            evaluations.selectEvaluationsByTopic(loadedTopic.id, catalogId, activeGroupId),
          ]);
        let loadedProgress: TopicProgress | null = null;
        if (account) {
          try {
            const [attemptGroups, evaluationScores] = await Promise.all([
              Promise.all(
                loadedLessons.map(lesson => attempts.selectAttemptsByLesson(account.id, lesson.id)),
              ),
              evaluations.selectEvaluationScoresByLesson(account.id),
            ]);
            loadedProgress = computeTopicProgress({
              lessonIds: loadedLessons.map(lesson => lesson.id),
              completionMap,
              exercises: loadedExercises,
              attempts: attemptGroups.flat(),
              evaluationScores,
            });
          } catch {
            // El avance es secundario: si falla, el subtema sigue disponible.
            loadedProgress = null;
          }
        }
        if (!active) {
          return;
        }
        setTopic(loadedTopic);
        setLessonsByTopic(loadedLessons);
        setExamples(loadedExamples);
        setExercises(loadedExercises);
        setEvaluationsByTopic(loadedEvaluations);
        setProgress(loadedProgress);
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
    attempts,
    account,
    topicId,
    catalogId,
    activeGroupId,
    completionMap,
  ]);

  const unit = units.find(item => item.id === topic?.unitId) ?? null;
  const completed =
    lessonsByTopic.length > 0 &&
    lessonsByTopic.every(lesson => !!completionMap[lesson.id]);
  const lessonsDone = lessonsByTopic.filter(lesson => !!completionMap[lesson.id]).length;

  return {
    topic,
    unit,
    lessons: lessonsByTopic,
    examples,
    exercises,
    evaluations: evaluationsByTopic,
    completed,
    completionMap,
    progress: progress
      ? { ...progress, lessons: topicSection(lessonsDone, lessonsByTopic.length) }
      : null,
    isLoading,
    error,
    refresh,
  };
}
