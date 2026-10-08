import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { normalizeAnswer, type FillSegment } from '@/viewmodels/exerciseLogic';
import type { FillEngine } from '@/viewmodels/useExerciseEngine';

import { AppText } from './AppText';
import { PrimaryButton, SecondaryButton } from './Buttons';

interface FillExerciseProps {
  engine: FillEngine;
  onSubmit: (answer: string, correct: boolean) => void;
  showReset?: boolean;
  locked?: boolean;
  variant?: 'default' | 'example';
}

export function FillExercise({
  engine,
  onSubmit,
  showReset = true,
  locked = false,
  variant = 'default',
}: FillExerciseProps) {
  const { colors, radius, spacing } = useTheme();
  const example = variant === 'example';
  const complete = engine.assignment.every(item => item !== null);
  const errors = engine.assignment.filter((word, index) => {
    if (word === null) {
      return false;
    }
    return normalizeAnswer(word) !== normalizeAnswer(engine.answers[index] ?? '');
  }).length;

  const check = () => {
    const correct = engine.submit();
    onSubmit(JSON.stringify(engine.assignment), correct);
  };

  const renderBlank = (blankIndex: number) => {
    const word = engine.assignment[blankIndex];
    const expected = engine.answers[blankIndex];
    const isActive = engine.activeBlank === blankIndex;
    const stateColor = engine.checked
      ? word !== null && normalizeAnswer(word) === normalizeAnswer(expected ?? '')
        ? colors.success
        : colors.danger
      : isActive
        ? colors.primary
        : colors.line;
    return (
      <Text
        key={`blank-${blankIndex}`}
        onPress={
          locked
            ? undefined
            : () => (word ? engine.clearBlank(blankIndex) : engine.selectBlank(blankIndex))
        }
        style={[
          styles.blank,
          {
            backgroundColor: colors.soft,
            borderColor: stateColor,
            color: word ? colors.text : colors.muted,
          },
        ]}>
        {word ?? '_____'}
      </Text>
    );
  };

  const renderSegments = (segments: FillSegment[], sentenceIndex: number) => (
    <AppText key={`s-${sentenceIndex}`} style={styles.sentence}>
      {segments.map((segment, index) =>
        segment.blank === null ? (
          <Text key={`t-${index}`}>{segment.text}</Text>
        ) : (
          renderBlank(segment.blank)
        ),
      )}
    </AppText>
  );

  return (
    <View>
      {example ? (
        <AppText variant="small" color={colors.muted} style={styles.instruction}>
          Toca una palabra y después un espacio. Toca una respuesta para devolverla al banco.
        </AppText>
      ) : null}

      <View style={styles.sentences}>{engine.sentences.map(renderSegments)}</View>

      {example ? <AppText variant="eyebrow" style={styles.bankLabel}>Palabras disponibles</AppText> : null}
      <View style={[styles.bank, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
        {engine.bank.map((word, index) => (
          <Pressable
            key={`${word}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`Palabra ${word}`}
            accessibilityState={{ disabled: locked || engine.used[index] }}
            disabled={locked || engine.used[index]}
            onPress={() => engine.placeWord(index)}
            style={[
              styles.chip,
              {
                backgroundColor: colors.card,
                borderColor: colors.line,
                borderRadius: radius.pill,
                opacity: locked || engine.used[index] ? 0.35 : 1,
              },
            ]}>
            <AppText variant="small" weight="600">
              {word}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        <PrimaryButton
          label="Comprobar"
          disabled={locked || !complete}
          onPress={check}
          style={styles.action}
        />
        {showReset ? (
          <SecondaryButton
            label={example ? 'Reiniciar' : 'Reintentar'}
            onPress={engine.reset}
            style={styles.action}
          />
        ) : null}
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
            {engine.isCorrect ? '✓ Conceptos completados' : '↻ Revisa los espacios marcados'}
          </AppText>
          {example ? (
            engine.isCorrect ? (
              <AppText variant="small">
                Las frases quedaron completas con los términos correctos.
              </AppText>
            ) : (
              <AppText variant="small">
                {errors === 1
                  ? 'Hay 1 respuesta por revisar. El espacio incorrecto está marcado. Puedes cambiarla y volver a comprobar.'
                  : `Hay ${errors} respuestas por revisar. Los espacios incorrectos están marcados. Puedes cambiarlas y volver a comprobar.`}
              </AppText>
            )
          ) : (
            <AppText variant="small">
              {engine.isCorrect
                ? 'Las frases quedaron completas con los términos correctos.'
                : 'Toca un espacio ocupado para devolver su palabra al banco.'}
            </AppText>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  instruction: { lineHeight: 18, marginBottom: 12 },
  bankLabel: { marginTop: 12 },
  sentences: { gap: 14 },
  sentence: { fontSize: 14, lineHeight: 26 },
  blank: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
  feedback: { borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
});
