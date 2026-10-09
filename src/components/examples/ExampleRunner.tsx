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
  const [hasChecked, setHasChecked] = useState(false);
  const [solveSignal, setSolveSignal] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);

  const steps = demoSteps(exercise);
  const hints = hintsForType(exercise.type);
  const pairs = exercise.config.pairs ?? [];
  const label = TYPE_LABELS[exercise.type] ?? exercise.type;

  const advanceLabel = isLast ? 'Ir a ejercicios' : 'Siguiente ejemplo';
  const nextAction = (
    <IconButton
      accessibilityLabel={advanceLabel}
      disabled={!hasChecked}
      onPress={isLast ? onGoExercises : onNext}>
      <Chevron
        direction="right"
        size={18}
        color={hasChecked ? colors.text : colors.muted}
        strokeWidth={2.2}
      />
    </IconButton>
  );

  if (variant === 'A') {
    return (
      <View>
        <ScreenHeader
          onBack={onBack ?? onGoExercises}
          action={nextAction}
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
        action={nextAction}
        eyebrow={`Ejemplo ${index + 1}/${total} · B · Acompañamiento · ${label}`}
        title={exercise.prompt}
      />

      <AppText variant="small" color={colors.muted} style={styles.hint}>
        Resuélvelo tú; si te atoras, usa una pista (no te da la respuesta).
      </AppText>

      <View style={{ marginTop: spacing.md }}>
        <ActivityView
          exercise={exercise}
          allowReset
          variant="example"
          revealSignal={solveSignal}
          onSubmit={() => setHasChecked(true)}
        />
      </View>

      {solutionShown ? (
        <View
          style={[
            styles.solution,
            {
              borderColor: colors.success,
              backgroundColor: colors.card,
              borderRadius: radius.control,
              marginTop: spacing.md,
            },
          ]}>
          <AppText variant="eyebrow">Solución</AppText>
          <AppText variant="small">{exercise.explanation}</AppText>
        </View>
      ) : null}

      {revealedHints > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {hints.slice(0, revealedHints).map((hint, hintIndex) => (
            <View
              key={hint}
              style={[styles.hintBox, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
              <AppText variant="small">{`Pista ${hintIndex + 1}: ${hint}`}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.controls, { marginTop: spacing.lg }]}>
        <SecondaryButton
          label="Ver pista"
          icon={<Magnifier size={16} color={colors.text} />}
          disabled={revealedHints >= hints.length}
          onPress={() => setRevealedHints(current => Math.min(hints.length, current + 1))}
          style={styles.control}
          accessibilityLabel="Ver pista"
        />
        <SecondaryButton
          label="Ver solución"
          onPress={() => {
            setSolveSignal(current => current + 1);
            setSolutionShown(true);
            setHasChecked(true);
          }}
          style={styles.control}
          accessibilityLabel="Ver solución"
        />
      </View>
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
  controls: { flexDirection: 'row', gap: 12 },
  control: { flex: 1 },
  solution: { borderWidth: 1, padding: 14, gap: 4 },
});
