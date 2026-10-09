# Auditoría técnica profunda — MLO Ingeniería de Software

> Documento **nuevo**; no modifica `docs/review.md`. Fecha de ejecución: 2026-10-08.
> Método: ejecución de comandos reales + inspección estática del código. Cada afirmación cita archivo, símbolo y línea.

## Convenciones de evidencia

- **[HECHO]** verificado por comando ejecutado o lectura directa del código.
- **[INFERENCIA]** deducción razonada a partir de hechos; no ejecutada (p. ej. comportamiento en runtime de React).
- **[NO COMPROBABLE]** no se pudo verificar en este entorno (p. ej. runtime en dispositivo, StrictMode).
- **[LÍMITE]** requiere medición reproducible; no se clasifica como defecto.

---

## 1. Resumen ejecutivo

La base es sólida: **`tsc --noEmit` pasa (exit 0), `expo lint` pasa (exit 0), 22 suites/145 tests pasan (exit 0)** y los tres *exports* (web, Android, iOS) se generan sin errores. La arquitectura MVVM se respeta y **no existe ninguna llamada de red** (búsqueda sin coincidencias de `fetch|axios|XMLHttpRequest|WebSocket|http(s)://`).

No se detectó ningún hallazgo **P0**. Los problemas relevantes son de **corrección de datos y robustez**:

- **AUD-01 (P1):** `resetProgress` no borra `attempts`, `last_location` ni el estado de sesión → tras "Reiniciar mi progreso" persisten analítica y "Continuar donde lo dejaste" (`progressRepository.ts:57-62`).
- **AUD-02 (P1):** efecto secundario (`insertAttempt`) dentro de un actualizador de estado en `usePracticeEngine.submit` (`usePracticeEngine.ts:85-94`) → riesgo de **escrituras duplicadas**.
- **AUD-03 (P1):** la migración a `user_version` 5 **borra** los `attempts` de la Unidad 1 (`db.ts:37-68` + `seed.ts:247-254`).
- **AUD-04 (P2):** migración no atómica globalmente; `PRAGMA user_version` se fija al final, fuera de transacción (`db.ts:96`).
- **AUD-05/AUD-16 (P2):** ausencia de manejo de errores y de bloqueo de botones durante operaciones async.
- **AUD-06 (P2):** contraseñas con SHA-256 + salt de una sola pasada, no un KDF (`authLogic.ts:69-80`).

Deuda técnica: código muerto (incluida la tabla `results` completa), duplicación, dependencias sin import directo y **cobertura de tests del 66.82% (solo archivos tocados) / 49.92% (todo `src`)**.

**El proyecto compila, pasa tests y exporta.** Las correcciones priorizadas son de integridad de datos y endurecimiento, no bloqueantes de compilación.

---

## 2. Separación de hechos, inferencias y no comprobables

### 2.1 Hechos verificados (comandos)

| Hecho | Evidencia |
|---|---|
| Typecheck estricto sin errores | `npx tsc --noEmit` → `TSC_EXIT=0` |
| Lint sin errores | `npm run lint` → `LINT_EXIT=0` |
| 22 suites / 145 tests pasan | `npm test -- --runInBand` → `TEST_EXIT=0` |
| Cobertura (archivos tocados) | 66.82% stmts / 56.93% branches / 63.86% funcs / 66.73% lines |
| Cobertura (todo `src/**`) | 49.92% stmts / 48.93% branches / 47.68% funcs / 49.54% lines |
| web export OK | `expo export --platform web` → `WEB_EXPORT_EXIT=0`, `entry-*.js` 2.5 MB |
| android export OK | `expo export --platform android` → `ANDROID_EXPORT_EXIT=0`, `.hbc` 4.4 MB |
| ios export OK | `expo export --platform ios` → `IOS_EXPORT_EXIT=0`, `.hbc` 4.2 MB |
| expo-doctor | 20/21 checks; falla "packages match versions required by Expo SDK" |
| Sin red | búsqueda `fetch|axios|XMLHttpRequest|WebSocket|http(s)://` en `src` → 0 coincidencias |
| Sin logs/TODO | búsqueda `console.(log|warn|error)|TODO|FIXME` en `src` → 0 coincidencias |

### 2.2 Inferencias

- Doble invocación de actualizadores de estado con StrictMode/React Compiler → escrituras duplicadas (AUD-02). **[INFERENCIA]**
- `PRAGMA foreign_keys` es por conexión; una segunda conexión no tendría FK activas (AUD-18). **[INFERENCIA]**
- Fallo parcial de migración deja esquema inconsistente (AUD-04). **[INFERENCIA]**

### 2.3 Aspectos no comprobables en este entorno

- Ejecución en dispositivo/emulador y comportamiento real de `Stack.Protected` (`_layout.tsx:44-52`). **[NO COMPROBABLE]**
- Si Expo habilita `StrictMode` en dev para este proyecto. **[NO COMPROBABLE]**
- Rendimiento real (N+1 en `useCatalog.ts:29-31`) sin medición. **[LÍMITE]**
- Necesidad real de dependencias sin import directo (pueden ser requeridas por plugins/transitivas). **[LÍMITE]**

---

## 3. Resultados completos de los comandos

### 3.1 `npx tsc --noEmit`

```
(sin salida)
TSC_EXIT=0
```

### 3.2 `npm run lint`

```
> mlo-ingenieria-software@1.0.0 lint
> expo lint
LINT_EXIT=0
```

### 3.3 `npm test -- --runInBand`

```
Test Suites: 22 passed, 22 total
Tests:       145 passed, 145 total
Snapshots:   0 total
Time:        34.926 s
TEST_EXIT=0
```

Suites: ActivityLocking, useExamplesEngine, ExampleFlow, ModulesResumeHero, useSession, ResultActionBranches, LessonFinish, useExerciseEngine, useQuizEngine, FillExerciseMarking, SubtopicTabBar, AppTabBar, BottomTabBar, exerciseLogic, quizLogic, authLogic, locationRepository, db, tabRoutes, locationRoutes, exampleLogic, analyticsLogic.

### 3.4 Cobertura

Resumen (coverage por defecto, solo archivos importados por tests):

```
Statements : 66.82% ( 963/1441 )
Branches   : 56.93% ( 620/1089 )
Functions  : 63.86% ( 258/404 )
Lines      : 66.73% ( 919/1377 )
```

Con `--collectCoverageFrom="src/**/*.{ts,tsx}"` (todo `src`): **49.92% stmts / 48.93% branches / 47.68% funcs / 49.54% lines**.

Zonas con 0% de cobertura (extracto):
- `data/repositories/*` (excepto `locationRepository.ts`): `accountRepository`, `attemptRepository`, `evaluationRepository`, `exampleRepository`, `exerciseRepository`, `lessonRepository`, `profileRepository`, `progressRepository`.
- `viewmodels/*`: `useAuth.tsx` (3.38%), `useCatalog`, `useLearnerProfile`, `useLessonContent`, `useLessonHub`, `useModuleProgress`, `usePracticeEngine`, `useRecentResults`, `useEvaluationsCatalog`, `useAttempts`, `useExample`.
- `app/**`: `_layout.tsx`, `login.tsx`, `register.tsx`, `tema/[id].tsx`, `perfil/index.tsx`, `evaluaciones/index.tsx` (0%).
- `components/*`: `HubTile`, `ResultModal`, `RichContent`, `TextField`, `Toggle`, `SubtopicRow` (16.66%), `QuizOption` (16.66%).
- `theme/theme-provider.tsx` (0%), `hooks/useReducedMotion.ts` (0%).

### 3.5 `npx expo-doctor`

```
Running 21 checks on your project...
20/21 checks passed. 1 checks failed.

✖ Check that packages match versions required by installed Expo SDK
package            expected  found
@expo/ui           ~57.0.22  57.0.18
expo               ~57.0.27  57.0.22
expo-constants     ~57.0.21  57.0.18
expo-glass-effect  ~57.0.4   57.0.3
expo-linking       ~57.0.12  57.0.10
expo-router        ~57.0.25  57.0.21
expo-sqlite        ~57.0.4   57.0.3
7 packages out of date.
```

### 3.6 Builds / export

| Plataforma | Comando | Resultado |
|---|---|---|
| Web | `npx expo export --platform web` | OK. 1408 módulos; `index.html` + `entry-*.js` (2.5 MB) + `wa-sqlite.wasm` (621 KB) |
| Android | `npx expo export --platform android` | OK. 1875 módulos; `entry-*.hbc` (4.4 MB) |
| iOS | `npx expo export --platform ios` | OK. 1781 módulos; `entry-*.hbc` (4.2 MB) |

Nota **[HECHO]**: `dist/` está en `.gitignore`, por lo que el export no contamina el repositorio versionado. El build **nativo** (APK/AAB/IPA) no se ejecutó: requiere prebuild + toolchains (Android SDK/Xcode), fuera del alcance viable aquí.

### 3.7 Búsqueda de imports/exports/archivos/dependencias sin uso

**[HECHO]** Símbolos exportados sin consumidor en `src` (solo definición):

| Símbolo | Archivo | Evidencia |
|---|---|---|
| `useQuizEngine` (motor MCQ) | `viewmodels/useQuizEngine.ts:32` | solo usado en `__tests__/useQuizEngine.test.tsx` |
| `useAttempts` | `viewmodels/useAttempts.ts:17` | solo definición |
| `useExample` | `viewmodels/useExample.ts:12` | solo definición |
| `useExercise` | `viewmodels/useExerciseEngine.ts:166` | solo definición |
| `useExerciseForLesson` | `viewmodels/useExerciseEngine.ts:114` | solo definición |
| `useRecordExerciseResult` | `viewmodels/useExerciseEngine.ts:143` | solo definición |
| `selectUnit` | `data/repositories/lessonRepository.ts:80` | solo definición |
| `selectAllLessons` | `data/repositories/lessonRepository.ts:98` | solo definición |
| `selectExample` | `data/repositories/exampleRepository.ts:76` | solo usado por `useExample` (a su vez muerto) |
| `selectExampleByLesson` | `data/repositories/exampleRepository.ts:81` | solo definición |
| `insertResult` | `data/repositories/exerciseRepository.ts:60` | solo usado por `useRecordExerciseResult` (muerto) |
| `useScaledFont` | `theme/theme-provider.tsx:48` | solo definición |
| `saveQuestionnaire` | `viewmodels/useLearnerProfile.tsx:27,92` | expuesto, sin consumidores |
| `useSession().clear` | `viewmodels/useSession.tsx:95` | solo usado en test |
| `ResultModal` | `components/ResultModal.tsx:16` | sin importadores |
| `metadata` | `models/metadata.ts:1` | sin importadores |
| `src/global.css` | `src/global.css` | sin importadores |

**[HECHO]** Dependencias declaradas en `package.json` sin import directo en `src`:
`@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-web-browser`, `expo-device`, `expo-constants`.
**[LÍMITE]**: esto **no implica** que sean innecesarias; pueden ser requeridas por plugins de `app.json` o transitivas. `expo-doctor` no las marcó como innecesarias (solo como desactualizadas).

**[HECHO]** Assets de plantilla sin referencias en `src`: `assets/images/react-logo*`, `expo-logo.png`, `tutorial-web.png`, `tabIcons/` (no referenciados en código).

---

## 4. Tabla priorizada de hallazgos

| ID | Sev | Título | Archivo(s) clave | Confianza |
|---|---|---|---|---|
| AUD-01 | P1 | `resetProgress` incompleto: no borra `attempts`/`last_location`/sesión | `progressRepository.ts:57`, `useLearnerProfile`/`useSession` | Alta |
| AUD-02 | P1 | Efecto secundario dentro de actualizador de estado | `usePracticeEngine.ts:85` | Alta (patrón) / Media (impacto) |
| AUD-03 | P1 | Migración v5 borra `attempts` de Unidad 1 | `db.ts:37-68`, `seed.ts:247-254` | Alta |
| AUD-04 | P2 | Migración no atómica; `user_version` fuera de transacción | `db.ts:30-96` | Media |
| AUD-05 | P2 | Sin manejo de errores en hooks async; `isLoading` colgado | `useAuth.tsx:84`, `useLessonContent.ts:30` | Alta |
| AUD-06 | P2 | Credenciales con SHA-256+salt (no KDF) | `authLogic.ts:69-80`, `useAuth.tsx:95` | Alta |
| AUD-07 | P2 | `recordedRef` no se reinicia al cambiar de lección sin remount | `EvaluationFlow.tsx:98,113-123` | Media/Baja |
| AUD-08 | P2 | Botones de envío no se deshabilitan durante async (doble envío) | `login.tsx:65`, `register.tsx:84` | Media |
| AUD-09 | P2 | Repositorios críticos con 0% de cobertura | `data/repositories/*` | Alta |
| AUD-10 | P3 | Tabla `results` + entidad `Result` inertes | `schema.ts:65`, `entities.ts:92`, `exerciseRepository.ts:60` | Alta |
| AUD-11 | P3 | Código muerto (hooks/repos/componentes) | varios (ver 3.7) | Alta |
| AUD-12 | P3 | Duplicación de constantes y wrappers | `ExampleRunner.tsx:15`, `EvaluationFlow.tsx:25`, `ejercicios/index.tsx:18` | Alta |
| AUD-13 | P3 | Dependencias/assets sin import directo | `package.json`, `assets/` | Media |
| AUD-14 | P3 | `homeTabForRoute` lanza excepción ante ruta desconocida | `tabRoutes.ts:24` | Alta |
| AUD-15 | P3 | Blanks con `Text onPress` sin rol/etiqueta accesible | `FillExercise.tsx:56` | Alta |
| AUD-16 | P3 | Consultas N+1 y doble carga (potencial) | `useCatalog.ts:29`, `(modules)/index.tsx:36` | Media [LÍMITE] |
| AUD-17 | P3 | 7 paquetes con patch desactualizado | `package.json` (expo-doctor) | Alta |
| AUD-18 | P3 | `PRAGMA foreign_keys` solo en la conexión de init | `db.ts:16` | Media |
| AUD-19 | P3 | `seedDatabase` no idempotente si se re-ejecuta sobre BD existente | `seed.ts:285-316` | Alta |
| AUD-20 | P3 | `metadata.ts` y `global.css` huérfanos | `models/metadata.ts`, `src/global.css` | Alta |

---

## 5. Hallazgos detallados

### AUD-01 — `resetProgress` no restablece todo el estado del usuario · **P1**

- **Evidencia:** `progressRepository.ts:57-62` (`resetAccountProgress`) solo ejecuta `DELETE FROM module_progress`, `DELETE FROM evaluation_results`, `DELETE FROM results`. No toca `attempts` (`schema.ts:93-102`) ni `last_location` (`schema.ts:130-137`). La analítica se calcula sobre `attempts`: `useQuizEngine.ts:190` (`selectAttemptsByLesson` → `summarizeAttempts`) y `usePracticeEngine.ts:75`. La ubicación en memoria (`useSession.tsx:58`) no se limpia desde `useAuth.resetProgress` (`useAuth.tsx:137-142`).
- **Impacto:** tras "Reiniciar mi progreso" (`perfil/index.tsx:39-53`), el usuario ve progreso y resultados vacíos, pero (a) `recommendReview` sigue recomendando repaso por intentos viejos y (b) "Continuar donde lo dejaste" apunta a la lección anterior.
- **Reproducir:**
  1. Registrar cuenta, completar ejercicios y una evaluación del tema 1.2.
  2. Perfil → "Reiniciar mi progreso" → confirmar.
  3. Entrar a un tema y ver el resumen de ejercicios: las recomendaciones siguen basadas en intentos previos; la tarjeta "Continuar" conserva la ubicación.
- **Solución recomendada:** ampliar `resetAccountProgress` para borrar `attempts` y `last_location`, y exponer un `clear()` de sesión invocado desde `resetProgress`; alternativamente crear `resetAccountData` que orqueste los tres repositorios en una transacción.
- **Archivos:** `progressRepository.ts`, `useAuth.tsx`, `useSession.tsx`, `perfil/index.tsx`.
- **Criterio de aceptación:** tras reset, `SELECT COUNT(*) FROM attempts WHERE account_id=?` = 0, `last_location` sin fila, y la pantalla de Módulos no muestra "Continuar" apuntando a la lección previa.
- **Prueba de regresión:** test que ejecute `resetAccountProgress` con un mock que capture los `DELETE` y verifique que incluye `attempts` y `last_location`; test de integración opcional con BD en memoria.
- **Confianza:** Alta.

### AUD-02 — Efecto secundario dentro de actualizador de estado · **P1**

- **Evidencia:** `usePracticeEngine.ts:83-97`. `submit` llama `setAnswered(current => { ...; void insertAttempt(...); return true; })` (línea 91). El actualizador de `useState` debe ser puro.
- **Impacto:** con StrictMode (React 18/19) los actualizadores se invocan dos veces en desarrollo; `insertAttempt` se ejecutaría dos veces → filas duplicadas en `attempts`, sesgando `summarizeAttempts`/`accurracy` y `recommendReview`. También puede duplicar si React re-ejecuta el render por concurrencia.
- **Reproducir:** ejecutar la pantalla de ejercicios en modo estricto y contar filas de `attempts` por un único `Comprobar`.
- **Solución recomendada:** mover la escritura fuera del actualizador (usar un guard con `useRef` o `if (answered) return;` antes del `setState`, como ya hace `useEvaluationEngine.submit` en `useQuizEngine.ts:207-228`).
- **Archivos:** `usePracticeEngine.ts`.
- **Criterio de aceptación:** un solo `insertAttempt` por acción `Comprobar`, incluso con StrictMode.
- **Prueba de regresión:** test con `renderHook` + mock de `insertAttempt` que dispare `submit` dos veces y afirme `toHaveBeenCalledTimes(1)`.
- **Confianza:** Alta en el anti-patrón; Media en la duplicación efectiva (depende de StrictMode). **[INFERENCIA]**

### AUD-03 — Migración a v5 borra intentos de la Unidad 1 · **P1**

- **Evidencia:** `db.ts:37-68` (bloque `if (currentVersion < 5)`) llama `applyUnit1Content(db)` con el argumento por defecto `clearAttempts = true` (`seed.ts:247`). `applyUnit1Content` ejecuta `DELETE FROM attempts WHERE lesson_id IN ('l1.1'...'l1.4')` (`seed.ts:249-254`).
- **Impacto:** un usuario con `user_version` 2–4 que actualice pierde su historial de intentos de la Unidad 1. Las migraciones a v6 (`db.ts:70`) y v8 (`db.ts:76`) sí usan `applyUnit1Content(db, false)`, lo que confirma que preservar era la intención.
- **Reproducir:** crear BD con `user_version=4` y filas en `attempts` para `l1.2`; ejecutar `migrateAndSeed`; verificar borrado.
- **Solución recomendada:** llamar `applyUnit1Content(db, false)` en el bloque `< 5`, o guardar con una condición de migración documentada.
- **Archivos:** `db.ts`, `seed.ts`.
- **Criterio de aceptación:** migrar desde `user_version=4` no elimina filas de `attempts`.
- **Prueba de regresión:** extender `db.test.ts` con un caso `user_version=4` que afirme que no se ejecuta `DELETE FROM attempts`.
- **Confianza:** Alta (el `DELETE` es `[HECHO]`; el impacto depende de la ruta de upgrade).

### AUD-04 — Migración no atómica y `user_version` fuera de transacción · **P2**

- **Evidencia:** `db.ts:14-96`. Los `execAsync` de DDL (`:31,35,38-66,79-88`) no están dentro de una transacción; `PRAGMA user_version = 10` se fija al final (`:96`). Solo los `apply*Content`/`seedDatabase` usan `withTransactionAsync` (`seed.ts:248,278,286`).
- **Impacto:** si un paso intermedio falla, parte del esquema queda aplicado y `user_version` sigue antiguo; el reintento puede re-ejecutar `ALTER TABLE ... ADD COLUMN` sobre columnas ya existentes y fallar permanentemente.
- **Reproducir:** simular un error (mock de `runAsync` que lance) en medio del bloque `< 5` y volver a invocar `migrateAndSeed` con el mismo `user_version`.
- **Solución recomendada:** envolver cada paso de migración en `withTransactionAsync` y fijar `user_version` dentro del mismo paso; o adoptar una librería de migraciones monotónicas.
- **Archivos:** `db.ts`.
- **Criterio de aceptación:** un fallo en cualquier paso deja `user_version` sin avanzar y el reintento es idempotente.
- **Prueba de regresión:** test con `runAsync` que lance en un `ALTER` y una segunda pasada que no duplicate columnas.
- **Confianza:** Media. **[INFERENCIA]**

### AUD-05 — Sin manejo de errores en operaciones async · **P2**

- **Evidencia:** `useAuth.tsx:84-130` (`register`/`login`) no usa `try/catch`; `useLessonContent.ts:30-41`, `useCatalog.ts:26-37`, `useModuleProgress.ts:27-40`, `useRecentResults.ts:22-26` no capturan rechazos ni fijan estado de error. `login.tsx:25-32` y `register.tsx:32-39` invocan `await login/register` sin `try/catch`.
- **Impacto:** ante un error de BD, la promesa se rechaza, `isLoading` permanece `true` (pantalla de "Cargando" infinita) y no se informa al usuario; se producen *unhandled promise rejections*.
- **Reproducir:** forzar error en `selectUnits` (mock) al abrir Módulos → estado de carga indefinido.
- **Solución recomendada:** añadir captura de error en cada hook (estado `error`) y en los formularios; mostrar `EmptyState`/mensaje de error.
- **Archivos:** `useAuth.tsx`, `useCatalog.ts`, `useLessonContent.ts`, `useModuleProgress.ts`, `useRecentResults.ts`, `login.tsx`, `register.tsx`.
- **Criterio de aceptación:** un fallo de repositorio muestra estado de error y permite reintentar; ninguna promesa queda rechazada sin manejar.
- **Prueba de regresión:** test de hook que mockee el repositorio para lanzar y afirme `isLoading === false` y `error !== null`.
- **Confianza:** Alta.

### AUD-06 — Credenciales con SHA-256 simple · **P2**

- **Evidencia:** `authLogic.ts:69-71` (`hashPassword` = `digest("<salt>:<password>")`) y `:73-80`; digest = `Crypto.digestStringAsync(SHA256, ...)` en `useAuth.tsx:34`; salt `Crypto.randomUUID()` en `useAuth.tsx:95`.
- **Impacto:** SHA-256 es rápido, lo que facilita ataques de fuerza bruta/diccionario offline si se extrae `mlo.db`. Es local (sin red), lo que reduce el vector, pero el estándar recomienda KDF lento.
- **Reproducir:** inspeccionar `accounts.password_hash` en la BD: es un SHA-256 en hexadecimal, no bcrypt/scrypt/PBKDF2.
- **Solución recomendada:** usar PBKDF2 (WebCrypto) o una KDF con iteraciones y salt; migrar el formato de hash.
- **Archivos:** `authLogic.ts`, `useAuth.tsx`.
- **Criterio de aceptación:** el hash almacenado es de una KDF con iteraciones; verificación retrocompatible o estrategia de rehash en login.
- **Prueba de regresión:** test unitario que afirme que dos hashes del mismo password con distinto salt difieren y que `verifyPassword` falla con password erróneo.
- **Confianza:** Alta.

### AUD-07 — `recordedRef` no se reinicia entre lecciones · **P2**

- **Evidencia:** `EvaluationFlow.tsx:98` (`recordedRef = useRef(false)`), `:113-123` (efecto que registra si `phase==='summary'` y no está registrado). El `ref` nunca vuelve a `false`; depende de que el componente se desmonte al cambiar de `lesson`.
- **Impacto:** si Expo Router reutiliza la instancia del componente para otra lección, el segundo resultado **no se registra** en `evaluation_results`.
- **Reproducir:** navegar de `/evaluacion?lesson=A` a `/evaluacion?lesson=B` sin desmontar y completar B → sin fila nueva.
- **Solución recomendada:** resetear `recordedRef.current = false` cuando cambie `lessonParam`/`evaluation.id` (p. ej. en el mismo `useEffect`).
- **Archivos:** `EvaluationFlow.tsx`.
- **Criterio de aceptación:** cada evaluación completada inserta exactamente un registro aunque cambie la lección.
- **Prueba de regresión:** test que renderice `EvaluationFlow` con dos `lesson` distintos y afirme dos llamadas a `record`.
- **Confianza:** Media/Baja (depende del ciclo de vida real de la ruta). **[INFERENCIA]**

### AUD-08 — Doble envío en login/registro · **P2**

- **Evidencia:** `login.tsx:65` (`<PrimaryButton label="Entrar" onPress={submit} />`) y `register.tsx:84` no pasan `disabled` durante el `await`; `PrimaryButton` (`Buttons.tsx:40-44`) acepta `disabled` pero no se usa aquí.
- **Impacto:** doble tap puede ejecutar dos veces `login` o `register`; en registro, el segundo `insertAccount` violaría `UNIQUE(username)` (`schema.ts:6`) y lanzaría una promesa rechazada (ver AUD-05).
- **Reproducir:** tocar "Crear cuenta" dos veces rápidamente con el mismo usuario.
- **Solución recomendada:** estado local `submitting` que deshabilite el botón y `try/catch` con mensaje.
- **Archivos:** `login.tsx`, `register.tsx`.
- **Criterio de aceptación:** un doble tap produce un solo intento; nunca hay rechazo sin manejar.
- **Prueba de regresión:** test de `RegisterScreen` que dispare `onPress` dos veces y afirme una sola llamada a `register`.
- **Confianza:** Media.

### AUD-09 — Repositorios críticos sin cobertura · **P2**

- **Evidencia:** sección 3.4. `accountRepository`, `progressRepository`, `evaluationRepository`, `attemptRepository`, `lessonRepository`, `exerciseRepository`, `exampleRepository`, `profileRepository` = 0% de sentencias.
- **Impacto:** las rutas de persistencia (incluidas las de AUD-01/AUD-03) no tienen prueba; regresiones de SQL pasan desapercibidas.
- **Reproducir:** `npm test -- --coverage --collectCoverageFrom="src/**/*.{ts,tsx}"`.
- **Solución recomendada:** añadir tests de repositorio con `expo-sqlite` en memoria o mocks que capturen SQL/params (patrón ya usado en `locationRepository.test.ts` y `db.test.ts`).
- **Archivos:** `data/repositories/*`, `src/data/__tests__`.
- **Criterio de aceptación:** cada repositorio ≥ 80% de sentencias.
- **Prueba de regresión:** suite por repositorio.
- **Confianza:** Alta.

### AUD-10 — Tabla `results` y entidad `Result` inertes · **P3**

- **Evidencia:** `schema.ts:65-72` (tabla `results`), `entities.ts:92-98` (`ExerciseResult`), `exerciseRepository.ts:60-74` (`insertResult`), `useExerciseEngine.ts:143-159` (`useRecordExerciseResult`) que es el único consumidor y nunca se importa. Ninguna función `select*` lee `results`.
- **Impacto:** entidad declarada en `AGENTS.md` ("mantiene Exercise/Result") sin uso real; `Attempt` (`entities.ts:119-128`) la reemplaza de facto. Confusión de modelo y trabajo muerto.
- **Reproducir:** búsqueda de `insertResult`/`from results`: solo la definición y el hook muerto.
- **Solución recomendada:** eliminar tabla/entidad/hook o documentar su propósito y conectarla.
- **Archivos:** `schema.ts`, `entities.ts`, `exerciseRepository.ts`, `useExerciseEngine.ts`.
- **Criterio de aceptación:** sin código ni tabla sin consumidor, o con justificación documentada.
- **Prueba de regresión:** n/a (limpieza).
- **Confianza:** Alta.

### AUD-11 — Código muerto · **P3**

- **Evidencia:** tabla 3.7.
- **Impacto:** mantenimiento y superficie de confusión.
- **Solución recomendada:** retirar o marcar como uso futuro con justificación.
- **Archivos:** varios.
- **Criterio de aceptación:** `ts-prune`/`knip` sin exportaciones huérfanas (o lista justificada).
- **Confianza:** Alta.

### AUD-12 — Duplicación · **P3**

- **Evidencia:** `TYPE_LABELS` en `ExampleRunner.tsx:15`, `EvaluationFlow.tsx:25`, `ejercicios/index.tsx:18`; `MESSAGES` en `login.tsx:12` y `register.tsx:12`; wrappers `(modules)/evaluacion/index.tsx` y `(evaluations)/evaluacion/index.tsx`; filtros `KNOWN_TYPES`/`KNOWN_ACTIVITY_TYPES` en `usePracticeEngine.ts:12`, `useExamplesEngine.ts:7`, `useQuizEngine.ts:16`, `analyticsLogic.ts:3`.
- **Impacto:** cambios divergentes entre copias.
- **Solución recomendada:** centralizar en `models`/`i18n` y un único helper de filtrado.
- **Criterio de aceptación:** una sola fuente por constante.
- **Confianza:** Alta.

### AUD-13 — Dependencias/assets sin import directo · **P3 [LÍMITE]**

- **Evidencia:** sección 3.7. Declaradas: `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-web-browser`, `expo-device`, `expo-constants`.
- **Impacto:** instalación/lockfile más grandes; posible confusión.
- **Advertencia:** **no** se clasifican como innecesarias por falta de imports directos; pueden requerirse por plugins o transitividad. Requiere evaluación caso por caso.
- **Solución recomendada:** auditar con `npx expo install --check` y retirar solo las confirmadas no usadas.
- **Archivos:** `package.json`, `app.json`.
- **Confianza:** Media.

### AUD-14 — `homeTabForRoute` lanza excepción · **P3**

- **Evidencia:** `tabRoutes.ts:15-25`, `default: throw new Error(...)` en `:24`.
- **Impacto:** añadir una pestaña sin actualizar el mapa rompe la tab bar en runtime.
- **Solución recomendada:** retornar un valor por defecto o tipar exhaustivamente el `switch`.
- **Criterio de aceptación:** ninguna ruta válida provoca excepción.
- **Prueba de regresión:** test de `homeTabForRoute` para cada ruta y para una desconocida (sin lanzar).
- **Confianza:** Alta.

### AUD-15 — Blanks de rellenar sin accesibilidad · **P3**

- **Evidencia:** `FillExercise.tsx:56-72`: `Text` con `onPress`, sin `accessibilityRole`/`accessibilityLabel`/`accessibilityState`.
- **Impacto:** lectores de pantalla no anuncian los espacios como interactivos.
- **Solución recomendada:** `accessibilityRole="button"` + `accessibilityLabel` descriptivo.
- **Archivos:** `FillExercise.tsx`.
- **Criterio de aceptación:** cada blank es accesible y anunciado.
- **Confianza:** Alta.

### AUD-16 — N+1 / doble carga · **P3 [LÍMITE]**

- **Evidencia:** `useCatalog.ts:29-31` itera unidades y espera `selectLessonsByUnit` secuencialmente; `(modules)/index.tsx:36-40` (`useFocusEffect` → `refresh`) más `useCatalog.ts:39-41` (`useEffect` → `refresh`) lanzan cargas que pueden solaparse al enfocar.
- **Impacto:** consultas redundantes; puede ser irrelevante con volúmenes pequeños. **No hay medición** que demuestre degradación.
- **Solución recomendada:** `Promise.all` para las unidades y evitar el doble disparo.
- **Criterio de aceptación:** una sola carga por foco; medición que muestre mejora antes de refactorizar.
- **Confianza:** Media.

### AUD-17 — Paquetes desactualizados · **P3**

- **Evidencia:** sección 3.5 (7 paquetes).
- **Impacto:** posibles incompatibilidades de patch con SDK 57.
- **Solución recomendada:** `npx expo install --check` y actualizar los patch.
- **Criterio de aceptación:** `expo-doctor` 21/21.
- **Confianza:** Alta.

### AUD-18 — `PRAGMA foreign_keys` por conexión · **P3 [INFERENCIA]**

- **Evidencia:** `db.ts:16` fija `foreign_keys = ON` solo en `migrateAndSeed`; expo-sqlite usa una única conexión en el provider (`_layout.tsx:19`).
- **Impacto:** si se abriera otra conexión, las FK no estarían activas.
- **Solución recomendada:** documentar que debe usarse la conexión del provider, o activar FK en cada apertura.
- **Confianza:** Media.

### AUD-19 — `seedDatabase` no idempotente · **P3**

- **Evidencia:** `seed.ts:288-296` y `:301-315` insertan `units`/`lessons` sin `ON CONFLICT`. Solo se invoca tras `DROP_ALL_DDL` (`db.ts:26-28`), por lo que en producción no se re-ejecuta, pero un uso directo sobre BD existente fallaría por PK/UNIQUE.
- **Solución recomendada:** usar `ON CONFLICT DO NOTHING` como en el resto de inserts, o documentar precondición.
- **Confianza:** Alta.

### AUD-20 — Artefactos huérfanos · **P3**

- **Evidencia:** `models/metadata.ts:1` sin importadores; `src/global.css` sin importadores (búsqueda `global.css` en `*.tsx` → 0).
- **Solución recomendada:** retirar o integrar.
- **Confianza:** Alta.

---

## 6. Matriz requisito → implementación → prueba

| Requisito (`AGENTS.md`) | Implementación | Evidencia | Prueba existente | Estado |
|---|---|---|---|---|
| Offline-first, sin red | Repositorios sobre `expo-sqlite` | `db.ts:19`; ausencia de `fetch` | Ninguna específica | **[HECHO] Cumple** (sin test) |
| MVVM: vista no toca repos | `src/app` usa hooks de `src/viewmodels` | `_layout.tsx:19`; pantallas | Ninguna de frontera de imports | **[HECHO] Cumple** (sin test) |
| 6 entidades + 3 (Profile/Progress/EvalResult) | Tablas en `schema.ts` | `schema.ts:4-137` | `db.test.ts` parcial | **Parcial** (`Result` inerte, AUD-10) |
| Exercise/Result y Evaluation/Question separadas | Tablas separadas | `schema.ts:54,65,74,81` | `exerciseLogic.test`, `quizLogic.test` | **Cumple** (`results` sin uso) |
| Repos con `db` primer argumento, funciones `select/insert/mark/count/save` | Firmas de repos | `progressRepository.ts:8,23,37,57` | `locationRepository.test.ts` | **Cumple** (cobertura baja) |
| Lógica pura `exerciseLogic`/`quizLogic` | Archivos puros | `exerciseLogic.ts:1`, `quizLogic.ts:1` | `*.test.ts` dedicados | **Cumple** |
| Hooks `use`+PascalCase | Nombres de hooks | `useCatalog.ts:18`, etc. | n/a | **Cumple** |
| CHAEA en `app/personalizacion` (Fase 4) | `saveQuestionnaire` sin pantalla | `useLearnerProfile.tsx:27` | Ninguna | **No implementado** (extensión) |
| LOM/SCORM no en runtime | `metadata.ts` declarativo | `metadata.ts:9` | n/a | **Cumple** |

---

## 7. Plan de corrección ordenado

1. **P1 — Integridad de datos**
   1. AUD-01: ampliar `resetAccountProgress` (+ `attempts`, `last_location`) y limpiar `useSession` desde `resetProgress`. Prueba: repositorio + integración.
   2. AUD-02: sacar `insertAttempt` del actualizador en `usePracticeEngine.submit`. Prueba: `renderHook` con conteo.
   3. AUD-03: `applyUnit1Content(db, false)` en el bloque `< 5`. Prueba: `db.test.ts` con `user_version=4`.
2. **P2 — Robustez y seguridad**
   4. AUD-05 + AUD-08: `try/catch`, estado de error y `submitting` en formularios y hooks.
   5. AUD-04: migraciones atómicas y `user_version` transaccional.
   6. AUD-06: migrar a PBKDF2/WebCrypto con rehash en login.
   7. AUD-07: resetear `recordedRef` al cambiar de lección.
   8. AUD-09: tests de repositorios.
3. **P3 — Limpieza y calidad**
   9. AUD-10/11/20: eliminar o justificar código y tablas inertes.
   10. AUD-12: centralizar constantes.
   11. AUD-14: `homeTabForRoute` seguro.
   12. AUD-15: accesibilidad de blanks.
   13. AUD-16: evaluar con medición antes de refactorizar.
   14. AUD-17: `npx expo install --check`.
   15. AUD-13/AUD-18/AUD-19: auditoría de dependencias, FK y seed.

---

## 8. Limitaciones de la auditoría

- **Builds nativos** (APK/AAB/IPA) no ejecutados: solo *export* de bundles JS. Requiere prebuild + Android SDK/Xcode.
- **Runtime en dispositivo** no verificado: accesibilidad real, gestos (`OrderExercise` con reanimated) y `Stack.Protected` quedan como **[NO COMPROBABLE]**.
- **Cobertura con `--collectCoverageFrom`** incluye archivos no importados por los tests, lo que baja el porcentaje global a 49.92%; el 66.82% corresponde solo a lo ejecutado.
- **StrictMode**: no se confirmó si Expo lo habilita en dev; AUD-02 queda como inferencia.
- **Dependencias sin import directo**: no se determinó su necesidad real (posible uso por plugins/transitivas). **[LÍMITE]**
- **Rendimiento**: sin perfilado; AUD-16 es una observación de código, no un defecto medido. **[LÍMITE]**
- Los números de línea se refieren al estado del repositorio en la fecha de ejecución.
