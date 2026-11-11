import { Pressable, StyleSheet, View } from 'react-native';

import type { Topic } from '@/shared/model/entities';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { Icon } from '@/shared/components/Icon';

interface TopicRowProps {
  topic: Topic;
  unitNumber: number;
  /** Lecciones completadas sobre el total del subtema. */
  progress: number;
  completed: boolean;
  onPress: () => void;
}

export function TopicRow({ topic, unitNumber, progress, completed, onPress }: TopicRowProps) {
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();
  const accent = completed ? colors.success : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}, ${progress}% completado${completed ? '' : ', en progreso'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && !reduced ? { opacity: 0.65 } : null]}>
      <View style={[styles.marker, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
        <AppText variant="code" color={accent}>
          {`${unitNumber}.${topic.position + 1}`}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText weight="600">{topic.title}</AppText>
        <AppText variant="small">{`${progress}%`}</AppText>
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
