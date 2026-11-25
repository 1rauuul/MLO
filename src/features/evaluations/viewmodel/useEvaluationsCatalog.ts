import type { EvaluationSummary } from '@/features/evaluations/model/evaluationRepository';
import { useCourses } from '@/features/modules/viewmodel/useCourses';
import { useAsyncResource } from '@/shared/hooks/useAsyncResource';
import { useRepositories } from '@/shared/services/data/DataProvider';

interface EvaluationsCatalogResult {
  summaries: EvaluationSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useEvaluationsCatalog(): EvaluationsCatalogResult {
  const { evaluations } = useRepositories();
  const { activeCatalogId } = useCourses();
  const resource = useAsyncResource(
    () => evaluations.selectEvaluationSummaries(activeCatalogId),
    `evaluations:${activeCatalogId}`,
    null,
    'No se pudo cargar las evaluaciones.',
  );

  return {
    summaries: resource.data ?? [],
    isLoading: resource.status === 'loading' || resource.status === 'idle',
    error: resource.error,
  };
}
