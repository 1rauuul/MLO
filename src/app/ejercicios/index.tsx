import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';


import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/theme-provider';
import { useExerciseForLesson } from '@/viewmodels/useExerciseEngine';

export default function ExercisesScreen() {
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const { exercise, isLoading } = useExerciseForLesson(lessonParam ?? null);
  const router = useRouter();
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow="Práctica"
        title="Ejercicios"
        trailing={exercise ? '01' : '00'}
      />
      {!isLoading && !exercise ? (
        <EmptyState
          title="Sin ejercicios"
          message="Este tema aún no tiene ejercicios. Se agregarán en una próxima actualización."
        />
      ) : null}
      {exercise ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ejercicio: ${exercise.prompt}`}
          onPress={() =>
            router.push({
              pathname: '/ejercicios/[id]',
              params: { id: exercise.id, lesson: exercise.lessonId },
            })
          }
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
            pressed && !reduced ? { transform: [{ scale: 0.99 }] } : null,
          ]}>
          <AppText variant="eyebrow">Microejercicio · Ordena</AppText>
          <AppText variant="heading">{exercise.prompt}</AppText>
          <AppText variant="small">{exercise.instructions}</AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 18, gap: 8 },
});
