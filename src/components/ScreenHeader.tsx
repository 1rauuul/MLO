import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';
import { IconButton } from './Buttons';

interface ScreenHeaderProps {
  onBack: () => void;
  eyebrow: string;
  title: string;
  trailing?: string;
}

export function ScreenHeader({ onBack, eyebrow, title, trailing }: ScreenHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.header, { marginBottom: spacing.lg }]}>
      <IconButton glyph="←" onPress={onBack} accessibilityLabel="Volver" />
      <View style={styles.copy}>
        <AppText variant="eyebrow">{eyebrow}</AppText>
        <AppText weight="700" style={styles.title}>
          {title}
        </AppText>
      </View>
      {trailing ? <AppText variant="code">{trailing}</AppText> : <View style={styles.spacer} />}
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
