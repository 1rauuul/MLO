import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  clearSession,
  insertAccount,
  saveSession,
  selectAccountById,
  selectAccountByUsername,
  selectSessionAccountId,
  updatePasswordHash,
} from '@/features/auth/model/accountRepository';
import {
  insertEvaluationResult,
  selectEvaluationByLesson,
  selectEvaluationSummaries,
  selectQuestions,
  selectRecentEvaluationResults,
} from '@/features/evaluations/model/evaluationRepository';
import { selectExamplesByLesson } from '@/features/examples/model/exampleRepository';
import { insertAttempt, selectAttemptsByLesson } from '@/features/exercises/model/attemptRepository';
import { applyStagedContent } from '@/shared/services/content/remote/applyStagedContent';
import { fetchGroup, refreshCatalog } from '@/shared/services/content/remoteContent';
import { http } from '@/shared/services/http/client';
import {
  saveExampleState,
  selectExampleState,
} from '@/features/exercises/model/exampleStateRepository';
import { selectExercisesByLesson } from '@/features/exercises/model/exerciseRepository';
import {
  clearAccountGroup,
  saveAccountGroup,
  selectAccountGroup,
  selectActiveCatalogId,
} from '@/features/groups/model/groupRepository';
import {
  selectLesson,
  selectLessons,
  selectUnits,
} from '@/features/modules/model/lessonRepository';
import {
  clearLocation,
  saveLocation,
  selectLocation,
} from '@/features/modules/model/locationRepository';
import {
  countCompletedByUnit,
  markLessonCompleted,
  resetAccountProgress,
  selectProgressMap,
} from '@/features/modules/model/progressRepository';
import {
  replaceProgressFromBackup,
  selectProgressBackup,
} from '@/features/profile/model/backupRepository';
import {
  createDefaultProfile,
  saveProfile,
  selectProfile,
} from '@/features/profile/model/profileRepository';

/**
 * Puertos de datos por feature. Los ViewModels consumen este objeto en vez de
 * `expo-sqlite`, así un adaptador remoto puede sustituir al SQLite local.
 */
export function createRepositories(db: SQLiteDatabase) {
  return {
    accounts: {
      insertAccount: (input: Parameters<typeof insertAccount>[1]) => insertAccount(db, input),
      selectAccountByUsername: (username: string) => selectAccountByUsername(db, username),
      selectAccountById: (id: number) => selectAccountById(db, id),
      selectSessionAccountId: () => selectSessionAccountId(db),
      saveSession: (accountId: number) => saveSession(db, accountId),
      updatePasswordHash: (accountId: number, passwordHash: string, salt: string) =>
        updatePasswordHash(db, accountId, passwordHash, salt),
      clearSession: () => clearSession(db),
    },
    evaluations: {
      selectEvaluationByLesson: (lessonId: string) => selectEvaluationByLesson(db, lessonId),
      selectQuestions: (evaluationId: string) => selectQuestions(db, evaluationId),
      insertEvaluationResult: (
        accountId: number,
        evaluationId: string,
        score: number,
        correctCount: number,
        totalCount: number,
      ) => insertEvaluationResult(db, accountId, evaluationId, score, correctCount, totalCount),
      selectRecentEvaluationResults: (accountId: number, limit?: number, catalogId?: string) =>
        selectRecentEvaluationResults(db, accountId, limit, catalogId),
      selectEvaluationSummaries: (catalogId?: string) =>
        selectEvaluationSummaries(db, catalogId),
    },
    examples: {
      selectExamplesByLesson: (lessonId: string) => selectExamplesByLesson(db, lessonId),
    },
    exercises: {
      selectExercisesByLesson: (lessonId: string) => selectExercisesByLesson(db, lessonId),
    },
    attempts: {
      insertAttempt: (
        accountId: number,
        source: 'practice' | 'evaluation',
        itemId: string,
        itemType: Parameters<typeof insertAttempt>[4],
        lessonId: string,
        correct: boolean,
        score?: Parameters<typeof insertAttempt>[7],
      ) => insertAttempt(db, accountId, source, itemId, itemType, lessonId, correct, score),
      selectAttemptsByLesson: (accountId: number, lessonId: string) =>
        selectAttemptsByLesson(db, accountId, lessonId),
    },
    exampleState: {
      selectExampleState: (accountId: number, lessonId: string) =>
        selectExampleState(db, accountId, lessonId),
      saveExampleState: (
        accountId: number,
        lessonId: string,
        state: Parameters<typeof saveExampleState>[3],
      ) => saveExampleState(db, accountId, lessonId, state),
    },
    lessons: {
      selectUnits: (catalogId?: string) => selectUnits(db, catalogId),
      selectLessons: (catalogId?: string) => selectLessons(db, catalogId),
      selectLesson: (id: string, catalogId?: string) => selectLesson(db, id, catalogId),
    },
    groups: {
      selectAccountGroup: (accountId: number) => selectAccountGroup(db, accountId),
      saveAccountGroup: (
        accountId: number,
        group: Parameters<typeof saveAccountGroup>[2],
      ) => saveAccountGroup(db, accountId, group),
      clearAccountGroup: (accountId: number) => clearAccountGroup(db, accountId),
      selectActiveCatalogId: (accountId: number) => selectActiveCatalogId(db, accountId),
    },
    content: {
      fetchGroup: (code: string) => fetchGroup(http, code),
      refreshCatalog: (catalogId: string, force?: boolean) =>
        refreshCatalog(db, http, catalogId, force),
      applyStagedContent: (catalogId?: string) => applyStagedContent(db, catalogId),
    },
    locations: {
      selectLocation: (accountId: number) => selectLocation(db, accountId),
      saveLocation: (
        accountId: number,
        input: Parameters<typeof saveLocation>[2],
      ) => saveLocation(db, accountId, input),
      clearLocation: (accountId: number) => clearLocation(db, accountId),
    },
    progress: {
      selectProgressMap: (accountId: number, catalogId?: string) =>
        selectProgressMap(db, accountId, catalogId),
      markLessonCompleted: (accountId: number, lessonId: string) =>
        markLessonCompleted(db, accountId, lessonId),
      countCompletedByUnit: (accountId: number, unitId: string, catalogId?: string) =>
        countCompletedByUnit(db, accountId, unitId, catalogId),
      resetAccountProgress: (accountId: number) => resetAccountProgress(db, accountId),
    },
    backup: {
      selectProgressBackup: (accountId: number) => selectProgressBackup(db, accountId),
      replaceProgressFromBackup: (
        accountId: number,
        backup: Parameters<typeof replaceProgressFromBackup>[2],
      ) => replaceProgressFromBackup(db, accountId, backup),
    },
    profile: {
      selectProfile: (accountId: number) => selectProfile(db, accountId),
      saveProfile: (profile: Parameters<typeof saveProfile>[1]) => saveProfile(db, profile),
      createDefaultProfile: (accountId: number) => createDefaultProfile(db, accountId),
    },
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

const RepositoriesContext = createContext<Repositories | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const repositories = useMemo(() => createRepositories(db), [db]);
  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  );
}

export function useRepositories(): Repositories {
  const context = useContext(RepositoriesContext);
  const db = useSQLiteContext();
  const fallback = useMemo(() => createRepositories(db), [db]);
  return context ?? fallback;
}
