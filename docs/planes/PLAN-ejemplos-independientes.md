# Plan: ejemplos independientes en MLO

- **Repos:** `D:\devvv\MLO\MLO-Ingenieria-software` (motor) y
  `D:\devvv\MLO-content\mlo-teachers` (panel).
- **Estado:** fases 0, 1 y 2 ✅. Rutas de catálogo de la fase 3 ✅. Falta ejecutar la
  app MLO en `hybrid` y, para cursos de maestro, `/groups/{code}`.
- **Objetivo:** que un ejemplo independiente publicado desde el panel se aplique en
  MLO y aparezca en la pantalla de ejemplos, sin tocar el sorteo de práctica.
- **Dependencias:** para el curso `base` ya se puede probar con
  `GET /api/mlo/v2/catalogs/...`; para cursos de maestro falta `/groups/{code}`. Expo
  web necesita CORS (M5).

## 1. Problema actual

El panel ya publica `examples[]` y MLO ya los guarda:

- `applyLessonPayload` inserta los ejemplos independientes en la tabla `examples`.
- `selectExamplesByLesson` los devuelve ordenados por `rowid`.
- Pero `useExamplesEngine` solo dibuja ejercicios:
  - carga `selectExercisesByLesson` y `selectExamplesByLesson`;
  - el sorteo se hace sobre los ids de **ejercicios**;
  - `examples` solo se usa como lookup por id para enriquecer un ejercicio
    (`examplesById.get(current.id)`).

Por eso un ejemplo independiente (cuyo id no existe en `exercises`) nunca entra a
`items` y nunca se muestra. El fixture `k7f3q-ex1` de
`src/shared/services/http/fixtures.ts` ya reproduce el caso: se aplica, pero no se ve.

## 2. Decisión

**Sintetizar un `Exercise` para cada `Example` independiente y añadirlo a la lista de
ejemplos.** No se duplica en la base ni se toca el sorteo compartido de práctica.

```ts
const synthetic: Exercise = {
  id: example.id,
  lessonId: example.lessonId,
  type: example.type,
  prompt: example.prompt,
  instructions: '',
  correctOrder: [],
  config: example.config,
  explanation: example.explanation,
};
```

Como el id sintético es el mismo del `Example`, `currentExample` sigue funcionando sin
cambios en `ExampleRunner`.

### Regla de tipos

Un ejemplo independiente **no puede ser `order`**: el contrato `ExampleSeed` no tiene
`correctOrder` y `OrderExercise` lo necesita. Los ejemplos dentro de un ejercicio sí
pueden ser `order` porque heredan el `correctOrder` del ejercicio.

- En el panel: ocultar `order` en el formulario de ejemplo independiente y rechazarlo en
  `parseExampleInput`.
- En MLO: ignorar (o rechazar) ejemplos independientes de tipo `order` como defensa.

## 3. Fase 0 — Restringir `order` en el panel — ✅ hecha

Archivos:

- `app/(panel)/cursos/[id]/lecciones/[lessonId]/example-form.tsx`
  - quitar la opción `order` del `<select>` de ejemplos independientes;
  - el tipo por defecto sigue siendo `match`.
- `lib/content/validate.ts`
  - en `parseExampleInput`, rechazar `raw.type === 'order'` con un mensaje claro;
  - `parseExerciseInput` no cambia: el ejemplo embebido de un ejercicio puede ser
    `order`.
- `lib/content/validate.test.ts`
  - agregar un caso que rechace un ejemplo independiente `order`.

Criterio: el panel no puede publicar un ejemplo independiente `order`.

## 4. Fase 1 — Motor de ejemplos — ✅ hecha

Archivo principal: `src/features/examples/viewmodel/useExamplesEngine.ts`.

Cambios:

1. Separar los ejemplos independientes de los que enriquecen un ejercicio:
   ```ts
   const byId = new Map(loaded.map(exercise => [exercise.id, exercise]));
   const independent = loadedExamples.filter(
     example => !byId.has(example.id) && example.type !== 'order',
   );
   const synthetic = independent.map(example => ({ /* Exercise sintético */ }));
   ```
2. El pool del sorteo sigue siendo **solo ejercicios**:
   ```ts
   const pool = loaded; // no incluir synthetic
   ```
3. Los `items` son los ejemplos sorteados de ejercicios **más** los independientes:
   ```ts
   const drawn = chosenIds.map(id => byId.get(id)).filter(Boolean);
   setItems([...drawn, ...synthetic]);
   ```
4. `redraw` vuelve a sortear solo ejercicios y vuelve a añadir `synthetic`.
5. No cambiar `lessonDraw.ts`: el sorteo de práctica no se ve afectado y un ejemplo
   independiente no consume un cupo de ejercicio.
6. `persist` puede seguir guardando los ids de `items`; en la siguiente carga
   `ensureLessonDraw` filtra los que no son ejercicios y el hook los vuelve a añadir.
   Si se quiere evitar ese ruido, guardar solo los ids que estén en `pool`.

No hace falta tocar `ExampleRunner`, `exampleRepository`, `applyLessonPayload` ni el
esquema.

### Pruebas del motor

Archivo: `src/features/examples/viewmodel/__tests__/useExamplesEngine.test.ts`.

Agregar:

- una lección **sin ejercicios** y con un ejemplo independiente muestra ese ejemplo;
- una lección con ejercicios + ejemplos independientes devuelve ambos;
- un ejemplo cuyo id coincide con un ejercicio no se duplica;
- `next` y `redraw` conservan los independientes;
- un ejemplo independiente de tipo `order` se ignora;
- los tests actuales siguen pasando.

## 5. Fase 2 — Probar que el release del panel llega a MLO sin red — ✅ hecha

Esta fase no depende de la API M4 y es la prueba más barata del flujo
panel → contrato → base local.

### 5.1 Generar el fixture desde el panel

En `mlo-teachers`, agregar un script de mantenimiento (temporal o permanente):

```bash
# mlo-teachers
node --env-file=.env.local --import tsx scripts/export-release.ts base <destino.json>
```

Debe leer el último `release` del curso `base` y escribir:

```json
{ "manifest": { ... }, "lessons": [ { "schemaVersion": 2, ... } ] }
```

El release base actual tiene 25 lecciones y 3 ejemplos independientes
(`exA1.2`, `exA1.3`, `exA1.4`).

Guardar el resultado como fixture de MLO:
`src/shared/services/content/remote/__fixtures__/panelRelease.json`.

### 5.2 Test de aplicación

Archivo nuevo:
`src/shared/services/content/remote/__tests__/panelRelease.test.ts`.

Con el mismo mock de `expo-sqlite` de `applyLessonPayload.test.ts`:

1. Por cada payload del fixture, ejecutar
   `validateLessonPayload(payload, { catalogId: 'base', lessonId })`.
2. Llamar `applyLessonPayload(db, payload)`.
3. Verificar que se insertaron `exA1.2`, `exA1.3` y `exA1.4` en `INSERT INTO examples`.
4. Verificar que un ejercicio con `example` embebido no se duplica como ejemplo
   independiente.

### 5.3 Test de visualización

En el test del motor, usar los ejemplos independientes del fixture como
`selectExamplesByLesson` y los ejercicios del mismo fixture como
`selectExercisesByLesson`. Verificar que:

- los 3 ejemplos independientes aparecen en `items`;
- `currentExample.title` es el del ejemplo;
- la práctica (`usePracticeEngine`/`lessonDraw`) no cambia.

Comandos:

```bash
# MLO
npx tsc --noEmit
npm run lint
npm test
```

Criterio: el release real del panel pasa la validación, se aplica y el motor lo
muestra.

Resultado:

- Fixture generado con `npm run export:release -- base <ruta>` desde el panel:
  `src/shared/services/content/remote/__fixtures__/panelRelease.json` (25 lecciones).
- `panelRelease.test.ts`: las 25 lecciones validan y se aplican; `exA1.2`, `exA1.3` y
  `exA1.4` quedan una sola vez en `examples`.
- `useExamplesEngine.test.ts`: el ejemplo `exA1.2` del release real aparece en
  `items` y `currentExample` con su título.
- MLO: `55` suites y `353` tests en verde, además de `tsc` y lint.

## 6. Fase 3 — Prueba HTTP real — 🟡 rutas de catálogo listas

Esta es la prueba de que los cambios llegan por red, no solo por fixture. Las rutas de
catálogo ya existen en el panel:

- `GET /api/mlo/v2/catalogs/{catalogId}/manifest` — ✅
- `GET /api/mlo/v2/catalogs/{catalogId}/lessons/{lessonId}` — ✅

Ya se validó por HTTP el release `base` completo (25 lecciones, 3 ejemplos
independientes) con `parseCatalogManifest` y `validateLessonPayload`. Falta ejecutar la
app MLO y, para cursos de maestro, `GET /groups/{code}`.

### 6.1 Preparar el panel

1. Importar el core (`npm run import:base`) y publicar `base`.
2. Agregar un ejemplo independiente de prueba a una lección del core (como admin) o
   crear un curso de maestro y publicarlo.
3. Anotar `catalogId` (clave del curso) y la versión/hash del release.

### 6.2 Configurar MLO

`EXPO_PUBLIC_DATA_MODE=hybrid` y `EXPO_PUBLIC_API_URL` apuntando al panel:

| Entorno | URL |
|---|---|
| Web | `http://localhost:3000/api/mlo/v2` |
| Emulador Android | `http://10.0.2.2:3000/api/mlo/v2` |
| Dispositivo físico | `http://<IP-LAN>:3000/api/mlo/v2` |

### 6.3 Flujo esperado

1. MLO descarga el manifest en segundo plano.
2. Descarga la lección y la guarda en `remote_lessons` (área de espera).
3. Al reiniciar, `applyStagedContent` aplica el payload.
4. La fila queda en `examples` y el ejemplo aparece en **Ejemplos**.

Verificar en la base local:

```sql
SELECT id, lesson_id, title FROM examples WHERE lesson_id = '<lessonId>';
SELECT lesson_id, hash, applied_hash FROM remote_lessons;
```

### 6.4 Si se usa un curso de maestro

Hace falta el endpoint `/groups/{code}` y un grupo del panel (M4). Unirse al grupo,
esperar la descarga, reiniciar y abrir el curso. El curso `base` no necesita grupo.

### 6.5 Criterio de aceptación

- La lección descargada pasa `validateLessonPayload`.
- El ejemplo independiente queda en `examples` después de aplicar.
- Aparece en la pantalla de ejemplos sin recompilar la app.
- El sorteo de práctica no cambia.

## 7. Matriz de pruebas

| Nivel | Qué prueba | Depende de |
|---|---|---|
| Unitario del motor | El pool de ejemplos incluye independientes | nada |
| Contrato + aplicación | El release del panel valida y llena `examples` | fixture del panel |
| HTTP + staging | La descarga llena `remote_lessons` | M4 |
| HTTP + aplicación | Tras reiniciar, el ejemplo se ve | M4 |
| Manual | Pantalla de ejemplos en dispositivo | M4 |

## 8. Riesgos y límites

- **`order` independiente:** no se puede representar con el contrato actual. Se
  restringe en el panel y se ignora en MLO.
- **Cupo de ejemplos:** los independientes se añaden siempre; `EXAMPLE_DRAW_COUNT`
  sigue limitando el sorteo de ejercicios. Si se quieren limitar, decidir si cuentan
  dentro de los 10.
- **Estado persistido:** `drawExampleIds` se guarda por cuenta/lección. Los
  independientes se añaden en cada carga; no hace falta "Nuevo sorteo" para verlos.
- **Duplicados:** si un ejemplo comparte id con un ejercicio, se excluye el sintético.
- **Contenido retirado:** si un ejemplo deja de venir en el release,
  `applyLessonPayload` lo borra de `examples`; el motor deja de mostrarlo.
- **CORS:** la prueba web necesita CORS en el panel (M5).

## 9. Orden de ejecución

```
Fase 0 (panel: order) ─► Fase 1 (motor + tests) ─► Fase 2 (fixture panel → MLO)
                                                      └─► Fase 3 (HTTP, después de M4)
```
