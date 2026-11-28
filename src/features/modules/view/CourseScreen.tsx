import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { useClasses } from '@/features/classes/viewmodel/useClasses';
import {
  BASE_CATALOG_ID,
  displayCourseTitle,
} from '@/features/modules/model/catalog';
import { Bibliography } from '@/features/modules/view/Bibliography';
import { CourseInfoCard } from '@/features/modules/view/CourseInfoCard';
import { CourseOptionsMenu } from '@/features/modules/view/CourseOptionsMenu';
import { TopicRow } from '@/features/modules/view/TopicRow';
import { UnitCard } from '@/features/modules/view/UnitCard';
import { useCatalog } from '@/features/modules/viewmodel/useCatalog';
import { useCourses } from '@/features/modules/viewmodel/useCourses';
import { AppText } from '@/shared/components/AppText';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SectionHeading } from '@/shared/components/SectionHeading';
import { useContentSync } from '@/shared/services/content/ContentSyncProvider';
import type { Topic } from '@/shared/model/entities';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { accentForUnit } from '@/shared/theme/tokens';

export default function CourseScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const catalogId = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { checking, checkNow } = useContentSync();
  const { courses, refresh: refreshCourses } = useCourses();
  const { classes, leaveClass } = useClasses();
  const course = courses.find(item => item.catalogId === catalogId);
  const klass = classes.find(item => item.courseCatalogId === catalogId) ?? null;
  const { units, topics, lessonsByUnit, completionMap, references, isLoading, error, refresh } =
    useCatalog(catalogId);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const courseTitle = course ? displayCourseTitle(course) : 'Curso';
  const menuButton =
    units.length > 0 ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Opciones del curso"
        onPress={() => setMenuOpen(true)}
        style={styles.menuButton}>
        <Icon name="more" size={20} color={colors.text} />
      </Pressable>
    ) : undefined;
  const header = (
    <ScreenHeader onBack={() => router.back()} title="Inicio" action={menuButton} />
  );

  if (!catalogId) {
    return (
      <Screen>
        {header}
        <EmptyState
          title="Curso no encontrado"
          message="Este curso ya no está disponible."
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        {header}
        <EmptyState title="No se pudo cargar" message={error} />
      </Screen>
    );
  }

  if (isLoading && units.length === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          loading
          title="Cargando catálogo"
          message="Preparando las unidades del curso."
        />
      </Screen>
    );
  }

  if (units.length === 0) {
    const isBase = catalogId === BASE_CATALOG_ID;
    return (
      <Screen>
        {header}
        <EmptyState
          title="Sin contenido"
          message={
            !isBase && course?.empty
              ? 'Este curso aún no tiene contenido publicado.'
              : !isBase
                ? 'Este curso todavía no tiene unidades disponibles.'
                : 'No hay unidades disponibles en este dispositivo.'
          }
        />
      </Screen>
    );
  }

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
  const topicsByUnit: Record<string, Topic[]> = {};
  for (const topic of catalogTopics) {
    (topicsByUnit[topic.unitId] ??= []).push(topic);
  }

  const doneLessons = allLessons.filter(lesson => completionMap[lesson.id]).length;
  const courseProgress = allLessons.length
    ? Math.round((doneLessons / allLessons.length) * 100)
    : 0;
  const nextTopic =
    catalogTopics.find(topic =>
      lessonsForTopic(topic.id).some(lesson => !completionMap[lesson.id]),
    ) ??
    catalogTopics[0] ??
    null;
  const actionLabel = !nextTopic
    ? 'Sin contenido'
    : courseProgress === 100
      ? 'Repasar curso'
      : courseProgress > 0
        ? 'Continuar curso'
        : 'Comenzar curso';
  const accent = accentForUnit(units[0]?.color ?? 'blue');

  const leave = () => {
    if (!klass) {
      return;
    }
    setConfirmLeave(false);
    setLeaveError(null);
    void leaveClass(klass)
      .then(async () => {
        await Promise.all([refreshCourses(), refresh()]);
        router.back();
      })
      .catch(() =>
        setLeaveError(
          'No se pudo salir. Necesitas conexión para que el maestro deje de verte en la lista.',
        ),
      );
  };

  return (
    <Screen contentStyle={styles.content} scrollRef={scrollRef}>
      {header}

      <CourseInfoCard
        title={courseTitle}
        description={course?.description}
        level={course?.level}
        icon={course?.icon}
        accent={accent}
        unitCount={units.length}
        subtopicCount={catalogTopics.length}
        progress={courseProgress}
        actionLabel={actionLabel}
        actionDisabled={!nextTopic}
        onAction={() => {
          if (nextTopic) {
            router.push({ pathname: '/tema/[id]', params: { id: nextTopic.id } });
          }
        }}
      />

      {leaveError ? (
        <AppText
          variant="small"
          color={colors.danger}
          accessibilityLiveRegion="polite"
          style={{ marginTop: spacing.sm }}>
          {leaveError}
        </AppText>
      ) : null}

      <SectionHeading title="Unidades del curso" />

      <View style={styles.list}>
        {units.map(unit => {
          const unitTopics = topicsByUnit[unit.id] ?? [];
          const lessons = lessonsByUnit[unit.id] ?? [];
          const done = lessons.filter(lesson => completionMap[lesson.id]).length;
          const progress = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
          const isExpanded = expanded === unit.id;
          const completedSubtopics = unitTopics.filter(topic => {
            const topicLessons = lessonsForTopic(topic.id);
            return (
              topicLessons.length > 0 &&
              topicLessons.every(lesson => completionMap[lesson.id])
            );
          }).length;
          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              subtopicCount={unitTopics.length}
              completedSubtopics={completedSubtopics}
              progress={progress}
              expanded={isExpanded}
              onToggle={() => setExpanded(isExpanded ? null : unit.id)}>
              <View style={styles.subtopics}>
                {unitTopics.map(topic => {
                  const topicLessons = lessonsForTopic(topic.id);
                  const topicDone = topicLessons.filter(lesson => completionMap[lesson.id]).length;
                  const topicProgress = topicLessons.length
                    ? Math.round((topicDone / topicLessons.length) * 100)
                    : 0;
                  const topicCompleted =
                    topicLessons.length > 0 && topicDone === topicLessons.length;
                  return (
                    <TopicRow
                      key={topic.id}
                      topic={topic}
                      unitNumber={unit.number}
                      progress={topicProgress}
                      completed={topicCompleted}
                      onPress={() =>
                        router.push({ pathname: '/tema/[id]', params: { id: topic.id } })
                      }
                    />
                  );
                })}
              </View>
            </UnitCard>
          );
        })}
      </View>

      <Bibliography references={references ?? []} />

      <ConfirmModal
        visible={confirmLeave}
        title="Salir del curso"
        message={
          klass
            ? `Saldrás de la clase ${klass.className} de este curso. Se ocultará el contenido extra de la clase; tu progreso del curso base se conserva.`
            : ''
        }
        confirmLabel="Salir"
        cancelLabel="Cancelar"
        destructive
        onCancel={() => setConfirmLeave(false)}
        onConfirm={leave}
      />

      <CourseOptionsMenu
        visible={menuOpen}
        checking={checking}
        canLeave={!!klass}
        onClose={() => setMenuOpen(false)}
        onCheckUpdates={() => {
          void checkNow();
        }}
        onShowInfo={() => {
          setMenuOpen(false);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }}
        onLeave={() => {
          setMenuOpen(false);
          setLeaveError(null);
          setConfirmLeave(true);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: 12 },
  subtopics: { gap: 8 },
});
