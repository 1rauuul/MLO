import { Pressable, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';

interface HubTileProps {
  icon: string;
  label: string;
  note: string;
  accent: string;
  onPress: () => void;
}

export function HubTile({ icon, label, note, accent, onPress }: HubTileProps) {
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${note}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.tile },
        pressed && !reduced ? { transform: [{ scale: 0.97 }] } : null,
      ]}>
      <View style={[styles.icon, { backgroundColor: `${accent}22` }]}>
        <AppText style={styles.glyph} color={accent}>
          {icon}
        </AppText>
      </View>
      <View>
        <AppText variant="heading" style={styles.label}>
          {label}
        </AppText>
        <AppText variant="small">{note}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    padding: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 22,
    lineHeight: 26,
  },
  label: {
    fontSize: 16,
  },
});
