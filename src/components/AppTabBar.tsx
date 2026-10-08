import { usePathname, useRouter } from 'expo-router';

import { isSubtopicPath, topicHref } from '@/navigation/locationRoutes';
import { homeTabForRoute, type HomeTab } from '@/navigation/tabRoutes';
import { useSession } from '@/viewmodels/useSession';

import { BottomTabBar } from './BottomTabBar';
import { SubtopicTabBar } from './SubtopicTabBar';

export interface AppTabBarProps {
  routeName: string;
  onNavigateTab: (tab: HomeTab) => void;
  bottomInset: number;
}

export function AppTabBar({ routeName, onNavigateTab, bottomInset }: AppTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { location } = useSession();

  if (isSubtopicPath(pathname)) {
    const tema = topicHref(location);
    return (
      <SubtopicTabBar
        active={pathname.startsWith('/tema') ? 'tema' : null}
        onInicio={() => router.navigate('/')}
        onTema={tema ? () => router.navigate(tema) : undefined}
        bottomInset={bottomInset}
      />
    );
  }

  return (
    <BottomTabBar
      active={homeTabForRoute(routeName)}
      onChange={onNavigateTab}
      bottomInset={bottomInset}
    />
  );
}
