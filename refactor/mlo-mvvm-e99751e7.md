# Plan: reestructurar MLO a MVVM por features

## Estado actual (repo `1rauuul/MLO`, rama `main`, HEAD `63935fe`)
La app ya sigue MVVM, pero por **capas**: `src/models`, `src/data` (db, seed, banks, repositories), `src/viewmodels` (hooks + `*Logic.ts`), `src/components`, `src/hooks`, `src/navigation`, `src/theme`. Las pantallas viven dentro de `src/app/**` (100–230 líneas cada una), así que hoy la ruta *es* la vista.
Hay alias `@/*` → `./src/*` (tsconfig); todas las importaciones usan `@/...`, por eso se pueden reescribir de forma mecánica.
Problemas detectados que hay que tener en cuenta:
- `components/evaluation/EvaluationFlow.tsx` llama directo a hooks (`useSession`, `useModuleProgress`, `useLessonContent`): es una vista con ViewModel dentro, y se queda así (no se cambia comportamiento; solo cambia de carpeta).
- `FillExercise`/`MatchExercise` importan tipos de `useExerciseEngine` y `exerciseLogic`: eso está bien porque las vistas consumen el VM.
- `models/entities.ts` lo comparten casi todas las features (58 importaciones).

## Estructura objetivo
```
src/
  app/                         # rutas Expo Router delgadas: `export { default } from '@/features/x/view/XScreen'`
                               # se mantienen _layout.tsx y la lógica de guards/providers
  features/
    auth/        model: accountRepository
                 viewmodel: useAuth, useSession, auth.logic, auth.messages
                 view: LoginScreen, RegisterScreen
    profile/     model: profileRepository
                 viewmodel: useLearnerProfile, useRecentResults
                 view: ProfileScreen, PersonalizationScreen, Toggle
    modules/     model: lessonRepository, progressRepository, locationRepository
                 viewmodel: useCatalog, useLessonHub, useLessonContent, useModuleProgress, cha.logic
                 view: ModulesScreen, TopicScreen, LessonScreen, UnitCard, SubtopicRow, SubtopicTabBar, HubTile, RichContent, Magnifier, ProgressRing
    examples/    model: exampleRepository
                 viewmodel: useExamplesEngine, example.logic
                 view: ExamplesScreen, ExampleRunner
    exercises/   model: exerciseRepository, attemptRepository
                 viewmodel: useExerciseEngine, usePracticeEngine, exercise.logic, exercise.hints
                 view: ExercisesScreen, FillExercise, MatchExercise, QuizOption, activities/* (ActivityView, CrosswordExercise, OrderExercise, accents)
    evaluations/ model: evaluationRepository
                 viewmodel: useQuizEngine, useEvaluationsCatalog, evaluation.logic, analytics.logic
                 view: EvaluationsScreen, EvaluationScreen, EvaluationFlow
    (cada carpeta model/viewmodel/view tiene su __tests__/ con los tests que le tocan)
  shared/
    components/  AppText, Screen, ScreenHeader, Buttons, Icon, Chevron, EmptyState, SectionHeading, TextField, MetadataBadge, AppTabBar, BottomTabBar
    hooks/       useReducedMotion
    services/
      db/        database.ts (ex db.ts), schema.ts, seed.ts
      content/   richContent.ts, unit1.content.ts, banks/{lesson1.2.bank.ts, types.ts}
    utils/       navigation/{tabRoutes, locationRoutes}, activityLabels
    model/       entities.ts   (tipos compartidos; ver regla 4)
    theme/       ThemeProvider.tsx (ex theme-provider.tsx), tokens.ts
```
La asignación final de cada archivo se confirma con `grep` antes de mover: si un componente o hook lo usan ≥2 features, va a `shared/`; si lo usa solo una, va a esa feature.

## Limpieza: archivos sin uso (verificado con grep sobre `src`, `app.json` y `package.json`)
Se borran con `git rm` en un commit propio (`chore: remove unused files`, paso 8). Antes de borrar cada uno, se vuelve a correr `grep` y, si aparece alguna referencia, ese archivo se conserva.
- `src/data/banks/bank1.2.ts`: está vacío y no se importa.
- `src/models/metadata.ts`: no se importa en ningún lugar.
- `src/data/banks/template.ts`: es una plantilla de referencia que no se importa. Se mueve a `docs/plantillas/banco-ejercicios.template.ts` y se excluye de tsconfig/jest si hace falta. No se borra porque documenta el formato.
- `scripts/reset-project.js` y el script `reset-project` de `package.json`: vienen de la plantilla de Expo y, si se ejecutan, destruirían la app.
- Assets de la plantilla de Expo sin referencias: `assets/images/{react-logo,react-logo@2x,react-logo@3x,expo-logo,expo-badge,expo-badge-white,tutorial-web,logo-glow}.png` y `assets/images/tabIcons/*`. **Se conservan** `assets/expo.icon/**` (lo usa `app.json`, ios.icon), icon, favicon, splash y android-icon-*.
- Componentes, hooks, exports o funciones que solo se usan en tests: se buscan con `grep` durante el paso 0. Si se encuentra alguno, se lista en el PR y se borra junto con su test.
- Carpetas que quedan vacías (`src/components`, `src/viewmodels`, `src/data`, `src/models`, `src/navigation`, `src/hooks`, `src/theme`, `scripts/`): se eliminan.

## Raíz del repo: documentación ordenada
- `Introducción a la ISW.md` y `Unidad 1 ingdelsoftware.md` se mueven a `docs/contenido/introduccion-isw.md` y `docs/contenido/unidad-1.md`.
- `mapa-navegacion.html` se mueve a `docs/mapa-navegacion.html`.
- `status/*` se mueve a `docs/estado/` (es documentación del proyecto, no código).
- En la raíz solo quedan la configuración (`app.json`, `package*.json`, `tsconfig.json`, `eslint.config.js`, `metro.config.js`), `README.md`, `LICENSE`, `AGENTS.md`, `CLAUDE.md`, además de `src/`, `assets/` y `docs/`.
- Si `CLAUDE.md`, `AGENTS.md` o `README.md` enlazan a estos archivos, los enlaces se actualizan.

## Convención de nombres (se renombra al mover; mismo `git mv`)
- Vistas de pantalla: `PascalCase` + sufijo `Screen.tsx` (`LoginScreen`, `TopicScreen`, `LessonScreen`...).
- Componentes: `PascalCase.tsx`. `theme/theme-provider.tsx` → `shared/theme/ThemeProvider.tsx`.
- ViewModels (hooks): `useXxx.ts(x)`. Lógica pura del VM: se cambia el sufijo `xxxLogic.ts` por `xxx.logic.ts` (`authLogic.ts` → `auth.logic.ts`, `exerciseLogic.ts` → `exercise.logic.ts`, `chaLogic.ts` → `cha.logic.ts`, etc.), `authMessages.ts` → `auth.messages.ts`, `exerciseHints.ts` → `exercise.hints.ts`.
- Model: `xxxRepository.ts` se mantiene. `models/schema.ts` → `shared/services/db/schema.ts`, junto con `db.ts` → `shared/services/db/database.ts` y `seed.ts` → `shared/services/db/seed.ts`. El contenido (`richContent.ts`, `unit1Content.ts` → `unit1.content.ts`, `banks/l1.2.ts` → `banks/lesson1.2.bank.ts`, `banks/types.ts`) pasa a `shared/services/content/`.
- Utils: `tabRoutes.ts` y `locationRoutes.ts` se mantienen en `shared/utils/navigation/`. `models/activityLabels.ts` → `shared/utils/activityLabels.ts` (son funciones de formato, no tipos).
- Tests: todos van en `__tests__/` junto al código y con el nombre `<archivo>.test.ts(x)`. Los tests que hoy están junto al archivo (`*Repository.test.ts`, `db.test.ts`, `*Routes.test.ts`) se pasan a `__tests__/`. Los tests de pantalla toman el nombre de la vista (por ejemplo, `AuthScreens.test` → `auth/view/__tests__/LoginRegister.test.tsx`). `MainScreens.test` se divide **solo si** prueba varias features; si no, se queda en la feature principal con el nombre que corresponde.
- Cada renombre se agrega a la tabla del PR (origen → destino), y las importaciones se reescriben con el mismo `sed`.

## Reglas
1. Movimientos solo con `git mv` (se conserva el historial); los cambios de contenido se limitan a rutas de importación y a extraer pantallas.
2. Extraer pantalla = `git mv src/app/.../index.tsx src/features/x/view/XScreen.tsx` y crear en su lugar un archivo de ruta nuevo de 1 línea con re-export (Git detecta el rename). Los `_layout.tsx` se quedan en `app/`.
3. Dependencias: View → ViewModel → Model → shared/services. Ninguna vista importa repositorios ni `expo-sqlite`. Entre features, solo se importa desde `viewmodel` o `model` de otra feature (p. ej., evaluations usa `modules/viewmodel/useModuleProgress`); nunca desde su `view`.
4. `entities.ts` se queda en `shared/model` (en tu estructura solo están components/hooks/services/utils; agrego `model` y `theme` para no partir un archivo de tipos compartido, porque partirlo sería un cambio de contenido).
5. No se agregan ni actualizan dependencias (la única excepción es quitar el script `reset-project`), no se cambian los textos de la UI ni la lógica.

## Ejecución (rama `refactor/mvvm-features` desde `main`)
Un commit por paso, y después de cada uno se corre la verificación:
0. `chore: scaffold shared` — mover theme, hooks, navigation→utils, models comunes, data/db+seed+content→services y componentes compartidos, con los renombres de la convención. (Va primero porque todas las features dependen de esto.)
1. `refactor(auth)` 2. `refactor(profile)` 3. `refactor(modules)` 4. `refactor(examples)` 5. `refactor(exercises)` 6. `refactor(evaluations)`
7. `chore: move docs` (raíz → docs/).
8. `chore: remove unused files` (ver sección Limpieza).
9. `docs: update CLAUDE.md/AGENTS.md/README` con la estructura, la convención de nombres y las reglas de dependencias.
En cada paso, las importaciones se reescriben con `sed` sobre las rutas `@/...` que se movieron, más las relativas (`./AppText`, `../FillExercise`), que se convierten a `@/...`.

## Verificación por commit
- `npx tsc --noEmit` (no existe un script de typecheck; usa el TypeScript que ya está instalado y es el equivalente a "build")
- `npm run lint`
- `npm test` (el número de suites y tests debe ser igual al de la línea base, salvo los tests que se borren en el paso 8, que se listan uno por uno)
- Antes de empezar: se ejecuta la línea base en `main` y se guardan los resultados. Si algo ya falla, se reporta y no se arregla.
- Al final: `grep -r "@/\(viewmodels\|data\|models\|components\|navigation\|hooks\|theme\)/" src` debe dar 0 resultados, y se hace una prueba manual con `npm run web` (o Expo Go) navegando login → módulos → lección → ejercicios → evaluación → perfil. También se comprueba que el ícono y el splash siguen apareciendo después de borrar los assets.
- Jest `moduleNameMapper`: el preset jest-expo resuelve `@/` a través de babel/tsconfig; si los tests fallan por esa razón, te consulto antes de tocar la configuración.

## Riesgos
- Las rutas con grupos y corchetes (`(modules)/tema/[id].tsx`) y los nombres con espacios o tildes (`Introducción a la ISW.md`) hay que citarlos entre comillas en el shell.
- Los `jest.mock('@/viewmodels/...')` dentro de los tests también usan rutas y se reescriben con el mismo `sed`.
- Renombrar un archivo y cambiar mucho su contenido en el mismo commit puede hacer que Git pierda el rename; por eso los cambios de contenido se limitan a las importaciones.
- La entrega: haré push de la rama y abriré un PR solo si me lo pides.
