# Global Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the three main sections accessible throughout learning, preserve a separate stack per tab, and route activity-completion actions to their agreed destinations.

**Architecture:** Replace the authenticated root stack with Expo Router JavaScript tabs for Módulos, Evaluaciones, and Perfil. Put a Stack under each tab group; share the evaluation flow between the Módulos and Evaluaciones stacks so the active tab and ordinary back behavior match the entry point. Keep the existing custom tab-bar visual and use explicit destinations for completion actions.

**Tech Stack:** Expo SDK 57, Expo Router 57, React Native 0.86, TypeScript strict, Jest/jest-expo, `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-09-29-global-navigation-design.md`

## Global Constraints

- Expo SDK 57 (React Native) + Expo Router + expo-sqlite + TypeScript estricto + Jest/jest-expo con `@testing-library/react-native`.
- Offline-first: **ninguna llamada de red** en ninguna capa.
- La vista (`src/app`, `src/components`) **nunca** importa repositorios ni `expo-sqlite` directamente; solo consume hooks de `src/viewmodels`.
- La ruta autenticada de Módulos conserva `/` como pantalla principal.
- Módulos, Evaluaciones y Perfil están disponibles en todas las pantallas autenticadas y cada pestaña conserva su pila y posición.
- «Regresar al tema» termina en el hub del tema en lección, ejemplo y resumen de ejercicios; la evaluación final ofrece «Volver a Módulos» como acción principal.
- El tema 1.1 no recibe un hub: conserva la apertura directa y termina en Módulos con «Volver a módulos».
- Revisar la documentación exacta de Expo SDK 57 antes de implementar las rutas y opciones del navegador.
- No cambiar el flujo de autenticación, los modelos, el esquema SQLite, el progreso, los resultados ni el modo offline-first.

---

## Mapa De Archivos

- `src/app/(app)/_layout.tsx`: navegador global de pestañas autenticadas.
- `src/app/(app)/(modules)/_layout.tsx`: Stack de Módulos.
- `src/app/(app)/(modules)/index.tsx`: contenido actual de la vista Módulos.
- `src/app/(app)/(modules)/tema/[id].tsx`, `lecciones/[id].tsx`, `ejemplos/[id].tsx`, `ejercicios/index.tsx`: recorridos actuales, bajo el Stack de Módulos.
- `src/app/(app)/(modules)/evaluacion/index.tsx` y `src/app/(app)/(evaluations)/evaluacion/index.tsx`: rutas compartidas de evaluación para mantener el contexto de la pestaña de entrada.
- `src/app/(app)/(evaluations)/_layout.tsx` y `evaluaciones/index.tsx`: Stack y catálogo de evaluaciones.
- `src/app/(app)/(profile)/_layout.tsx` y `perfil/index.tsx`: Stack y vista Perfil.
- `src/components/evaluation/EvaluationFlow.tsx`: UI y lógica de la pantalla de evaluación reutilizada por las dos rutas.
- `src/components/BottomTabBar.tsx`: conservar el diseño y conectar selección/accesibilidad a la navegación de Tabs.
- `src/navigation/activityRoutes.ts` y `activityRoutes.test.ts`: destino y etiqueta explícitos de regreso según el código del tema.
- `src/navigation/tabRoutes.ts` y `tabRoutes.test.ts`: tipo de pestaña y adaptación entre IDs de UI y nombres de grupos Expo Router.
- `src/components/__tests__/BottomTabBar.test.tsx`: selección accesible de pestaña.
- `src/app/(app)/index.tsx` y las rutas actuales bajo `(app)`: retirar o mover después de migrar su contenido para no dejar rutas duplicadas.

## Task 1: Destination Helper

**Files:**
- Create: `src/navigation/activityRoutes.ts`
- Test: `src/navigation/activityRoutes.test.ts`

**Interfaces:**
- Produces `getTopicExitHref(lessonId: string, lessonCode: string)`, returning `/` for lesson code `1.1` and `{ pathname: '/tema/[id]', params: { id: lessonId } }` for every other lesson.
- Produces `getTopicExitLabel(lessonCode: string)`, returning `Volver a módulos` for lesson code `1.1` and `Regresar al tema` otherwise.
- The return type is Expo Router `Href`, so callers can pass it directly to `router.navigate` and typed routes validate it.

- [ ] **Step 1: Write the failing destination tests**

```ts
import { getTopicExitHref, getTopicExitLabel } from './activityRoutes';

describe('getTopicExitHref', () => {
  it('opens the topic hub for regular lessons', () => {
    expect(getTopicExitHref('lesson-2', '2.1')).toEqual({
      pathname: '/tema/[id]',
      params: { id: 'lesson-2' },
    });
    expect(getTopicExitLabel('2.1')).toBe('Regresar al tema');
  });

  it('returns to Modules for lesson 1.1, which has no hub', () => {
    expect(getTopicExitHref('lesson-1', '1.1')).toBe('/');
    expect(getTopicExitLabel('1.1')).toBe('Volver a módulos');
  });
});
```

- [ ] **Step 2: Run the test and confirm the helper is missing**

Run: `npx jest src/navigation/activityRoutes.test.ts --runInBand`

Expected: FAIL because `activityRoutes.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal typed helper**

```ts
import type { Href } from 'expo-router';

export function getTopicExitHref(lessonId: string, lessonCode: string): Href {
  if (lessonCode === '1.1') {
    return '/';
  }

  return {
    pathname: '/tema/[id]',
    params: { id: lessonId },
  };
}

export function getTopicExitLabel(lessonCode: string): string {
  return lessonCode === '1.1' ? 'Volver a módulos' : 'Regresar al tema';
}
```

- [ ] **Step 4: Run the focused test and typecheck**

Run: `npx jest src/navigation/activityRoutes.test.ts --runInBand`

Expected: PASS for both the hub and 1.1 fallback destinations.

Run: `npx tsc --noEmit`

Expected: exit 0; both current route hrefs satisfy Expo Router's `Href` type.

## Task 2: Separate The Three Tab Roots And Nest Route Stacks

**Files:**
- Create: `src/app/(app)/(modules)/_layout.tsx`, `(modules)/index.tsx`
- Create: `src/app/(app)/(evaluations)/_layout.tsx`, `(evaluations)/evaluaciones/index.tsx`
- Create: `src/app/(app)/(profile)/_layout.tsx`, `(profile)/perfil/index.tsx`
- Move: current topic, lesson, example, and exercise route files under `(modules)` without changing their public URLs.
- Create: `src/components/evaluation/EvaluationFlow.tsx`
- Create: `(modules)/evaluacion/index.tsx` and `(evaluations)/evaluacion/index.tsx` wrappers rendering `EvaluationFlow`.
- Modify: `src/app/(app)/index.tsx` by moving its Módulos, Evaluaciones, and Perfil content to their tab root routes, then remove the obsolete route.

**Interfaces:**
- Each tab root owns the hooks it needs: Módulos uses `useCatalog` and its current profile/auth display data; Evaluaciones uses `useEvaluationsCatalog` and `useRecentResults`; Perfil uses `useAuth`, `useLearnerProfile`, `useCatalog`, and `useRecentResults`.
- `EvaluationFlow` owns the current evaluation screen behavior and is rendered unchanged by both route wrappers. Navigation within the flow remains in the group that opened it.
- Group route paths are `(modules)` for `/`, `(evaluations)/evaluaciones` for `/evaluaciones`, and `(profile)/perfil` for `/perfil`; only evaluation is intentionally shared at `/evaluacion`.

- [ ] **Step 1: Move the four learning route files into `(modules)` and add a Stack layout**

Preserve the route URL segments `tema/[id]`, `lecciones/[id]`, `ejemplos/[id]`, and `ejercicios/index`. In `(modules)/_layout.tsx`, render `Stack` with `headerShown: false` and set `unstable_settings.anchor` to `index`. Do not use deprecated `initialRouteName`. Do not edit exercise logic or activity components as part of these moves.

- [ ] **Step 2: Extract Módulos as the `(modules)/index.tsx` screen**

Move the existing `ModulesTab` markup and `openLesson` behavior into this route. Remove the internal active-tab conditionals and bottom bar from the page, and replace its `setTab('profile')` callback with a group-qualified navigation to `/(app)/(profile)/perfil`. Keep the unit expand/collapse state local to Módulos so it survives switching away and back.

- [ ] **Step 3: Extract Evaluaciones and Perfil into their own tab roots**

Move `AssessmentsTab` to `(evaluations)/evaluaciones/index.tsx` and `ProfileTab` to `(profile)/perfil/index.tsx`. Give each group a Stack with hidden native headers and set `unstable_settings.anchor` to `evaluaciones/index` and `perfil/index` respectively. Do not use deprecated `initialRouteName`. Refresh evaluation results with `useFocusEffect` on the Evaluaciones route; refresh catalog and recent results on Perfil focus. Keep profile reset, logout, learner-style, theme, and text-size actions unchanged.

- [ ] **Step 4: Extract the evaluation flow and add one route wrapper per tab group**

Move the current contents of `(app)/evaluacion/index.tsx` into `src/components/evaluation/EvaluationFlow.tsx`. Render that component from both `(modules)/evaluacion/index.tsx` and `(evaluations)/evaluacion/index.tsx`. Preserve the same `/evaluacion` URL; Expo Router's shared-route group selects the module stack when entered from Módulos and the evaluation stack when entered from Evaluaciones.

- [ ] **Step 5: Run typecheck and existing tests after the route migration**

Run: `npx tsc --noEmit`

Expected: exit 0 with no duplicate route-file/type errors.

Run: `npm test -- --runInBand`

Expected: existing Jest suite passes; no learning-engine or persistence behavior changes.

## Task 3: Install Persistent Tabs And Keep The Existing Tab Bar

**Files:**
- Modify: `src/app/(app)/_layout.tsx`
- Modify: `src/components/BottomTabBar.tsx`
- Create: `src/navigation/tabRoutes.ts`
- Test: `src/navigation/tabRoutes.test.ts`
- Create: `src/components/__tests__/BottomTabBar.test.tsx`
- Delete: obsolete `src/app/(app)/index.tsx` if not already removed in Task 2.

**Interfaces:**
- `(app)/_layout.tsx` renders Expo Router `Tabs` with `(modules)`, `(evaluations)`, and `(profile)` as its three tab routes.
- `BottomTabBar` retains its `active: HomeTab` and `onChange(tab: HomeTab)` interface; the `Tabs` layout adapts route names to those IDs.
- `tabRouteName(tab)` and `homeTabForRoute(routeName)` in `src/navigation/tabRoutes.ts` provide the typed bidirectional mapping used by the tab-bar adapter.

- [ ] **Step 1: Write failing tests for route-name mapping**

Create `src/navigation/tabRoutes.test.ts` with these assertions:

```ts
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
```

- [ ] **Step 2: Run the mapping test and confirm it fails before implementation**

Run: `npx jest src/navigation/tabRoutes.test.ts --runInBand`

Expected: FAIL because `tabRoutes.ts` does not exist yet.

- [ ] **Step 3: Implement the mapping and connect Tabs**

Move the `HomeTab` union type into `src/navigation/tabRoutes.ts`; make `BottomTabBar.tsx` import it as a type. Implement the mapping as a typed constant and a strict reverse lookup:

```ts
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
    case '(modules)': return 'modules';
    case '(evaluations)': return 'assessments';
    case '(profile)': return 'profile';
    default: throw new Error(`Unknown authenticated tab route: ${routeName}`);
  }
}
```

Change `(app)/_layout.tsx` from `Stack` to `Tabs`, hide native headers, and render `BottomTabBar` via the JavaScript-tabs custom `tabBar` option. Use `homeTabForRoute` for the selected ID and `tabRouteName` for `navigation.navigate`. Keep the current bar colors, glyphs, labels, selected pill, and accessibility roles. Include the bottom safe-area inset so the bar does not overlap the Android gesture area or iPhone home indicator.

- [ ] **Step 4: Add a component test for the existing bar contract**

Create `src/components/__tests__/BottomTabBar.test.tsx`:

```tsx
import { fireEvent, render } from '@testing-library/react-native';

import { BottomTabBar } from '../BottomTabBar';

jest.mock('@/theme/theme-provider', () => ({
  useTheme: () => ({
    colors: {
      surface: '#fff', line: '#ddd', primary: '#00f', muted: '#777', text: '#111',
    },
    fonts: { mono: 'monospace' },
    scale: 1,
  }),
}));

it('exposes accessible tabs and reports the selected destination', () => {
  const onChange = jest.fn();
  const { getByRole } = render(<BottomTabBar active="modules" onChange={onChange} />);
  const modules = getByRole('tab', { name: 'Módulos' });
  const profile = getByRole('tab', { name: 'Perfil' });

  expect(modules.props.accessibilityState).toEqual({ selected: true });
  expect(getByRole('tab', { name: 'Evaluaciones' }).props.accessibilityState).toEqual({ selected: false });
  expect(profile.props.accessibilityState).toEqual({ selected: false });
  fireEvent.press(profile);
  expect(onChange).toHaveBeenCalledWith('profile');
});
```

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npx jest src/navigation/tabRoutes.test.ts src/components/__tests__/BottomTabBar.test.tsx --runInBand`

Expected: PASS for route mappings, accessible selected states, and tab events.

Run: `npx tsc --noEmit`

Expected: exit 0 for the typed `Tabs` screen names and tab-bar adapter.

## Task 4: Route Activity Completion To The Agreed Destination

**Files:**
- Modify: `src/app/(app)/(modules)/lecciones/[id].tsx`
- Modify: `src/app/(app)/(modules)/ejemplos/[id].tsx`
- Modify: `src/app/(app)/(modules)/ejercicios/index.tsx`
- Modify: `src/components/evaluation/EvaluationFlow.tsx`
- Create: `src/components/ActivityExitButton.tsx`
- Test: `src/components/__tests__/ActivityExitButton.test.tsx`
- Test: `src/navigation/activityRoutes.test.ts`

**Interfaces:**
- The lesson/example/exercise screens call `getTopicExitHref(lessonId, lessonCode)` and `getTopicExitLabel(lessonCode)`; `router.navigate(...)` performs their explicit exit action.
- `ActivityExitButton({ lessonId, lessonCode, onExit? })` renders the agreed accessible label, invokes optional `onExit`, then navigates to `getTopicExitHref`.
- Evaluation completion navigates to `/`, the unique Módulos root; review actions target the corresponding route in the module group.

- [ ] **Step 1: Write failing tests for the reusable exit button**

Create `src/components/__tests__/ActivityExitButton.test.tsx`. Mock only `useRouter`, the theme hook, and reduced-motion hook; render the real button and assert the visible label, its navigation target, and the optional callback:

```tsx
import { fireEvent, render } from '@testing-library/react-native';

import { ActivityExitButton } from '../ActivityExitButton';

const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate }) }));
jest.mock('@/theme/theme-provider', () => ({
  useTheme: () => ({
    colors: { soft: '#eee', text: '#111', onPrimary: '#fff' },
    radius: { control: 8 }, scale: 1, fonts: { mono: 'monospace' },
  }),
}));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));

it.each([
  ['lesson-2', '2.1', 'Regresar al tema', { pathname: '/tema/[id]', params: { id: 'lesson-2' } }],
  ['lesson-1', '1.1', 'Volver a módulos', '/'],
] as const)('navigates from %s with the matching label', (lessonId, lessonCode, label, href) => {
  mockNavigate.mockClear();
  const onExit = jest.fn();
  const { getByRole } = render(
    <ActivityExitButton lessonId={lessonId} lessonCode={lessonCode} onExit={onExit} />,
  );

  fireEvent.press(getByRole('button', { name: label }));
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith(href);
});
```

- [ ] **Step 2: Run the component test and confirm RED**

Run: `npx jest src/components/__tests__/ActivityExitButton.test.tsx --runInBand`

Expected: FAIL because `ActivityExitButton.tsx` does not exist yet.

- [ ] **Step 3: Implement the minimal shared button**

Implement `ActivityExitButton` with props `lessonId: string`, `lessonCode: string`, optional `onExit?: () => void`; use `SecondaryButton`, `getTopicExitLabel`, `getTopicExitHref`, and `useRouter`. Its press handler calls `onExit?.()` before `router.navigate(getTopicExitHref(lessonId, lessonCode))`.

- [ ] **Step 4: Add the lesson exit action at the final synthesis section**

On the last section, keep the existing progression action (`Ver ejemplo`, `Ejercicios`, or `Evaluación`) when it leads to another activity and add `ActivityExitButton` with the current lesson ID/code. When no next activity exists, use the explicit exit button as the completion action rather than a `Terminar` action that calls `router.back()`. Pass `markCompleted` through `onExit` so leaving from either action preserves lesson completion.

- [ ] **Step 5: Add an exit action after the example has been answered**

Use `example.lessonId` with `useLessonContent` to resolve the lesson code. Once the guided exercise is answered and the lesson is loaded, show `Regresar al tema` or the 1.1 fallback beside `Ir a ejercicios`. Leave the example A/B controls and answer state intact.

- [ ] **Step 6: Replace the exercise-summary history-dependent return**

Use the already loaded lesson data on the summary screen. Change `Volver al tema` to `ActivityExitButton`; keep the existing recommendation and evaluation actions.

- [ ] **Step 7: Make the final evaluation action return to the Modules root**

On the evaluation summary, make `Volver a Módulos` the primary action and call `router.navigate('/')`. Keep `Repasar la lección` or `Resolver ejercicios` as secondary actions when the recommendation provides them; target `/(app)/(modules)/lecciones/[id]` and `/(app)/(modules)/ejercicios?lesson=...` respectively. Keep the header back action contextual to the group from which this shared evaluation route was opened.

- [ ] **Step 8: Run focused tests, all tests, and typecheck**

Run: `npx jest src/navigation/activityRoutes.test.ts src/navigation/tabRoutes.test.ts src/components/__tests__/BottomTabBar.test.tsx src/components/__tests__/ActivityExitButton.test.tsx --runInBand`

Expected: PASS for route destinations and tab behavior.

Run: `npm test -- --runInBand`

Expected: PASS for the complete Jest suite.

Run: `npx tsc --noEmit`

Expected: exit 0 with typed route targets and screen params.

## Task 5: Verify End-To-End Navigation And Finish Checks

**Files:**
- Modify only any navigation files identified by a failing check; do not modify unrelated dirty files.

- [ ] **Step 1: Verify the three tabs stay visible and preserve their positions**

Run the app with `npm run start`. Open a topic from Módulos, switch to Evaluaciones, then Perfil, and return to Módulos. Confirm the topic route and expanded unit state remain where they were. Repeat while on a nested route and confirm each tab remains available.

- [ ] **Step 2: Verify contextual back for the shared evaluation route**

Open an evaluation from a topic hub, use the evaluation header back action, and confirm it returns to that module flow. Open an evaluation from the Evaluaciones catalog, use header back, and confirm it returns to the catalog. Complete an evaluation from each entry point and confirm `Volver a Módulos` always reaches the Modules root.

- [ ] **Step 3: Verify every explicit activity exit**

Complete the lesson synthesis, answer the guided example, and finish an exercise set for a regular topic. Confirm each exit reaches that topic's hub even when it is not the immediately previous screen. Check the 1.1 lesson path remains direct and exits to Módulos with `Volver a módulos`.

- [ ] **Step 4: Run final repository checks**

Run: `npx tsc --noEmit`

Expected: exit 0.

Run: `npm test -- --runInBand`

Expected: all tests pass.

Run: `npm run lint`

Expected: exit 0 with no lint errors.

## Documentation Consulted

- Expo SDK 57 JavaScript tabs: `https://docs.expo.dev/versions/v57.0.0/router/advanced/tabs/`
- Expo SDK 57 nested navigators: `https://docs.expo.dev/versions/v57.0.0/router/advanced/nesting-navigators/`
- Expo SDK 57 shared routes: `https://docs.expo.dev/versions/v57.0.0/router/advanced/shared-routes/`
- Expo SDK 57 router settings: `https://docs.expo.dev/versions/v57.0.0/router/advanced/router-settings/`
- Expo SDK 57 navigation actions: `https://docs.expo.dev/versions/v57.0.0/router/reference/navigating/`
