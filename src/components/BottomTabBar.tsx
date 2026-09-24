import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';

export type HomeTab = 'modules' | 'assessments' | 'profile';

const tabs: { id: HomeTab; icon: string; label: string }[] = [
  { id: 'modules', icon: '▦', label: 'Módulos' },
  { id: 'assessments', icon: '✓', label: 'Evaluaciones' },
  { id: 'profile', icon: '◉', label: 'Perfil' },
];

interface BottomTabBarProps {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
}

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={() => onChange(tab.id)}
            style={styles.tab}>
            <View
              style={[
                styles.iconPill,
                { backgroundColor: isActive ? `${colors.primary}2E` : 'transparent' },
              ]}>
              <AppText
                color={isActive ? colors.primary : colors.muted}
                weight={isActive ? '700' : '500'}
                style={styles.glyph}>
                {tab.icon}
              </AppText>
            </View>
            <AppText
              variant="small"
              color={isActive ? colors.primary : colors.muted}
              weight={isActive ? '700' : '500'}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  iconPill: {
    width: 44,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 18,
    lineHeight: 20,
  },
});
