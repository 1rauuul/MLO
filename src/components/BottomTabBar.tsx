import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import type { HomeTab } from '@/navigation/tabRoutes';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const tabs: { id: HomeTab; icon: IconName; label: string }[] = [
  { id: 'modules', icon: 'module', label: 'Módulos' },
  { id: 'assessments', icon: 'eval', label: 'Evaluaciones' },
  { id: 'profile', icon: 'user', label: 'Perfil' },
];

interface BottomTabBarProps {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
  bottomInset?: number;
}

export function BottomTabBar({ active, onChange, bottomInset = 0 }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          paddingBottom: Math.max(bottomInset, 6),
        },
      ]}>
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
              <Icon
                name={tab.icon}
                size={18}
                color={isActive ? colors.primary : colors.muted}
              />
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
});
