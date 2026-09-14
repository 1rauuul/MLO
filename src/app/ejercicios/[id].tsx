import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton, PrimaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/theme/theme-provider';
import { useExerciseEngine, useExerciseForLesson, useRecordExerciseResult } from '@/viewmodels/useExerciseEngine';

export default function ExerciseDetailScreen() {
  const { id, lesson } = useLocalSearchParams<{ id: string; lesson?: string }>();
  const { exercise, isLoading } = useExerciseForLesson(lesson ?? null);
  const engine = useExerciseEngine(exercise);
  const record = useRecordExerciseResult();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();

  const current = exercise && exercise.id === id ? exercise : exercise;

  if (!isLoading && !current) {
    return (
      <Screen>
        <EmptyState title="Sin ejercicio" message="No se encontró el ejercicio solicitado." />
      </Screen>
    );
  }

  if (!current) {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando el ejercicio." />
      </Screen>
    );
  }

  const check = () => {
    engine.submit(correct => {
      void record(current.id, JSON.stringify(engine.steps), correct);
    });
  };

  return (
    <Screen>
      <ScreenHeader onBack={() => router.back()} eyebrow="Práctica" title="Ejercicios" trailing="01" />

      <View style={styles.intro}>
        <AppText variant="eyebrow">Microejercicio · Ordena</AppText>
        <AppText variant="heading">{current.prompt}</AppText>
        <AppText variant="small">{current.instructions}</AppText>
      </View>

      <View style={[styles.list, { marginTop: spacing.lg }]}>
        {engine.steps.map((step, index) => (
          <View
            key={step}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
            <AppText variant="code" color={colors.muted}>
              {String(index + 1).padStart(2, '0')}
            </AppText>
            <AppText style={styles.flex} weight="600">
              {step}
            </AppText>
            <View style={styles.controls}>
              <IconButton
                glyph="↑"
                accessibilityLabel={`Subir ${step}`}
                onPress={() => engine.move(index, -1)}
                style={{ opacity: index === 0 ? 0.4 : 1 }}
              />
              <IconButton
                glyph="↓"
                accessibilityLabel={`Bajar ${step}`}
                onPress={() => engine.move(index, 1)}
                style={{ opacity: index === engine.steps.length - 1 ? 0.4 : 1 }}
              />
            </View>
          </View>
        ))}
      </View>

      <PrimaryButton label="Comprobar orden" onPress={check} style={{ marginTop: spacing.lg }} />

      {engine.checked ? (
        <View
          style={[
            styles.feedback,
            {
              borderColor: engine.isCorrect ? colors.success : colors.danger,
              backgroundColor: colors.card,
              borderRadius: radius.control,
            },
          ]}>
          <AppText color={engine.isCorrect ? colors.success : colors.danger} weight="700">
            {engine.isCorrect ? '✓ Secuencia correcta' : '↻ Revisa el punto de partida'}
          </AppText>
          <AppText variant="small">
            {engine.isCorrect
              ? 'En la práctica puede iterarse entre estas actividades.'
              : 'Primero necesitamos comprender el problema y sus requisitos.'}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { gap: 6 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
  },
  controls: { flexDirection: 'row', gap: 6 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
