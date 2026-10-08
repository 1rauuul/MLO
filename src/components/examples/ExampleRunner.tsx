import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityView } from '@/components/activities/ActivityView';
import { AppText } from '@/components/AppText';
import { IconButton, PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Chevron } from '@/components/Chevron';
import { Magnifier } from '@/components/Magnifier';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ActivityType, Exercise } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';
import { demoSteps } from '@/viewmodels/exampleLogic';
import { hintsForType } from '@/viewmodels/exerciseHints';

const TYPE_LABELS: Record<ActivityType, string> = {
  order: 'Ordena',
  fill: 'Completa',
  match: 'Enlaza',
  crossword: 'Crucigrama',
  mcq: 'Opción múltiple',
};

interface ExampleRunnerProps {
  exercise: Exercise;
  index: number;
  total: number;
  isLast: boolean;
  onNext: () => void;
  onGoExercises: () => void;
  onBack?: () => void;
}

export function ExampleRunner({
  exercise,
  index,
  total,
  isLast,
  onNext,
  onGoExercises,
  onBack,
}: ExampleRunnerProps) {
  const { colors, radius, spacing } = useTheme();
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [revealedHints, setRevealedHints] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const steps = demoSteps(exercise);
  const hints = hintsForType(exercise.type);
  const pairs = exercise.config.pairs ?? [];
  const label = TYPE_LABELS[exercise.type] ?? exercise.type;

  if (variant === 'A') {
    return (
      <View>
        <ScreenHeader
          onBack={onBack ?? onGoExercises}
          eyebrow={`Ejemplo ${index + 1}/${total} · A · Demostración · ${label}`}
          title={exercise.prompt}
        />

        <AppText variant="eyebrow">Solución completa paso a paso</AppText>

        {pairs.length > 0 ? (
          <View
            style={[styles.table, { borderColor: colors.line, borderRadius: radius.control, marginTop: spacing.md }]}>
            <View style={[styles.tableRow, { backgroundColor: colors.soft, borderTopWidth: 0 }]}>
              <AppText variant="small" weight="700" style={styles.cell}>
                Concepto
              </AppText>
              <AppText variant="small" weight="700" style={styles.cell}>
                Descripción
              </AppText>
            </View>
            {pairs.map((pair, pairIndex) => (
              <View
                key={`${pair.left}-${pairIndex}`}
                style={[styles.tableRow, { borderTopColor: colors.line }]}>
                <AppText variant="small" weight="600" style={styles.cell}>
                  {pair.left}
                </AppText>
                <AppText variant="small" style={styles.cell}>
                  {pair.right}
                </AppText>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.steps, { marginTop: spacing.md }]}>
            {steps.map((step, stepIndex) => (
              <View
                key={`${step.text}-${stepIndex}`}
                style={[styles.node, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
                <AppText variant="code" color={colors.primary} weight="700">
                  {String(stepIndex + 1).padStart(2, '0')}
                </AppText>
                <View style={styles.flex}>
                  <AppText weight="600">{step.text}</AppText>
                  <AppText variant="small" color={colors.muted}>
                    {`Por qué: ${step.why}`}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}

        <PrimaryButton
          compact
          label="Ahora inténtalo tú"
          onPress={() => setVariant('B')}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <View>
      <ScreenHeader
        onBack={() => setVariant('A')}
        eyebrow={`Ejemplo ${index + 1}/${total} · B · Acompañamiento · ${label}`}
        title={exercise.prompt}
      />

      <AppText variant="small" color={colors.muted} style={styles.hint}>
        Resuélvelo tú; si te atoras, usa una pista (no te da la respuesta).
      </AppText>

      <View style={{ marginTop: spacing.md }}>
        <ActivityView exercise={exercise} allowReset onSubmit={() => setAnswered(true)} />
      </View>

      {hints.length > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {hints.slice(0, revealedHints).map((hint, hintIndex) => (
            <View
              key={hint}
              style={[styles.hintBox, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
              <AppText variant="small">{`Pista ${hintIndex + 1}: ${hint}`}</AppText>
            </View>
          ))}
          {revealedHints < hints.length ? (
            <View style={styles.actions}>
              <IconButton
                accessibilityLabel="Ver una pista"
                onPress={() => setRevealedHints(current => current + 1)}>
                <Magnifier color={colors.muted} />
              </IconButton>
            </View>
          ) : null}
        </View>
      ) : null}

      {answered ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {showSolution ? (
            <View
              style={[styles.solution, { borderColor: colors.success, backgroundColor: colors.card, borderRadius: radius.control }]}>
              <AppText variant="eyebrow">Solución completa</AppText>
              <AppText variant="small">{exercise.explanation}</AppText>
            </View>
          ) : null}
          <View style={styles.actions}>
            {showSolution ? null : (
              <SecondaryButton label="Solución" onPress={() => setShowSolution(true)} />
            )}
            {isLast ? (
              <PrimaryButton compact label="Ir a ejercicios" onPress={onGoExercises} />
            ) : (
              <IconButton accessibilityLabel="Siguiente ejemplo" onPress={onNext}>
                <Chevron direction="right" color={colors.primary} />
              </IconButton>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  steps: { gap: 10 },
  node: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderWidth: 1 },
  table: { borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1 },
  cell: { flex: 1, lineHeight: 18, textAlign: 'justify' },
  hint: { lineHeight: 18 },
  hintBox: { padding: 12 },
  solution: { borderWidth: 1, padding: 14, gap: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
});
