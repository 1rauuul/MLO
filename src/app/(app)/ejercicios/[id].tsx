import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton, PrimaryButton } from '@/components/Buttons';
import { EmptyState } from '@/components/EmptyState';
import { FillExercise } from '@/components/FillExercise';
import { MatchExercise } from '@/components/MatchExercise';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ExerciseType } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import {
  useExercise,
  useExerciseEngine,
  useFillEngine,
  useMatchEngine,
  useRecordExerciseResult,
} from '@/viewmodels/useExerciseEngine';

const TYPE_LABELS: Record<ExerciseType, string> = {
  order: 'Ordena',
  fill: 'Completa',
  match: 'Enlaza',
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exercise, isLoading } = useExercise(id ?? null);
  const orderEngine = useExerciseEngine(exercise);
  const fillEngine = useFillEngine(exercise);
  const matchEngine = useMatchEngine(exercise);
  const record = useRecordExerciseResult();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();

  if (!isLoading && !exercise) {
    return (
      <Screen>
        <EmptyState title="Sin ejercicio" message="No se encontró el ejercicio solicitado." />
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando el ejercicio." />
      </Screen>
    );
  }

  const checkOrder = () => {
    orderEngine.submit(correct => {
      void record(exercise.id, JSON.stringify(orderEngine.steps), correct);
    });
  };

  return (
    <Screen>
      <ScreenHeader onBack={() => router.back()} eyebrow="Práctica" title="Ejercicios" />

      <View style={styles.intro}>
        <AppText variant="eyebrow">{`Microejercicio · ${TYPE_LABELS[exercise.type]}`}</AppText>
        <AppText variant="heading">{exercise.prompt}</AppText>
        <AppText variant="small">{exercise.instructions}</AppText>
      </View>

      {exercise.type === 'order' ? (
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.list}>
            {orderEngine.steps.map((step, index) => (
              <View
                key={step}
                style={[
                  styles.row,
                  { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control },
                ]}>
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
                    onPress={() => orderEngine.move(index, -1)}
                    style={{ opacity: index === 0 ? 0.4 : 1 }}
                  />
                  <IconButton
                    glyph="↓"
                    accessibilityLabel={`Bajar ${step}`}
                    onPress={() => orderEngine.move(index, 1)}
                    style={{ opacity: index === orderEngine.steps.length - 1 ? 0.4 : 1 }}
                  />
                </View>
              </View>
            ))}
          </View>

          <PrimaryButton label="Comprobar orden" onPress={checkOrder} style={{ marginTop: spacing.lg }} />

          {orderEngine.checked ? (
            <View
              style={[
                styles.feedback,
                {
                  borderColor: orderEngine.isCorrect ? colors.success : colors.danger,
                  backgroundColor: colors.card,
                  borderRadius: radius.control,
                },
              ]}>
              <AppText color={orderEngine.isCorrect ? colors.success : colors.danger} weight="700">
                {orderEngine.isCorrect ? '✓ Secuencia correcta' : '↻ Revisa el punto de partida'}
              </AppText>
              <AppText variant="small">
                {orderEngine.isCorrect
                  ? 'En la práctica puede iterarse entre estas actividades.'
                  : 'Primero necesitamos comprender el problema y sus requisitos.'}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      {exercise.type === 'fill' ? (
        <View style={{ marginTop: spacing.lg }}>
          <FillExercise
            engine={fillEngine}
            onSubmit={(answer, correct) => {
              void record(exercise.id, answer, correct);
            }}
          />
        </View>
      ) : null}

      {exercise.type === 'match' ? (
        <View style={{ marginTop: spacing.lg }}>
          <MatchExercise
            engine={matchEngine}
            onSubmit={(answer, correct) => {
              void record(exercise.id, answer, correct);
            }}
          />
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
