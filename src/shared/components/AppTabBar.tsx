import { usePathname, useRouter } from 'expo-router';

import { runOrGuardExit } from '@/shared/services/navigation/exitGuard';
import { isSubtopicPath, topicHref } from '@/shared/utils/navigation/locationRoutes';
import { homeTabForRoute, type HomeTab } from '@/shared/utils/navigation/tabRoutes';
import { useSession } from '@/features/auth/viewmodel/useSession';

import { BottomTabBar } from '@/shared/components/BottomTabBar';
import { SubtopicTabBar } from '@/features/modules/view/SubtopicTabBar';

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
        onInicio={() => runOrGuardExit(() => router.navigate('/'))}
        onTema={tema ? () => runOrGuardExit(() => router.navigate(tema)) : undefined}
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
