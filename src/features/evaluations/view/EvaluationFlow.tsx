import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityView } from '@/features/exercises/view/activities/ActivityView';
import { AppText } from '@/shared/components/AppText';
import { AnswerReview } from '@/shared/components/AnswerReview';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DisclosureRow } from '@/shared/components/DisclosureRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { PerformanceBreakdown } from '@/shared/components/PerformanceBreakdown';
import { QuizOption } from '@/features/exercises/view/QuizOption';
import { ResultScoreCard } from '@/shared/components/ResultScoreCard';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import type { ActivityType, Exercise, ExerciseType, Question } from '@/shared/model/entities';
import { ACTIVITY_TYPE_LABELS as TYPE_LABELS } from '@/shared/utils/activityLabels';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { recommendReview } from '@/features/evaluations/viewmodel/analytics.logic';
import { isAnswerComplete, summarizeAnswers } from '@/features/evaluations/viewmodel/evaluation.logic';
import {
  useEvaluationEngine,
  useEvaluationForLesson,
  useRecordEvaluationResult,
} from '@/features/evaluations/viewmodel/useQuizEngine';
import { useLessonContent } from '@/features/modules/viewmodel/useLessonContent';
import { useActiveGroup } from '@/features/classes/viewmodel/useActiveGroup';
import { useSession } from '@/features/auth/viewmodel/useSession';
import { useExitGuard } from '@/shared/hooks/useExitGuard';
import { useBlockContentUpdates } from '@/shared/hooks/useContentUpdatesGate';

function asExercise(question: Question, lessonId: string): Exercise {
  return {
    id: question.id,
    lessonId,
    type: question.type as ExerciseType,
    prompt: question.prompt,
    instructions: '',
    correctOrder: question.type === 'order' ? question.options : [],
    config: question.config,
    explanation: question.explanation,
  };
}

function McqQuestion({
  question,
  chosen,
  onSelect,
}: {
  question: Question;
  chosen: number | null;
  onSelect: (index: number) => void;
}) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      {question.options.map((option, index) => (
        <QuizOption
          key={option}
          index={index}
          label={option}
          selected={chosen === index}
          onPress={() => onSelect(index)}
        />
      ))}
    </View>
  );
}

export default function EvaluationFlow() {
  const {
    lesson: lessonParam,
    evaluationId: evaluationParam,
    catalog: catalogParam,
  } = useLocalSearchParams<{ lesson?: string; evaluationId?: string; catalog?: string }>();
  const catalogId = catalogParam ?? 'base';
  const groupId = useActiveGroup(catalogId);
  const { evaluation, questions, isLoading, error } = useEvaluationForLesson(
    lessonParam ?? null,
    evaluationParam ?? null,
    catalogId,
    groupId,
  );
  const { lesson } = useLessonContent(lessonParam ?? null);
  const engine = useEvaluationEngine(questions, lessonParam ?? null);
  const question = engine.question;
  // Stable reference: engines reset on the exercise identity, so a new object per render loops.
  const exercise = useMemo(
    () => (question ? asExercise(question, lessonParam ?? '') : null),
    [question, lessonParam],
  );
  const feedback = useMemo(
    () => summarizeAnswers(engine.items, engine.answers),
    [engine.items, engine.answers],
  );
  const record = useRecordEvaluationResult();
  const { record: recordLocation } = useSession();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  // Un resultado por intento: cambia runId cuando el alumno reintenta.
  const recordedRunRef = useRef<number | null>(null);
  const [startedRun, setStartedRun] = useState<number | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const started = startedRun === engine.runId;
  const exitGuard = useExitGuard(started && engine.phase === 'running');
  const restartEvaluation = engine.restart;
  const confirmExitGuard = exitGuard.confirm;
  // Salir sin calificar descarta el intento: al volver se empieza de cero.
  const confirmExit = useCallback(() => {
    restartEvaluation();
    confirmExitGuard();
  }, [restartEvaluation, confirmExitGuard]);
  // Un contenido nuevo no debe reemplazar los reactivos de una evaluación abierta.
  useBlockContentUpdates(started && engine.phase === 'running');

  useFocusEffect(
    useCallback(() => {
      if (lesson) {
        recordLocation({
          unitId: lesson.unitId,
          lessonId: lesson.id,
          lessonCode: lesson.code,
          section: 'quiz',
        });
      }
    }, [lesson, recordLocation]),
  );

  useEffect(() => {
    setShowReview(false);
  }, [engine.runId]);

  useEffect(() => {
    if (engine.phase !== 'summary' || !evaluation || recordedRunRef.current === engine.runId) {
      return;
    }
    recordedRunRef.current = engine.runId;
    const percent = engine.total === 0 ? 0 : Math.round((engine.correctCount / engine.total) * 100);
    void record(evaluation.id, percent, engine.correctCount, engine.total);
  }, [engine.phase, engine.runId, engine.correctCount, engine.total, evaluation, record]);

  if (!isLoading && (!evaluation || engine.total === 0)) {
    return (
      <Screen>
        <EmptyState
          title="Sin evaluación"
          message={error ?? 'Este tema aún no tiene evaluación. Se agregará en una próxima actualización.'}
        />
      </Screen>
    );
  }

  if (!evaluation) {
    return (
      <Screen>
        <EmptyState loading title="Cargando" message="Preparando la evaluación." />
      </Screen>
    );
  }

  if (engine.phase === 'summary') {
    const percent = engine.total === 0 ? 0 : Math.round((engine.correctCount / engine.total) * 100);
    const recommendation = recommendReview(engine.summary);
    const typeRows = Object.entries(engine.summary.byType).map(([type, bucket]) => ({
      key: type,
      label: TYPE_LABELS[type as ActivityType] ?? type,
      percent: bucket.total === 0 ? 0 : (bucket.correct / bucket.total) * 100,
      detail: `${bucket.correct} de ${bucket.total}`,
    }));
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} eyebrow="Evaluación" title="Resultado" />
        <ResultScoreCard
          eyebrow="Puntaje final"
          percent={percent}
          title="Evaluación finalizada"
          detail={`${engine.correctCount} de ${engine.total} ${
            engine.total === 1 ? 'reactivo correcto' : 'reactivos correctos'
          }`}
        />
        <PerformanceBreakdown
          rows={typeRows}
          correct={engine.correctCount}
          incorrect={engine.total - engine.correctCount}
        />

        {recommendation !== 'none' ? (
          <View
            style={[styles.feedback, { borderColor: colors.warning, backgroundColor: colors.card, borderRadius: radius.control }]}>
            <AppText color={colors.warning} weight="700">
              {recommendation === 'lesson' ? 'Recomendación: repasa la lección' : 'Recomendación: resuelve más ejercicios'}
            </AppText>
            <AppText variant="small">
              {recommendation === 'lesson'
                ? 'Los errores sugieren repasar el contenido del tema.'
                : 'Hay tipos de ejercicio con varios errores; resuélvelos en los ejercicios.'}
            </AppText>
          </View>
        ) : (
          <View
            style={[styles.feedback, { borderColor: colors.success, backgroundColor: colors.card, borderRadius: radius.control }]}>
            <AppText color={colors.success} weight="700">
              ¡Buen resultado!
            </AppText>
            <AppText variant="small">Puedes continuar con el siguiente tema.</AppText>
          </View>
        )}

        <View style={styles.disclosures}>
          <DisclosureRow
            label="Revisar respuestas"
            expanded={showReview}
            onPress={() => setShowReview(visible => !visible)}
            trailing={`${feedback.length} reactivos`}
          />
        </View>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {recommendation === 'lesson' && lessonParam ? (
            <PrimaryButton
              label="Repasar la lección"
              onPress={() =>
                router.push({ pathname: '/(app)/(modules)/lecciones/[id]', params: { id: lessonParam } })
              }
            />
          ) : recommendation === 'practice' && lessonParam ? (
            <PrimaryButton
              label="Resolver ejercicios"
              onPress={() =>
                router.push({ pathname: '/(app)/(modules)/ejercicios', params: { lesson: lessonParam } })
              }
            />
          ) : null}
          {recommendation !== 'none' && lessonParam ? (
            <SecondaryButton label="Volver al subtema" onPress={() => lesson ? router.navigate({ pathname: '/tema/[id]', params: { id: lesson.topicId ?? `t-${lesson.id}` } }) : router.navigate('/')} />
          ) : (
            <PrimaryButton label="Volver al subtema" onPress={() => lesson ? router.navigate({ pathname: '/tema/[id]', params: { id: lesson.topicId ?? `t-${lesson.id}` } }) : router.navigate('/')} />
          )}
          <SecondaryButton label="Reintentar evaluación" onPress={engine.restart} />
        </View>

        {showReview ? <AnswerReview items={feedback} showHeading={false} /> : null}
      </Screen>
    );
  }

  if (!question || !exercise) {
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} eyebrow="Evaluación" title="Sin reactivos" />
        <EmptyState
          title="Sin reactivos"
          message="No hay reactivos disponibles para esta evaluación."
        />
      </Screen>
    );
  }

  if (!started) {
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} title="Evaluación" />
        <View style={styles.introduction}>
          <View style={[styles.introIcon, { backgroundColor: colors.soft, borderRadius: radius.card }]}>
            <Icon name="eval" size={34} color={colors.primary} strokeWidth={2} />
          </View>
          <AppText variant="title">Comprueba tu aprendizaje</AppText>
          <AppText variant="heading">{lesson?.title ?? evaluation.title}</AppText>
          {evaluation.description ? <AppText>{evaluation.description}</AppText> : null}
          <View style={[styles.introDetails, { backgroundColor: colors.card, borderRadius: radius.card }]}>
            <View style={styles.introRow}>
              <Icon name="eval" size={18} color={colors.primary} strokeWidth={2.2} />
              <AppText weight="600" style={styles.flex}>{`${engine.total} reactivos`}</AppText>
            </View>
            <View style={styles.introRow}>
              <Icon name="refresh" size={18} color={colors.primary} strokeWidth={2.2} />
              <AppText weight="600" style={styles.flex}>Selección aleatoria</AppText>
            </View>
            <View style={styles.introRow}>
              <Icon name="chart" size={18} color={colors.primary} strokeWidth={2.2} />
              <AppText weight="600" style={styles.flex}>Resultados al finalizar</AppText>
            </View>
          </View>
          <AppText variant="small">
            Podrás revisar tus respuestas antes de finalizar. Si sales antes, el intento se descarta.
          </AppText>
          <PrimaryButton label="Comenzar evaluación" onPress={() => setStartedRun(engine.runId)} />
        </View>
      </Screen>
    );
  }

  const answeredCount = engine.items.filter(
    (item, index) =>
      engine.touched[index] && isAnswerComplete(item, engine.answers[index] ?? null),
  ).length;
  const allAnswered = answeredCount === engine.total;

  const handleExit = () => {
    exitGuard.request(() => router.back());
  };

  return (
    <Screen keyboardAvoiding>
      <ScreenHeader
        onBack={handleExit}
        eyebrow={`Reactivo ${String(engine.index + 1).padStart(2, '0')} · ${TYPE_LABELS[question.type] ?? question.type}`}
        title="Evaluación"
        trailing={`${engine.index + 1}/${engine.total}`}
      />

      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Reactivo ${engine.index + 1} de ${engine.total}`}
        accessibilityValue={{ min: 1, max: engine.total, now: engine.index + 1 }}
        style={[styles.progressTrack, { backgroundColor: colors.soft }]}>
        <View
          style={[
            styles.progressValue,
            { width: `${((engine.index + 1) / engine.total) * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={[styles.navigator, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Navegador de reactivos" accessibilityState={{ expanded: showNavigator }}
          onPress={() => setShowNavigator(current => !current)} style={styles.navigatorToggle}>
          <AppText variant="small">{`${answeredCount} de ${engine.total} respondidos`}</AppText>
          <AppText color={colors.primary} weight="600">{showNavigator ? 'Ocultar reactivos' : 'Ver reactivos'}</AppText>
        </Pressable>
        {showNavigator ? <>
        <View style={styles.questionButtons}>
          {engine.items.map((item, index) => {
            const answered = engine.touched[index] && isAnswerComplete(item, engine.answers[index] ?? null);
            const current = index === engine.index;
            return (
              <Pressable key={item.id} accessibilityRole="button"
                accessibilityLabel={`Reactivo ${index + 1}, ${current ? 'actual, ' : ''}${answered ? 'respondido' : 'pendiente'}`}
                accessibilityState={{ selected: current }} onPress={() => engine.goTo(index)}
                style={[styles.questionButton, {
                  borderColor: current ? colors.primary : answered ? colors.success : colors.line,
                  borderWidth: current ? 2 : 1,
                  backgroundColor: answered ? `${colors.success}22` : colors.bg,
                  borderRadius: radius.control,
                }]}>
                <AppText weight="600" color={current ? colors.primary : answered ? colors.success : colors.text}>
                  {index + 1}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <AppText variant="small">Respondido</AppText>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <AppText variant="small">Actual</AppText>
          <View style={[styles.legendDot, { backgroundColor: colors.line }]} />
          <AppText variant="small">Pendiente</AppText>
        </View>
        </> : null}
      </View>

      <AppText variant="heading" style={styles.prompt}>
        {question.prompt}
      </AppText>

      <View style={{ marginTop: spacing.lg }}>
        {question.type === 'mcq' ? (
          <McqQuestion
            key={question.id}
            question={question}
            chosen={engine.answer?.type === 'mcq' ? engine.answer.chosen : null}
            onSelect={index => engine.setAnswer({ type: 'mcq', chosen: index })}
          />
        ) : (
          <ActivityView
            key={question.id}
            exercise={exercise}
            allowReset={false}
            hideCheck
            initialAnswer={engine.answer}
            onAnswerChange={answer => engine.setAnswer(answer)}
            onSubmit={() => {}}
          />
        )}
      </View>

      {question.type === 'order' && !engine.touched[engine.index] ? (
        <AppText variant="small" style={{ marginTop: spacing.sm }}>
          Mueve al menos una tarjeta para registrar tu respuesta.
        </AppText>
      ) : null}

      <View style={[styles.nav, { marginTop: spacing.lg }]}>
        <SecondaryButton
          label="Anterior"
          disabled={engine.index === 0}
          onPress={engine.goPrev}
          style={styles.navButton}
        />
        <PrimaryButton
          label={engine.isLast ? 'Finalizar evaluación' : 'Siguiente'}
          disabled={engine.isLast ? !allAnswered : !engine.canSend}
          onPress={engine.isLast ? () => setConfirmFinish(true) : engine.send}
          style={styles.navButton}
        />
      </View>

      <ConfirmModal
        visible={exitGuard.visible}
        title="Salir de la evaluación"
        message="Si sales ahora perderás el progreso de esta evaluación y la próxima vez empezarás de cero."
        cancelLabel="Continuar"
        onCancel={exitGuard.cancel}
        onConfirm={confirmExit}
      />
      <ConfirmModal visible={confirmFinish} title="Finalizar evaluación"
        message={`Se calificarán los ${engine.total} reactivos de este intento. Después podrás revisar tus respuestas.`}
        confirmLabel="Calificar" cancelLabel="Seguir revisando"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={() => { setConfirmFinish(false); engine.send(); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressTrack: { height: 4, borderRadius: 99, overflow: 'hidden', marginBottom: 20 },
  progressValue: { height: '100%' },
  prompt: { marginTop: 8 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
  disclosures: { gap: 10, marginTop: 16 },
  nav: { flexDirection: 'row', gap: 12 },
  navButton: { flex: 1 },
  introduction: { gap: 20 },
  introIcon: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  introDetails: { padding: 20, gap: 16 },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navigator: { gap: 10, marginBottom: 20, padding: 14, borderWidth: 1 },
  questionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  questionButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  navigatorToggle: { minHeight: 48, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 999 },
});
