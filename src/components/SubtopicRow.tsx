import { Pressable, StyleSheet, View } from 'react-native';

import type { Lesson } from '@/models/entities';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';

interface SubtopicRowProps {
  lesson: Lesson;
  completed: boolean;
  onPress: () => void;
}

export function SubtopicRow({ lesson, completed, onPress }: SubtopicRowProps) {
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();
  const accent = completed ? colors.success : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lesson.code} ${lesson.title}${completed ? ', completado' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: completed ? colors.success : colors.line,
          borderRadius: radius.card,
        },
        pressed && !reduced ? { transform: [{ scale: 0.99 }] } : null,
      ]}>
      <View style={[styles.code, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
        <AppText variant="code" color={accent}>
          {lesson.code}
        </AppText>
      </View>
      <AppText style={styles.title} weight="600">
        {lesson.title}
      </AppText>
      <AppText color={completed ? colors.success : colors.muted} weight="700">
        {completed ? '✓' : '→'}
      </AppText>
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
