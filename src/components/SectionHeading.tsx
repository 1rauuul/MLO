import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';

export function SectionHeading({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow: string;
  title: string;
  trailing?: string;
}) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.heading, { marginTop: spacing.xl }]}>
      <View style={styles.copy}>
        <AppText variant="eyebrow">{eyebrow}</AppText>
        <AppText variant="heading">{title}</AppText>
      </View>
      {trailing ? <AppText variant="code">{trailing}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  copy: {
    gap: 2,
  },
});
