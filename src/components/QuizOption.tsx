import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';
import { Icon } from './Icon';

export type QuizOptionResult = 'correct' | 'wrong';

interface QuizOptionProps {
  index: number;
  label: string;
  selected: boolean;
  result?: QuizOptionResult;
  onPress: () => void;
}

export function QuizOption({ index, label, selected, result, onPress }: QuizOptionProps) {
  const { colors, radius } = useTheme();
  const letter = String.fromCharCode(65 + index);
  const borderColor =
    result === 'correct'
      ? colors.success
      : result === 'wrong'
        ? colors.danger
        : selected
          ? colors.primary
          : colors.line;

  const mark =
    result === 'correct' ? (
      <Icon name="check" size={16} color={borderColor} strokeWidth={2.5} />
    ) : result === 'wrong' ? (
      <Icon name="close" size={16} color={borderColor} strokeWidth={2.5} />
    ) : (
      <AppText variant="code" color={borderColor} weight="700">
        {letter}
      </AppText>
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!result, selected }}
      accessibilityLabel={`Opción ${letter}: ${label}${result === 'correct' ? ', correcta' : result === 'wrong' ? ', incorrecta' : ''}`}
      disabled={!!result}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { borderColor, backgroundColor: colors.card, borderRadius: radius.control },
        pressed && !result ? { opacity: 0.85 } : null,
      ]}>
      <View style={[styles.letter, { backgroundColor: colors.soft }]}>{mark}</View>
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  letter: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 14,
  },
});
