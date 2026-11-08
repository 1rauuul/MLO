import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useClasses } from '@/features/classes/viewmodel/useClasses';
import {
  BASE_CATALOG_ID,
  displayCourseTitle,
} from '@/features/modules/model/catalog';
import { useCourses } from '@/features/modules/viewmodel/useCourses';
import { useRepositories } from '@/shared/services/data/DataProvider';

export interface CourseLibraryEntry {
  catalogId: string;
  title: string;
  /** Lecciones completadas sobre el total del curso. */
  percent: number;
  className: string | null;
  isActive: boolean;
  isBase: boolean;
}

export interface CourseLibraryResult {
  entries: CourseLibraryEntry[];
  activeCatalogId: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectCourse: (catalogId: string) => Promise<void>;
}

export function useCourseLibrary(): CourseLibraryResult {
  const { lessons, progress } = useRepositories();
  const selectLessons = lessons.selectLessons;
  const selectCompletionMap = progress.selectCompletionMap;
  const { account } = useAuth();
  const { classes, refresh: refreshClasses } = useClasses();
  const {
    courses,
    activeCatalogId,
    selectCourse,
    refresh: refreshCourses,
    isLoading,
    error,
  } = useCourses();
  const [percents, setPercents] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!account || courses.length === 0) {
      setPercents({});
      return;
    }
    let active = true;
    void (async () => {
      const next: Record<string, number> = {};
      for (const course of courses) {
        const classId =
          classes.find(klass => klass.courseCatalogId === course.catalogId)?.classId ?? null;
        try {
          const [courseLessons, completion] = await Promise.all([
            selectLessons(course.catalogId, classId),
            selectCompletionMap(account.id, course.catalogId),
          ]);
          const done = courseLessons.filter(lesson => completion[lesson.id]).length;
          next[course.catalogId] = courseLessons.length
            ? Math.round((done / courseLessons.length) * 100)
            : 0;
        } catch {
          next[course.catalogId] = 0;
        }
      }
      if (active) {
        setPercents(next);
      }
    })();
    return () => {
      active = false;
    };
  }, [account, courses, classes, selectLessons, selectCompletionMap]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshCourses(), refreshClasses()]);
  }, [refreshCourses, refreshClasses]);

  const entries = useMemo(() => {
    const classByCourse = new Map(classes.map(klass => [klass.courseCatalogId, klass.className]));
    return courses
      .map(course => {
        const className = classByCourse.get(course.catalogId) ?? null;
        return {
          catalogId: course.catalogId,
          title: displayCourseTitle(course),
          percent: percents[course.catalogId] ?? 0,
          className,
          isActive: course.catalogId === activeCatalogId,
          isBase: course.catalogId === BASE_CATALOG_ID,
        };
      })
      .sort(
        (a, b) =>
          Number(b.className !== null) - Number(a.className !== null) ||
          Number(a.isBase) - Number(b.isBase) ||
          a.title.localeCompare(b.title, 'es'),
      );
  }, [courses, classes, percents, activeCatalogId]);

  return { entries, activeCatalogId, isLoading, error, refresh, selectCourse };
}
