import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SectionHeading } from '@/shared/components/SectionHeading';
import { HubTile } from '@/features/modules/view/HubTile';
import { SubtopicRow } from '@/features/modules/view/SubtopicRow';
import { useTheme } from '@/shared/theme/ThemeProvider';
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
  if (lessons.length === 1) {
    actions.push({
      key: 'lesson',
      icon: 'lesson',
      label: 'Lecciones',
      note: 'Concepto y síntesis',
      accent: colors.primary,
      onPress: () =>
        router.push({ pathname: '/lecciones/[id]', params: { id: lessons[0]!.id } }),
    });
  }
  if (contextLesson && examples.length > 0) {
    actions.push({
      key: 'examples',
      icon: 'examples',
      label: 'Ejemplos',
      note: 'Demostración guiada',
      accent: colors.success,
      onPress: () => go('/ejemplos'),
    });
  }
  if (contextLesson && exercises.length > 0) {
    actions.push({
      key: 'exercises',
      icon: 'exercises',
      label: 'Ejercicios',
      note: 'Práctica lo aprendido',
      accent: colors.warning,
      onPress: () => go('/ejercicios'),
    });
  }
  if (contextLesson && evaluations.length === 1) {
    actions.push({
      key: 'eval',
      icon: 'eval',
      label: 'Evaluación',
      note: 'Comprueba tu avance',
      accent: colors.danger,
      onPress: () => go('/evaluacion', evaluations[0]!.id),
    });
  }

  const tileRows: HubAction[][] = [];
  for (let index = 0; index < actions.length; index += 2) {
    tileRows.push(actions.slice(index, index + 2));
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
      />

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

      {tileRows.length > 0 ? (
        <View style={styles.grid}>
          {tileRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {row.map(action => (
                <HubTile
                  key={action.key}
                  icon={action.icon}
                  label={action.label}
                  note={action.note}
                  accent={action.accent}
                  onPress={action.onPress}
                />
              ))}
              {row.length === 1 ? <View style={styles.tileSpacer} /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {lessons.length > 1 ? (
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

      {evaluations.length > 1 ? (
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
                onPress={() => go('/evaluacion', evaluation.id)}
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
  gridRow: { flexDirection: 'row', gap: 12 },
  tileSpacer: { flex: 1 },
  list: { gap: 10 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
});
