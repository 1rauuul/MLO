import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityView } from '@/features/exercises/view/activities/ActivityView';
import { AppText } from '@/shared/components/AppText';
import { AnswerReview } from '@/shared/components/AnswerReview';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { EmptyState } from '@/shared/components/EmptyState';
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
    const typeBreakdown = Object.entries(engine.summary.byType);
    const resultColor = (correct: number, total: number) => {
      const fraction = total === 0 ? 0 : correct / total;
      return fraction === 1 ? colors.success : fraction === 0 ? colors.danger : colors.warning;
    };
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} eyebrow="Evaluación" title="Resultado" />
        <ResultScoreCard
          eyebrow="Puntaje final"
          percent={percent}
          detail={`${engine.correctCount} de ${engine.total} ${
            engine.total === 1 ? 'reactivo correcto' : 'reactivos correctos'
          }`}
        />

        {typeBreakdown.length > 0 ? (
          <>
            <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
              Puntaje por tipo
            </AppText>
            <View style={styles.list}>
              {typeBreakdown.map(([type, bucket]) => (
                <View
                  key={type}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
                  <AppText weight="600" style={styles.flex}>
                    {TYPE_LABELS[type as ActivityType] ?? type}
                  </AppText>
                  <AppText color={resultColor(bucket.correct, bucket.total)} weight="700">
                    {`${bucket.correct}/${bucket.total}`}
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

        <AnswerReview items={feedback} />

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
          <AppText variant="title">Comprueba tu aprendizaje</AppText>
          <AppText variant="heading">{lesson?.title ?? evaluation.title}</AppText>
          {evaluation.description ? <AppText>{evaluation.description}</AppText> : null}
          <View style={[styles.introDetails, { backgroundColor: colors.card, borderRadius: radius.card }]}>
            <AppText weight="600">{`${engine.total} reactivos · Selección aleatoria`}</AppText>
            <AppText>Las respuestas y la selección se conservan al navegar entre reactivos.</AppText>
            <AppText>Verás la calificación y las soluciones al finalizar. Si sales antes, el intento se descarta.</AppText>
          </View>
          <PrimaryButton label="Comenzar evaluación" onPress={() => setStartedRun(engine.runId)} />
        </View>
      </Screen>
    );
  }

  const answeredCount = engine.items.filter((item, index) => isAnswerComplete(item, engine.answers[index] ?? null)).length;
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

      <View style={styles.navigator}>
        <Pressable accessibilityRole="button" accessibilityLabel="Navegador de reactivos" accessibilityState={{ expanded: showNavigator }}
          onPress={() => setShowNavigator(current => !current)} style={styles.navigatorToggle}>
          <AppText variant="small">{`${answeredCount} de ${engine.total} respondidos`}</AppText>
          <AppText color={colors.primary} weight="600">{showNavigator ? 'Ocultar reactivos' : 'Ver reactivos'}</AppText>
        </Pressable>
        {showNavigator ? <>
        <View style={styles.questionButtons}>
          {engine.items.map((item, index) => {
            const answered = isAnswerComplete(item, engine.answers[index] ?? null);
            const current = index === engine.index;
            return (
              <Pressable key={item.id} accessibilityRole="button"
                accessibilityLabel={`Reactivo ${index + 1}, ${current ? 'actual, ' : ''}${answered ? 'respondido' : 'pendiente'}`}
                accessibilityState={{ selected: current }} onPress={() => engine.goTo(index)}
                style={[styles.questionButton, { borderColor: current ? colors.primary : colors.line, borderWidth: current ? 2 : 1, backgroundColor: answered ? colors.soft : colors.bg, borderRadius: radius.control }]}>
                <AppText weight="600" color={current ? colors.primary : colors.text}>{index + 1}{answered ? ' ✓' : ''}</AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="small">Actual: borde azul · Respondido: marca de verificación · Pendiente: sin marca</AppText>
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
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
  nav: { flexDirection: 'row', gap: 12 },
  navButton: { flex: 1 },
  introduction: { gap: 20 },
  introDetails: { padding: 20, gap: 16 },
  navigator: { gap: 10, marginBottom: 20 },
  questionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  questionButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  navigatorToggle: { minHeight: 48, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
