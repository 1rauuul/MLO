export const PROGRESS_BACKUP_VERSION = 1;

export interface ProgressBackup {
  version: 1;
  exportedAt: string;
  moduleProgress: {
    lessonId: string;
    completed: boolean;
    updatedAt: string;
  }[];
  attempts: {
    source: 'practice' | 'evaluation';
    itemId: string;
    itemType: string;
    lessonId: string;
    correct: boolean;
    createdAt: string;
  }[];
  evaluationResults: {
    evaluationId: string;
    score: number;
    correctCount: number;
    totalCount: number;
    createdAt: string;
  }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function parseProgressBackup(raw: string): ProgressBackup {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== PROGRESS_BACKUP_VERSION) {
    throw new Error('Formato de respaldo no compatible.');
  }

  const moduleProgress = value.moduleProgress;
  const attempts = value.attempts;
  const evaluationResults = value.evaluationResults;
  if (
    !isString(value.exportedAt) ||
    !Array.isArray(moduleProgress) ||
    !Array.isArray(attempts) ||
    !Array.isArray(evaluationResults)
  ) {
    throw new Error('El respaldo está incompleto.');
  }

  if (
    !moduleProgress.every(
      item =>
        isRecord(item) &&
        isString(item.lessonId) &&
        isBoolean(item.completed) &&
        isString(item.updatedAt),
    )
  ) {
    throw new Error('El progreso del respaldo no es válido.');
  }

  if (
    !attempts.every(
      item =>
        isRecord(item) &&
        (item.source === 'practice' || item.source === 'evaluation') &&
        isString(item.itemId) &&
        isString(item.itemType) &&
        isString(item.lessonId) &&
        isBoolean(item.correct) &&
        isString(item.createdAt),
    )
  ) {
    throw new Error('Los intentos del respaldo no son válidos.');
  }

  if (
    !evaluationResults.every(
      item =>
        isRecord(item) &&
        isString(item.evaluationId) &&
        isNumber(item.score) &&
        isNumber(item.correctCount) &&
        isNumber(item.totalCount) &&
        isString(item.createdAt),
    )
  ) {
    throw new Error('Los resultados del respaldo no son válidos.');
  }

  return value as unknown as ProgressBackup;
}
