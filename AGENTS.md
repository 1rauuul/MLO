# MLO — Ingeniería de Software (OAM)

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Stack de producción

Expo SDK 57 (React Native) + Expo Router + expo-sqlite + TypeScript estricto + Jest/jest-expo
con `@testing-library/react-native`. Offline-first: **ninguna llamada de red** en ninguna capa.
Sin RA, sin sensores nativos, sin empaquetado SCORM/LOM en runtime.

## Arquitectura (MVVM con hooks, MLO-AR sin RA)

```
View (src/app/**)  →  Hook "ViewModel" (src/viewmodels/**)  →  Repositorio (src/data/repositories/**)  →  expo-sqlite
```

Reglas:

- La vista (`src/app`, `src/components`) **nunca** importa repositorios ni `expo-sqlite`
  directamente; solo consume hooks de `src/viewmodels`.
- Los repositorios exponen funciones async (`select*`, `insert*`, `mark*`) que reciben la
  `SQLiteDatabase` como primer argumento.
- El esquema conserva 6 entidades (`Lesson`, `Example`, `Exercise`, `Result`, `Evaluation`,
  `Question`) y **mantiene `Exercise`/`Result` y `Evaluation`/`Question` como tablas
  separadas** (feedback inmediato por reactivo vs. puntaje acumulado). Se añaden
  `LearnerProfile`, `ModuleProgress` y `EvaluationResult` para la capa de personalización y
  el historial.

## Estructura de carpetas

- `src/app/` — rutas de Expo Router (Capa de Interactividad + Estructura General).
- `src/models/` — `entities.ts`, `schema.ts` (DDL), `metadata.ts`.
- `src/data/` — `db.ts` (init/migración/seed) y `repositories/`.
- `src/viewmodels/` — hooks "ViewModel" y lógica pura (`*Logic.ts`).
- `src/components/` — componentes RN reutilizables.
- `src/theme/` — tokens derivados del prototipo y `AppThemeProvider`.
- `prototipo/` — maqueta web (Vite/React DOM). **Fuente de verdad visual únicamente; no se
  importa ni se ejecuta en la app de producción.** Está excluida de `tsconfig.json`.

## Convenciones de nombres

- Hooks: `use` + PascalCase (`useLessonContent`, `useExerciseEngine`, `useQuizEngine`,
  `useModuleProgress`, `useLearnerProfile`, `useCatalog`, `useSession`).
- Repositorios: `<entidad>Repository.ts` con funciones `selectX`, `insertX`, `markX`,
  `countX`, `saveX`.
- Lógica pura testeable: `exerciseLogic.ts`, `quizLogic.ts`.

## Comandos

- `npm run start` — Expo dev server (Android/Expo Go).
- `npm run android` / `npm run ios` / `npm run web`.
- `npm test` — Jest (jest-expo + @testing-library/react-native).
- `npx tsc --noEmit` — typecheck estricto.

## Notas de alcance

- `app/personalizacion` (cuestionario CHAEA) queda como extensión de la Fase 4; el estilo de
  aprendizaje ya se persiste y se ajusta desde el Perfil.
- Los subtemas de las unidades 2–5 tienen contenido introductorio; el contenido completo de
  la Unidad 1 proviene de `prototipo/tablas-ingenieria.md`.
