import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';

export function EmptyState({ title, message }: { title: string; message: string }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
      ]}>
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
