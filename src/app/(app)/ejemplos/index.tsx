import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chevron } from '@/components/Chevron';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ActivityType } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { useExercisesForLesson } from '@/viewmodels/useExerciseEngine';
import { useLessonContent } from '@/viewmodels/useLessonContent';

const TYPE_LABELS: Record<ActivityType, string> = {
  order: 'Ordena',
  fill: 'Completa',
  match: 'Enlaza',
  crossword: 'Crucigrama',
  mcq: 'Opción múltiple',
};

export default function ExamplesScreen() {
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { lesson } = useLessonContent(lessonParam ?? null);
  const { exercises } = useExercisesForLesson(lessonParam ?? null);
  const router = useRouter();
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={lesson ? `Tema ${lesson.code}` : 'Ejemplos'}
        title="Ejemplos guiados"
        trailing={String(exercises.length)}
      />

      {exercises.length === 0 ? (
        <EmptyState title="Sin ejemplos" message="Este tema aún no tiene ejercicios para ejemplificar." />
      ) : (
        <View style={styles.list}>
          {exercises.map((exercise, index) => (
            <Pressable
              key={exercise.id}
              accessibilityRole="button"
              accessibilityLabel={`Ejemplo ${index + 1} de ${TYPE_LABELS[exercise.type] ?? exercise.type}`}
              onPress={() =>
                router.push({
                  pathname: '/ejemplos/[id]',
                  params: { id: exercise.id, lesson: exercise.lessonId },
                })
              }
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
                pressed && !reduced ? { transform: [{ scale: 0.99 }] } : null,
              ]}>
              <AppText variant="eyebrow">
                {`Ejemplo ${String(index + 1).padStart(2, '0')} · ${TYPE_LABELS[exercise.type] ?? exercise.type}`}
              </AppText>
              <AppText variant="heading">{exercise.prompt}</AppText>
              <AppText variant="small" color={colors.muted}>
                Demostración paso a paso + acompañamiento con pistas
              </AppText>
              <View style={styles.go}>
                <AppText variant="small" color={colors.primary} weight="600">
                  Ver ejemplo
                </AppText>
                <Chevron direction="right" size={16} color={colors.primary} strokeWidth={2.2} />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { borderWidth: 1, padding: 18, gap: 6 },
  go: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
