import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';

export function MetadataBadge({ children, accent = false }: { children: string; accent?: boolean }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.badge,
        {
          borderRadius: radius.pill,
          backgroundColor: accent ? colors.primary : colors.soft,
        },
      ]}>
      <AppText
        variant="code"
        color={accent ? colors.onPrimary : colors.muted}
        style={styles.label}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10,
  },
});
