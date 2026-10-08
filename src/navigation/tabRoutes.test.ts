import { homeTabForRoute, tabRouteName } from './tabRoutes';

describe('tab route mapping', () => {
  it.each([
    ['modules', '(modules)'],
    ['assessments', '(evaluations)'],
    ['profile', '(profile)'],
  ] as const)('maps %s to %s', (tab, route) => {
    expect(tabRouteName(tab)).toBe(route);
    expect(homeTabForRoute(route)).toBe(tab);
  });
});
