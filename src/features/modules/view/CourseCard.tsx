import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { initials } from '@/features/auth/viewmodel/auth.logic';
import type { CourseLibraryEntry } from '@/features/modules/viewmodel/useCourseLibrary';

export function CourseCard({
  entry,
  onPress,
}: {
  entry: CourseLibraryEntry;
  onPress: () => void;
}) {
  const { colors, radius } = useTheme();
  const subtitle = entry.className
    ? `Clase · ${entry.className} · ${entry.percent}%`
    : `Curso disponible · ${entry.percent}%`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Curso ${entry.title}, ${subtitle}`}
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
      <View style={[styles.badge, { backgroundColor: colors.soft, borderRadius: radius.control }]}>
        <AppText variant="code" color={colors.primary} weight="700">
          {initials(entry.title)}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText weight="600" numberOfLines={2}>
          {entry.title}
        </AppText>
        <AppText variant="small" numberOfLines={2}>
          {subtitle}
        </AppText>
      </View>
      <Chevron direction="right" size={18} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
    borderWidth: 1,
  },
  badge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 3 },
});
