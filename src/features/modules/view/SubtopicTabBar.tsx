import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { AppText } from '@/shared/components/AppText';
import { Icon, type IconName } from '@/shared/components/Icon';

type SubtopicTab = 'inicio' | 'tema';

interface SubtopicTabBarProps {
  active: SubtopicTab | null;
  onInicio: () => void;
  onTema?: () => void;
  bottomInset?: number;
}

const items: { id: SubtopicTab; icon: IconName; label: string }[] = [
  { id: 'inicio', icon: 'home', label: 'Inicio' },
  { id: 'tema', icon: 'tile', label: 'Tema' },
];

export function SubtopicTabBar({
  active,
  onInicio,
  onTema,
  bottomInset = 0,
}: SubtopicTabBarProps) {
  const { colors } = useTheme();
  const handlers: Record<SubtopicTab, (() => void) | undefined> = {
    inicio: onInicio,
    tema: onTema,
  };
  const visibleTabs = onTema ? items : items.filter(item => item.id !== 'tema');

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
      {visibleTabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={handlers[tab.id]}
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
