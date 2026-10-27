import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTabBar } from '@/shared/components/AppTabBar';
import { tabRouteName } from '@/shared/utils/navigation/tabRoutes';

export default function AppLayout() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigateToTab }) => (
        <AppTabBar
          routeName={state.routes[state.index].name}
          onNavigateTab={tab => {
            const target = state.routes.find(route => route.name === tabRouteName(tab));
            if (target) {
              navigateToTab(target.key);
            }
          }}
          bottomInset={bottom}
        />
      )}>
      <Tabs.Screen name="(modules)" />
      <Tabs.Screen name="(evaluations)" />
      <Tabs.Screen name="(profile)" />
    </Tabs>
  );
}
