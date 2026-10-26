import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityView } from '@/features/exercises/view/activities/ActivityView';
import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ConfirmExitModal } from '@/shared/components/ConfirmExitModal';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import type { ActivityType } from '@/shared/model/entities';
import { ACTIVITY_TYPE_LABELS as TYPE_LABELS } from '@/shared/utils/activityLabels';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { recommendReview, weakTopics } from '@/features/evaluations/viewmodel/analytics.logic';
import { TOPIC_LABELS } from '@/shared/services/content/topics';
import { useLessonContent } from '@/features/modules/viewmodel/useLessonContent';
import { usePracticeEngine } from '@/features/exercises/viewmodel/usePracticeEngine';
import { useSession } from '@/features/auth/viewmodel/useSession';
import { useExitGuard } from '@/shared/hooks/useExitGuard';

function formatPoints(value: number): string {
  return Number(value.toFixed(1)).toString();
}

export default function PracticeScreen() {
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { lesson } = useLessonContent(lessonParam ?? null);
  const engine = usePracticeEngine(lessonParam ?? null);
  const { record } = useSession();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const exitGuard = useExitGuard(engine.phase === 'running' && !engine.isLoading);
  const [showBreakdown, setShowBreakdown] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (lesson) {
        record({
          unitId: lesson.unitId,
          lessonId: lesson.id,
          lessonCode: lesson.code,
          section: 'exercise',
        });
      }
    }, [lesson, record]),
  );

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
    const { summary } = engine;
    const recommendation = recommendReview(summary);
    const topics = weakTopics(summary);
    const percent = Math.round(summary.accuracy * 100);
    const perQuestion = summary.total > 0 ? 100 / summary.total : 0;
    const shareOf = (points: number) => (summary.total > 0 ? (points / summary.total) * 100 : 0);
    const colorFor = (fraction: number) =>
      fraction === 1 ? colors.success : fraction === 0 ? colors.danger : colors.warning;

    return (
      <Screen>
        <ScreenHeader onBack={goBack} eyebrow={lesson ? `Tema ${lesson.code}` : 'Ejercicios'} title="Resultado" />
        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
          <AppText variant="eyebrow">Score de ejercicios</AppText>
          <AppText variant="title">{`${percent}%`}</AppText>
          <AppText variant="small">
            {`${formatPoints(summary.correct)} de ${summary.total} puntos · cada pregunta vale ${formatPoints(perQuestion)}%`}
          </AppText>
        </View>

        <SecondaryButton
          label={showBreakdown ? 'Ocultar desglose' : 'Ver desglose completo'}
          onPress={() => setShowBreakdown(visible => !visible)}
          style={{ marginTop: spacing.lg }}
        />

        {showBreakdown ? (
          <>
            <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
              Desglose por pregunta
            </AppText>
            <View style={styles.list}>
              {summary.byQuestion.map(question => {
                const fraction = question.total === 0 ? 0 : question.correct / question.total;
                return (
                  <View
                    key={question.exerciseId}
                    style={[
                      styles.row,
                      { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
                    ]}>
                    <View style={styles.flex}>
                      <AppText weight="600">{`Pregunta ${question.index + 1}`}</AppText>
                      <AppText variant="small">
                        {`${TYPE_LABELS[question.type] ?? question.type} · ${question.correct}/${question.total} reactivos`}
                      </AppText>
                    </View>
                    <View style={styles.scoreColumn}>
                      <AppText color={colorFor(fraction)} weight="700">
                        {`${Math.round(fraction * 100)}%`}
                      </AppText>
                      <AppText variant="small">
                        {`${formatPoints(shareOf(fraction))}% del total`}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>

            <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
              Desglose por tipo de ejercicio
            </AppText>
            <View style={styles.list}>
              {Object.entries(summary.byType).map(([type, bucket]) => {
                const fraction = bucket.total === 0 ? 0 : bucket.correct / bucket.total;
                return (
                  <View
                    key={type}
                    style={[
                      styles.row,
                      { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
                    ]}>
                    <View style={styles.flex}>
                      <AppText weight="600">{TYPE_LABELS[type as ActivityType] ?? type}</AppText>
                      <AppText variant="small">
                        {`${formatPoints(bucket.correct)} de ${bucket.total} preguntas`}
                      </AppText>
                    </View>
                    <View style={styles.scoreColumn}>
                      <AppText color={colorFor(fraction)} weight="700">
                        {`${Math.round(fraction * 100)}%`}
                      </AppText>
                      <AppText variant="small">
                        {`${formatPoints(shareOf(bucket.correct))}% del total`}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        {topics.length > 0 ? (
          <>
            <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
              Temas a reforzar
            </AppText>
            <View style={styles.list}>
              {topics.map(topic => (
                <View
                  key={topic}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
                  <AppText weight="600" style={styles.flex}>
                    {TOPIC_LABELS[topic] ?? topic}
                  </AppText>
                </View>
              ))}
            </View>
          </>
        ) : null}

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
          {lessonParam ? <PrimaryButton label="Ir a la evaluación" onPress={goEvaluation} /> : null}
          {recommendation === 'lesson' ? (
            <SecondaryButton label="Repasar la lección" onPress={goLesson} />
          ) : null}
        </View>
      </Screen>
    );
  }

  if (engine.isLoading) {
    return (
      <Screen>
        <ScreenHeader onBack={goBack} eyebrow={lesson ? `Tema ${lesson.code}` : 'Ejercicios'} title="Ejercicios" />
        <EmptyState loading title="Cargando" message="Preparando los ejercicios del tema." />
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

  const handleBack = () => exitGuard.request(goBack);

  return (
    <Screen>
      <ScreenHeader
        onBack={handleBack}
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
          locked={engine.answered}
          onSubmit={(answer, correct, score) => engine.submit(answer, correct, score)}
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

      <ConfirmExitModal
        visible={exitGuard.visible}
        title="Salir de los ejercicios"
        message="Si sales ahora, la próxima vez empezarás de cero con ejercicios diferentes."
        onCancel={exitGuard.cancel}
        onConfirm={exitGuard.confirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  small: { fontSize: 14 },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  scoreColumn: { alignItems: 'flex-end' },
  card: { borderWidth: 1, padding: 18, gap: 4 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
