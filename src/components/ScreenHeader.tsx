import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';
import { IconButton } from './Buttons';
import { Chevron } from './Chevron';

interface ScreenHeaderProps {
  onBack: () => void;
  eyebrow: string;
  title: string;
  trailing?: string;
  action?: ReactNode;
}

export function ScreenHeader({ onBack, eyebrow, title, trailing, action }: ScreenHeaderProps) {
  const { spacing, colors } = useTheme();

  return (
    <View style={[styles.header, { marginBottom: spacing.lg }]}>
      <IconButton onPress={onBack} accessibilityLabel="Volver">
        <Chevron direction="left" size={18} color={colors.text} strokeWidth={2.2} />
      </IconButton>
      <View style={styles.copy}>
        <AppText variant="eyebrow">{eyebrow}</AppText>
        <AppText weight="700" style={styles.title}>
          {title}
        </AppText>
      </View>
      {action ?? (trailing ? <AppText variant="code">{trailing}</AppText> : <View style={styles.spacer} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 15,
  },
  spacer: {
    width: 44,
  },
});
