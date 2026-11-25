# MLO — Ingeniería de Software (OAM)

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v58.0.0/ before writing any code.

## Stack de producción

Expo SDK 58 (React Native 0.88) + Expo Router + expo-sqlite + TypeScript estricto + Jest/jest-expo
con `@testing-library/react-native`. Offline-first: **sin red por defecto** (`DATA_MODE = 'local'`).
Los servicios solo se consultan con `DATA_MODE = 'hybrid'`; SQLite sigue siendo la fuente de verdad
local y el contenido llega desde los cursos y clases del CMS (el APK no empaqueta contenido base).
Sin RA, sin sensores nativos, sin empaquetado SCORM/LOM en runtime.

## Arquitectura (MVVM por features, MLO-AR sin RA)

```
src/app/**                    →  rutas Expo Router delgadas (re-export de una vista)
src/features/<f>/view         →  componente de pantalla
src/features/<f>/viewmodel    →  ViewModel "hook" (useXxx); consume useRepositories()
src/features/<f>/model        →  Repositorio (xxxRepository)
src/shared/services/data      →  DataProvider, puertos y DATA_MODE
src/shared/services/http      →  cliente HTTP (solo con DATA_MODE='hybrid')
src/shared/services/db        →  expo-sqlite (migración/seed)
src/shared/services/content   →  contenido local y fuente remota
```

Reglas:

- La vista (`src/features/*/view`, `src/app`) **nunca** importa repositorios ni `expo-sqlite`
  directamente; solo consume hooks de `src/features/*/viewmodel`.
- Los ViewModels **no importan `expo-sqlite`** (lo impone `no-restricted-imports`): usan
  `useRepositories()` de `shared/services/data/DataProvider` y sus puertos por feature.
- Los repositorios exponen funciones async (`select*`, `insert*`, `mark*`) que reciben la
  `SQLiteDatabase` como primer argumento; `createRepositories(db)` las liga a los puertos.
- Con `DATA_MODE='local'` no se ejecuta ninguna petición HTTP. El contenido remoto se valida con
  `shared/utils/validate.ts` (`parse*Seed`) y nunca reemplaza el contenido local si falla.
- El contrato v2 vive en `docs/api/contrato.md`: el cliente acepta `version` string o entera,
  normaliza los códigos de clase a mayúsculas y los campos vacíos omitidos, y descarta una
  lección si su hash o sus ids no coinciden con el manifest y el curso.
- **El arranque nunca espera a la red.** `migrateAndSeed` solo crea el esquema y aplica los
  releases v3 ya guardados; `ContentSyncProvider` descarga cursos y clases en segundo plano y
  `applyPendingContent` aplica lo pendiente cuando el alumno confirma.
- El contenido base ya no se empaqueta en el APK: vive solo en el CMS y se muestra únicamente
  si un curso publicado (`uses_base`) o una clase lo incluye. Una instalación nueva sin cursos
  o clases sincronizadas queda vacía hasta que el alumno entre y descargue contenido.
- Contenido retirado: `units`, `lessons` y `evaluations` se archivan con `archived_at`; no se
  borran si tienen progreso asociado. Los ids de contenido remoto son globales
  (`{catalogId}-{id}`); el curso base usa ids sin prefijo y `catalog_id = 'base'`.
- Las clases **pertenecen a un curso**: el CMS asigna la clase a un curso y el preview/join
  devuelven `course: { catalogId, title }`. `account_classes` guarda la membresía con su
  `course_catalog_id`; `class_cache` el último release por clase y `class_extras_cache` sus
  bloques/ejemplos/ejercicios. Un alumno puede estar en una clase por curso y en varios cursos;
  el mismo `extra_id` en varias clases se deduplica y se etiqueta con los nombres de las clases.
- Al unirse por código o reclamar una invitación, el CMS concede acceso al curso de la clase
  (`course_access`) y MLO registra una tarjeta local con el nombre del curso aunque aún no tenga
  release publicado.
- La identidad del alumno es `accounts.external_key` (UUID estable, generado al registrarse).
  Los respaldos v5 incluyen ese UUID, las clases y el curso de cada clase; siguen aceptando
  v1/v2/v3/v4. Al importar un respaldo con otra identidad se vuelve a unir a las clases y se
  retira la identidad temporal del dispositivo para no duplicar al alumno en la lista del docente.
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
- `src/features/` — una carpeta por feature (`auth`, `groups`, `profile`, `modules`, `examples`,
  `exercises`, `evaluations`), cada una con `model/`, `viewmodel/` y `view/` (+ `__tests__/`).
- `src/shared/components/` — componentes RN reutilizables (`AppText`, `Screen`, `Buttons`, …).
- `src/shared/hooks/` — `useReducedMotion`, `useExitGuard`, `useAsyncResource`.
- `src/shared/services/db/` — `database.ts` (init/migración de esquema), `schema.ts`.
- `src/shared/services/data/` — `DataProvider.tsx` (puertos inyectables) y `dataMode.ts`.
- `src/shared/services/http/` — `client.ts` (timeout, reintentos, errores tipados).
- `src/shared/services/content/` — `remoteContent.ts` (clases), `coursesV3.ts` (catálogo v3),
  `applyV3Content.ts`, `mediaCache.ts`/`mediaPath.ts`, `remote/` (validadores y contenido
  pendiente) y `ContentSyncProvider.tsx`.
- `src/shared/utils/` — `activityLabels.ts`, `validate.ts`, `navigation/{tabRoutes,locationRoutes}`.
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
- El contenido base del curso vive en el CMS (`docs/contenido/tablas-ingenieria.md` es su fuente);
  el APK ya no lo empaqueta y solo lo muestra dentro de cursos o clases que lo incluyan.
- No hay empaquetado SCORM/LOM en runtime.
