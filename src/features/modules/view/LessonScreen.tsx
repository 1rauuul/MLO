import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { RichContent } from '@/features/modules/view/RichContent';
import { Screen } from '@/shared/components/Screen';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { nextLessonHref } from '@/shared/utils/navigation/locationRoutes';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { useCatalog } from '@/features/modules/viewmodel/useCatalog';
import { useExercisesForLesson } from '@/features/exercises/viewmodel/useExerciseEngine';
import { useLessonContent } from '@/features/modules/viewmodel/useLessonContent';
import { useModuleProgress } from '@/features/modules/viewmodel/useModuleProgress';
import { useEvaluationForLesson } from '@/features/evaluations/viewmodel/useQuizEngine';
import { useSession } from '@/features/auth/viewmodel/useSession';

const SECTION_LABELS = ['Concepto', 'Síntesis'];
const LAST_SECTION = SECTION_LABELS.length - 1;

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? null;
  const { lesson, lessonExtras, isLoading, error } = useLessonContent(lessonId);
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
        <EmptyState
          title={error ? 'No se pudo cargar' : 'Sin lección'}
          message={error ?? 'No se encontró la lección solicitada.'}
        />
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen>
        <EmptyState loading title="Cargando" message="Preparando el contenido de la lección." />
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
            labelColor={section === index ? colors.onPrimary : undefined}
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

            {lessonExtras.length > 0 && (
              <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                <AppText variant="eyebrow">Contenido de tus clases</AppText>
                {lessonExtras.map(extra => (
                  <View
                    key={extra.id}
                    style={[
                      styles.classExtra,
                      {
                        borderColor: colors.line,
                        backgroundColor: colors.soft,
                        borderRadius: radius.control,
                      },
                    ]}>
                    {extra.classNames.length > 0 && (
                      <AppText variant="eyebrow" color={colors.primary}>
                        {extra.classNames.join(' · ')}
                      </AppText>
                    )}
                    {extra.title ? <AppText variant="heading">{extra.title}</AppText> : null}
                    <RichContent blocks={extra.blocks} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {section === 1 && (
          <View style={styles.list}>
            {lesson.synthesis.map(item => (
              <View key={item} style={styles.synthesisRow}>
                <Icon name="check" size={16} color={colors.success} strokeWidth={2.5} />
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
  classExtra: { borderWidth: 1, padding: 14, gap: 4 },
  code: { padding: 16, marginTop: 12 },
  list: { marginTop: 12, gap: 10 },
  synthesisRow: { flexDirection: 'row', gap: 10 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  footerButton: { flex: 1 },
});
