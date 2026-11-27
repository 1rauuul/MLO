import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';
import { IconButton } from '@/shared/components/Buttons';
import { Chevron } from '@/shared/components/Chevron';

interface ScreenHeaderProps {
  onBack: () => void;
  eyebrow?: string;
  title: string;
  trailing?: string;
  action?: ReactNode;
  /** Keeps navigation controls separate from long educational titles. */
  stacked?: boolean;
}

export function ScreenHeader({ onBack, eyebrow, title, trailing, action, stacked = false }: ScreenHeaderProps) {
  const { spacing, colors } = useTheme();

  const endControl = action ?? (trailing ? <AppText variant="code">{trailing}</AppText> : <View style={styles.spacer} />);

  if (stacked) {
    return (
      <View style={[styles.stackedHeader, { marginBottom: spacing.lg }]}>
        <View style={styles.navigationRow}>
          <IconButton onPress={onBack} accessibilityLabel="Volver">
            <Chevron direction="left" size={18} color={colors.text} strokeWidth={2.2} />
          </IconButton>
          <View style={styles.flex} />
          {endControl}
        </View>
        <View style={styles.stackedCopy}>
          {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
          <AppText weight="700" style={styles.stackedTitle}>
            {title}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.header, { marginBottom: spacing.lg }]}>
      <IconButton onPress={onBack} accessibilityLabel="Volver">
        <Chevron direction="left" size={18} color={colors.text} strokeWidth={2.2} />
      </IconButton>
      <View style={styles.copy}>
        {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
        <AppText weight="700" style={styles.title}>
          {title}
        </AppText>
      </View>
      {endControl}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stackedHeader: { gap: 12 },
  navigationRow: { flexDirection: 'row', alignItems: 'center' },
  stackedCopy: { gap: 2 },
  flex: { flex: 1 },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 15,
  },
  stackedTitle: {
    fontSize: 20,
    lineHeight: 25,
  },
  spacer: {
    width: 44,
  },
});
