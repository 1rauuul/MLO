import type { Attempt } from '@/models/entities';

export interface AttemptSummary {
  total: number;
  correct: number;
  accuracy: number;
  byType: Record<string, { total: number; correct: number }>;
}

export function summarizeAttempts(attempts: Attempt[]): AttemptSummary {
  const byType: AttemptSummary['byType'] = {};
  let correct = 0;
  for (const attempt of attempts) {
    const bucket = byType[attempt.itemType] ?? { total: 0, correct: 0 };
    bucket.total += 1;
    if (attempt.correct) {
      bucket.correct += 1;
      correct += 1;
    }
    byType[attempt.itemType] = bucket;
  }
  const total = attempts.length;
  return { total, correct, accuracy: total === 0 ? 1 : correct / total, byType };
}

export function weakTypes(summary: AttemptSummary, threshold = 3): string[] {
  return Object.entries(summary.byType)
    .filter(([, bucket]) => bucket.total - bucket.correct >= threshold)
    .map(([type]) => type);
}

export function recommendReview(
  summary: AttemptSummary,
  accuracyThreshold = 0.6,
): 'lesson' | 'practice' | 'none' {
  if (summary.total === 0) {
    return 'none';
  }
  if (summary.accuracy < accuracyThreshold) {
    return 'lesson';
  }
  if (weakTypes(summary).length > 0) {
    return 'practice';
  }
  return 'none';
}
