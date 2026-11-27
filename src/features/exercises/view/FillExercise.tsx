import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';
import { normalizeAnswer, fillScore, type ExerciseScore, type FillSegment } from '@/features/exercises/viewmodel/exercise.logic';
import type { FillEngine } from '@/features/exercises/viewmodel/useExerciseEngine';

import { AppText } from '@/shared/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ActivityFeedback } from '@/features/exercises/view/activities/ActivityFeedback';

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
    const isActive = engine.activeBlank === blankIndex;
    const result = engine.blankStates[blankIndex] ?? null;
    const stateColor = result === 'correct'
      ? colors.success
      : result === 'wrong'
        ? colors.danger
        : isActive
          ? colors.primary
          : colors.line;
    const stateBackground = result
      ? `${result === 'correct' ? colors.success : colors.danger}12`
      : 'transparent';
    return (
      <Text
        key={`blank-${blankIndex}`}
        allowFontScaling={false}
        accessibilityRole="button"
        accessibilityLabel={`Espacio ${blankIndex + 1}${word ? `: ${word}` : ', vacío'}${
          result === 'correct' ? ', correcto' : result === 'wrong' ? ', incorrecto' : ''
        }`}
        accessibilityHint={result === 'wrong' ? 'Respuesta por revisar. Toca para devolverla al banco.' : undefined}
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
            fontSize: 16 * scale,
            borderBottomWidth: result === 'wrong' ? 2 : 1,
          },
        ]}>
        {word ?? '_____'}
      </Text>
    );
  };

  const renderSegments = (segments: FillSegment[], sentenceIndex: number) => (
    <AppText key={`s-${sentenceIndex}`} style={[styles.sentence, { fontSize: 16 * scale, lineHeight: 25 * scale }]}>
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
        <ActivityFeedback
          correct={engine.isCorrect}
          title={engine.isCorrect ? 'Conceptos completados' : 'Revisa los espacios marcados'}
          message={
            engine.isCorrect
              ? 'Las frases quedaron completas con los términos correctos.'
              : errors === 1
                ? 'Hay 1 respuesta por revisar. El espacio incorrecto está marcado. Puedes cambiarla y volver a comprobar.'
                : `Hay ${errors} respuestas por revisar. Los espacios incorrectos están marcados. Puedes cambiarlas y volver a comprobar.`
          }
        />
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
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 2,
    paddingVertical: 0,
    fontSize: 13,
    fontWeight: '400',
  },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, marginTop: 8 },
  chip: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
