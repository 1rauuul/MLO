import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityView } from '@/features/exercises/view/activities/ActivityView';
import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ConfirmExitModal } from '@/shared/components/ConfirmExitModal';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { QuizOption } from '@/features/exercises/view/QuizOption';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import type { ActivityType, Exercise, ExerciseType, Question } from '@/shared/model/entities';
import { ACTIVITY_TYPE_LABELS as TYPE_LABELS } from '@/shared/utils/activityLabels';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { recommendReview } from '@/features/evaluations/viewmodel/analytics.logic';
import { useModuleProgress } from '@/features/modules/viewmodel/useModuleProgress';
import {
  useEvaluationEngine,
  useEvaluationForLesson,
  useRecordEvaluationResult,
} from '@/features/evaluations/viewmodel/useQuizEngine';
import { useLessonContent } from '@/features/modules/viewmodel/useLessonContent';
import { useSession } from '@/features/auth/viewmodel/useSession';
import { useExitGuard } from '@/shared/hooks/useExitGuard';

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
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { evaluation, questions, isLoading } = useEvaluationForLesson(lessonParam ?? null);
  const { lesson } = useLessonContent(lessonParam ?? null);
  const engine = useEvaluationEngine(questions, lessonParam ?? null);
  const question = engine.question;
  // Stable reference: engines reset on the exercise identity, so a new object per render loops.
  const exercise = useMemo(
    () => (question ? asExercise(question, lessonParam ?? '') : null),
    [question, lessonParam],
  );
  const record = useRecordEvaluationResult();
  const { markCompleted } = useModuleProgress();
  const { record: recordLocation } = useSession();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const recordedEvaluationRef = useRef<string | null>(null);
  const exitGuard = useExitGuard(engine.phase === 'running');

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
    if (engine.phase !== 'summary' || !evaluation || recordedEvaluationRef.current === evaluation.id) {
      return;
    }
    recordedEvaluationRef.current = evaluation.id;
    const percent = engine.total === 0 ? 0 : Math.round((engine.correctCount / engine.total) * 100);
    void record(evaluation.id, percent, engine.correctCount, engine.total);
    if (lessonParam) {
      void markCompleted(lessonParam);
    }
  }, [engine.phase, engine.correctCount, engine.total, evaluation, record, markCompleted, lessonParam]);

  if (!isLoading && (!evaluation || engine.total === 0)) {
    return (
      <Screen>
        <EmptyState
          title="Sin evaluación"
          message="Este tema aún no tiene evaluación. Se agregará en una próxima actualización."
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
    return (
      <Screen>
        <ScreenHeader onBack={() => router.back()} eyebrow="Evaluación" title="Resultado" />
        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
          <AppText variant="eyebrow">Score final</AppText>
          <AppText variant="title">{`${percent}%`}</AppText>
          <AppText variant="small">{`${engine.correctCount} de ${engine.total} reactivos correctos`}</AppText>
        </View>

        <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
          Score por tipo
        </AppText>
        <View style={styles.list}>
          {Object.entries(engine.summary.byType)
            .filter(([type]) => type !== 'mcq')
            .map(([type, bucket]) => (
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

        <AppText variant="eyebrow" style={{ marginTop: spacing.lg }}>
          Repaso de reactivos
        </AppText>
        <View style={styles.list}>
          {engine.items.map((item, index) => {
            const ok = engine.outcomes[index] === true;
            return (
              <View
                key={item.id}
                style={[
                  styles.review,
                  {
                    backgroundColor: colors.card,
                    borderColor: ok ? colors.success : colors.danger,
                    borderRadius: radius.control,
                  },
                ]}>
                <Icon
                  name={ok ? 'check' : 'close'}
                  size={16}
                  color={ok ? colors.success : colors.danger}
                  strokeWidth={2.5}
                />
                <View style={styles.flex}>
                  <AppText variant="small" weight="600">
                    {item.prompt}
                  </AppText>
                  {!ok && item.explanation ? (
                    <AppText variant="small" color={colors.muted}>
                      {item.explanation}
                    </AppText>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <PrimaryButton label="Volver a Módulos" onPress={() => router.navigate('/')} />
          {recommendation === 'lesson' && lessonParam ? (
            <SecondaryButton
              label="Repasar la lección"
              onPress={() =>
                router.push({ pathname: '/(app)/(modules)/lecciones/[id]', params: { id: lessonParam } })
              }
            />
          ) : recommendation === 'practice' && lessonParam ? (
            <SecondaryButton
              label="Resolver ejercicios"
              onPress={() =>
                router.push({ pathname: '/(app)/(modules)/ejercicios', params: { lesson: lessonParam } })
              }
            />
          ) : null}
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

  const handleExit = () => {
    exitGuard.request(() => router.back());
  };

  return (
    <Screen>
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
          label={engine.isLast ? 'Calificar' : 'Enviar'}
          disabled={!engine.canSend}
          onPress={engine.send}
          style={styles.navButton}
        />
      </View>

      <ConfirmExitModal
        visible={exitGuard.visible}
        title="Salir de la evaluación"
        message="Si sales ahora perderás el progreso de esta evaluación y la próxima vez empezarás de cero."
        onCancel={exitGuard.cancel}
        onConfirm={exitGuard.confirm}
      />
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
  review: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderWidth: 1 },
  card: { borderWidth: 1, padding: 18, gap: 4 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
  nav: { flexDirection: 'row', gap: 12 },
  navButton: { flex: 1 },
});
