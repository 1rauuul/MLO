import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityView } from '@/features/exercises/view/activities/ActivityView';
import { AppText } from '@/shared/components/AppText';
import { AnswerReview } from '@/shared/components/AnswerReview';
import { ActivityFeedback } from '@/features/exercises/view/activities/ActivityFeedback';
import type { EvaluationAnswer } from '@/features/evaluations/viewmodel/evaluation.logic';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { ContinuationButton } from '@/shared/components/ContinuationButton';
import { DisclosureRow } from '@/shared/components/DisclosureRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { PerformanceBreakdown } from '@/shared/components/PerformanceBreakdown';
import { ResultScoreCard } from '@/shared/components/ResultScoreCard';
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
  const { lesson: lessonParam, from } = useLocalSearchParams<{ lesson?: string; from?: string }>();
  const { lesson } = useLessonContent(lessonParam ?? null);
  const engine = usePracticeEngine(lessonParam ?? null);
  const { record } = useSession();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const exitGuard = useExitGuard(engine.phase === 'running' && !engine.isLoading);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const response = useRef<{ id: string; answer: EvaluationAnswer } | null>(null);

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

  const goBack = () => {
    // Si venimos de ejemplos, ese flujo ya terminó: se sale al hub, no a ejemplos.
    if (from === 'examples') {
      router.navigate('/');
      return;
    }
    router.back();
  };
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
    const colorFor = (fraction: number) =>
      fraction === 1 ? colors.success : fraction === 0 ? colors.danger : colors.warning;
    const typeRows = Object.entries(summary.byType).map(([type, bucket]) => ({
      key: type,
      label: TYPE_LABELS[type as ActivityType] ?? type,
      percent: bucket.total === 0 ? 0 : (bucket.correct / bucket.total) * 100,
      detail: `${bucket.total} ${bucket.total === 1 ? 'actividad' : 'actividades'}`,
    }));

    return (
      <Screen>
        <ScreenHeader onBack={goBack} eyebrow={lesson ? `Tema ${lesson.code}` : 'Ejercicios'} title="Resultado" />
        <ResultScoreCard
          eyebrow="Puntaje de ejercicios"
          percent={percent}
          title="Ejercicios finalizados"
          detail={`${formatPoints(summary.correct)} de ${summary.total} puntos`}
        />
        <PerformanceBreakdown rows={typeRows} />

        {topics.length > 0 ? (
          <>
            <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
              Temas a reforzar
            </AppText>
            <View style={styles.topicList}>
              {topics.map(topic => (
                <AppText key={topic} variant="small">
                  {TOPIC_LABELS[topic] ?? topic}
                </AppText>
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

        <View style={styles.disclosures}>
          <DisclosureRow
            label="Ver desglose completo"
            expanded={showBreakdown}
            onPress={() => setShowBreakdown(visible => !visible)}
          />
          <DisclosureRow
            label="Revisar respuestas"
            expanded={showReview}
            onPress={() => setShowReview(visible => !visible)}
            trailing={`${engine.review.length} reactivos`}
          />
        </View>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {recommendation === 'lesson' ? <PrimaryButton label="Repasar la lección" onPress={goLesson} /> : null}
          {lessonParam ? recommendation === 'lesson'
            ? <SecondaryButton label="Ir a la evaluación" onPress={goEvaluation} />
            : <PrimaryButton label="Ir a la evaluación" onPress={goEvaluation} /> : null}
          <SecondaryButton label="Volver al subtema" onPress={() => lesson ? router.navigate({ pathname: '/tema/[id]', params: { id: lesson.topicId ?? `t-${lesson.id}` } }) : goBack()} />
        </View>

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
                        {`${TYPE_LABELS[question.type] ?? question.type} · ${formatPoints(question.correct)} de ${question.total}`}
                      </AppText>
                    </View>
                    <AppText color={colorFor(fraction)} weight="700">
                      {`${Math.round(fraction * 100)}%`}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        {showReview && engine.review.length > 0 ? (
          <AnswerReview items={engine.review} showHeading={false} />
        ) : null}
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
    <Screen keyboardAvoiding>
      <ScreenHeader
        onBack={handleBack}
        eyebrow={lesson ? `Tema ${lesson.code} · ${TYPE_LABELS[exercise.type] ?? exercise.type}` : (TYPE_LABELS[exercise.type] ?? exercise.type)}
        title="Ejercicios"
        trailing={`${engine.index + 1}/${engine.total}`}
      />

      {exercise.className ? (
        <AppText variant="eyebrow" color={colors.primary}>
          {`Extra de ${exercise.className}`}
        </AppText>
      ) : null}
      <AppText variant="heading">{exercise.prompt}</AppText>

      <View style={{ marginTop: spacing.md }}>
        <ActivityView
          key={exercise.id}
          exercise={exercise}
          allowReset={false}
          locked={engine.answered}
          onAnswerChange={answer => { response.current = { id: exercise.id, answer }; }}
          onSubmit={(answer, correct, score) => engine.submit(answer, correct, score, response.current?.id === exercise.id ? response.current.answer : null)}
        />
      </View>

      {engine.answered ? (
        <ActivityFeedback
          correct={!!engine.lastCorrect}
          partial={(engine.summary.byQuestion[engine.index]?.correct ?? 0) > 0 && !engine.lastCorrect}
          title={
            engine.lastCorrect
              ? 'Respuesta correcta'
              : (engine.summary.byQuestion[engine.index]?.correct ?? 0) > 0
                ? 'Respuesta parcialmente correcta'
                : 'Revisa tu respuesta'
          }
          detailLabel="Explicación"
          message={exercise.explanation}
          action={
            <ContinuationButton
              label={isLast ? 'Ver resumen' : 'Siguiente ejercicio'}
              onPress={engine.next}
              revealSignal={1}
            />
          }
        />
      ) : null}

      <ConfirmModal
        visible={exitGuard.visible}
        title="Salir de los ejercicios"
        message="Si sales ahora, la próxima vez empezarás de cero con ejercicios diferentes."
        cancelLabel="Continuar"
        onCancel={exitGuard.cancel}
        onConfirm={exitGuard.confirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: 10 },
  disclosures: { gap: 10, marginTop: 16 },
  topicList: { gap: 4, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
