import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActivityView } from '@/features/exercises/view/activities/ActivityView';
import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ContinuationButton } from '@/shared/components/ContinuationButton';
import { Magnifier } from '@/features/modules/view/Magnifier';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import type { Example, Exercise } from '@/shared/model/entities';
import { ACTIVITY_TYPE_LABELS as TYPE_LABELS } from '@/shared/utils/activityLabels';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { demoSteps } from '@/features/examples/viewmodel/example.logic';
import { hintsForType } from '@/features/exercises/viewmodel/exercise.hints';

interface ExampleRunnerProps {
  exercise: Exercise;
  example?: Example | null;
  index: number;
  total: number;
  isLast: boolean;
  onNext: () => void;
  onGoExercises: () => void;
  onRedraw?: () => void;
  onBack?: () => void;
}

export function ExampleRunner({
  exercise,
  example,
  index,
  total,
  isLast,
  onNext,
  onGoExercises,
  onRedraw,
  onBack,
}: ExampleRunnerProps) {
  const { colors, radius, spacing } = useTheme();
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [revealedHints, setRevealedHints] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const hasChecked = checkCount > 0;
  const [solveSignal, setSolveSignal] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);

  const steps = example && example.steps.length > 0 ? example.steps : demoSteps(exercise);
  const hints = example && example.hints.length > 0 ? example.hints : hintsForType(exercise.type);
  const title = example?.title ?? exercise.prompt;
  const pairs = exercise.config.pairs ?? [];
  const label = TYPE_LABELS[exercise.type] ?? exercise.type;
  const source = exercise.className ?? example?.className;
  const sourceSuffix = source ? ` · ${source}` : '';

  const advanceLabel = isLast ? 'Finalizar ejemplos' : 'Siguiente ejemplo';
  const nextAction = (
    <ContinuationButton
      label={advanceLabel}
      disabled={!hasChecked}
      revealSignal={checkCount}
      style={{ marginTop: spacing.lg }}
      onPress={isLast ? onGoExercises : onNext} />
  );
  const header = (
    <View style={styles.header}>
      <ScreenHeader onBack={variant === 'B' ? () => setVariant('A') : onBack ?? onGoExercises}
        title="Ejemplos" trailing={`${index + 1}/${total}`} />
      <View style={[styles.phases, { borderColor: colors.line, borderRadius: radius.control }]}>
        <View style={[styles.phase, { backgroundColor: variant === 'A' ? colors.soft : 'transparent' }]}>
          <AppText variant="small" weight="600" color={variant === 'A' ? colors.primary : colors.muted}>1. Demostración</AppText>
        </View>
        <View style={[styles.phase, { backgroundColor: variant === 'B' ? colors.soft : 'transparent' }]}>
          <AppText variant="small" weight="600" color={variant === 'B' ? colors.primary : colors.muted}>2. Acompañamiento</AppText>
        </View>
      </View>
      <AppText variant="small">{`${label}${sourceSuffix}`}</AppText>
      <AppText variant="heading">{title}</AppText>
    </View>
  );

  if (variant === 'A') {
    return (
      <View>
        {header}

        <AppText weight="600">Demostración paso a paso</AppText>

        {pairs.length > 0 && !example ? (
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
                <AppText color={colors.primary} weight="700">
                  {stepIndex + 1}
                </AppText>
                <View style={styles.flex}>
                  <AppText weight="600" style={styles.justified}>
                    {step.text}
                  </AppText>
                  <AppText variant="small" color={colors.muted} style={styles.justified}>
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
        {isLast && onRedraw ? (
          <SecondaryButton
            label="Nuevo sorteo"
            onPress={onRedraw}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View>
      {header}

      <AppText variant="small" color={colors.muted} style={styles.hint}>
        Resuélvelo tú; si te atoras, usa una pista (no te da la respuesta).
      </AppText>

      <View style={{ marginTop: spacing.md }}>
        <ActivityView
          exercise={exercise}
          allowReset
          variant="example"
          revealSignal={solveSignal}
          onSubmit={() => setCheckCount(current => current + 1)}
        />
      </View>

      {nextAction}

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
          <AppText variant="small" style={styles.justified}>
            {exercise.explanation}
          </AppText>
        </View>
      ) : null}

      {revealedHints > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {hints.slice(0, revealedHints).map((hint, hintIndex) => (
            <View
              key={hint}
              style={[styles.hintBox, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
              <AppText variant="small" style={styles.justified}>
                {`Pista ${hintIndex + 1}: ${hint}`}
              </AppText>
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
          style={[styles.control, { borderColor: colors.line }]}
          accessibilityLabel="Ver pista"
        />
        <SecondaryButton
          label="Ver solución"
          onPress={() => {
            setSolveSignal(current => current + 1);
            setSolutionShown(true);
          }}
          style={[styles.control, { borderColor: colors.line }]}
          accessibilityLabel="Ver solución"
        />
      </View>

      {isLast && onRedraw ? (
        <SecondaryButton
          label="Nuevo sorteo"
          onPress={onRedraw}
          style={{ marginTop: spacing.sm }}
        />
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
  cell: { flex: 1, lineHeight: 18 },
  justified: { textAlign: 'justify' },
  hint: { lineHeight: 18 },
  hintBox: { padding: 12 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  control: { flexGrow: 1, flexBasis: '46%', minWidth: 130, borderWidth: 1 },
  solution: { borderWidth: 1, padding: 14, gap: 4 },
  header: { gap: 12, marginBottom: 20 },
  phases: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, overflow: 'hidden' },
  phase: { flex: 1, minWidth: 130, minHeight: 48, padding: 10, justifyContent: 'center' },
});
