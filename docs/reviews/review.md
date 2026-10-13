# Review del proyecto — MLO Ingeniería de Software

Análisis guiado, solo lectura, por fases. Fuente de intención: `AGENTS.md` y `docs/especificaciones/`.

---

## Fase 1 – Visión general

### ¿Qué hace la app?

App móvil educativa (offline-first) para aprender Ingeniería de Software. Cubre:

- Contenido teórico (lecciones/subtemas) de la Unidad 1.
- Ejemplos interactivos paso a paso.
- Ejercicios con feedback inmediato (rellenar, relacionar, ordenar, crucigramas).
- Evaluaciones con puntaje acumulado.
- Personalización por perfil de aprendizaje (estilo tipo CHAEA) e historial.

El `README.md` es el genérico de Expo (no personalizado).

### ¿Expo o React Native CLI?

**Expo (managed/prebuild) con Expo Router**, no RN CLI puro.

- `package.json:3` → `"main": "expo-router/entry"`.
- `package.json:8` → `"expo": "^57.0.22"`.
- `app.json:1-45` → configuración Expo; no hay carpetas `android/` ni `ios/` propias.

Versiones clave: React Native `0.86.3`, React `19.2.3`, Expo SDK 57.

### Estructura de carpetas

Raíz:

| Carpeta/archivo | Para qué sirve |
|---|---|
| `src/` | Todo el código de la app. |
| `assets/` | Íconos, splash, imágenes. |
| `docs/` | Documentación, planes/specs. |
| `scripts/` | Utilidades Node. |
| `status/` | Por revisar. |
| `app.json`, `metro.config.js`, `eslint.config.js`, `tsconfig.json` | Configuración Expo/Metro/ESLint/TS. |
| `docs/arquitectura/mapa-navegacion.html` | Mapa visual de navegación. |

Dentro de `src/`:

- `src/app/` — rutas de Expo Router (vistas): `login.tsx`, `register.tsx` y grupos `(app)`, `(evaluations)`, `(modules)`, `(profile)`.
- `src/components/` — componentes RN reutilizables.
- `src/viewmodels/` — hooks "ViewModel" y lógica pura.
- `src/data/` — `db.ts` (init/migración/seed), `seed.ts`, `unit1Content.ts`, `repositories/`.
- `src/models/` — `entities.ts`, `schema.ts` (DDL), `metadata.ts`.
- `src/navigation/` — `locationRoutes.ts`, `tabRoutes.ts`.
- `src/theme/` — `tokens.ts`, `theme-provider.tsx`.
- `src/hooks/` — hooks genéricos.

Arquitectura MVVM: `View (src/app) → Hook ViewModel (src/viewmodels) → Repositorio (src/data/repositories) → expo-sqlite`.

### Dependencias principales y por qué

- Navegación: `expo-router`, `expo-linking`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`.
- Persistencia offline: `expo-sqlite`.
- UI/nativas: `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-font`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `react-native-svg`.
- Utilidades: `expo-constants`, `expo-crypto`, `expo-device`, `expo-web-browser`.
- Web: `react-dom`, `react-native-web`.
- Dev: `typescript` (`tsconfig.json:4` `strict`), `jest` + `jest-expo` + `@testing-library/react-native`, `eslint` + `eslint-config-expo`.

Config: `app.json:41-44` → `typedRoutes` y `reactCompiler`; `scheme: "mloingenieriasoftware"`.

---

## Fase 2 – Arranque y navegación

### Punto de entrada

No hay `index.js`/`App.tsx`. El punto de entrada es `expo-router/entry` (`package.json:3`), que resuelve el árbol de rutas de `src/app/`.

**Layout raíz** — `src/app/_layout.tsx:15` (`RootLayout`):

1. `GestureHandlerRootView` (`:17`) — requerido por gesture-handler.
2. `SafeAreaProvider` (`:18`).
3. `SQLiteProvider` (`:19`) con `databaseName={DATABASE_NAME}` y `onInit={migrateAndSeed}` — abre la BD y ejecuta migración+seed.
4. `AuthProvider` → `SessionProvider` → `LearnerProfileProvider` → `AppThemeProvider` (`:20-23`).
5. `RootNavigator` (`:36`).

`SplashScreen.preventAutoHideAsync()` (`:13`) mantiene el splash; se oculta en `RootNavigator` cuando `isLoading` es falso (`:39-41`).

### Navegación raíz y autenticación

`RootNavigator` (`src/app/_layout.tsx:36-53`) usa un `Stack` y **`Stack.Protected`** (feature de Expo Router):

- `guard={!!account}` → `(app)` (zona autenticada).
- `guard={!account}` → `login` y `register`.

Es decir, el login/registro se controla por el estado de sesión (`useAuth`), no por redirecciones manuales.

### Navegación por pestañas

`src/app/(app)/_layout.tsx:7` (`AppLayout`) usa `Tabs` con una **tab bar personalizada** (`AppTabBar`, `:13-18`) en lugar de la por defecto. Registra 3 pestañas (`:20-22`):

- `(modules)` — módulos/ruta de aprendizaje.
- `(evaluations)` — evaluaciones.
- `(profile)` — perfil.

El mapeo tab ↔ ruta vive en `src/navigation/tabRoutes.ts`:

- `tabRouteName` (`:11`) → `modules → '(modules)'`, `assessments → '(evaluations)'`, `profile → '(profile)'`.
- `homeTabForRoute` (`:15`) hace lo inverso.

### Stacks anidados y anclas

Cada grupo tiene su propio `Stack`:

- `src/app/(app)/(modules)/_layout.tsx:3` → `anchor: 'index'`.
- `src/app/(app)/(evaluations)/_layout.tsx:4` → `anchor: 'evaluaciones/index'`.
- `src/app/(app)/(profile)/_layout.tsx:4` → `anchor: 'perfil/index'`.

El `anchor` define la pantalla de reposo del stack (a dónde vuelve al tocar la pestaña).

### Mapa de pantallas (rutas de archivos)

```
src/app/
├─ _layout.tsx                Stack raíz + providers (auth gate)
├─ login.tsx                  /login
├─ register.tsx               /register
├─ (app)/
│  ├─ _layout.tsx             Tabs (AppTabBar)
│  ├─ (modules)/
│  │  ├─ _layout.tsx          Stack (anchor: index)
│  │  ├─ index.tsx            /            ← catálogo + "Continuar"
│  │  ├─ tema/[id].tsx        /tema/:id
│  │  ├─ lecciones/[id].tsx   /lecciones/:id
│  │  ├─ ejemplos/index.tsx   /ejemplos?lesson=
│  │  ├─ ejercicios/index.tsx /ejercicios?lesson=
│  │  └─ evaluacion/index.tsx /evaluacion?lesson=
│  ├─ (evaluations)/
│  │  ├─ _layout.tsx          Stack (anchor: evaluaciones/index)
│  │  └─ evaluaciones/index.tsx, evaluacion/index.tsx
│  └─ (profile)/
│     ├─ _layout.tsx          Stack (anchor: perfil/index)
│     └─ perfil/index.tsx
```

### Rutas "de dominio": `locationRoutes.ts`

`src/navigation/locationRoutes.ts` traduce la ubicación guardada de sesión a un `Href` de Expo Router:

- `topicHref` (`:11`) → `/` si el código es `1.1`, si no `/tema/[id]`.
- `nextLessonHref` (`:24`) → siguiente lección o `/`.
- `hrefForLocation` (`:33`) → según `loc.section`: `hub | lesson | example | exercise | quiz`.
- `isSubtopicPath` (`:55`) → detecta si estás en una subpantalla (`tema`, `lecciones`, `ejemplos`, `ejercicios`, `evaluacion`).

### Ejemplo de flujo de arranque

1. Se abre la app → `RootLayout` monta providers y abre SQLite.
2. `useAuth` carga la cuenta; el splash se oculta.
3. Si no hay `account` → stack `login`/`register`.
4. Al hacer login (`login.tsx:25` `submit`) → `login()` y luego `router.replace('/')` (`:28`).
5. Con `account`, `Stack.Protected` habilita `(app)` y se muestra el tab `(modules)`, cuyo `index.tsx:28` (`ModulesScreen`) pinta catálogo y "Continuar".

---

## Fase 3 – Pantallas y componentes

### Pantallas

**`login.tsx`** (`LoginScreen`): formulario usuario/contraseña. Estado local `useState` (`:21-23`), `useAuth()` (`:18`) y `useTheme()`. En `submit` (`:25`) llama `login()`; si `ok` → `router.replace('/')`, si no mapea el error con `MESSAGES` (`:12`). Usa `Screen`, `AppText`, `TextField`, `PrimaryButton`, `SecondaryButton`. Enlace a `/register` (`:66`).

**`register.tsx`** (`RegisterScreen`): análogo, con 4 campos (nombre, usuario, contraseña, confirmar). `register()` (`:33`) valida y responde `{ ok, error }`; los errores se traducen en `MESSAGES` (`:12-20`).

**`(modules)/index.tsx`** (`ModulesScreen`): pantalla principal. Muestra saludo con la fecha (`greetingDate` `:19`), tarjeta "Continúa donde lo dejaste" y lista de unidades expandibles. Hooks: `useCatalog` (`:31`), `useSession` (`:32`), `useAuth` (`:30`). `useFocusEffect` refresca el catálogo (`:36`). Calcula unidad/lección actual y `resumeHref`; `openDestination` (`:43`) decide entre `/lecciones/[id]` y `/tema/[id]`. Componentes: `UnitCard`, `SubtopicRow`, `SectionHeading`, `Chevron`, `EmptyState`, `Screen`.

**`(modules)/tema/[id].tsx`** (`TopicHubScreen`): hub de un tema. `useLocalSearchParams` lee `id`; `useLessonHub(lessonId)` (`:26`) trae `lesson, unit, exercises, evaluation, completed`. Registra la ubicación (`record`, `:34`) y redirige el código `1.1` a `/lecciones/[id]` (`:44-48`). Construye `HubAction[]` (`:58`) y los pinta en `HubTile` en filas de 2 (`:102-105`). Componentes: `ScreenHeader`, `HubTile`, `EmptyState`.

**`(modules)/lecciones/[id].tsx`** (`LessonDetailScreen`): contenido de una lección en 2 secciones (`SECTION_LABELS = ['Concepto','Síntesis']`, `:20`). Hooks: `useLessonContent`, `useExercisesForLesson`, `useEvaluationForLesson`, `useModuleProgress`, `useCatalog`, `useSession`. Renderiza `RichContent` si hay bloques, si no `lesson.body` (`:128-132`). Al final decide botón: "Ver ejemplos" / "Evaluación" / "Terminar" (`:67-71`). `markCompleted` (`:74`) guarda progreso y `finish` (`:82`) navega a la siguiente lección con `nextLessonHref`.

**`(modules)/ejemplos/index.tsx`** (`ExamplesScreen`): ejemplos guiados. `useExamplesEngine(lessonParam)` (`:15`) maneja la secuencia; delega el render en `ExampleRunner` (`:60`). Registra `section: 'example'`.

**`(modules)/ejercicios/index.tsx`** (`PracticeScreen`): práctica. `usePracticeEngine` (`:29`). Dos fases: resumen (`:61`) con score, desglose por tipo y recomendación (`recommendReview`, `:62`); o ejercicio activo renderizado con `ActivityView` (`:157`). Botón avanza con `engine.next`.

**`(modules)/evaluacion/index.tsx`** y **`(evaluations)/evaluacion/index.tsx`**: ambos son wrappers de 5 líneas que devuelven `<EvaluationFlow />`.

**`(evaluations)/evaluaciones/index.tsx`** (`EvaluationsScreen`): lista evaluaciones disponibles (`useEvaluationsCatalog`) e historial de resultados (`useRecentResults`). `ResultRow` (`:94`) muestra puntaje. Navega a `(app)/(evaluations)/evaluacion?lesson=`.

**`(profile)/perfil/index.tsx`** (`ProfileScreen`): perfil. Muestra avatar con `initials`, stats (`completedLessons/totalLessons` y `averageScore`), selector de estilo de aprendizaje (`LEARNING_STYLES`, `:18`), toggles de accesibilidad (modo oscuro, texto ampliado), y acciones de sesión/`resetProgress` con `Alert.alert` (`:40`). Hooks: `useLearnerProfile`, `useCatalog`, `useRecentResults`, `useAuth`.

### Componentes reutilizables y props

- **`Screen`** (`Screen.tsx:14`): `{ children, scroll=true, contentStyle, edges=['top'] }`. Aplica `SafeAreaView` + `ScrollView` con padding del tema.
- **`ScreenHeader`** (`ScreenHeader.tsx:18`): `{ onBack, eyebrow, title, trailing?, action? }`. Barra con botón volver y título.
- **`AppText`** (`AppText.tsx:14`): `{ variant, color, weight, center }`. `variant`: `eyebrow | title | heading | body | small | code`; escala con `scale` del tema.
- **`Buttons`** (`Buttons.tsx`): `PrimaryButton`, `SecondaryButton`, `IconButton` con `{ label, onPress, disabled, compact, icon, style }`. Animación de presión vía `pressStyle` (`:19`) y `useReducedMotion`.
- **`TextField`** (`TextField.tsx:11`): extiende `TextInputProps` + `label`.
- **`Toggle`** (`Toggle.tsx:11`): `{ on, onToggle, label }`.
- **`EmptyState`** (`EmptyState.tsx:7`): `{ title, message }`.
- **`SectionHeading`** (`SectionHeading.tsx:7`): `{ eyebrow, title, trailing? }`.
- **`UnitCard`** (`UnitCard.tsx:22`): `{ unit, subtopicCount, progress, expanded, onToggle, children }`. Usa `ProgressRing` y `MetadataBadge`.
- **`SubtopicRow`** (`SubtopicRow.tsx:17`): `{ lesson, completed, onPress, inline? }`.
- **`HubTile`** (`HubTile.tsx:16`): `{ icon, label, note, accent, onPress }`.
- **`RichContent`** (`RichContent.tsx:8`): `{ blocks: ContentBlock[] }`; soporta `p`, `h`, `bullets`, `numbers`, `table`.
- **`QuizOption`** (`QuizOption.tsx:17`): `{ index, label, selected, result?, onPress }`.
- **Barras de navegación**: `AppTabBar` (`AppTabBar.tsx:16`) decide entre `BottomTabBar` (tabs principales) y `SubtopicTabBar` (dentro de un tema) según `isSubtopicPath(pathname)` (`:21`).
- **`ActivityView`** (`activities/ActivityView.tsx:27`): `{ exercise, onSubmit, allowReset?, locked?, variant?, revealSignal? }`. Es un **switch por `exercise.type`** que instancia 4 engines (`useExerciseEngine`, `useFillEngine`, `useMatchEngine`, `useCrosswordEngine`) y renderiza `OrderExercise`/`FillExercise`/`MatchExercise`/`CrosswordExercise`. `revealSignal` dispara `solve()` (`:45-59`).
- **`ExampleRunner`** (`examples/ExampleRunner.tsx:33`): alterna variante A (demostración) y B (acompañamiento con pistas/solución). Props `{ exercise, index, total, isLast, onNext, onGoExercises, onBack? }`.
- **`EvaluationFlow`** (`evaluation/EvaluationFlow.tsx:88`): motor completo de evaluación; `McqQuestion` local (`:46`), `asExercise` (`:33`) adapta `Question` → `Exercise` para reutilizar `ActivityView`.

**Patrón de props dominante**: componentes "tontos" que reciben datos y callbacks (`onPress`, `onToggle`), sin acceso a repositorios; la lógica vive en los viewmodels.

---

## Fase 4 – Estado y datos

### Manejo de estado

No hay Redux ni Zustand. Se usa **React Context + hooks + `useState`** en 3 niveles:

1. **Estado global (Context)**, montado en `src/app/_layout.tsx:20-23` (orden importa):
   - `AuthProvider` (`useAuth.tsx:54`): `account`, `isLoading`, `register`, `login`, `logout`, `resetProgress`.
   - `SessionProvider` (`useSession.tsx:55`): `location` (última ubicación), `record`, `resumeHref`, `clear`.
   - `LearnerProfileProvider` (`useLearnerProfile.tsx:33`): `profile`, `style`, `darkMode`, `largeText` y setters.
   - `AppThemeProvider` (`theme-provider.tsx:20`): **deriva** el tema de `useLearnerProfile()` → `{ mode, colors, scale }`.
2. **Estado de datos remotos = "estado de BD"**: hooks que cargan async y exponen `refresh()`, p. ej. `useCatalog.ts:26`, `useModuleProgress.ts:27`, `useRecentResults.ts:22`.
3. **Estado local de UI**: `useState` en pantallas (`login.tsx:21`, `ModuleScreens` `expanded`, etc.) y en motores (`useQuizEngine`, `usePracticeEngine`).

Refresco: las pantallas llaman `refresh()` dentro de `useFocusEffect` (p. ej. `(modules)/index.tsx:36`, `(profile)/perfil/index.tsx:27`) para recargar al volver a la pantalla.

### Origen de datos

**100 % local (expo-sqlite), sin red.** Base `mlo.db` (`db.ts:12`), abierta en `SQLiteProvider` con `onInit={migrateAndSeed}`.

`migrateAndSeed` (`db.ts:14`) hace:
1. `PRAGMA journal_mode = WAL` y `foreign_keys = ON` (`:15-16`).
2. Lee `PRAGMA user_version` (`:18`); si `>= DATABASE_VERSION` solo re-ejecuta el DDL idempotente (`CREATE TABLE IF NOT EXISTS`, `:21`).
3. Si no, ejecuta migraciones incrementales (`:25-93`), y al final fija `user_version = 10` (`:96`).
4. `DATABASE_VERSION = 10` (`schema.ts:1`). Migraciones tempranas destruyen y re-siembran (`DROP_ALL_DDL` + `seedDatabase`), otras aplican contenido (`applyUnit1Content`, `applyUnit12ExerciseBank`) — ver `src/data/seed.ts`.

**Tablas** (`schema.ts`): `accounts`, `auth_session`, `units`, `lessons`, `examples`, `exercises`, `results`, `evaluations`, `questions`, `attempts`, `evaluation_results`, `learner_profile`, `module_progress`, `last_location` (+ índices `:139-148`). Los JSON (`synthesis`, `content`, `config`, `steps`, `hints`, `options`) se guardan como TEXT y se parsean en los repositorios.

### Flujo de datos (de la BD a la vista)

```
Vista (src/app) → hook ViewModel (useX) → repositorio (selectX/insertX) → expo-sqlite
```

Ejemplo concreto (mostrar un catálogo):
`ModulesScreen` (`(modules)/index.tsx:31`) llama `useCatalog()` → `refresh` (`useCatalog.ts:26`) → `selectUnits` + `selectLessonsByUnit` (`lessonRepository.ts:75,85`) y `selectProgressMap` (`progressRepository.ts:8`) → estado local → render.

Ejemplo de escritura (marcar lección):
`LessonDetailScreen.goNext` (`lecciones/[id].tsx:74`) → `useModuleProgress.markCompleted` (`useModuleProgress.ts:46`) → `markLessonCompleted` (`progressRepository.ts:23`, `INSERT ... ON CONFLICT`) → `refresh()`.

### Repositorios (todos reciben `db` como primer argumento)

- `accountRepository.ts`: `insertAccount`, `selectAccountByUsername/ById`, `selectSessionAccountId`, `saveSession`, `clearSession`.
- `profileRepository.ts`: `selectProfile`, `saveProfile`, `createDefaultProfile` (por defecto `'Pragmático'`, `dark_mode=1`).
- `progressRepository.ts`: `selectProgressMap`, `markLessonCompleted`, `countCompletedByUnit`, `resetAccountProgress` (transacción, `:58`).
- `lessonRepository.ts`: `selectUnits`, `selectLessonsByUnit`, `selectLesson`, `selectAllLessons`.
- `exerciseRepository.ts` / `exampleRepository.ts`: `selectExercisesByLesson`, `selectExercise`, `selectExamplesByLesson`, `selectExampleByLesson`, `insertResult`.
- `evaluationRepository.ts`: `selectEvaluationByLesson`, `selectQuestions`, `insertEvaluationResult`, `selectRecentEvaluationResults`, `selectEvaluationSummaries`.
- `attemptRepository.ts`: `insertAttempt`, `selectAttemptsByLesson`.
- `locationRepository.ts`: `selectLocation`, `saveLocation`, `clearLocation`.

### Viewmodels (lógica de presentación y motores)

- Auth: `useAuth.tsx`, `authLogic.ts`.
- Sesión/perfil: `useSession.tsx`, `useLearnerProfile.tsx`, `useCatalog.ts`, `useModuleProgress.ts`.
- Contenido: `useLessonContent.ts`, `useLessonHub.ts`.
- Motores: `usePracticeEngine.ts`, `useExamplesEngine.ts`, `useQuizEngine.ts` (`useEvaluationEngine`, `useEvaluationForLesson`, `useRecordEvaluationResult`).
- Analítica: `analyticsLogic.ts` (`summarizeAttempts`, `weakTypes`, `recommendReview`), `quizLogic.ts` (`computeScore`, `countCorrect`, `optionResult`).
- Lógica pura de ejercicios: `exerciseLogic.ts`, `exampleLogic.ts`, `exerciseHints.ts`.

### Autenticación

Local, sin servidor. En `useAuth.tsx`:

- **Registro** (`:84`): `validateRegistration` → `normalizeUsername` → comprueba duplicado → `salt = Crypto.randomUUID()` → `hashPassword` → `insertAccount` → `createDefaultProfile` → `saveSession`.
- **Hash** (`authLogic.ts:69`): `sha256("<salt>:<password>")` usando `expo-crypto` (`useAuth.tsx:34`). Es un **hash con salt, no un KDF** (nota de seguridad para Fase 6).
- **Login** (`:107`): busca por usuario y `verifyPassword` (`authLogic.ts:73`).
- **Sesión** (`accountRepository.ts:65`): fila única `auth_session(id=1, account_id)`; se restaura al arrancar (`useAuth.tsx:59-82`).
- **Logout** (`:132`) borra la sesión; `resetProgress` (`:137`) llama `resetAccountProgress`.

---

## Fase 5 – Lo nativo y la configuración

### Proyecto Expo (managed/prebuild)

No existen carpetas `android/` ni `ios/` (verificado): el proyecto es **Expo managed**, sin código nativo propio. La app se compila con `expo start`/`expo prebuild`/EAS y corre en Expo Go, emulador o build de desarrollo.

### `app.json`

- Identidad: `name`, `slug`, `version`, `scheme: "mloingenieriasoftware"` (deep links), `orientation: "portrait"`, `userInterfaceStyle: "automatic"`.
- **Plugins** (`:27-40`): `expo-router`, `expo-splash-screen` (backgroundColor `#208AEF`), `expo-sqlite`, `expo-image`, `expo-web-browser`.
- **Experiments** (`:41-44`): `typedRoutes: true` (rutas tipadas) y `reactCompiler: true` (**React Compiler** activado — memoiza automáticamente; hay que tenerlo en cuenta al razonar sobre renders).
- Iconos y splash en `assets/images/*`; `ios.icon` apunta a `assets/expo.icon`.

### Configuración de build y herramientas

- `metro.config.js`: añade `wasm` a `assetExts` para soportar `expo-sqlite` en web (`:5-8`).
- `tsconfig.json`: `strict: true`; alias `@/*` → `./src/*` y `@/assets/*` → `./assets/*`; **excluye `prototipo`** (`:25`).
- `eslint.config.js`: flat config con `eslint-config-expo`; ignora `dist`, `.expo`, `prototipo`; desactiva `react-hooks/set-state-in-effect` (`:11`).
- `expo-env.d.ts`: tipos de Expo generados.
- `.env.example`: indica que **no se necesitan variables de entorno** en local.

### Librerías nativas usadas realmente

- `expo-sqlite` (BD local, WAL) — núcleo de persistencia.
- `expo-crypto` (`useAuth.tsx:1,34`) para `randomUUID` + SHA-256.
- `expo-router` + `expo-linking` (navegación), `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `expo-font`.
- `react-native-gesture-handler`, `react-native-reanimated` + `react-native-worklets`, `react-native-screens`, `react-native-safe-area-context`, `react-native-svg`.

**No hay permisos declarados** (ni cámara, ni ubicación, ni sensores) — coherente con “sin RA ni sensores nativos”.

### Cómo se ejecuta y compila

Según `package.json:44-52`:
- `npm run start` / `android` / `ios` / `web` → `expo start ...`.
- `npm run lint` → `expo lint`.
- `npm test` → `jest` (preset `jest-expo` + `@testing-library/react-native`; 22 archivos `*.test.*`).
- Typecheck: `npx tsc --noEmit` (según `AGENTS.md`).
- Web: `output: "single"` + `bundler: "metro"` (`app.json:22-26`).

---

## Fase 6 – Flujo completo y problemas

### Flujo real de principio a fin

1. **Registro** (`register.tsx:33`) → `useAuth.register` (`useAuth.tsx:84`) crea cuenta (hash+salt), perfil por defecto y sesión.
2. **Login** (`login.tsx:25`) → `useAuth.login` (`:107`) → `router.replace('/')`.
3. **Módulos** (`(modules)/index.tsx:31`): `useCatalog.refresh` carga unidades, lecciones y progreso; "Continuar" usa `resumeHref` de `useSession`.
4. **Tema/hub** (`tema/[id].tsx:26`): `useLessonHub` trae lección, unidad, ejercicios y evaluación; registra `section: 'hub'`.
5. **Lecciones** (`lecciones/[id].tsx`): `useLessonContent`; al terminar `markCompleted` (`:74`) → `insert`/`update` en `module_progress`.
6. **Ejemplos** (`ejemplos/index.tsx`): `useExamplesEngine`; `ExampleRunner` variantes A/B.
7. **Ejercicios** (`ejercicios/index.tsx`): `usePracticeEngine.submit` (`:83`) inserta en `attempts` (`source='practice'`); el resumen usa `summarizeAttempts` + `recommendReview`.
8. **Evaluación** (`EvaluationFlow.tsx`): `useEvaluationEngine` inserta en `attempts` (`source='evaluation'`, `:214`) y, al terminar, `useRecordEvaluationResult` inserta en `evaluation_results` (`:119`) y `markCompleted` (`:121`).
9. **Historial** (`evaluaciones/index.tsx`): `useRecentResults` + `useEvaluationsCatalog`.
10. **Perfil** (`perfil/index.tsx`): `useLearnerProfile` persiste estilo/apariencia; `resetProgress` borra progreso y resultados (`progressRepository.ts:57`).

**Guardar un dato, en concreto**: tocar "Terminar" en lecciones → `markCompleted(lesson.id)` → `markLessonCompleted(db, accountId, lessonId)` → fila en `module_progress` (`ON CONFLICT ... DO UPDATE`) → `refresh()` repinta el progreso.

### Código duplicado

- **`TYPE_LABELS`** redefinido en 3 lugares: `components/examples/ExampleRunner.tsx:15`, `components/evaluation/EvaluationFlow.tsx:25`, `app/(app)/(modules)/ejercicios/index.tsx:18`. Debería vivir en `models` o `theme`.
- **`MESSAGES`** de errores replicado en `login.tsx:12` y `register.tsx:12`.
- **Rutas wrapper idénticas**: `(modules)/evaluacion/index.tsx` y `(evaluations)/evaluacion/index.tsx` son el mismo `<EvaluationFlow />` de 5 líneas.
- **Filtrado de tipos** `KNOWN_TYPES`/`KNOWN_ACTIVITY_TYPES` repetido en `usePracticeEngine.ts:12`, `useExamplesEngine.ts:7`, `useQuizEngine.ts:16`, `analyticsLogic.ts:3`.
- **Plantillas de login/register** (hero + card) casi idénticas.

### Código muerto / no usado (verificado por búsqueda)

- `useQuizEngine` (`useQuizEngine.ts:32`, motor MCQ) — solo lo usan sus tests; la app usa `useEvaluationEngine`.
- `useAttempts.ts` — exportado, sin consumidores.
- `useExample.ts` — sin consumidores (se usa `useExamplesEngine`).
- `useScaledFont` (`theme-provider.tsx:48`) y `saveQuestionnaire` (`useLearnerProfile.tsx:27`) — sin consumidores (el cuestionario CHAEA no está implementado; `AGENTS.md` lo deja como extensión).
- Repositorios sin uso: `selectUnit` y `selectAllLessons` (`lessonRepository.ts:80,98`), `selectExample` (solo lo usaba `useExample`).
- `src/global.css` — sin importar.
- **Dependencias declaradas pero no importadas** (`package.json`): `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-web-browser`, `expo-device`, `expo-constants` (varias también listadas como plugins en `app.json`). Assets de plantilla sin usar (`react-logo*`, `expo-logo`, `tutorial-web`, `tabIcons/`).

### Malas prácticas y riesgos

1. **Criptografía de contraseñas débil** (`authLogic.ts:69`): un solo SHA-256 con salt, no un KDF lento (bcrypt/scrypt/PBKDF2/argon2). Es local y sin red, pero almacenar credenciales así no es recomendable.
2. **Efecto secundario dentro de un updater de estado** (`usePracticeEngine.ts:85-94`): `insertAttempt` se llama dentro de `setAnswered(updater => ...)`. Los updaters deben ser puros; con React Compiler/StrictMode puede invocarse más de una vez. Mejor mover el efecto fuera.
3. **Migraciones destructivas**: las versiones tempranas (`db.ts:25-28`) hacen `DROP_ALL_DDL` + re-seed, borrando datos del usuario. Aceptable en prototipo, arriesgado en producción. Además `applyUnit1Content`/`applyUnit12ExerciseBank` se re-ejecutan en varias versiones (`:70,76,91,92`); depende de que sean idempotentes.
4. **`homeTabForRoute` lanza error** ante una ruta desconocida (`tabRoutes.ts:24`): añadir una pestaña sin actualizar el mapa rompe la tab bar.
5. **Dependencia de `Stack.Protected`** (`_layout.tsx:45-51`), API reciente de Expo Router: correcta aquí, pero conviene fijar versión.
6. **Rendimiento de listas**: catálogos e historial usan `ScrollView` (`Screen`) en vez de `FlatList`; correcto con datos pequeños, no escala con miles de filas.
7. **`reactCompiler: true`** sin `useMemo`/`useCallback` exhaustivos: la mayoría de hooks sí memoiza, pero conviene ser consciente de que el compilador cambia el comportamiento de re-render.
8. **Ciclos de carga duplicados**: cada pantalla dispara `refresh()` en `useFocusEffect` y los hooks también en `useEffect`, provocando consultas repetidas a SQLite.
9. **`displayName` de `register` puede quedar vacío** en la sesión inicial si el trim se aplica tras la validación; validado, pero el `account` inicial usa `new Date().toISOString()` reconstruido (`useAuth.tsx:101`) en vez del valor de BD.
10. **`resetProgress`** solo borra `module_progress`, `evaluation_results` y `results` (`progressRepository.ts:57-62`): **no** limpia `attempts` ni `last_location`. El resumen de analítica (`summarizeAttempts` sobre `attempts`) seguiría mostrando datos antiguos tras “Reiniciar mi progreso”.

### Fortalezas

- Separación MVVM limpia y consistente: vistas sin acceso a repositorios.
- Lógica pura extraída y **probada** (`exerciseLogic`, `quizLogic`, `analyticsLogic`, `authLogic`, `exampleLogic`) + motores con tests (22 archivos).
- Offline-first real: cero llamadas de red.
- Tipado estricto y rutas tipadas (`typedRoutes`).
- Accesibilidad cuidada (`accessibilityRole`, `accessibilityLabel`, `accessibilityState` en botones, tabs y toggles).
