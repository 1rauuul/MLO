import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { ContentUpdateButton } from '@/shared/components/ContentUpdateNotice';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SectionHeading } from '@/shared/components/SectionHeading';
import { Bibliography } from '@/features/modules/view/Bibliography';
import { TopicRow } from '@/features/modules/view/TopicRow';
import { UnitCard } from '@/features/modules/view/UnitCard';
import type { Topic } from '@/shared/model/entities';
import { useTheme } from '@/shared/theme/ThemeProvider';
import {
  BASE_CATALOG_ID,
  displayCourseTitle,
} from '@/features/modules/model/catalog';
import { useCatalog } from '@/features/modules/viewmodel/useCatalog';
import { useCourses } from '@/features/modules/viewmodel/useCourses';

export default function CourseScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const catalogId = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { courses } = useCourses();
  const course = courses.find(item => item.catalogId === catalogId);
  const { units, topics, lessonsByUnit, completionMap, references, isLoading, error, refresh } =
    useCatalog(catalogId);
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const title = course ? displayCourseTitle(course) : 'Curso';
  const header = (
    <ScreenHeader onBack={() => router.back()} eyebrow="Curso" title={title} />
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

  return (
    <Screen contentStyle={styles.content}>
      {header}

      <SectionHeading title="Tus unidades" trailing={String(units.length).padStart(2, '0')} />

      <View style={styles.list}>
        {units.map(unit => {
          const unitTopics = topicsByUnit[unit.id] ?? [];
          const lessons = lessonsByUnit[unit.id] ?? [];
          const done = lessons.filter(lesson => completionMap[lesson.id]).length;
          const progress = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
          const isExpanded = expanded === unit.id;
          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              subtopicCount={unitTopics.length}
              progress={progress}
              expanded={isExpanded}
              onToggle={() => setExpanded(isExpanded ? null : unit.id)}>
              <AppText variant="eyebrow">{`Objetos de aprendizaje · ${unitTopics.length} subtemas`}</AppText>
              <View style={styles.subtopics}>
                {unitTopics.map((topic, index) => {
                  const topicLessons = lessonsForTopic(topic.id);
                  const topicDone = topicLessons.filter(lesson => completionMap[lesson.id]).length;
                  const topicProgress = topicLessons.length
                    ? Math.round((topicDone / topicLessons.length) * 100)
                    : 0;
                  const topicCompleted =
                    topicLessons.length > 0 && topicDone === topicLessons.length;
                  return (
                    <View key={topic.id}>
                      {index > 0 ? (
                        <View style={[styles.divider, { backgroundColor: colors.line }]} />
                      ) : null}
                      <TopicRow
                        topic={topic}
                        progress={topicProgress}
                        completed={topicCompleted}
                        onPress={() =>
                          router.push({ pathname: '/tema/[id]', params: { id: topic.id } })
                        }
                      />
                    </View>
                  );
                })}
              </View>
            </UnitCard>
          );
        })}
      </View>

      <Bibliography references={references ?? []} />

      <ContentUpdateButton style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  list: { gap: 12 },
  subtopics: { marginTop: 6 },
  divider: { height: 1 },
});
