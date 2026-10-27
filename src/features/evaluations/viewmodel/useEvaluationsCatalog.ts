import type { EvaluationSummary } from '@/features/evaluations/model/evaluationRepository';
import { useActiveCatalog } from '@/features/groups/viewmodel/useActiveCatalog';
import { useAsyncResource } from '@/shared/hooks/useAsyncResource';
import { useRepositories } from '@/shared/services/data/DataProvider';

interface EvaluationsCatalogResult {
  summaries: EvaluationSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useEvaluationsCatalog(): EvaluationsCatalogResult {
  const { evaluations } = useRepositories();
  const { catalogId, isLoading: catalogLoading } = useActiveCatalog();
  const resource = useAsyncResource(
    () => (catalogLoading ? Promise.resolve([]) : evaluations.selectEvaluationSummaries(catalogId)),
    `evaluations:${catalogLoading ? 'loading' : catalogId}`,
    null,
    'No se pudo cargar las evaluaciones.',
  );

  return {
    summaries: resource.data ?? [],
    isLoading: catalogLoading || resource.status === 'loading' || resource.status === 'idle',
    error: resource.error,
  };
}
