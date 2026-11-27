import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

/** Resalte ovalado compartido por las barras de pestañas. */
export function TabIconPill({ active, children }: { active: boolean; children: ReactNode }) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: active ? `${colors.primary}2E` : 'transparent',
          borderRadius: radius.pill,
        },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
