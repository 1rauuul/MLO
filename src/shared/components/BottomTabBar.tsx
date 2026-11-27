import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';
import type { HomeTab } from '@/shared/utils/navigation/tabRoutes';

import { AppText } from '@/shared/components/AppText';
import { Icon, type IconName } from '@/shared/components/Icon';
import { TabIconPill } from '@/shared/components/TabIconPill';

const tabs: { id: HomeTab; icon: IconName; label: string }[] = [
  { id: 'modules', icon: 'module', label: 'Cursos' },
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
            <TabIconPill active={isActive}>
              <Icon
                name={tab.icon}
                size={18}
                color={isActive ? colors.primary : colors.muted}
              />
            </TabIconPill>
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
});
