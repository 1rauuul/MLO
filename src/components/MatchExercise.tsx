import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import type { MatchEngine } from '@/viewmodels/useExerciseEngine';

import { AppText } from './AppText';
import { PrimaryButton, SecondaryButton } from './Buttons';

interface MatchExerciseProps {
  engine: MatchEngine;
  onSubmit: (answer: string, correct: boolean) => void;
}

export function MatchExercise({ engine, onSubmit }: MatchExerciseProps) {
  const { colors, radius, spacing } = useTheme();
  const complete = engine.assignment.every(item => item !== null);

  const check = () => {
    const correct = engine.submit();
    onSubmit(JSON.stringify(engine.assignment), correct);
  };

  const leftBorder = (index: number) => {
    const linked = engine.assignment[index];
    if (engine.checked) {
      const ok = linked !== null && engine.rights[linked] === engine.pairs[index]?.right;
      return ok ? colors.success : colors.danger;
    }
    if (engine.selectedLeft === index) {
      return colors.primary;
    }
    return linked !== null ? colors.primary : colors.line;
  };

  const rightBorder = (position: number) => {
    const owner = engine.assignment.indexOf(position);
    if (engine.checked) {
      const ok = owner !== -1 && engine.rights[position] === engine.pairs[owner]?.right;
      return ok ? colors.success : colors.danger;
    }
    return owner !== null && owner !== -1 ? colors.primary : colors.line;
  };

  return (
    <View>
      <AppText variant="small" style={[styles.hint, { color: colors.muted }]}>
        Toca un concepto y después la definición que le corresponde.
      </AppText>

      <View style={[styles.columns, { marginTop: spacing.md }]}>
        <View style={styles.column}>
          {engine.lefts.map((left, index) => {
            const linked = engine.assignment[index];
            return (
              <Pressable
                key={left}
                accessibilityRole="button"
                accessibilityState={{ selected: engine.selectedLeft === index }}
                accessibilityLabel={`Concepto ${left}`}
                onPress={() => engine.selectLeft(index)}
                style={[
                  styles.item,
                  { backgroundColor: colors.card, borderColor: leftBorder(index), borderRadius: radius.control },
                ]}>
                <AppText variant="small" weight="600" style={styles.flex}>
                  {left}
                </AppText>
                {linked !== null ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <AppText variant="small" color={colors.onPrimary} weight="700">
                      {linked + 1}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.column}>
          {engine.rights.map((right, position) => {
            const owner = engine.assignment.indexOf(position);
            return (
              <Pressable
                key={right}
                accessibilityRole="button"
                accessibilityLabel={`Definición ${right}`}
                onPress={() => engine.selectRight(position)}
                style={[
                  styles.item,
                  { backgroundColor: colors.card, borderColor: rightBorder(position), borderRadius: radius.control },
                ]}>
                <View style={[styles.badge, { backgroundColor: owner !== -1 ? colors.primary : colors.soft }]}>
                  <AppText variant="small" color={owner !== -1 ? colors.onPrimary : colors.muted} weight="700">
                    {position + 1}
                  </AppText>
                </View>
                <AppText variant="small" style={styles.flex}>
                  {right}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        <PrimaryButton label="Comprobar" disabled={!complete} onPress={check} style={styles.action} />
        <SecondaryButton label="Reintentar" onPress={engine.reset} style={styles.action} />
      </View>

      {engine.checked ? (
        <View
          style={[
            styles.feedback,
            {
              backgroundColor: colors.card,
              borderColor: engine.isCorrect ? colors.success : colors.danger,
              borderRadius: radius.control,
            },
          ]}>
          <AppText color={engine.isCorrect ? colors.success : colors.danger} weight="700">
            {engine.isCorrect ? '✓ Conceptos enlazados' : '↻ Hay enlaces que no corresponden'}
          </AppText>
          <AppText variant="small">
            {engine.isCorrect
              ? 'Cada concepto quedó con su definición correcta.'
              : 'Toca un concepto y elige otra definición para corregir.'}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { lineHeight: 18 },
  columns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    minHeight: 52,
  },
  flex: { flex: 1 },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
