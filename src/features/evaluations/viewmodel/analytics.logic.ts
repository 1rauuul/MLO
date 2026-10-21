import type { Attempt } from '@/shared/model/entities';
import { ACTIVITY_TYPES } from '@/shared/model/entities';

export interface AttemptSummary {
  total: number;
  correct: number;
  accuracy: number;
  byType: Record<string, { total: number; correct: number }>;
  byTopic?: Record<string, { total: number; correct: number }>;
}

export function summarizeAttempts(
  attempts: Attempt[],
  topicById: Record<string, string> = {},
): AttemptSummary {
  const byType: AttemptSummary['byType'] = {};
  const byTopic: AttemptSummary['byTopic'] = {};
  let correct = 0;
  let total = 0;
  for (const attempt of attempts) {
    if (!ACTIVITY_TYPES.includes(attempt.itemType)) {
      continue;
    }
    const bucket = byType[attempt.itemType] ?? { total: 0, correct: 0 };
    bucket.total += 1;
    total += 1;
    if (attempt.correct) {
      bucket.correct += 1;
      correct += 1;
    }
    byType[attempt.itemType] = bucket;

    const topic = topicById[attempt.itemId];
    if (topic) {
      const topicBucket = byTopic[topic] ?? { total: 0, correct: 0 };
      topicBucket.total += 1;
      if (attempt.correct) {
        topicBucket.correct += 1;
      }
      byTopic[topic] = topicBucket;
    }
  }
  return { total, correct, accuracy: total === 0 ? 1 : correct / total, byType, byTopic };
}

export function weakTypes(summary: AttemptSummary, threshold = 3): string[] {
  return Object.entries(summary.byType)
    .filter(([, bucket]) => bucket.total - bucket.correct >= threshold)
    .map(([type]) => type);
}

export function weakTopics(summary: AttemptSummary, threshold = 2): string[] {
  return Object.entries(summary.byTopic ?? {})
    .filter(([, bucket]) => bucket.total - bucket.correct >= threshold)
    .map(([topic]) => topic);
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
