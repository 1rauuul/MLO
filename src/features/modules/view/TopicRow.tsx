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
  const started = progress > 0;
  const statusColor = completed ? colors.success : started ? colors.primary : colors.muted;
  const status = completed
    ? 'Completado'
    : started
      ? `En progreso · ${progress}%`
      : 'Sin comenzar';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}, ${status.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.soft, borderRadius: radius.control },
        pressed && !reduced ? { opacity: 0.7 } : null,
      ]}>
      <View style={[styles.marker, { backgroundColor: colors.card, borderRadius: radius.control }]}>
        <AppText variant="small" weight="700" color={statusColor}>
          {`${unitNumber}.${topic.position + 1}`}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText weight="600">{topic.title}</AppText>
        <View style={styles.status}>
          {completed ? (
            <Icon name="check" size={13} color={statusColor} strokeWidth={2.5} />
          ) : null}
          <AppText variant="small" weight="600" color={statusColor}>
            {status}
          </AppText>
        </View>
        {started && !completed ? (
          <View style={[styles.track, { backgroundColor: colors.line }]}>
            <View
              style={[
                styles.fill,
                { width: `${progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        ) : null}
      </View>
      <Chevron direction="right" size={16} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  marker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  track: { height: 3, borderRadius: 999, overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', borderRadius: 999 },
});
