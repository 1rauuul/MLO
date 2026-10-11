import { Pressable, StyleSheet, View } from 'react-native';

import type { Lesson } from '@/models/entities';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';
import { Chevron } from './Chevron';
import { Icon } from './Icon';

interface SubtopicRowProps {
  lesson: Lesson;
  completed: boolean;
  onPress: () => void;
  inline?: boolean;
}

export function SubtopicRow({ lesson, completed, onPress, inline = false }: SubtopicRowProps) {
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();
  const accent = completed ? colors.success : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lesson.code} ${lesson.title}${completed ? ', completado' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        inline
          ? styles.inlineRow
          : [
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: completed ? colors.success : colors.line,
                borderRadius: radius.card,
              },
            ],
        pressed && !reduced ? (inline ? { opacity: 0.65 } : { transform: [{ scale: 0.99 }] }) : null,
      ]}>
      <View style={[styles.code, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
        <AppText variant="code" color={accent}>
          {lesson.code}
        </AppText>
      </View>
      <AppText style={styles.title} weight="600">
        {lesson.title}
      </AppText>
      {completed ? (
        <Icon name="check" size={17} color={colors.success} strokeWidth={2.5} />
      ) : (
        <Chevron direction="right" size={16} color={colors.muted} strokeWidth={2.2} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
    borderWidth: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
  },
  code: {
    width: 44,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 14,
  },
});
