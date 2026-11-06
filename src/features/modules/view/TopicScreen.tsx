import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SectionHeading } from '@/shared/components/SectionHeading';
import { SubtopicRow } from '@/features/modules/view/SubtopicRow';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { useLessonHub } from '@/features/modules/viewmodel/useLessonHub';
import { useCourses } from '@/features/modules/viewmodel/useCourses';
import { useSession } from '@/features/auth/viewmodel/useSession';

function ActivityRow({
  label,
  detail,
  onPress,
}: {
  label: string;
  detail: string;
  onPress: () => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${detail}`}
      onPress={onPress}
      style={[styles.activityRow, { borderColor: colors.line, borderRadius: radius.control }]}>
      <View style={styles.flex}>
        <AppText variant="eyebrow">{label}</AppText>
        <AppText weight="600">{detail}</AppText>
      </View>
      <Chevron direction="right" size={16} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  );
}

export default function TopicHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = id ?? null;
  const { activeCatalogId } = useCourses();
  const {
    topic,
    unit,
    lessons,
    examples,
    exercises,
    evaluations,
    completed,
    isLoading,
    error,
    refresh,
  } = useLessonHub(topicId, activeCatalogId);
  const { record } = useSession();
  const router = useRouter();
  const { colors, radius } = useTheme();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const contextLesson = lessons[0]?.id ?? null;
  useEffect(() => {
    if (topic && contextLesson) {
      record({
        unitId: topic.unitId,
        lessonId: contextLesson,
        lessonCode: null,
        section: 'hub',
      });
    }
  }, [topic, contextLesson, record]);

  if (isLoading) {
    return (
      <Screen>
        <EmptyState loading title="Cargando" message="Preparando el subtema." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <EmptyState title="No se pudo cargar" message={error} />
      </Screen>
    );
  }

  if (!topic) {
    return (
      <Screen>
        <EmptyState title="Subtema no encontrado" message="Este subtema ya no está disponible." />
      </Screen>
    );
  }

  const go = (pathname: '/ejemplos' | '/ejercicios' | '/evaluacion') => {
    if (contextLesson) {
      router.push({ pathname, params: { lesson: contextLesson } });
    }
  };

  const empty =
    lessons.length === 0 &&
    examples.length === 0 &&
    exercises.length === 0 &&
    evaluations.length === 0;

  return (
    <Screen contentStyle={styles.content}>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={unit ? `Unidad ${unit.number} · Subtema` : 'Subtema'}
        title={topic.title}
      />

      <View
        style={[
          styles.status,
          {
            backgroundColor: colors.card,
            borderColor: completed ? colors.success : colors.line,
            borderRadius: radius.control,
          },
        ]}>
        <Icon
          name={completed ? 'check' : 'clock'}
          size={18}
          color={completed ? colors.success : colors.primary}
        />
        <AppText weight="600" style={styles.flex}>
          {completed ? 'Subtema completado' : `${lessons.length} lecciones`}
        </AppText>
      </View>

      {empty ? (
        <EmptyState
          title="Sin contenido"
          message="Este subtema aún no tiene lecciones ni actividades."
        />
      ) : null}

      {lessons.length > 0 ? (
        <>
          <SectionHeading eyebrow="Lectura" title="Lecciones" trailing={String(lessons.length)} />
          <View style={styles.list}>
            {lessons.map(lesson => (
              <SubtopicRow
                key={lesson.id}
                lesson={lesson}
                completed={false}
                onPress={() =>
                  router.push({ pathname: '/lecciones/[id]', params: { id: lesson.id } })
                }
              />
            ))}
          </View>
        </>
      ) : null}

      {examples.length > 0 ? (
        <>
          <SectionHeading
            eyebrow="Práctica guiada"
            title="Ejemplos"
            trailing={String(examples.length)}
          />
          <View style={styles.list}>
            {examples.map(example => (
              <ActivityRow
                key={example.id}
                label="Ejemplo"
                detail={example.title}
                onPress={() => go('/ejemplos')}
              />
            ))}
          </View>
        </>
      ) : null}

      {exercises.length > 0 ? (
        <>
          <SectionHeading
            eyebrow="Práctica"
            title="Ejercicios"
            trailing={String(exercises.length)}
          />
          <View style={styles.list}>
            {exercises.map(exercise => (
              <ActivityRow
                key={exercise.id}
                label="Ejercicio"
                detail={exercise.prompt}
                onPress={() => go('/ejercicios')}
              />
            ))}
          </View>
        </>
      ) : null}

      {evaluations.length > 0 ? (
        <>
          <SectionHeading
            eyebrow="Comprobación"
            title="Evaluaciones"
            trailing={String(evaluations.length)}
          />
          <View style={styles.list}>
            {evaluations.map(evaluation => (
              <ActivityRow
                key={evaluation.id}
                label="Evaluación"
                detail={evaluation.title}
                onPress={() => go('/evaluacion')}
              />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  flex: { flex: 1 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  list: { gap: 10, marginBottom: 20 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
});
