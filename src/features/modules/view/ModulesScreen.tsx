import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { SecondaryButton } from '@/shared/components/Buttons';
import { Chevron } from '@/shared/components/Chevron';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { SectionHeading } from '@/shared/components/SectionHeading';
import { SubtopicRow } from '@/features/modules/view/SubtopicRow';
import { UnitCard } from '@/features/modules/view/UnitCard';
import type { Lesson } from '@/shared/model/entities';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { initials } from '@/features/auth/viewmodel/auth.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { BASE_CATALOG_ID } from '@/features/modules/model/catalog';
import { useCatalog } from '@/features/modules/viewmodel/useCatalog';
import { useCourses, type CoursesResult } from '@/features/modules/viewmodel/useCourses';
import { useSession } from '@/features/auth/viewmodel/useSession';

function greetingDate(): string {
  const formatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatted.toUpperCase();
}

function CoursePicker({
  courses,
  activeCatalogId,
  onSelect,
}: {
  courses: CoursesResult['courses'];
  activeCatalogId: string;
  onSelect: (catalogId: string) => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.coursePicker}>
      <AppText variant="eyebrow">Mis cursos</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.courseChips}>
        {courses.map(course => {
          const selected = course.catalogId === activeCatalogId;
          return (
            <Pressable
              key={course.catalogId}
              accessibilityRole="button"
              accessibilityLabel={`Curso ${course.title}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(course.catalogId)}
              style={[
                styles.courseChip,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.line,
                  borderRadius: radius.pill,
                },
              ]}>
              <AppText
                variant="small"
                color={selected ? colors.onPrimary : colors.text}
                weight={selected ? '700' : undefined}>
                {course.title}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function ModulesScreen() {
  const { colors, radius } = useTheme();
  const { account } = useAuth();
  const {
    courses,
    activeCatalogId,
    selectCourse,
    refresh: refreshCourses,
    isLoading: coursesLoading,
  } = useCourses();
  const { units, lessonsByUnit, completionMap, isLoading, error, refresh } = useCatalog(
    coursesLoading ? '' : activeCatalogId,
  );
  const { location, resumeHref } = useSession();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshCourses();
      void refresh();
    }, [refreshCourses, refresh]),
  );

  const learnerName = account?.displayName ?? 'Estudiante';
  const activeCourse = courses.find(course => course.catalogId === activeCatalogId);
  const isBaseCourse = activeCatalogId === BASE_CATALOG_ID;
  const openDestination = (lesson: Lesson) => {
    if (lesson.code === '1.1') {
      router.push({ pathname: '/lecciones/[id]', params: { id: lesson.id } });
    } else {
      router.push({ pathname: '/tema/[id]', params: { id: lesson.id } });
    }
  };
  const coursePicker = (
    <CoursePicker
      courses={courses}
      activeCatalogId={activeCatalogId}
      onSelect={catalogId => void selectCourse(catalogId)}
    />
  );

  if (!coursesLoading && courses.length === 0) {
    return (
      <Screen contentStyle={styles.content}>
        {coursePicker}
        <EmptyState
          title="Sin cursos habilitados"
          message="No tienes cursos disponibles."
        />
        <SecondaryButton
          label="Reintentar"
          onPress={() => {
            void refreshCourses();
            void refresh();
          }}
          style={styles.retry}
        />
      </Screen>
    );
  }

  if (units.length === 0) {
    const title = error
      ? 'No se pudo cargar'
      : isLoading
        ? 'Cargando catálogo'
        : !isBaseCourse && activeCourse?.empty
          ? 'Sin contenido'
          : !isBaseCourse
            ? 'Contenido en preparación'
            : 'Sin contenido';
    const message =
      error ??
      (isLoading
        ? 'Preparando las unidades del curso.'
        : !isBaseCourse && activeCourse?.empty
          ? 'Este curso aún no tiene contenido publicado.'
          : !isBaseCourse
            ? 'Este curso todavía no tiene unidades disponibles.'
            : 'No hay unidades disponibles en este dispositivo.');
    return (
      <Screen contentStyle={styles.content}>
        {coursePicker}
        <EmptyState loading={isLoading && !error} title={title} message={message} />
        {!isLoading ? (
          <SecondaryButton
            label="Reintentar"
            onPress={() => void refresh()}
            style={styles.retry}
          />
        ) : null}
      </Screen>
    );
  }

  const currentUnit =
    units.find(unit => {
      const lessons = lessonsByUnit[unit.id] ?? [];
      return lessons.some(lesson => !completionMap[lesson.id]);
    }) ?? units[0];
  const currentLessons = lessonsByUnit[currentUnit.id] ?? [];
  const nextLesson = currentLessons.find(lesson => !completionMap[lesson.id]) ?? currentLessons[0];

  const allLessons = units.flatMap(unit => lessonsByUnit[unit.id] ?? []);
  const resumedLesson = location.lessonId
    ? allLessons.find(lesson => lesson.id === location.lessonId) ?? null
    : null;
  const resumedUnit = resumedLesson
    ? units.find(unit => unit.id === resumedLesson.unitId) ?? null
    : null;
  const canResume = resumedLesson !== null && resumedUnit !== null && resumeHref !== null;
  const heroUnit = canResume && resumedUnit ? resumedUnit : currentUnit;
  const heroLessons = lessonsByUnit[heroUnit.id] ?? [];
  const heroDone = heroLessons.filter(lesson => completionMap[lesson.id]).length;
  const heroProgress = heroLessons.length ? Math.round((heroDone / heroLessons.length) * 100) : 0;
  const heroTitle = canResume && resumedLesson ? resumedLesson.title : heroUnit.title;

  const handleContinue = () => {
    if (canResume && resumeHref) {
      router.push(resumeHref);
      return;
    }
    if (nextLesson) {
      openDestination(nextLesson);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">{greetingDate()}</AppText>
          <AppText variant="title">{`Hola, ${learnerName}`}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => router.navigate('/(app)/(profile)/perfil')}
          style={[styles.avatar, { backgroundColor: colors.soft }]}>
          <AppText variant="code" color={colors.primary} weight="700">
            {initials(learnerName)}
          </AppText>
        </Pressable>
      </View>

      {coursePicker}

      <View
        style={[
          styles.continueCard,
          { backgroundColor: colors.primary, borderRadius: radius.tile },
        ]}>
        <AppText variant="eyebrow" color="#DCE6FF">
          Continúa donde lo dejaste
        </AppText>
        <AppText style={styles.continueTitle} color={colors.onPrimary} weight="700">
          Unidad {heroUnit.number}
          {'\n'}
          {heroTitle}
        </AppText>
        <AppText variant="small" color="#E6ECFF">
          {`${heroDone} de ${heroLessons.length} subtemas · ${heroProgress}%`}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar unidad"
          disabled={!canResume && !nextLesson}
          onPress={handleContinue}
          style={[styles.continueAction, { backgroundColor: colors.onPrimary }]}>
          <Chevron direction="right" size={18} color={colors.primary} strokeWidth={2.4} />
        </Pressable>
      </View>

      <SectionHeading
        eyebrow="Ruta de aprendizaje"
        title="Tus unidades"
        trailing={String(units.length).padStart(2, '0')}
      />

      <View style={styles.list}>
        {units.map(unit => {
          const lessons = lessonsByUnit[unit.id] ?? [];
          const done = lessons.filter(lesson => completionMap[lesson.id]).length;
          const progress = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
          const isExpanded = expanded === unit.id;
          const nextLessonInUnit = lessons.find(lesson => !completionMap[lesson.id]) ?? lessons[0];
          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              subtopicCount={lessons.length}
              progress={progress}
              expanded={isExpanded}
              onToggle={() => setExpanded(isExpanded ? null : unit.id)}>
              <AppText variant="eyebrow">{`Objetos de aprendizaje · ${lessons.length} subtemas`}</AppText>
              <View style={styles.subtopics}>
                {lessons.map((lesson, index) => (
                  <View key={lesson.id}>
                    {index > 0 ? (
                      <View style={[styles.divider, { backgroundColor: colors.line }]} />
                    ) : null}
                    <SubtopicRow
                      inline
                      lesson={lesson}
                      completed={!!completionMap[lesson.id]}
                      onPress={() => openDestination(lesson)}
                    />
                  </View>
                ))}
              </View>
              {nextLessonInUnit ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Explorar subtemas"
                  onPress={() => openDestination(nextLessonInUnit)}
                  style={styles.explore}>
                  <AppText variant="small" color={colors.primary} weight="700">
                    Explorar subtemas
                  </AppText>
                  <Chevron direction="right" size={16} color={colors.primary} strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </UnitCard>
          );
        })}
      </View>

      <View style={[styles.source, { borderTopColor: colors.line }]}>
        <AppText variant="eyebrow">Fuente</AppText>
        <AppText variant="small">
          Sommerville, I. (2011). Ingeniería de software (9.ª ed.). Pearson Educación.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  flex: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCard: {
    position: 'relative',
    padding: 22,
    gap: 6,
    overflow: 'hidden',
  },
  continueTitle: { fontSize: 22, lineHeight: 24 },
  continueAction: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retry: { marginTop: 12 },
  coursePicker: { gap: 8, marginBottom: 18 },
  courseChips: { gap: 8, paddingRight: 8 },
  courseChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  list: { gap: 12 },
  subtopics: { marginTop: 6 },
  divider: { height: 1 },
  explore: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  source: { marginTop: 28, paddingTop: 14, borderTopWidth: 1, gap: 4 },
});
