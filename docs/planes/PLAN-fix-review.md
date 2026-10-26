# Plan: corrección de los issues de la revisión (MLO)

Repo: `https://github.com/1rauuul/MLO.git` (rama `main`, commit revisado `e67e35f`, `DATABASE_VERSION 14`)
Base: `tsc --noEmit` sin errores · `jest` 42 suites / 257 tests en verde · `eslint` 0 errores, 2 warnings.

## Restricciones

- No se cambian dependencias, comportamiento ni textos de la UI sin consultarlo. Los pasos que lo requieren llevan **[Consultar]**.
- Los ejercicios conservan exactamente sus campos: `id`, `lessonId`, `type`, `prompt`, `instructions`, `correctOrder`, `config`, `explanation`, `example` (`title`, `steps[{ text, why }]`, `hints[]`).
- Se conserva el progreso del alumno (`attempts`, `evaluation_results`, `module_progress`) en toda migración.
- Cada bloque termina con `npx tsc --noEmit`, `npm run lint` y `npm test` en verde.

## Decisiones previas

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| P1 | Ids de las preguntas del banco (issue 1) | (a) campo `id` explícito en cada pregunta (cambia el formato `{type, prompt, options, answer, explanation}`); (b) id derivado de un hash del `prompt` | (a): es estable aunque se edite el texto |
| P2 | Preguntas duplicadas en `ev1.2` (issue 9) | Conservar la de la base de `ev1.2` o la del banco | Conservar la del banco y quitarla de la base |
| P3 | Ejemplos al terminar el sorteo (issue 6) | Nuevo sorteo automático, botón "Nuevo sorteo" o dejarlo fijo | Botón explícito (texto nuevo) |
| P4 | Mezcla de los ejercicios de ordenar (issue 8) | Aleatoria (distinta del orden correcto) o mantener la rotación fija | Aleatoria |

---

## Bloque A — Contenido y migraciones (issues 1, 13, 9) · prioridad alta

### A1. Upsert real en las tablas de contenido (issue 1)
- **Problema:** `seed.ts` usa `ON CONFLICT(id) DO NOTHING` en todos los inserts, así que las versiones v10, v11 y v14 no actualizan nada en instalaciones existentes.
- **Cambio:** en `insertExampleRow`, `insertExerciseRow`, `insertQuestionRow` y `insertEvaluationRows`, usar `ON CONFLICT(id) DO UPDATE SET …` con todas las columnas de contenido. Las tablas de usuario no se tocan.
- **Huérfanos:** después del upsert, borrar de `exercises`, `examples` y `questions` las filas de las lecciones gestionadas (`l1.1` a `l1.4`) cuyo id ya no esté en el seed. Los registros de `attempts` no se borran.

### A2. Re-sincronizar contenido sin subir la versión de esquema (issue 1)
- Crear la tabla `meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)` y guardar `content_hash`, calculado sobre el JSON del contenido empaquetado (`unit1Exercises`, `unit1Examples`, `unit1Evaluations`, `l12QuestionBank`, `richContent`).
- En `migrateAndSeed`, después de las migraciones, se re-sincroniza el contenido en una transacción solo si el hash cambió.
- Quitar las llamadas redundantes de las versiones históricas no se puede (ya corrieron), pero desde ahora corregir contenido ya no requiere un nuevo `if (version < N)`.

### A3. Ids estables para las preguntas del banco (issue 1, según P1)
- Hoy el id es `ev1.2-bank-q${index + 1}`, así que insertar o reordenar preguntas desalinea el contenido.
- Con la opción (a), cada pregunta de `lesson1.2.questions.ts` recibe su `id` **[Consultar]**.
- En la migración, los ids viejos se renombran a los nuevos emparejando por `prompt`, y se actualiza `attempts.item_id` con el mismo mapeo.

### A4. Migraciones atómicas (issue 1)
- Hoy, en `if (version < N)`, el contenido y `PRAGMA user_version` se aplican en pasos separados.
- `applyUnit1Content`, `applyExerciseBank` y `applyQuestionBank` se dividen en una función interna sin transacción, que recibe `db`, y un envoltorio que sí la abre. `expo-sqlite` falla con transacciones anidadas, por eso `seedDatabase` ya duplica la lógica.
- Cada bloque de versión aplica todos sus cambios y su `user_version` dentro de una sola transacción.

### A5. Quitar la doble inserción del banco (issue 13)
- `unit1Exercises` ya incluye `...l12ExerciseBank` (`unit1.content.ts:230`), así que no hace falta la inserción extra. `applyUnit12ExerciseBank` pasa a ser un alias de la re-sincronización de A2, y se documenta que el banco entra por `unit1Exercises`.

### A6. Preguntas duplicadas (issue 9, según P2)
- Quitar del lado elegido "¿Cuál es un atributo esencial del buen software?" y "¿Qué aportó la Web a la ingeniería de software?" **[Consultar]**.
- Agregar una protección en `buildEvaluationPool` que descarte preguntas con `prompt` repetido.

### A7. `DATABASE_VERSION 15`
- Crea `meta`, renombra los ids de preguntas (A3), aplica la limpieza de huérfanos (A1) y guarda el primer `content_hash`, todo en una sola transacción.

**Tests (`database.test.ts`, `seed` y `evaluation.logic.test.ts`):**
- Migrar desde v14 con un ejercicio editado actualiza su texto y conserva `attempts`.
- Un id quitado del seed desaparece de `exercises`/`examples`, y `attempts` conserva sus filas.
- Los ids de preguntas se migran y `attempts.item_id` se re-mapea.
- Ejecutar el seed dos veces da los mismos conteos.
- Un error a mitad de migración deja `user_version` en 14.
- `buildEvaluationPool` no devuelve dos preguntas con el mismo `prompt`.

---

## Bloque B — Ejemplos curados (issues 2, 3) · prioridad alta

### B1. El runner usa el ejemplo curado (issue 2)
- **Problema:** `ExampleRunner.tsx:42-43` usa `demoSteps(exercise)`, que repite `explanation` como `why` en cada paso, y `hintsForType(type)`, que son genéricas.
- **Cambio:** `useExamplesEngine` carga también `selectExamplesByLesson` y empareja cada ejercicio con su `Example` por `id`. `ExampleRunner` recibe el `example` y usa `example.title`, `example.steps` y `example.hints`. `demoSteps`/`hintsForType` quedan solo como respaldo si no hay ejemplo **[Consultar: cambia lo que ve el usuario]**.

### B2. Bloque `example` para los 9 legacy de `l1.2` (issue 3)
- Ejercicios: `ord1.2`, `fill1.2`, `match1.2`, `match1.2b`, `cross1.2` y `fill1.2b` (en `unit1.content.ts`), y `cross1.2a`, `fill1.2c` y `ord1.2a` (en `lesson1.2.bank.ts`).
- Redactar `title`, `steps[{text, why}]` y `hints[]` a partir de `tema 1.2.pdf` y `Unidad I Introducción a la ISW.pdf`, con el mismo estilo del banco **[Consultar: validar el contenido antes de integrarlo]**.
- Gracias a A2, entran a la base sin una migración nueva.

**Tests:**
- Todo ejercicio de `l1.2` tiene `example` con `title`, `steps` y `hints` no vacíos.
- `ExampleFlow.test.tsx` comprueba que se muestran el `why` propio de cada paso y las pistas del ejemplo.

---

## Bloque C — Motores y estado (issues 5, 6, 7, 8) · prioridad media

### C1. Sorteo conjunto y sin intersección (issue 5)
- **Problema:** `usePracticeEngine` solo excluye `drawExampleIds`. Si Ejercicios se abre antes que Ejemplos, después puede haber repetidos, y `drawExerciseIds` se guarda siempre vacío.
- **Cambio:** crear `ensureLessonDraw(db, accountId, lessonId)` en `features/exercises/model` (o en el viewmodel, a partir del repositorio). Si no hay sorteo válido, ejecuta `drawGroups` una sola vez con ambos grupos y guarda `drawExampleIds` y `drawExerciseIds`. `useExamplesEngine` y `usePracticeEngine` leen ese mismo sorteo.
- Cada nueva sesión de práctica toma `drawExerciseIds` del sorteo vigente, en orden aleatorio.

### C2. Reset, backup y renovación del sorteo (issue 6)
- `resetAccountProgress` (`progressRepository.ts:57`) y `replaceProgressFromBackup` (`backupRepository.ts:76`) borran `example_state` de la cuenta.
- Al ver el último ejemplo, se ofrece un nuevo sorteo según P3 **[Consultar: texto nuevo]**.

### C3. Funciones de actualización puras (issue 7)
- Sacar `saveExampleState` del `setIndex(updater)` en `useExamplesEngine.next`. Se calcula `nextIndex` a partir del estado actual, luego se hace `setIndex(nextIndex)` y `void saveExampleState(…)` en el handler.

### C4. "Reiniciar" limpio y mezcla real (issue 8)
- En `useFillEngine`, `useMatchEngine` y `useCrosswordEngine`, `reset()` ignora `initialRef` y deja el ejercicio vacío y mezclado. El estado restaurado se aplica solo en la carga inicial, y `initialRef` se vacía tras usarlo para que no se aplique a otro ejercicio.
- `scrambleOrder(correctOrder, random = Math.random)` usa `shuffleItems` y repite la mezcla hasta que sea distinta de `correctOrder` (si hay 2 o más elementos distintos) **[Consultar, según P4]**.

**Tests:**
- No hay intersección entre ejemplos y ejercicios, sin importar el orden de apertura.
- Tras reiniciar el progreso o importar un backup, no queda fila en `example_state`.
- `saveExampleState` se llama una vez por cada "Siguiente".
- `reset()` tras restaurar un estado deja todo vacío.
- `scrambleOrder` nunca devuelve el orden correcto (prueba con `random` fijo).

---

## Bloque D — Modal de salida (issue 4) · prioridad alta, en paralelo a A–C

- **Problema:** el guard solo cubre el botón de atrás del header y `SubtopicTabBar`. El botón físico de Android y el gesto de iOS salen sin aviso.
- **Cambio:** crear el hook `useExitGuard({ active, onRequest })` en `shared/hooks`:
  - `useNavigation()` de `expo-router` con el listener `beforeRemove`: si `active`, hace `e.preventDefault()`, abre el modal, y al confirmar ejecuta `navigation.dispatch(e.data.action)`. Cubre el botón físico de Android, el atrás del header y `router.back()`;
  - `navigation.setOptions({ gestureEnabled: !active })`, porque el gesto nativo de iOS no se puede cancelar desde `beforeRemove`;
  - registra el guard de `exitGuard.ts` para la barra inferior.
- Usarlo en `ExercisesScreen` (hoy en `requestExit` y `handleBack`, líneas 50 y 251) y en `EvaluationFlow` (`requestExit`, línea 100), quitando la lógica duplicada.
- Envolver también `BottomTabBar.onChange` (`AppTabBar.tsx`) con `runOrGuardExit`.
- Sin dependencias nuevas.

**Tests:**
- Simular `beforeRemove` con progreso muestra `ConfirmExitModal` y no navega.
- "Salir" ejecuta la acción pendiente.
- Sin progreso, navega directo.
- `gestureEnabled` es `false` mientras `active`.

---

## Bloque E — Higiene (issues 10, 11, 12 y warnings de lint) · prioridad baja

1. **Lint:** quitar `EMPTY_SUMMARY` sin uso (`usePracticeEngine.ts:46`) y cambiar el `require` de `EvaluationFlowRunning.test.tsx:50` por `jest.requireActual` o un `import`.
2. **Archivos versionados (issue 10):** quitar `coverage/`, `repomix-output.xml`, `.opencode/` y `refactor/` con `git rm --cached` y agregarlos a `.gitignore`. Unificar los duplicados de `docs/` (por ejemplo `docs/arquitectura-mlo.html` y `docs/arquitectura/arquitectura-mlo.html`) **[Consultar: borra archivos del repo]**.
3. **Dependencia (issue 11):** mover `eslint-config-expo` a `devDependencies` **[Consultar: cambio de dependencias]**.
4. **Comparación de hash (issue 12):** reemplazar `actual === expectedHash` (`auth.logic.ts:111`) por una comparación de tiempo constante (bucle XOR sobre la misma longitud), sin dependencias.

**Tests:** `npm run lint` sin warnings; `auth.logic.test.ts` cubre hashes iguales, distintos y de distinta longitud.

---

## Orden de ejecución

```
Decisiones P1–P4
   │
   ├─ A (A1→A2→A3→A4→A5→A6→A7) ─┬─ B (B1→B2)
   │                             └─ C (C1→C2→C3→C4)
   ├─ D (independiente)
   └─ E (independiente; E2 y E3 tras consulta)
```

- A va primero: B2 depende de que el contenido se actualice (A2) y C2 necesita el esquema de la v15.
- Una sola migración nueva: **v15**.
- Sugerencia de commits: uno por bloque (A, B, C, D, E), cada uno con sus tests.

## Riesgos

- **Re-mapeo de `attempts.item_id` (A3):** probarlo con un respaldo real exportado desde v14 antes de publicar.
- **Limpieza de huérfanos (A1):** limitarla a las lecciones gestionadas para no borrar contenido de otras unidades.
- **`gestureEnabled` dinámico (D):** validarlo en un dispositivo iOS y en un Android físico, no solo en tests.

## Definición de terminado

- Los 13 issues de la revisión resueltos o descartados explícitamente.
- `npx tsc --noEmit`, `npm run lint` (0 warnings) y `npm test` en verde, con los tests nuevos de cada bloque.
- Migración v15 probada desde v14 con datos reales.
- Los puntos **[Consultar]** aprobados antes de implementarlos.
