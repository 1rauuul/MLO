export type HomeTab = 'modules' | 'assessments' | 'profile';

const ROUTE_BY_TAB = {
  modules: '(modules)',
  assessments: '(evaluations)',
  profile: '(profile)',
} as const;

export type TabRouteName = (typeof ROUTE_BY_TAB)[HomeTab];

export function tabRouteName(tab: HomeTab): TabRouteName {
  return ROUTE_BY_TAB[tab];
}

export function homeTabForRoute(routeName: string): HomeTab {
  switch (routeName) {
    case '(modules)':
      return 'modules';
    case '(evaluations)':
      return 'assessments';
    case '(profile)':
      return 'profile';
    default:
      throw new Error(`Unknown authenticated tab route: ${routeName}`);
  }
}
