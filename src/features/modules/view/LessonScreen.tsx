import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton } from '@/shared/components/Buttons';
import { EmptyState } from '@/shared/components/EmptyState';
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
import { useLessonCatalogId } from '@/features/classes/viewmodel/useActiveGroup';
import { useSession } from '@/features/auth/viewmodel/useSession';

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? null;
  const { lesson, lessonExtras, isLoading, error } = useLessonContent(lessonId);
  const { exercises } = useExercisesForLesson(lessonId);
  const { evaluation } = useEvaluationForLesson(lessonId);
  const { markCompleted } = useModuleProgress();
  const lessonCatalogId = useLessonCatalogId(lessonId);
  const { lessonsByUnit } = useCatalog(lessonCatalogId);
  const { record } = useSession();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();

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
      <ScreenHeader onBack={() => router.back()} title="Lecciones" />

      <View style={styles.reading}>
        {lesson.eyebrow ? <AppText variant="small">{lesson.eyebrow}</AppText> : null}
        <AppText variant="title">{lesson.title}</AppText>

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
      </View>

      <View style={styles.footer}>
        {finalLabel ? (
          <PrimaryButton label={finalLabel} onPress={goNext} style={styles.footerButton} />
        ) : (
          <PrimaryButton compact label="Terminar" onPress={finish} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  reading: { gap: 12 },
  classExtra: { borderWidth: 1, padding: 14, gap: 4 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  footerButton: { flex: 1 },
});
