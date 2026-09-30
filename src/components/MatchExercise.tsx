import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import type { MatchEngine } from '@/viewmodels/useExerciseEngine';

import { AppText } from './AppText';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { accentForIndex } from './activities/accents';

interface MatchExerciseProps {
  engine: MatchEngine;
  onSubmit: (answer: string, correct: boolean) => void;
  showReset?: boolean;
}

export function MatchExercise({ engine, onSubmit, showReset = true }: MatchExerciseProps) {
  const { colors, radius, spacing } = useTheme();
  const complete = engine.assignment.every(item => item !== null);

  const check = () => {
    const correct = engine.submit();
    onSubmit(JSON.stringify(engine.assignment), correct);
  };

  const leftCorrect = (index: number): boolean => {
    const linked = engine.assignment[index];
    return linked !== null && engine.rights[linked] === engine.pairs[index]?.right;
  };

  return (
    <View>
      <AppText variant="small" style={[styles.hint, { color: colors.muted }]}>
        Toca un concepto y después la definición que le corresponde. Cada par se marca con su color.
      </AppText>

      <View style={[styles.columns, { marginTop: spacing.md }]}>
        <View style={styles.column}>
          {engine.lefts.map((left, index) => {
            const accent = accentForIndex(index);
            const selected = engine.selectedLeft === index;
            const correct = leftCorrect(index);
            return (
              <Pressable
                key={left}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Concepto ${left}`}
                onPress={() => engine.selectLeft(index)}
                style={[
                  styles.item,
                  {
                    backgroundColor: selected ? `${accent}1F` : colors.card,
                    borderColor: accent,
                    borderWidth: selected ? 3 : 2,
                    borderRadius: radius.control,
                  },
                ]}>
                <View style={[styles.badge, { backgroundColor: accent }]}>
                  <AppText variant="small" color={colors.onPrimary} weight="700">
                    {index + 1}
                  </AppText>
                </View>
                <AppText variant="small" weight="600" style={styles.flex}>
                  {left}
                </AppText>
                {engine.checked ? (
                  <AppText color={correct ? colors.success : colors.danger} weight="700">
                    {correct ? '✓' : '✗'}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.column}>
          {engine.rights.map((right, position) => {
            const owner = engine.assignment.indexOf(position);
            const accent = owner === -1 ? colors.line : accentForIndex(owner);
            const correct = owner !== -1 && leftCorrect(owner);
            return (
              <Pressable
                key={right}
                accessibilityRole="button"
                accessibilityLabel={`Definición ${right}`}
                onPress={() => engine.selectRight(position)}
                style={[
                  styles.item,
                  {
                    backgroundColor: owner === -1 ? colors.card : `${accent}14`,
                    borderColor: accent,
                    borderWidth: owner === -1 ? 1 : 2,
                    borderRadius: radius.control,
                    opacity: engine.selectedLeft === null && owner === -1 ? 0.85 : 1,
                  },
                ]}>
                <View style={[styles.badge, { backgroundColor: owner === -1 ? colors.soft : accent }]}>
                  <AppText
                    variant="small"
                    color={owner === -1 ? colors.muted : colors.onPrimary}
                    weight="700">
                    {owner === -1 ? position + 1 : owner + 1}
                  </AppText>
                </View>
                <AppText variant="small" style={styles.flex}>
                  {right}
                </AppText>
                {engine.checked && owner !== -1 ? (
                  <AppText color={correct ? colors.success : colors.danger} weight="700">
                    {correct ? '✓' : '✗'}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        <PrimaryButton label="Comprobar" disabled={!complete} onPress={check} style={styles.action} />
        {showReset ? <SecondaryButton label="Reintentar" onPress={engine.reset} style={styles.action} /> : null}
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
    borderWidth: 2,
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
