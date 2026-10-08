import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityView } from '@/components/activities/ActivityView';
import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { QuizOption, type QuizOptionResult } from '@/components/QuizOption';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ActivityType, Exercise, ExerciseType, Question } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { recommendReview } from '@/viewmodels/analyticsLogic';
import { useModuleProgress } from '@/viewmodels/useModuleProgress';
import {
  useEvaluationEngine,
  useEvaluationForLesson,
  useRecordEvaluationResult,
} from '@/viewmodels/useQuizEngine';
import { useLessonContent } from '@/viewmodels/useLessonContent';
import { useSession } from '@/viewmodels/useSession';

const TYPE_LABELS: Record<ActivityType, string> = {
  order: 'Ordena',
  fill: 'Completa',
  match: 'Enlaza',
  crossword: 'Crucigrama',
  mcq: 'Opción múltiple',
};

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
  answered,
  onAnswer,
}: {
  question: Question;
  answered: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const { spacing } = useTheme();
  const [chosen, setChosen] = useState<number | null>(null);

  const resultFor = (index: number): QuizOptionResult | undefined => {
    if (!answered) {
      return undefined;
    }
    if (index === question.answer) {
      return 'correct';
    }
    return index === chosen ? 'wrong' : undefined;
  };

  return (
    <View style={{ gap: spacing.md }}>
      {question.options.map((option, index) => (
        <QuizOption
          key={option}
          index={index}
          label={option}
          selected={chosen === index}
          result={resultFor(index)}
          onPress={() => {
            if (!answered) {
              setChosen(index);
            }
          }}
        />
      ))}
      {!answered ? (
        <PrimaryButton
          label="Comprobar"
          disabled={chosen === null}
          onPress={() => onAnswer(chosen === question.answer)}
        />
      ) : null}
    </View>
  );
}

export default function EvaluationFlow() {
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { evaluation, questions, isLoading } = useEvaluationForLesson(lessonParam ?? null);
  const { lesson } = useLessonContent(lessonParam ?? null);
  const engine = useEvaluationEngine(questions, lessonParam ?? null);
  const record = useRecordEvaluationResult();
  const { markCompleted } = useModuleProgress();
  const { record: recordLocation } = useSession();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const recordedRef = useRef(false);

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
    if (engine.phase !== 'summary' || !evaluation || recordedRef.current) {
      return;
    }
    recordedRef.current = true;
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
        <EmptyState title="Cargando" message="Preparando la evaluación." />
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
                <AppText color={ok ? colors.success : colors.danger} weight="700">
                  {ok ? '✓' : '✗'}
                </AppText>
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

  const question = engine.question;
  if (!question) {
    return null;
  }

  const isLast = engine.index >= engine.total - 1;

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={`Reactivo ${String(engine.index + 1).padStart(2, '0')} · ${TYPE_LABELS[question.type] ?? question.type}`}
        title="Evaluación"
        trailing={`${engine.index + 1}/${engine.total}`}
      />

      <View style={[styles.progressTrack, { backgroundColor: colors.soft }]}>
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
            answered={engine.answered}
            onAnswer={correct => engine.submit('', correct)}
          />
        ) : (
          <ActivityView
            key={question.id}
            exercise={asExercise(question, lessonParam ?? '')}
            allowReset={false}
            locked={engine.answered}
            onSubmit={(answer, correct) => engine.submit(answer, correct)}
          />
        )}
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
          {question.type === 'mcq' && question.options[question.answer] ? (
            <AppText variant="small" color={colors.success}>
              {`Respuesta correcta: ${question.options[question.answer]}`}
            </AppText>
          ) : null}
          <AppText variant="small">{question.explanation}</AppText>
        </View>
      ) : null}

      {engine.answered ? (
        <PrimaryButton
          label={isLast ? 'Ver resultado' : 'Siguiente reactivo'}
          onPress={engine.next}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}
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
});
