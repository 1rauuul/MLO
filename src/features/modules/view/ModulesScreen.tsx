import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { SecondaryButton } from '@/shared/components/Buttons';
import { Chevron } from '@/shared/components/Chevron';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { SectionHeading } from '@/shared/components/SectionHeading';
import { CourseCard } from '@/features/modules/view/CourseCard';
import type { Lesson, Topic } from '@/shared/model/entities';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { initials } from '@/features/auth/viewmodel/auth.logic';
import { useAuth } from '@/features/auth/viewmodel/useAuth';
import { useCatalog } from '@/features/modules/viewmodel/useCatalog';
import { useCourseLibrary } from '@/features/modules/viewmodel/useCourseLibrary';
import { useSession } from '@/features/auth/viewmodel/useSession';
import { isHybrid } from '@/shared/services/data/dataMode';

function greetingDate(): string {
  const formatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatted.toUpperCase();
}

export default function ModulesScreen() {
  const { colors, radius } = useTheme();
  const { account } = useAuth();
  const {
    entries,
    activeCatalogId,
    selectCourse,
    refresh: refreshLibrary,
    isLoading: libraryLoading,
    error: libraryError,
  } = useCourseLibrary();
  const {
    units,
    topics,
    lessonsByUnit,
    completionMap,
    error: catalogError,
    refresh: refreshCatalog,
  } = useCatalog(libraryLoading ? '' : activeCatalogId);
  const { location, resumeHref } = useSession();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      void refreshLibrary();
      void refreshCatalog();
    }, [refreshLibrary, refreshCatalog]),
  );

  const learnerName = account?.displayName ?? 'Estudiante';
  const showLibrary = entries.length > 0;

  const allLessons = units.flatMap(unit => lessonsByUnit[unit.id] ?? []);
  const lessonsForTopic = (topicId: string) =>
    allLessons.filter(lesson => (lesson.topicId ?? `t-${lesson.id}`) === topicId);
  const catalogTopics: Topic[] =
    (topics ?? []).length > 0
      ? topics ?? []
      : allLessons.map(lesson => ({
          id: lesson.topicId ?? `t-${lesson.id}`,
          unitId: lesson.unitId,
          title: lesson.title,
          summary: '',
          position: lesson.position,
        }));
  const currentTopic =
    catalogTopics.find(topic =>
      lessonsForTopic(topic.id).some(lesson => !completionMap[lesson.id]),
    ) ??
    catalogTopics[0] ??
    null;
  const nextLesson = currentTopic
    ? lessonsForTopic(currentTopic.id).find(lesson => !completionMap[lesson.id]) ??
      lessonsForTopic(currentTopic.id)[0]
    : undefined;

  const resumedLesson = location.lessonId
    ? allLessons.find(lesson => lesson.id === location.lessonId) ?? null
    : null;
  const resumedUnit = resumedLesson
    ? units.find(unit => unit.id === resumedLesson.unitId) ?? null
    : null;
  const canResume = resumedLesson !== null && resumedUnit !== null && resumeHref !== null;
  const resumedTopic = resumedLesson
    ? catalogTopics.find(
        topic => topic.id === (resumedLesson.topicId ?? `t-${resumedLesson.id}`),
      ) ?? null
    : null;
  const heroUnit =
    (canResume && resumedUnit ? resumedUnit : null) ??
    (currentTopic ? units.find(unit => unit.id === currentTopic.unitId) : null) ??
    units[0];
  const heroTopic = canResume && resumedTopic ? resumedTopic : currentTopic;
  const heroLessons = heroTopic ? lessonsForTopic(heroTopic.id) : [];
  const heroDone = heroLessons.filter(lesson => completionMap[lesson.id]).length;
  const heroProgress = heroLessons.length ? Math.round((heroDone / heroLessons.length) * 100) : 0;
  const heroTitle =
    canResume && resumedLesson
      ? resumedLesson.title
      : heroTopic?.title ?? heroUnit?.title ?? '';

  const openTopic = (topic: Topic) => {
    router.push({ pathname: '/tema/[id]', params: { id: topic.id } });
  };
  const openLesson = (lesson: Lesson) => {
    if (lesson.code === '1.1') {
      router.push({ pathname: '/lecciones/[id]', params: { id: lesson.id } });
    } else {
      router.push({
        pathname: '/tema/[id]',
        params: { id: lesson.topicId ?? `t-${lesson.id}` },
      });
    }
  };

  const handleContinue = () => {
    if (canResume && resumeHref) {
      router.push(resumeHref);
      return;
    }
    if (heroTopic) {
      openTopic(heroTopic);
      return;
    }
    if (nextLesson) {
      openLesson(nextLesson);
    }
  };

  const openCourse = async (catalogId: string) => {
    await selectCourse(catalogId);
    router.push({ pathname: '/curso/[id]', params: { id: catalogId } });
  };

  const joinClass = isHybrid() ? (
    <SecondaryButton
      label="Unirme a una clase"
      labelColor={colors.primary}
      icon={
        <AppText weight="700" color={colors.primary} style={styles.plus}>
          +
        </AppText>
      }
      onPress={() => router.push('/join-class' as Href)}
      style={[
        styles.joinButton,
        { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 },
      ]}
    />
  ) : null;

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

      {libraryLoading && !showLibrary ? (
        <EmptyState loading title="Cargando cursos" message="Preparando tus cursos." />
      ) : null}

      {!libraryLoading && !showLibrary ? (
        <>
          <SectionHeading eyebrow="Tu biblioteca" title="Mis cursos" trailing="00" />
          <EmptyState
            title={libraryError ? 'No se pudieron cargar los cursos' : 'Sin cursos habilitados'}
            message={libraryError ?? 'No tienes cursos disponibles.'}
          />
          <SecondaryButton
            label="Reintentar"
            onPress={() => {
              void refreshLibrary();
              void refreshCatalog();
            }}
            style={styles.retry}
          />
        </>
      ) : null}

      {showLibrary ? (
        <>
          {catalogError ? (
            <View style={styles.catalogError}>
              <EmptyState title="No se pudo cargar" message={catalogError} />
              <SecondaryButton
                label="Reintentar"
                onPress={() => void refreshCatalog()}
                style={styles.retry}
              />
            </View>
          ) : null}

          {!catalogError && heroUnit && heroTopic ? (
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
                {`${heroDone} de ${heroLessons.length} lecciones · ${heroProgress}%`}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continuar unidad"
                disabled={!canResume && !nextLesson}
                onPress={handleContinue}
                style={[styles.continueAction, { backgroundColor: colors.onPrimary }]}>
                <Chevron
                  direction="right"
                  size={18}
                  color={colors.primary}
                  strokeWidth={2.4}
                />
              </Pressable>
            </View>
          ) : null}

          <SectionHeading
            eyebrow="Tu biblioteca"
            title="Mis cursos"
            trailing={String(entries.length).padStart(2, '0')}
          />

          <View style={styles.list}>
            {entries.map(entry => (
              <CourseCard
                key={entry.catalogId}
                entry={entry}
                onPress={() => void openCourse(entry.catalogId)}
              />
            ))}
          </View>
        </>
      ) : null}

      {joinClass}
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
  list: { gap: 12 },
  joinButton: { marginTop: 14 },
  plus: { fontSize: 18, lineHeight: 20 },
  catalogError: { marginBottom: 8 },
});
