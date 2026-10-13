import { homeTabForRoute, tabRouteName } from '@/shared/utils/navigation/tabRoutes';

describe('tab route mapping', () => {
  it.each([
    ['modules', '(modules)'],
    ['assessments', '(evaluations)'],
    ['profile', '(profile)'],
  ] as const)('maps %s to %s', (tab, route) => {
    expect(tabRouteName(tab)).toBe(route);
    expect(homeTabForRoute(route)).toBe(tab);
  });

  it('devuelve modules para rutas desconocidas sin lanzar', () => {
    expect(homeTabForRoute('(desconocida)')).toBe('modules');
  });
});
