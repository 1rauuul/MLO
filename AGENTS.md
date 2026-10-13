# MLO — Ingeniería de Software (OAM)

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Stack de producción

Expo SDK 57 (React Native) + Expo Router + expo-sqlite + TypeScript estricto + Jest/jest-expo
con `@testing-library/react-native`. Offline-first: **ninguna llamada de red** en ninguna capa.
Sin RA, sin sensores nativos, sin empaquetado SCORM/LOM en runtime.

## Arquitectura (MVVM por features, MLO-AR sin RA)

```
src/app/**              →  rutas Expo Router delgadas (re-export de una vista)
src/features/<f>/view     →  ViewModel "hook" (useXxx)
src/features/<f>/model    →  Repositorio (xxxRepository)
src/shared/services       →  expo-sqlite (db) y contenido
```

Reglas:

- La vista (`src/features/*/view`, `src/app`) **nunca** importa repositorios ni `expo-sqlite`
  directamente; solo consume hooks de `src/features/*/viewmodel`.
- Los repositorios exponen funciones async (`select*`, `insert*`, `mark*`) que reciben la
  `SQLiteDatabase` como primer argumento.
- El esquema conserva las entidades núcleo (`Lesson`, `Example`, `Exercise`, `Evaluation`,
  `Question`) y **mantiene `Exercise` y `Evaluation`/`Question` como tablas separadas**
  (feedback inmediato por reactivo vs. puntaje acumulado). La bitácora real de intentos es
  `attempts` (`source = 'practice' | 'evaluation'`); la antigua tabla `results` se retiró por
  quedar inerte. Se añaden `LearnerProfile`, `ModuleProgress`, `EvaluationResult`, `Attempt`,
  `Account` y `last_location` para autenticación, personalización, analítica e historial.
- `PRAGMA foreign_keys` es por conexión: se activa en `migrateAndSeed`
  (`src/shared/services/db/database.ts`) sobre la conexión del `SQLiteProvider`; no abrir
  conexiones paralelas sin reactivar el pragma.
- Dependencias: View → ViewModel → Model → `shared/services`. Entre features solo se importa
  desde `viewmodel` o `model` de otra feature, nunca desde su `view`.

## Estructura de carpetas

- `src/app/` — rutas Expo Router delgadas (`export { default } from '@/features/x/view/XScreen'`)
  más los `_layout.tsx` y los guards/providers.
- `src/features/` — una carpeta por feature (`auth`, `profile`, `modules`, `examples`,
  `exercises`, `evaluations`), cada una con `model/`, `viewmodel/` y `view/` (+ `__tests__/`).
- `src/shared/components/` — componentes RN reutilizables (`AppText`, `Screen`, `Buttons`, …).
- `src/shared/hooks/` — `useReducedMotion`.
- `src/shared/services/db/` — `database.ts` (init/migración/seed), `schema.ts` (DDL), `seed.ts`.
- `src/shared/services/content/` — `richContent.ts`, `unit1.content.ts`, `banks/`.
- `src/shared/utils/` — `activityLabels.ts`, `navigation/{tabRoutes,locationRoutes}`.
- `src/shared/model/` — `entities.ts` (tipos compartidos).
- `src/shared/theme/` — `ThemeProvider.tsx`, `tokens.ts`.
- `docs/` — documentación y planes del proyecto (ver `docs/README.md`).

## Convenciones de nombres

- Hooks: `use` + PascalCase (`useLessonContent`, `usePracticeEngine`, `useQuizEngine`,
  `useModuleProgress`, `useLearnerProfile`, `useCatalog`, `useSession`).
- Repositorios: `<entidad>Repository.ts` con funciones `selectX`, `insertX`, `markX`,
  `countX`, `saveX`.
- Lógica pura testeable: `<entidad>.logic.ts` (`auth.logic.ts`, `exercise.logic.ts`,
  `cha.logic.ts`, `evaluation.logic.ts`, `example.logic.ts`, `analytics.logic.ts`).
- Vistas de pantalla: `PascalCase` + sufijo `Screen.tsx` (`LoginScreen`, `TopicScreen`).
- Los filtros de tipos de actividad viven en `shared/model/entities.ts` (`EXERCISE_TYPES`,
  `ACTIVITY_TYPES`); las etiquetas en `shared/utils/activityLabels.ts`; los mensajes de auth en
  `features/auth/viewmodel/auth.messages.ts`.
- Tests: `__tests__/<archivo>.test.ts(x)` junto al código que prueban.

## Comandos

- `npm run start` — Expo dev server (Android/Expo Go).
- `npm run android` / `npm run ios` / `npm run web`.
- `npm test` — Jest (jest-expo + @testing-library/react-native).
- `npx tsc --noEmit` — typecheck estricto.

## Notas de alcance

- `app/personalizacion` (cuestionario CHAEA abreviado) está implementado en
  `src/features/profile/view/PersonalizationScreen.tsx`; guarda el estilo dominante vía
  `useLearnerProfile.saveQuestionnaire` y la lógica pura vive en
  `src/features/modules/viewmodel/cha.logic.ts`.
- Las contraseñas se derivan con PBKDF2-HMAC-SHA256 (`src/features/auth/viewmodel/auth.logic.ts`);
  las cuentas con hash legacy SHA-256 se re-hashean de forma transparente al iniciar sesión.
- Los subtemas de las unidades 2–5 tienen contenido introductorio; el contenido completo de
  la Unidad 1 proviene de `docs/contenido/tablas-ingenieria.md`.
- No hay empaquetado SCORM/LOM en runtime.
