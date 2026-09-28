import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActivityView } from '@/components/activities/ActivityView';
import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ActivityType } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { recommendReview } from '@/viewmodels/analyticsLogic';
import { useLessonContent } from '@/viewmodels/useLessonContent';
import { usePracticeEngine } from '@/viewmodels/usePracticeEngine';

const TYPE_LABELS: Record<ActivityType, string> = {
  order: 'Ordena',
  fill: 'Completa',
  match: 'Enlaza',
  crossword: 'Crucigrama',
  mcq: 'Opción múltiple',
};

export default function PracticeScreen() {
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { lesson } = useLessonContent(lessonParam ?? null);
  const engine = usePracticeEngine(lessonParam ?? null);
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();

  const goBack = () => router.back();
  const goLesson = () => {
    if (lessonParam) {
      router.push({ pathname: '/lecciones/[id]', params: { id: lessonParam } });
    } else {
      router.back();
    }
  };
  const goEvaluation = () => {
    if (lessonParam) {
      router.push({ pathname: '/evaluacion', params: { lesson: lessonParam } });
    }
  };

  if (engine.phase === 'summary') {
    const recommendation = recommendReview(engine.summary);
    const percent = Math.round(engine.summary.accuracy * 100);
    return (
      <Screen>
        <ScreenHeader onBack={goBack} eyebrow={lesson ? `Tema ${lesson.code}` : 'Ejercicios'} title="Resultado" />
        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
          <AppText variant="eyebrow">Score de ejercicios</AppText>
          <AppText variant="title">{`${percent}%`}</AppText>
          <AppText variant="small">{`${engine.summary.correct} de ${engine.summary.total} correctos`}</AppText>
        </View>

        <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
          Por tipo de ejercicio
        </AppText>
        <View style={styles.list}>
          {Object.entries(engine.summary.byType).map(([type, bucket]) => (
            <View
              key={type}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
              <AppText weight="600" style={styles.flex}>
                {TYPE_LABELS[type as ActivityType] ?? type}
              </AppText>
              <AppText color={bucket.correct === bucket.total ? colors.success : colors.danger} weight="700">
                {`${bucket.correct}/${bucket.total}`}
              </AppText>
            </View>
          ))}
        </View>

        {recommendation !== 'none' ? (
          <View
            style={[styles.feedback, { borderColor: colors.warning, backgroundColor: colors.card, borderRadius: radius.control }]}>
            <AppText color={colors.warning} weight="700">
              {recommendation === 'lesson' ? 'Te conviene repasar la lección' : 'Te conviene resolver más ejercicios'}
            </AppText>
            <AppText variant="small">
              {recommendation === 'lesson'
                ? 'Detectamos varios errores: vuelve al contenido del tema antes de continuar.'
                : 'Hay un tipo de ejercicio con varios errores; refuerza ese tipo.'}
            </AppText>
          </View>
        ) : (
          <View
            style={[styles.feedback, { borderColor: colors.success, backgroundColor: colors.card, borderRadius: radius.control }]}>
            <AppText color={colors.success} weight="700">
              Buen desempeño
            </AppText>
            <AppText variant="small">Puedes continuar con la evaluación del tema.</AppText>
          </View>
        )}

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <PrimaryButton label="Ir a la evaluación" onPress={goEvaluation} />
          <SecondaryButton
            label={recommendation === 'lesson' ? 'Repasar la lección' : 'Volver al tema'}
            onPress={recommendation === 'lesson' ? goLesson : goBack}
          />
        </View>
      </Screen>
    );
  }

  if (engine.isLoading) {
    return (
      <Screen>
        <ScreenHeader onBack={goBack} eyebrow={lesson ? `Tema ${lesson.code}` : 'Ejercicios'} title="Ejercicios" />
        <EmptyState title="Cargando" message="Preparando los ejercicios del tema." />
      </Screen>
    );
  }

  if (engine.items.length === 0 || !engine.current) {
    return (
      <Screen>
        <ScreenHeader onBack={goBack} eyebrow={lesson ? `Tema ${lesson.code}` : 'Ejercicios'} title="Ejercicios" />
        <EmptyState title="Sin ejercicios" message="Este tema aún no tiene ejercicios." />
      </Screen>
    );
  }

  const exercise = engine.current;
  const isLast = engine.index >= engine.total - 1;

  return (
    <Screen>
      <ScreenHeader
        onBack={goBack}
        eyebrow={lesson ? `Tema ${lesson.code} · ${TYPE_LABELS[exercise.type] ?? exercise.type}` : (TYPE_LABELS[exercise.type] ?? exercise.type)}
        title="Ejercicios"
        trailing={`${engine.index + 1}/${engine.total}`}
      />

      <AppText variant="heading">{exercise.prompt}</AppText>

      <View style={{ marginTop: spacing.md }}>
        <ActivityView
          key={exercise.id}
          exercise={exercise}
          allowReset={false}
          onSubmit={(answer, correct) => engine.submit(answer, correct)}
        />
      </View>

      {engine.answered ? (
        <View
          style={[
            styles.feedback,
            {
              borderColor: engine.lastCorrect ? colors.success : colors.danger,
              backgroundColor: colors.card,
              borderRadius: radius.control,
            },
          ]}>
          <AppText color={engine.lastCorrect ? colors.success : colors.danger} weight="700">
            {engine.lastCorrect ? '✓ Respuesta correcta' : '✗ Respuesta incorrecta'}
          </AppText>
          {exercise.explanation ? <AppText variant="small">{exercise.explanation}</AppText> : null}
        </View>
      ) : null}

      {engine.answered ? (
        <PrimaryButton
          label={isLast ? 'Ver resumen' : 'Siguiente ejercicio'}
          onPress={engine.next}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  small: { fontSize: 14 },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  card: { borderWidth: 1, padding: 18, gap: 4 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
