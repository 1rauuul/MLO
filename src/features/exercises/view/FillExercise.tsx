import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';
import { normalizeAnswer, fillScore, type ExerciseScore, type FillSegment } from '@/features/exercises/viewmodel/exercise.logic';
import type { FillEngine } from '@/features/exercises/viewmodel/useExerciseEngine';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { Icon } from '@/shared/components/Icon';

interface FillExerciseProps {
  engine: FillEngine;
  onSubmit: (answer: string, correct: boolean, score: ExerciseScore) => void;
  showReset?: boolean;
  locked?: boolean;
  variant?: 'default' | 'example';
  hideCheck?: boolean;
}

export function FillExercise({
  engine,
  onSubmit,
  showReset = true,
  locked = false,
  variant = 'default',
  hideCheck = false,
}: FillExerciseProps) {
  const { colors, radius, spacing, scale } = useTheme();
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
    onSubmit(JSON.stringify(engine.assignment), correct, fillScore(engine.ordered, engine.assignment));
  };

  const renderBlank = (blankIndex: number) => {
    const word = engine.assignment[blankIndex] ?? null;
    const expected = engine.answers[blankIndex] ?? '';
    const isActive = engine.activeBlank === blankIndex;
    const correct = word !== null && normalizeAnswer(word) === normalizeAnswer(expected);
    const stateColor = engine.checked
      ? correct
        ? colors.success
        : colors.danger
      : isActive
        ? colors.primary
        : colors.line;
    const stateBackground = engine.checked
      ? `${correct ? colors.success : colors.danger}22`
      : colors.soft;
    return (
      <Text
        key={`blank-${blankIndex}`}
        allowFontScaling={false}
        accessibilityRole="button"
        accessibilityLabel={`Espacio ${blankIndex + 1}${word ? `: ${word}` : ', vacío'}${
          engine.checked ? (correct ? ', correcto' : ', incorrecto') : ''
        }`}
        accessibilityState={{ disabled: locked }}
        onPress={
          locked
            ? undefined
            : () => (word ? engine.clearBlank(blankIndex) : engine.selectBlank(blankIndex))
        }
        style={[
          styles.blank,
          {
            backgroundColor: stateBackground,
            borderColor: stateColor,
            color: word ? colors.text : colors.muted,
            fontSize: 13 * scale,
          },
        ]}>
        {word ?? '_____'}
      </Text>
    );
  };

  const renderSegments = (segments: FillSegment[], sentenceIndex: number) => (
    <AppText key={`s-${sentenceIndex}`} style={[styles.sentence, { fontSize: 14 * scale }]}>
      {segments.map((segment, index) =>
        segment.blank === null ? (
          <Text key={`t-${index}`} allowFontScaling={false}>
            {segment.text}
          </Text>
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
            hitSlop={8}
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

      {hideCheck && !showReset ? null : (
        <View style={[styles.actions, { marginTop: spacing.lg }]}>
          {hideCheck ? null : (
            <PrimaryButton
              label="Comprobar"
              disabled={locked || !complete}
              onPress={check}
              style={styles.action}
            />
          )}
          {showReset ? (
            <SecondaryButton
              label={example ? 'Reiniciar' : 'Reintentar'}
              onPress={engine.reset}
              style={styles.action}
            />
          ) : null}
        </View>
      )}

      {example && engine.checked ? (
        <View
          style={[
            styles.feedback,
            {
              backgroundColor: colors.card,
              borderColor: engine.isCorrect ? colors.success : colors.danger,
              borderRadius: radius.control,
            },
          ]}>
          <View style={styles.feedbackRow}>
            <Icon
              name={engine.isCorrect ? 'check' : 'refresh'}
              size={16}
              color={engine.isCorrect ? colors.success : colors.danger}
              strokeWidth={2.5}
            />
            <AppText color={engine.isCorrect ? colors.success : colors.danger} weight="700">
              {engine.isCorrect ? 'Conceptos completados' : 'Revisa los espacios marcados'}
            </AppText>
          </View>
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
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
