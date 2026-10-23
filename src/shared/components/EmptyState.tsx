import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';

export function EmptyState({
  title,
  message,
  loading = false,
}: {
  title: string;
  message: string;
  loading?: boolean;
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
      ]}>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Cargando" color={colors.primary} />
      ) : null}
      <AppText variant="heading">{title}</AppText>
      <AppText variant="small">{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 20,
    gap: 8,
    marginTop: 24,
  },
});
