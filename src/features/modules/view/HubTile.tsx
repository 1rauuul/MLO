import { Pressable, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';
import { Icon, type IconName } from '@/shared/components/Icon';
import { Chevron } from '@/shared/components/Chevron';

interface HubTileProps {
  icon: IconName;
  label: string;
  note: string;
  accent: string;
  onPress: () => void;
  status?: string;
}

export function HubTile({ icon, label, note, accent, onPress, status }: HubTileProps) {
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${note}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.card,
          borderColor: colors.line,
          borderRadius: radius.card,
        },
        pressed && !reduced ? { transform: [{ scale: 0.97 }] } : null,
      ]}>
      <View style={[styles.icon, { backgroundColor: `${accent}1C` }]}>
        <Icon name={icon} size={22} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        <AppText variant="heading" style={styles.label}>
          {label}
        </AppText>
        <AppText variant="small">{note}</AppText>
        {status ? <AppText variant="small" color={accent} weight="600">{status}</AppText> : null}
      </View>
      <Chevron direction="right" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
  },
  copy: { flex: 1, minWidth: 0, gap: 3 },
});
