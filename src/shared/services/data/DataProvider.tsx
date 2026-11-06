import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  clearSession,
  insertAccount,
  saveSession,
  selectAccountByExternalKey,
  selectAccountById,
  selectAccountByUsername,
  selectSessionAccountId,
  updateExternalKey,
  updatePasswordHash,
} from '@/features/auth/model/accountRepository';
import {
  insertEvaluationResult,
  selectEvaluationByLesson,
  selectEvaluationById,
  selectEvaluationExercises,
  selectEvaluationSummaries,
  selectEvaluationsByTopic,
  selectSelectedExercises,
  selectQuestions,
  selectRecentEvaluationResults,
} from '@/features/evaluations/model/evaluationRepository';
import {
  selectExamplesByLesson,
  selectExamplesByTopic,
  selectExamplesWithExtras,
} from '@/features/examples/model/exampleRepository';
import { insertAttempt, selectAttemptsByLesson } from '@/features/exercises/model/attemptRepository';
import {
  removeAccountClass,
  saveAccountClass,
  selectAccountClasses,
  selectActiveGroup,
  selectLessonExtras,
} from '@/features/classes/model/classRepository';
import { applyStagedContent } from '@/shared/services/content/remote/applyStagedContent';
import {
  refreshClassContent,
  refreshClassRelease,
} from '@/shared/services/content/classSync';
import {
  fetchClassPreview,
  fetchClassRelease,
  joinClassRequest,
  leaveClassRequest,
  refreshCatalog,
} from '@/shared/services/content/remoteContent';
import { claimInvitationRequest } from '@/shared/services/content/invitations';
import { http, httpV3 } from '@/shared/services/http/client';
import { refreshCourseList } from '@/shared/services/content/coursesV3';
import { applyStoredV3Content } from '@/shared/services/content/applyV3Content';
import {
  ensureBaseCourse,
  loadAccountCourses,
  selectCourse,
} from '@/features/modules/model/courseRepository';
import { selectReferences } from '@/features/modules/model/referenceRepository';
import {
  saveExampleState,
  selectExampleState,
} from '@/features/exercises/model/exampleStateRepository';
import {
  selectExercisesByLesson,
  selectExercisesByTopic,
  selectPracticeExercisesByLesson,
} from '@/features/exercises/model/exerciseRepository';
import {
  selectLesson,
  selectLessons,
  selectLessonsByTopic,
  selectTopic,
  selectTopics,
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
  selectCompletionMap,
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
      selectAccountByExternalKey: (externalKey: string) =>
        selectAccountByExternalKey(db, externalKey),
      selectSessionAccountId: () => selectSessionAccountId(db),
      saveSession: (accountId: number) => saveSession(db, accountId),
      updatePasswordHash: (accountId: number, passwordHash: string, salt: string) =>
        updatePasswordHash(db, accountId, passwordHash, salt),
      updateExternalKey: (accountId: number, externalKey: string) =>
        updateExternalKey(db, accountId, externalKey),
      clearSession: () => clearSession(db),
    },
    evaluations: {
      selectEvaluationByLesson: (lessonId: string, groupId?: string | null) =>
        selectEvaluationByLesson(db, lessonId, groupId),
      selectEvaluationById: (
        evaluationId: string,
        catalogId?: string,
        groupId?: string | null,
      ) => selectEvaluationById(db, evaluationId, catalogId, groupId),
      selectEvaluationsByTopic: (topicId: string, catalogId?: string, groupId?: string | null) =>
        selectEvaluationsByTopic(db, topicId, catalogId, groupId),
      selectEvaluationExercises: (evaluationId: string) =>
        selectEvaluationExercises(db, evaluationId),
      selectSelectedExercises: (evaluationId: string) =>
        selectSelectedExercises(db, evaluationId),
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
      selectExamplesByLesson: (lessonId: string, groupId?: string | null) =>
        selectExamplesByLesson(db, lessonId, groupId),
      selectExamplesByTopic: (topicId: string, catalogId?: string, groupId?: string | null) =>
        selectExamplesByTopic(db, topicId, catalogId, groupId),
      selectExamplesWithExtras: (accountId: number, lessonId: string, groupId?: string | null) =>
        selectExamplesWithExtras(db, accountId, lessonId, groupId),
    },
    exercises: {
      selectExercisesByLesson: (lessonId: string, groupId?: string | null) =>
        selectExercisesByLesson(db, lessonId, groupId),
      selectExercisesByTopic: (topicId: string, catalogId?: string, groupId?: string | null) =>
        selectExercisesByTopic(db, topicId, catalogId, groupId),
      selectPracticeExercisesByLesson: (
        accountId: number,
        lessonId: string,
        groupId?: string | null,
      ) => selectPracticeExercisesByLesson(db, accountId, lessonId, groupId),
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
      selectUnits: (catalogId?: string, groupId?: string | null) =>
        selectUnits(db, catalogId, groupId),
      selectTopics: (catalogId?: string, groupId?: string | null) =>
        selectTopics(db, catalogId, groupId),
      selectTopic: (id: string, catalogId?: string, groupId?: string | null) =>
        selectTopic(db, id, catalogId, groupId),
      selectLessons: (catalogId?: string, groupId?: string | null) =>
        selectLessons(db, catalogId, groupId),
      selectLessonsByTopic: (topicId: string, catalogId?: string, groupId?: string | null) =>
        selectLessonsByTopic(db, topicId, catalogId, groupId),
      selectLesson: (id: string, catalogId?: string, groupId?: string | null) =>
        selectLesson(db, id, catalogId, groupId),
    },
    courses: {
      ensureBaseCourse: (accountId?: number) => ensureBaseCourse(db, accountId),
      loadAccountCourses: (accountId?: number) => loadAccountCourses(db, accountId),
      selectCourse: (accountId: number, catalogId: string) =>
        selectCourse(db, accountId, catalogId),
      applyStoredContent: (catalogId?: string) => applyStoredV3Content(db, catalogId),
      refreshCourseList: () => refreshCourseList(db, httpV3),
    },
    bibliography: {
      selectReferences: (catalogId: string, groupId: string | null) =>
        selectReferences(db, catalogId, groupId),
    },
    classes: {
      selectAccountClasses: (accountId: number) => selectAccountClasses(db, accountId),
      selectActiveGroup: (accountId: number, courseCatalogId: string) =>
        selectActiveGroup(db, accountId, courseCatalogId),
      saveAccountClass: (
        accountId: number,
        code: string,
        preview: Parameters<typeof saveAccountClass>[3],
        courseCatalogId?: string,
      ) => saveAccountClass(db, accountId, code, preview, courseCatalogId),
      removeAccountClass: (accountId: number, classId: string) =>
        removeAccountClass(db, accountId, classId),
      selectLessonExtras: (accountId: number, lessonId: string) =>
        selectLessonExtras(db, accountId, lessonId),
    },
    content: {
      fetchClassPreview: (code: string) => fetchClassPreview(http, code),
      joinClass: (code: string, studentKey: string, studentName: string) =>
        joinClassRequest(http, code, studentKey, studentName),
      claimInvitation: (token: string, studentKey: string, studentName: string) =>
        claimInvitationRequest(httpV3, token, studentKey, studentName),
      leaveClass: (code: string, studentKey: string) =>
        leaveClassRequest(http, code, studentKey),
      fetchClassRelease: (code: string) => fetchClassRelease(http, code),
      refreshClass: (
        classId: string,
        code: string,
        studentKey?: string,
        courseCatalogId?: string,
      ) => refreshClassRelease(db, httpV3, classId, code, studentKey, courseCatalogId),
      refreshClassContent: () => refreshClassContent(db, httpV3),
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
      selectCompletionMap: (accountId: number, catalogId?: string) =>
        selectCompletionMap(db, accountId, catalogId),
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
