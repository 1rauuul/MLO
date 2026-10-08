import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { RichContent } from '@/components/RichContent';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { nextLessonHref } from '@/navigation/locationRoutes';
import { useTheme } from '@/theme/theme-provider';
import { useCatalog } from '@/viewmodels/useCatalog';
import { useExercisesForLesson } from '@/viewmodels/useExerciseEngine';
import { useLessonContent } from '@/viewmodels/useLessonContent';
import { useModuleProgress } from '@/viewmodels/useModuleProgress';
import { useEvaluationForLesson } from '@/viewmodels/useQuizEngine';
import { useSession } from '@/viewmodels/useSession';

const SECTION_LABELS = ['Concepto', 'Síntesis'];
const LAST_SECTION = SECTION_LABELS.length - 1;

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? null;
  const { lesson, isLoading } = useLessonContent(lessonId);
  const { exercises } = useExercisesForLesson(lessonId);
  const { evaluation } = useEvaluationForLesson(lessonId);
  const { markCompleted } = useModuleProgress();
  const { lessonsByUnit } = useCatalog();
  const { record } = useSession();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [section, setSection] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (lesson) {
        record({
          unitId: lesson.unitId,
          lessonId: lesson.id,
          lessonCode: lesson.code,
          section: 'lesson',
        });
      }
    }, [lesson, record]),
  );

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

  const firstExercise = exercises[0];

  const finalLabel = firstExercise
    ? 'Ver ejemplos'
    : evaluation
      ? 'Evaluación'
      : null;

  const goNext = () => {
    void markCompleted(lesson.id);
    if (firstExercise) {
      router.push({ pathname: '/ejemplos', params: { lesson: lesson.id } });
    } else if (evaluation) {
      router.push({ pathname: '/evaluacion', params: { lesson: lesson.id } });
    }
  };

  const finish = () => {
    void markCompleted(lesson.id);
    router.navigate(nextLessonHref(lessonsByUnit[lesson.unitId] ?? [], lesson.id));
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
              <AppText style={{ marginTop: spacing.sm, textAlign: 'justify' }}>{lesson.body}</AppText>
            )}
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
        {section === LAST_SECTION ? (
          finalLabel ? (
            <PrimaryButton label={finalLabel} onPress={goNext} style={styles.footerButton} />
          ) : (
            <PrimaryButton compact label="Terminar" onPress={finish} />
          )
        ) : (
          <PrimaryButton
            label="Continuar"
            onPress={() => setSection(Math.min(LAST_SECTION, section + 1))}
            style={styles.footerButton}
          />
        )}
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
