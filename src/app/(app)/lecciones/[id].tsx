import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { RichContent } from '@/components/RichContent';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/theme/theme-provider';
import { useExercisesForLesson } from '@/viewmodels/useExerciseEngine';
import { useLessonContent } from '@/viewmodels/useLessonContent';
import { useModuleProgress } from '@/viewmodels/useModuleProgress';
import { useEvaluationForLesson } from '@/viewmodels/useQuizEngine';

const SECTION_LABELS = ['Concepto', 'Síntesis'];
const LAST_SECTION = SECTION_LABELS.length - 1;

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? null;
  const { lesson, examples, isLoading } = useLessonContent(lessonId);
  const { exercises } = useExercisesForLesson(lessonId);
  const { evaluation } = useEvaluationForLesson(lessonId);
  const { markCompleted } = useModuleProgress();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [section, setSection] = useState(0);

  if (!isLoading && !lesson) {
    return (
      <Screen>
        <EmptyState title="Sin lección" message="No se encontró la lección solicitada." />
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando el contenido de la lección." />
      </Screen>
    );
  }

  const firstExample = examples[0];
  const firstExercise = exercises[0];

  const finalLabel = firstExample
    ? 'Ver ejemplo'
    : firstExercise
      ? 'Practicar'
      : evaluation
        ? 'Evaluación'
        : 'Terminar';

  const goNext = () => {
    void markCompleted(lesson.id);
    if (firstExample) {
      router.push({ pathname: '/ejemplos/[id]', params: { id: firstExample.id } });
    } else if (firstExercise) {
      router.push({ pathname: '/ejercicios/[id]', params: { id: firstExercise.id, lesson: lesson.id } });
    } else if (evaluation) {
      router.push({ pathname: '/evaluacion', params: { lesson: lesson.id } });
    } else {
      router.back();
    }
  };

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={lesson.eyebrow}
        title="Lecciones"
        trailing={`${section + 1}/${SECTION_LABELS.length}`}
      />

      <View style={[styles.progressTrack, { backgroundColor: colors.soft }]}>
        <View
          style={[
            styles.progressValue,
            { width: `${((section + 1) / SECTION_LABELS.length) * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={styles.tabs}>
        {SECTION_LABELS.map((label, index) => (
          <SecondaryButton
            key={label}
            label={label}
            onPress={() => setSection(index)}
            style={[
              styles.tab,
              { backgroundColor: section === index ? colors.primary : colors.card },
            ]}
          />
        ))}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
        ]}>
        <AppText variant="eyebrow">{section === 0 ? lesson.eyebrow : lesson.title}</AppText>
        <AppText variant="title">{section === 0 ? lesson.title : 'Síntesis'}</AppText>
        {section === 0 && (
          <>
            {lesson.content.length > 0 ? (
              <RichContent blocks={lesson.content} />
            ) : (
              <AppText style={{ marginTop: spacing.sm }}>{lesson.body}</AppText>
            )}
            {lesson.codeSample ? (
              <View style={[styles.code, { backgroundColor: colors.code, borderRadius: radius.control }]}>
                <AppText variant="code" color={colors.text}>
                  {lesson.codeSample}
                </AppText>
              </View>
            ) : null}
          </>
        )}
        {section === 1 && (
          <View style={styles.list}>
            {lesson.synthesis.map(item => (
              <View key={item} style={styles.synthesisRow}>
                <AppText color={colors.success} weight="700">
                  ✓
                </AppText>
                <AppText style={styles.flex}>{item}</AppText>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <SecondaryButton
          label="Anterior"
          disabled={section === 0}
          onPress={() => setSection(Math.max(0, section - 1))}
          style={styles.footerButton}
        />
        <PrimaryButton
          label={section === LAST_SECTION ? finalLabel : 'Continuar'}
          onPress={section === LAST_SECTION ? goNext : () => setSection(Math.min(LAST_SECTION, section + 1))}
          style={styles.footerButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressTrack: {
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressValue: { height: '100%' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingHorizontal: 8 },
  card: { borderWidth: 1, padding: 20, gap: 6 },
  code: { padding: 16, marginTop: 12 },
  list: { marginTop: 12, gap: 10 },
  synthesisRow: { flexDirection: 'row', gap: 10 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  footerButton: { flex: 1 },
});
