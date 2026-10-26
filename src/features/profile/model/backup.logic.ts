import type { ExampleState } from '@/features/exercises/model/exampleStateRepository';

import { isBoolean, isNumber, isRecord, isString, isStringOrNull } from '@/shared/utils/validate';

export const PROGRESS_BACKUP_VERSION = 2;

export interface BackupAttempt {
  source: 'practice' | 'evaluation';
  itemId: string;
  itemType: string;
  lessonId: string;
  correct: boolean;
  scoreCorrect: number;
  scoreTotal: number;
  createdAt: string;
}

export interface BackupExampleState {
  lessonId: string;
  payload: ExampleState;
  updatedAt: string;
}

export interface BackupLastLocation {
  unitId: string | null;
  lessonId: string | null;
  lessonCode: string | null;
  section: string | null;
  updatedAt: string;
}

export interface ProgressBackup {
  version: 2;
  exportedAt: string;
  moduleProgress: {
    lessonId: string;
    completed: boolean;
    updatedAt: string;
  }[];
  attempts: BackupAttempt[];
  evaluationResults: {
    evaluationId: string;
    score: number;
    correctCount: number;
    totalCount: number;
    createdAt: string;
  }[];
  exampleState: BackupExampleState[];
  lastLocation: BackupLastLocation | null;
}

function parseExampleState(value: unknown): ExampleState {
  if (
    !isRecord(value) ||
    !Array.isArray(value.drawExampleIds) ||
    !Array.isArray(value.drawExerciseIds) ||
    !Array.isArray(value.seenExampleIds) ||
    !isNumber(value.exampleIndex)
  ) {
    throw new Error('El estado de ejemplos del respaldo no es válido.');
  }
  return {
    drawExampleIds: value.drawExampleIds.filter(isString),
    drawExerciseIds: value.drawExerciseIds.filter(isString),
    seenExampleIds: value.seenExampleIds.filter(isString),
    exampleIndex: value.exampleIndex,
  };
}

function parseAttempt(value: unknown): BackupAttempt {
  if (
    !isRecord(value) ||
    (value.source !== 'practice' && value.source !== 'evaluation') ||
    !isString(value.itemId) ||
    !isString(value.itemType) ||
    !isString(value.lessonId) ||
    !isBoolean(value.correct) ||
    !isString(value.createdAt) ||
    (value.scoreCorrect !== undefined && !isNumber(value.scoreCorrect)) ||
    (value.scoreTotal !== undefined && !isNumber(value.scoreTotal))
  ) {
    throw new Error('Los intentos del respaldo no son válidos.');
  }
  return {
    source: value.source,
    itemId: value.itemId,
    itemType: value.itemType,
    lessonId: value.lessonId,
    correct: value.correct,
    scoreCorrect: isNumber(value.scoreCorrect) ? value.scoreCorrect : value.correct ? 1 : 0,
    scoreTotal: isNumber(value.scoreTotal) ? value.scoreTotal : 1,
    createdAt: value.createdAt,
  };
}

function parseLastLocation(value: unknown): BackupLastLocation | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (
    !isRecord(value) ||
    !isStringOrNull(value.unitId) ||
    !isStringOrNull(value.lessonId) ||
    !isStringOrNull(value.lessonCode) ||
    !isStringOrNull(value.section) ||
    !isString(value.updatedAt)
  ) {
    throw new Error('La ubicación del respaldo no es válida.');
  }
  return {
    unitId: value.unitId,
    lessonId: value.lessonId,
    lessonCode: value.lessonCode,
    section: value.section,
    updatedAt: value.updatedAt,
  };
}

export function parseProgressBackup(raw: string): ProgressBackup {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) {
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

  const isV2 = value.version === 2;
  const exampleState = isV2 ? value.exampleState : [];
  if (
    isV2 &&
    (!Array.isArray(exampleState) ||
      !exampleState.every(
        item =>
          isRecord(item) &&
          isString(item.lessonId) &&
          isString(item.updatedAt) &&
          isRecord(item.payload),
      ))
  ) {
    throw new Error('El estado de ejemplos del respaldo no es válido.');
  }

  return {
    version: PROGRESS_BACKUP_VERSION,
    exportedAt: value.exportedAt,
    moduleProgress: moduleProgress as ProgressBackup['moduleProgress'],
    attempts: attempts.map(parseAttempt),
    evaluationResults: evaluationResults as ProgressBackup['evaluationResults'],
    exampleState: (exampleState as BackupExampleState[]).map(item => ({
      lessonId: item.lessonId,
      payload: parseExampleState(item.payload),
      updatedAt: item.updatedAt,
    })),
    lastLocation: isV2 ? parseLastLocation(value.lastLocation) : null,
  };
}
