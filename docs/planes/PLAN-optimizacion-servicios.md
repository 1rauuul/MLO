# Plan: optimización de issues y preparación para el consumo de servicios (MLO)

Repo: `https://github.com/1rauuul/MLO.git` (rama `main`, commit revisado `e67e35f`)
Base verificada: `tsc --noEmit` sin errores · `jest` 42 suites / 257 tests en verde · `eslint` 0 errores, 2 warnings.
Arquitectura: `src/features/<feature>/{model,viewmodel,view}` + `src/shared/*`, rutas Expo Router delgadas en `src/app/`.

## Restricciones

- No se cambian dependencias, comportamiento ni textos de la UI sin consultarlo antes. Los pasos que lo requieren llevan **[Consultar]**.
- Los ejercicios conservan exactamente sus campos: `id`, `lessonId`, `type`, `prompt`, `instructions`, `correctOrder`, `config`, `explanation`, `example` (`title`, `steps[{ text, why }]`, `hints[]`).
- La app sigue funcionando 100 % offline. Los servicios se suman como fuente opcional; SQLite sigue siendo la fuente de verdad local.
- Cada fase termina con `npx tsc --noEmit`, `npm run lint` y `npm test` en verde.

## Contexto que cambia

`docs/estado/decisiones-alcance.md`, `docs/reporte/capitulo-3-desarrollo.md` y `docs/diagramas-mlo.md` declaran que MLO es "sin red ni backend". Integrar servicios revierte esa decisión, así que debe registrarse formalmente (Fase 7).

## Decisiones abiertas (bloquean solo la Fase 6)

> **Actualización:** D1 a D4 quedaron resueltas en `PLAN-sistema-maestro.md`. Se consume solo **contenido publicado** por el sistema del maestro, sin sincronizar progreso ni usar cuentas remotas. Quedan fuera de alcance la Fase 5 punto 5, los endpoints `sync/*` y `auth/*` del punto 8 y la Fase 6 puntos 2 y 4. D5 se resuelve con la opción (a): cada pregunta lleva un `contentId` estable.

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D1 | ¿Qué se consume? | (a) contenido remoto (bancos, lecciones), (b) sincronización de progreso, (c) autenticación remota | Empezar por (a) y (b); (c) después |
| D2 | Proveedor / protocolo | API REST propia, Supabase, otro | REST con contrato propio: el cliente no queda atado a un proveedor |
| D3 | Identidad | Cuentas locales vinculables a una cuenta remota, o solo remotas | Vinculables: no rompe a los usuarios actuales |
| D4 | Conflictos de sincronización | Último en escribir gana, o fusión por tipo de registro | `attempts`/`evaluation_results` solo se agregan (sin conflicto); `module_progress` y `learner_profile` usan último en escribir gana por `updated_at` |
| D5 | Ids de preguntas del banco | (a) campo `id` explícito en cada pregunta, (b) id derivado de un hash del `prompt` | (a); cambia el formato `{type, prompt, options, answer, explanation}` **[Consultar]** |

---

## Fase 0 — Higiene del repositorio

1. Quitar las 2 warnings de lint: `EMPTY_SUMMARY` sin uso (`usePracticeEngine.ts:46`) y el `require` de `EvaluationFlowRunning.test.tsx:50`.
2. Sacar del control de versiones `coverage/`, `repomix-output.xml`, `.opencode/` y `refactor/`, y agregarlos a `.gitignore` **[Consultar: implica borrar archivos del repo]**.
3. Unificar los documentos duplicados de `docs/` (por ejemplo `docs/arquitectura-mlo.html` y `docs/arquitectura/arquitectura-mlo.html`).
4. Mover `eslint-config-expo` a `devDependencies` **[Consultar: cambio de dependencias]**.

**Criterio:** `npm run lint` sin warnings; `git ls-files coverage .opencode` vacío.

## Fase 1 — Integridad del contenido y migraciones (alta)

Resuelve: contenido que no se actualiza, ids de preguntas por posición, doble inserción del banco y migraciones no atómicas.

1. **Separar el esquema del contenido.** Crear la tabla `meta(key, value)` y guardar `content_hash`. Al iniciar, si el hash del contenido empaquetado cambió, se re-sincroniza el contenido en una sola transacción. Así, corregir un ejercicio deja de exigir subir `DATABASE_VERSION`. Es el mismo canal que luego usará el contenido remoto (Fase 6).
2. **Upsert real, solo en tablas de contenido.** En `units`, `lessons`, `examples`, `exercises`, `evaluations` y `questions`, cambiar `ON CONFLICT DO NOTHING` por `ON CONFLICT DO UPDATE`. Las tablas de usuario no se tocan.
3. **Limpieza de huérfanos.** Borrar las filas de contenido de las lecciones gestionadas cuyo id ya no esté en el seed. `attempts` conserva su `item_id` como histórico.
4. **Ids estables para las preguntas** según D5. Migrar los `ev1.2-bank-qN` actuales al nuevo id, emparejando por `prompt`, sin perder intentos.
5. **Eliminar la doble inserción.** `unit1Exercises` ya incluye `...l12ExerciseBank`; `applyUnit12ExerciseBank` queda solo como alias de la re-sincronización.
6. **Atomicidad.** Cada bloque `if (version < N)` aplica sus cambios y su `PRAGMA user_version` dentro de la misma transacción.
7. **Duplicados en `ev1.2`.** Quitar de la base de `ev1.2` (o del banco) las 2 preguntas repetidas: "¿Cuál es un atributo esencial del buen software?" y "¿Qué aportó la Web a la ingeniería de software?" **[Consultar: cuál se conserva]**.
8. **Migración `DATABASE_VERSION 15`:** crea `meta`, migra los ids de preguntas y hace la primera re-sincronización de contenido.

**Tests:**
- Migrar desde v14 con un ejercicio editado actualiza su texto y conserva `attempts`.
- Un id quitado del seed desaparece de `exercises`.
- Volver a ejecutar el seed es idempotente.
- Un fallo a mitad de migración deja la base en la versión anterior.

## Fase 2 — Ejemplos curados (alta)

1. `ExampleRunner` deja de usar `demoSteps(exercise)` y `hintsForType(type)`, y lee `title`, `steps[{text, why}]` y `hints[]` de la tabla `examples` mediante `selectExamplesByLesson`. `demoSteps` queda solo como respaldo si no hay ejemplo curado **[Consultar: cambia lo que ve el usuario]**.
2. `useExamplesEngine` carga `Example` (no solo `Exercise`) y empareja por `id`.
3. Redactar el bloque `example` de los 9 ejercicios legacy de `l1.2` (`ord1.2`, `fill1.2`, `match1.2`, `match1.2b`, `cross1.2`, `fill1.2b`, `cross1.2a`, `fill1.2c`, `ord1.2a`) a partir de `tema 1.2.pdf` y `Unidad I Introducción a la ISW.pdf` **[Consultar: validar el contenido antes de integrarlo]**.

**Tests:** cada ejercicio de `l1.2` tiene un `example` completo; el runner muestra el `why` propio de cada paso.

## Fase 3 — Motores y estado (media)

1. **Sorteo conjunto y persistido.** Un solo `drawLessonGroups(lessonId)` sortea ejemplos y ejercicios a la vez, sin intersección, y guarda ambos en `example_state` (`drawExerciseIds` deja de quedar vacío). Práctica y Ejemplos leen ese mismo sorteo, sin importar cuál se abra primero.
2. **Ciclo de vida del sorteo.** Al terminar los 10 ejemplos se ofrece un nuevo sorteo **[Consultar: texto y comportamiento nuevos]**.
3. **Reset y backup.** `resetAccountProgress` y `replaceProgressFromBackup` borran `example_state`. El backup pasa a `PROGRESS_BACKUP_VERSION 2` e incluye `example_state` y `last_location`, y sigue aceptando la v1.
4. **Funciones de actualización puras.** En `useExamplesEngine.next`, `saveExampleState` sale del `setIndex(updater)` y pasa a un efecto o al handler.
5. **"Reiniciar" limpio.** En `useFillEngine`, `useMatchEngine` y `useCrosswordEngine`, `reset()` ignora `initialRef` y deja el ejercicio vacío; el estado restaurado solo se aplica al montar.
6. **Mezcla real.** `scrambleOrder` usa `shuffleItems`, garantiza un resultado distinto de `correctOrder` y acepta un `random` inyectable para los tests **[Consultar: cambia el orden inicial que ve el usuario]**.
7. **Puntaje parcial en `attempts`.** Hoy se guarda `correct` booleano aunque existe puntaje parcial. Agregar las columnas `score_correct` y `score_total` (se incluye en la v15).

**Tests:** no hay intersección sin importar el orden de apertura; el reset borra `example_state`; el backup v1 sigue importándose; `reset()` tras restaurar deja todo vacío; `scrambleOrder` nunca devuelve el orden correcto.

## Fase 4 — Navegación y modal de salida (alta)

1. **Hook único `useExitGuard(active, onRequest)`** en `shared/hooks`, que combina:
   - el listener `beforeRemove` de `useNavigation()` (expo-router), que cubre atrás del header, botón físico de Android y `router.back()`;
   - `gestureEnabled: false` mientras haya progreso, porque el gesto nativo de iOS no se puede cancelar con `beforeRemove`;
   - el `exitGuard` actual para la barra inferior (`AppTabBar`).
2. Aplicar el hook en `ExercisesScreen` y `EvaluationFlow`, quitando la lógica duplicada de `requestExit`.
3. Cubrir también `BottomTabBar.onChange` con `runOrGuardExit`, no solo `SubtopicTabBar`.
4. Sin dependencias nuevas: todo sale de `expo-router` y `react-native`.

**Tests:** un `beforeRemove` simulado con progreso muestra el modal y no navega; "Salir" navega; sin progreso navega directo.

## Fase 5 — Base para servicios, sin red todavía

Objetivo: que conectar un servicio sea agregar un adaptador, sin reescribir ViewModels.

1. **Puertos por feature.** Cada `features/<f>/model/` expone una interfaz (por ejemplo `ExerciseRepository`, `ProgressRepository`, `ContentSource`). Las 33 funciones actuales se agrupan en implementaciones `Sqlite*Repository`.
2. **Inyección.** `shared/services/data/DataProvider.tsx` construye los repositorios a partir del `db` y los expone con `useRepositories()`. Los 14 ViewModels que hoy llaman a `useSQLiteContext()` pasan a usar `useRepositories()`. Los tests inyectan dobles sin mockear `expo-sqlite`.
3. **Estados asíncronos y errores.** Crear un tipo `AsyncState<T>` (`idle | loading | success | error`) y un helper `useAsyncResource`. Agregar try/catch a los 6 motores que hoy no tienen ninguno: `useExerciseEngine`, `usePracticeEngine`, `useQuizEngine`, `useExamplesEngine`, `useLearnerProfile` y `backupRepository`. Sumar un `ErrorBoundary` en `app/_layout.tsx` **[Consultar: textos de error y de reintento]**.
4. **Validación en tiempo de ejecución.** Extraer los validadores de `backup.logic.ts` (`isRecord`, `isString`, …) a `shared/utils/validate.ts` y crear `parseExerciseSeed`, `parseQuestionSeed` y `parseExampleSeed`. Así, todo lo que entre por red o por archivo se valida igual. Sin agregar zod.
5. **Datos sincronizables (incluido en una `DATABASE_VERSION 16`):**
   - `public_id TEXT UNIQUE` (UUID de `expo-crypto`, que ya es dependencia) en `attempts`, `evaluation_results`, `module_progress`, `learner_profile` y `example_state`;
   - `updated_at` y `deleted_at` donde falten;
   - la tabla `sync_outbox(id, entity, public_id, op, payload, created_at, tries)`, que se llena en la misma transacción que cada escritura de usuario;
   - la tabla `sync_state(key, value)` para cursores y `remote_account_id`.
6. **Cliente HTTP base** en `shared/services/http/`, con `fetch` nativo y sin dependencias:
   - `baseUrl` desde `EXPO_PUBLIC_API_URL` (vía `app.json > extra`);
   - timeout con `AbortController`, reintentos con backoff exponencial solo para errores de red y 5xx;
   - errores tipados (`NetworkError`, `HttpError`, `ParseError`) y un gancho para el token de autenticación;
   - sin secretos en el cliente: solo URLs públicas.
7. **Modo de fuente de datos.** `DATA_MODE = 'local' | 'hybrid'`, con `local` por defecto. En `local` no se hace ninguna llamada de red, que es el comportamiento actual.
8. **Contrato de API** en `docs/api/contrato.md`, como borrador OpenAPI:
   - `GET /content/manifest` (hash y versión por lección), `GET /content/lessons/{id}` (mismo JSON que `ExerciseSeed`/`QuestionSeed`);
   - `POST /sync/push` (lote del outbox, idempotente por `public_id`), `GET /sync/pull?cursor=`;
   - `POST /auth/link` (según D3).
9. **Doble del servidor para tests:** un `fetch` falso con fixtures del contrato, en `shared/services/http/__tests__/`.

**Criterio:** con `DATA_MODE='local'` la app se comporta igual que hoy y toda la suite pasa. Ningún ViewModel importa `expo-sqlite`, lo que se puede comprobar con una regla de lint `no-restricted-imports` en `features/*/viewmodel`.

## Fase 6 — Integración (cuando se cierren D1 a D4)

1. **Contenido remoto.** `RemoteContentSource` descarga el manifest, compara hashes, valida con `parse*Seed` y aplica el contenido con la misma re-sincronización de la Fase 1. Si falla, se mantiene el contenido local.
2. **Sincronización.** Un `SyncService` vacía el outbox con `push` y aplica `pull` según D4. Se dispara al iniciar sesión, al volver la app a primer plano (`AppState`) y después de una evaluación.
3. **Conectividad.** Al inicio no se detecta la red: se intenta la llamada y se trata el `NetworkError`. `@react-native-community/netinfo` queda como mejora opcional **[Consultar: dependencia nueva]**.
4. **Vinculación de cuentas** según D3 **[Consultar: pantalla y textos nuevos]**.

**Tests:** contenido remoto inválido se descarta; un `push` repetido no duplica registros; un `pull` con conflicto respeta D4; sin red la app funciona igual.

## Fase 7 — Documentación y cierre

- Registrar el cambio de alcance (de offline puro a offline-first con servicios opcionales) en `docs/estado/decisiones-alcance.md`, y actualizar `capitulo-3-desarrollo.md` y `diagramas-mlo.md`.
- Actualizar `AGENTS.md` con la capa `shared/services/{data,http}`, los puertos y la regla de importación.
- Mover este plan a `docs/planes/` y marcar `PLAN-l1.2.md` como implementado (el remoto ya está en v14, no en v12).

---

## Orden y dependencias

```
F0 ─┬─ F1 ─┬─ F2
    │      └─ F3
    ├─ F4
    └─ F5 (requiere F1 y F3) ── F6 (requiere D1–D4) ── F7
```

- F1 va primero porque el resto depende de que el contenido se actualice bien.
- F4 es independiente y se puede hacer en paralelo.
- Migraciones: **v15** (F1, más las columnas de puntaje de F3) y **v16** (F5.5).

## Riesgos

- **La migración de ids de preguntas (F1.4) puede desalinear `attempts`.** Mitigación: emparejar por `prompt` y probar con un respaldo real de v14.
- **Refactor de 14 ViewModels (F5.2).** Mitigación: hacerlo por feature, con la suite en verde entre cada una.
- **El gesto de iOS no se puede cancelar.** Mitigación: `gestureEnabled: false` mientras haya progreso.
- **Pérdida del carácter offline.** Mitigación: `DATA_MODE='local'` por defecto y tests sin red.

## Pendiente de consulta (resumen)

D1–D5 · F0.2 · F0.4 · F1.7 · F2.1 · F2.3 · F3.2 · F3.6 · F5.3 (textos) · F6.3 · F6.4
