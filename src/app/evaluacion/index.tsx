import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton, PrimaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { QuizOption, type QuizOptionResult } from '@/components/QuizOption';
import { ResultModal } from '@/components/ResultModal';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme/theme-provider';
import { useLearnerProfile } from '@/viewmodels/useLearnerProfile';
import { useModuleProgress } from '@/viewmodels/useModuleProgress';
import {
  useEvaluationForLesson,
  useQuizEngine,
  useRecordEvaluationResult,
} from '@/viewmodels/useQuizEngine';

export default function EvaluationScreen() {
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { evaluation, questions, isLoading } = useEvaluationForLesson(lessonParam ?? null);
  const quiz = useQuizEngine(questions);
  const record = useRecordEvaluationResult();
  const { markCompleted } = useModuleProgress();
  const { profile } = useLearnerProfile();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!quiz.finished || !evaluation || recordedRef.current) {
      return;
    }
    recordedRef.current = true;
    void record(evaluation.id, quiz.score, quiz.correctCount, quiz.total);
    if (lessonParam) {
      void markCompleted(lessonParam);
    }
  }, [quiz.finished, evaluation, quiz.score, quiz.correctCount, quiz.total, record, markCompleted, lessonParam]);

  if (!isLoading && !evaluation) {
    return (
      <Screen>
        <EmptyState
          title="Sin evaluación"
          message="Este tema aún no tiene evaluación. Se agregará en una próxima actualización."
        />
      </Screen>
    );
  }

  if (!evaluation || !quiz.question) {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando la evaluación." />
      </Screen>
    );
  }

  const resultFor = (index: number): QuizOptionResult | undefined => {
    if (quiz.chosen === null) {
      return undefined;
    }
    if (index === quiz.question?.answer) {
      return 'correct';
    }
    return index === quiz.chosen ? 'wrong' : undefined;
  };

  const isLast = quiz.index === quiz.total - 1;

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          glyph="×"
          accessibilityLabel="Cerrar evaluación"
          onPress={() => router.back()}
        />
        <View style={styles.flex}>
          <AppText variant="eyebrow">Comprobación de aprendizaje</AppText>
          <AppText weight="700" style={styles.headerTitle}>
            Evaluación
          </AppText>
        </View>
        <AppText variant="code">{`${quiz.index + 1}/${quiz.total}`}</AppText>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.soft }]}>
        <View
          style={[
            styles.progressValue,
            {
              width: `${((quiz.index + 1) / quiz.total) * 100}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      <AppText variant="eyebrow">{`Pregunta ${String(quiz.index + 1).padStart(2, '0')}`}</AppText>
      <AppText variant="heading" style={styles.prompt}>
        {quiz.question.prompt}
      </AppText>

      <View style={[styles.options, { marginTop: spacing.lg }]}>
        {quiz.question.options.map((option, index) => (
          <QuizOption
            key={option}
            index={index}
            label={option}
            selected={quiz.chosen === index}
            result={resultFor(index)}
            onPress={() => quiz.choose(index)}
          />
        ))}
      </View>

      {quiz.chosen !== null ? (
        <View
          style={[
            styles.feedback,
            { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
          ]}>
          <AppText
            weight="700"
            color={quiz.chosen === quiz.question.answer ? colors.success : colors.danger}>
            {quiz.chosen === quiz.question.answer ? '✓ Respuesta correcta' : '! Aún no'}
          </AppText>
          <AppText variant="small">{quiz.question.explanation}</AppText>
        </View>
      ) : null}

      <PrimaryButton
        label={isLast ? 'Ver resultado' : 'Siguiente pregunta'}
        disabled={quiz.chosen === null}
        onPress={quiz.next}
        style={{ marginTop: spacing.lg }}
      />

      <ResultModal
        visible={quiz.finished}
        learnerName={profile?.learnerName ?? 'Valentina Ríos'}
        score={quiz.score}
        onClose={() => router.back()}
        onRetry={() => {
          recordedRef.current = false;
          quiz.restart();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  headerTitle: { fontSize: 15 },
  progressTrack: { height: 4, borderRadius: 99, overflow: 'hidden', marginBottom: 20 },
  progressValue: { height: '100%' },
  prompt: { marginTop: 8 },
  options: { gap: 10 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
