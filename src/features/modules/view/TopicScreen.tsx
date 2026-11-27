import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { HubTile } from '@/features/modules/view/HubTile';
import { SubtopicRow } from '@/features/modules/view/SubtopicRow';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { learningAccents } from '@/shared/theme/tokens';
import { useLessonHub } from '@/features/modules/viewmodel/useLessonHub';
import { useCourses } from '@/features/modules/viewmodel/useCourses';
import { useSession } from '@/features/auth/viewmodel/useSession';
import type { IconName } from '@/shared/components/Icon';

interface HubAction {
  key: string;
  icon: IconName;
  label: string;
  note: string;
  accent: string;
  onPress: () => void;
  status?: string;
}

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
    completionMap = {},
    isLoading,
    error,
    refresh,
  } = useLessonHub(topicId, activeCatalogId);
  const { record } = useSession();
  const router = useRouter();
  const { colors, radius, mode } = useTheme();
  const accents = learningAccents[mode ?? 'dark'];
  const [showLessons, setShowLessons] = useState(true);
  const [showEvaluations, setShowEvaluations] = useState(true);

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

  const go = (pathname: '/ejemplos' | '/ejercicios' | '/evaluacion', evaluationId?: string) => {
    if (contextLesson) {
      router.push({
        pathname,
        params: {
          lesson: contextLesson,
          ...(evaluationId ? { evaluationId } : {}),
          ...(evaluationId && activeCatalogId ? { catalog: activeCatalogId } : {}),
        },
      });
    }
  };

  const actions: HubAction[] = [];
  if (lessons.length > 0) {
    actions.push({
      key: 'lesson',
      icon: 'lesson',
      label: 'Lecciones',
      note: 'Contenido teórico',
      status: `${lessons.filter(lesson => completionMap[lesson.id]).length} de ${lessons.length} lecciones completadas`,
      accent: accents.lesson,
      onPress: () => lessons.length > 1 ? setShowLessons(current => !current) :
        router.push({ pathname: '/lecciones/[id]', params: { id: lessons[0]!.id } }),
    });
  }
  if (contextLesson && examples.length > 0) {
    actions.push({
      key: 'examples',
      icon: 'examples',
      label: 'Ejemplos',
      note: 'Demostración y acompañamiento',
      accent: accents.examples,
      onPress: () => go('/ejemplos'),
    });
  }
  if (contextLesson && exercises.length > 0) {
    actions.push({
      key: 'exercises',
      icon: 'exercises',
      label: 'Ejercicios',
      note: 'Pon en práctica lo aprendido',
      accent: accents.exercises,
      onPress: () => go('/ejercicios'),
    });
  }
  if (contextLesson && evaluations.length > 0) {
    actions.push({
      key: 'eval',
      icon: 'eval',
      label: 'Evaluación',
      note: evaluations.length === 1 ? '15 reactivos · Resultados al finalizar' : `${evaluations.length} evaluaciones disponibles`,
      accent: accents.evaluation,
      onPress: () => evaluations.length > 1 ? setShowEvaluations(current => !current) : go('/evaluacion', evaluations[0]!.id),
    });
  }

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
        stacked
      />

      {topic.summary ? <AppText style={styles.summary}>{topic.summary}</AppText> : null}

      <View
        style={[
          styles.status,
          {
            backgroundColor: colors.card,
            borderColor: completed ? colors.success : colors.line,
            borderRadius: radius.pill,
          },
        ]}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: completed ? colors.success : colors.primary },
          ]}
        />
        <AppText weight="600" style={styles.flex}>
          {completed ? 'Subtema completado' : 'En progreso'}
        </AppText>
      </View>

      {empty ? (
        <EmptyState
          title="Sin contenido"
          message="Este subtema aún no tiene lecciones ni actividades."
        />
      ) : null}

      {actions.length > 0 ? (
        <View style={styles.grid}>
          <AppText variant="heading">Ruta de aprendizaje</AppText>
          {actions.map(action => (
            <View key={action.key} style={styles.list}>
              <HubTile
                icon={action.icon}
                label={action.label}
                note={action.note}
                accent={action.accent}
                onPress={action.onPress}
                status={action.status}
              />
              {action.key === 'lesson' && lessons.length > 1 && showLessons ? (
                <View style={styles.list}>
                  {lessons.map(lesson => (
                    <SubtopicRow
                      key={lesson.id}
                      lesson={lesson}
                      completed={!!completionMap[lesson.id]}
                      onPress={() =>
                        router.push({ pathname: '/lecciones/[id]', params: { id: lesson.id } })
                      }
                    />
                  ))}
                </View>
              ) : null}
              {action.key === 'eval' && evaluations.length > 1 && showEvaluations ? (
                <View style={styles.list}>
                  {evaluations.map(evaluation => (
                    <ActivityRow
                      key={evaluation.id}
                      label="Evaluación"
                      detail={evaluation.title}
                      onPress={() => go('/evaluacion', evaluation.id)}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
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
    gap: 10,
    padding: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  grid: { gap: 12 },
  summary: { marginBottom: 20 },
  list: { gap: 10 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
});
