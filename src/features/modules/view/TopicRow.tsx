import { Pressable, StyleSheet, View } from 'react-native';

import type { Topic } from '@/shared/model/entities';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { Icon } from '@/shared/components/Icon';

interface TopicRowProps {
  topic: Topic;
  lessonCount: number;
  completed: boolean;
  onPress: () => void;
}

export function TopicRow({ topic, lessonCount, completed, onPress }: TopicRowProps) {
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();
  const accent = completed ? colors.success : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}, ${lessonCount} lecciones${completed ? ', completado' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !reduced ? { opacity: 0.65 } : null,
      ]}>
      <View style={[styles.marker, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
        <AppText variant="code" color={accent}>
          {String(topic.position + 1).padStart(2, '0')}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText weight="600">{topic.title}</AppText>
        <AppText variant="small">{`${lessonCount} lecciones`}</AppText>
      </View>
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
    paddingVertical: 12,
  },
  marker: {
    width: 44,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
});
