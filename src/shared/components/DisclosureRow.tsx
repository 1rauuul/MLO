import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Chevron } from '@/shared/components/Chevron';
import { useTheme } from '@/shared/theme/ThemeProvider';

interface DisclosureRowProps {
  label: string;
  expanded: boolean;
  onPress: () => void;
  trailing?: string;
}

/** Fila que abre un bloque largo sin alargar la pantalla de resultados. */
export function DisclosureRow({ label, expanded, onPress, trailing }: DisclosureRowProps) {
  const { colors, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
      <View style={styles.copy}>
        <AppText weight="600">{label}</AppText>
        {trailing ? <AppText variant="small">{trailing}</AppText> : null}
      </View>
      <Chevron direction={expanded ? 'up' : 'down'} size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
});
