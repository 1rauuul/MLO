import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { initials } from '@/features/auth/viewmodel/auth.logic';
import type { CourseLibraryEntry } from '@/features/modules/viewmodel/useCourseLibrary';

function groupName(className: string, title: string): string {
  const prefix = `${title} · `;
  return className.startsWith(prefix) ? className.slice(prefix.length) : className;
}

export function CourseCard({
  entry,
  onPress,
}: {
  entry: CourseLibraryEntry;
  onPress: () => void;
}) {
  const { colors, radius } = useTheme();
  const group = entry.className ? groupName(entry.className, entry.title) : null;
  const level = entry.level?.trim() ?? '';
  const labelParts = [`Curso ${entry.title}`];
  if (group) {
    labelParts.push(group);
  }
  if (level) {
    labelParts.push(`Nivel ${level}`);
  }
  const accessibilityLabel = labelParts.join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: entry.isActive }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: entry.isActive ? colors.primary : colors.line,
          borderRadius: radius.card,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={styles.top}>
        <View style={[styles.badge, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
          <AppText color={colors.primary} weight="700">
            {initials(entry.title)}
          </AppText>
        </View>
        <Chevron direction="right" size={20} color={colors.muted} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        <AppText variant="heading">
          {entry.title}
        </AppText>
        {group ? (
          <AppText variant="small" numberOfLines={1}>
            {group}
          </AppText>
        ) : null}
        {entry.description ? <AppText variant="small">{entry.description}</AppText> : null}
        {level ? (
          <AppText variant="small" numberOfLines={1}>
            {`Nivel: ${level}`}
          </AppText>
        ) : null}
      </View>
      <View style={styles.top}>
        {entry.unitCount !== undefined ? <AppText variant="small">{`${entry.unitCount} ${entry.unitCount === 1 ? 'unidad' : 'unidades'}`}</AppText> : <View />}
        <AppText variant="small">{`${entry.percent}% completado`}</AppText>
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel={`Progreso de ${entry.title}`}
        accessibilityValue={{ min: 0, max: 100, now: entry.percent }} style={[styles.track, { backgroundColor: colors.soft }]}>
        <View style={[styles.fill, { backgroundColor: colors.primary, width: `${Math.max(0, Math.min(100, entry.percent))}%` }]} />
      </View>
      <AppText color={colors.primary} weight="600">{entry.percent >= 100 ? 'Repasar curso' : entry.percent > 0 ? 'Continuar aprendizaje' : 'Comenzar curso'}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 18,
    borderWidth: 1,
  },
  badge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  track: { height: 6, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%' },
});
