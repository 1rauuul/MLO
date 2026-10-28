# Cómo agregar contenido al MLO

Guía para quien necesite subir lecciones, ejemplos, ejercicios o evaluaciones nuevas.
Explica primero qué es MLO y cómo viaja el contenido, y después el paso a paso por
cada una de las dos rutas posibles.

---

## 1. Resumen del proyecto

MLO es una app móvil (Expo SDK 58, React Native 0.88, Expo Router) de apoyo a la
asignatura **Ingeniería de Software**. Es **offline-first**: SQLite es la fuente de
verdad y, con `DATA_MODE = 'local'` (el valor por defecto), la app no hace ninguna
petición de red.

| Pieza | Qué hay hoy |
|---|---|
| Curso | 5 unidades. La Unidad 1 (4 lecciones) tiene contenido completo, ejercicios y evaluación; las unidades 2–5 tienen lecciones introductorias |
| Lectura | Bloques ricos: párrafo, subtítulo, viñetas, lista numerada y tabla |
| Práctica | Ejercicios `order`, `fill`, `match` y `crossword` |
| Evaluación | Banco de preguntas `mcq` más los cuatro tipos de ejercicio, puntuada y con analítica |
| Progreso | Local por cuenta (`attempts`, `module_progress`, `evaluation_results`); nunca sale del teléfono |
| Contenido remoto | Opcional (`hybrid`): descarga cursos publicados por un sistema de maestros y los aplica en el siguiente arranque |
| Arquitectura | MVVM por feature: `view` → `viewmodel` → `model` → `shared/services` |

El contenido se guarda en las tablas `units`, `lessons`, `examples`, `exercises`,
`evaluations` y `questions`. La vista no las consulta directamente: usa los hooks de
`src/features/*/viewmodel`.

---

## 2. Las dos rutas

| | **Ruta A — contenido incluido** | **Ruta B — contenido publicado** |
|---|---|---|
| Dónde vive | En el código de la app | En un servidor que cumple el contrato v2 |
| Quién lo edita | Un desarrollador | Un maestro desde el panel (fuera de este repo) |
| Cuándo llega al alumno | Al instalar o al reabrir la app con la nueva versión | Al unirse a un grupo o al reabrir con red, sin actualizar la app |
| Requiere `hybrid` | No | Sí (`EXPO_PUBLIC_DATA_MODE=hybrid`) |
| Sirve como respaldo | Sí, siempre | No: es lo primero que se puede descargar |

Con `local` no se ejecuta ninguna petición; con `hybrid` el arranque sigue sin esperar
a la red: descarga en segundo plano a un área de espera (`remote_lessons`) y aplica lo
pendiente al arrancar.

---

## 3. Ruta A — agregar contenido incluido (offline)

### 3.1 Archivos que se tocan

| Qué se agrega | Archivo | Símbolo |
|---|---|---|
| Unidad | `src/shared/services/db/seed.ts` | `units` |
| Lección con contenido completo | `src/shared/services/db/seed.ts` | `unitOneLessons` |
| Lección introductoria (solo texto corto) | `src/shared/services/db/seed.ts` | `simpleLessons` |
| Texto por bloques de una lección | `src/shared/services/content/richContent.ts` | `richContent['lX.Y']` |
| Ejemplos y ejercicios | `src/shared/services/content/unit1.content.ts` | `unit1Examples`, `unit1Exercises` |
| Banco de ejercicios de una lección | `src/shared/services/content/banks/<leccion>.bank.ts` | exportar el arreglo e importarlo en `unit1.content.ts` |
| Evaluación y preguntas | `src/shared/services/content/unit1.content.ts` | `unit1Evaluations` |
| Banco extra de preguntas | `src/shared/services/content/banks/<leccion>.questions.ts` | `l12QuestionBank` es el único caso hoy |
| Etiqueta de tema en la práctica | `src/shared/services/content/topics.ts` | `L12_TOPIC_BY_ID` (solo lección 1.2) |
| Limpieza de contenido retirado | `src/shared/services/db/seed.ts` | `UNIT1_LESSONS`, `UNIT1_EVALUATIONS` |

### 3.2 Pasos

1. **Unidad.** Si es nueva, agrégala a `units` con `number`, `title`, `description`,
   `difficulty` (`Fundamental` | `Intermedio` | `Avanzado`) y `color`
   (`blue` | `violet` | `green`).

2. **Lección.** Añádela al arreglo `LESSONS` (vía `unitOneLessons` o `simpleLessons`).
   El `id` sigue el patrón `l<code>` (`l2.1`), `code` es el número visible (`2.1`) y
   `position` ordena dentro de la unidad.

   ```ts
   {
     id: 'l2.1',
     unitId: 'u2',
     code: '2.1',
     title: 'Modelos de proceso de software',
     eyebrow: 'Módulo 02 · Lección 01',
     body: 'Resumen de una o dos frases que se ve en el hub y en la lectura.',
     contextTitle: 'En contexto',
     contextBody: 'Por qué importa este tema.',
     synthesis: ['Idea clave 1', 'Idea clave 2'],
     position: 0,
   }
   ```

3. **Texto largo.** Agrega la entrada correspondiente en `richContent`; si no existe,
   la lectura solo muestra `body`, `contextBody` y `synthesis`.

   ```ts
   'l2.1': [
     { type: 'p', text: 'Primer párrafo.' },
     { type: 'h', text: 'Subtítulo' },
     { type: 'bullets', items: ['Punto A', 'Punto B'] },
     { type: 'numbers', items: ['Paso 1', 'Paso 2'] },
     { type: 'table', header: ['Concepto', 'Definición'], rows: [['Cascada', '…']] },
   ],
   ```

4. **Ejercicios.** Añádelos a un banco (`banks/`) y asegúrate de que `unit1Exercises`
   los incluya. Cada ejercicio necesita `id`, `lessonId`, `type`, `prompt`,
   `instructions`, `correctOrder` y su `config` según el tipo:

   ```ts
   // order: el orden correcto es el arreglo
   { type: 'order', correctOrder: ['Especificar', 'Diseñar', 'Validar'], config: {} }

   // fill: cada oración lleva al menos un hueco {{…}} y el banco trae las palabras
   { type: 'fill', correctOrder: [], config: {
       sentences: ['El {{requisito}} describe una necesidad.'],
       bank: ['requisito', 'diseño'],
   } }

   // match: al menos 2 pares, sin repetir ni conceptos ni definiciones
   { type: 'match', correctOrder: [], config: {
       pairs: [{ left: 'Mantenimiento', right: 'Puede evolucionar' }],
   } }

   // crossword: palabras en mayúsculas A-ZÑ, dentro de rows×cols, con pista
   { type: 'crossword', correctOrder: [], config: { crossword: {
       rows: 12, cols: 13,
       entries: [{ word: 'EFICIENCIA', clue: 'No malgasta recursos.', row: 0, col: 4, direction: 'down' }],
   } } }
   ```

   Para que un ejercicio muestre un **ejemplo guiado**, agrega `example: { title,
   steps: [{ text, why }], hints: [] }` dentro del mismo ejercicio.

5. **Evaluación.** Añade la entrada en `unit1Evaluations` con `id` (`ev2.1`),
   `lessonId`, `title`, `description` y `questions`. Cada pregunta necesita `type`,
   `prompt`, `options`, `answer` y `explanation` (`mcq` exige `answer` dentro del
   rango). En los tipos `fill`/`match`/`crossword` la verdad va en `config` y
   `options`/`answer` quedan vacíos y en `0`; en `order`, `options` es la secuencia
   correcta.

6. **Limpieza.** Si la lección o su evaluación tienen hijos en el seed, agrega sus ids
   a `UNIT1_LESSONS` y `UNIT1_EVALUATIONS`. Esas listas son las que autorizan a borrar
   ejercicios, ejemplos y preguntas que ya no vienen en el código. Sin ese paso, un
   reactivo eliminado sigue en la base.

7. **Etiqueta de tema (opcional).** Si quieres que la analítica de práctica agrupe los
   ejercicios por tema, agrega el id a `L12_TOPIC_BY_ID` y la etiqueta legible a
   `TOPIC_LABELS`. Hoy solo está mapeada la lección 1.2; el resto simplemente no se
   agrupa.

### 3.3 Qué ocurre al arrancar (no hay que migrar la base)

`seed.ts` calcula `CONTENT_HASH` con todo el contenido empaquetado. Si cambió,
`syncContentIfChanged` vuelve a escribir unidades, lecciones, ejemplos, ejercicios,
evaluaciones y preguntas dentro de una transacción, y borra los huérfanos de las
lecciones gestionadas.

- **No se sube `DATABASE_VERSION`** para agregar o editar contenido incluido.
- El upsert es idempotente: reejecutar el seed no duplica nada.
- `attempts` no se toca, por eso **un id publicado no se cambia ni se reutiliza**.
- **Retirar** contenido incluido no basta con quitarlo del arreglo: como no hay
  `DELETE` de unidades ni de lecciones en el seed, hay que agregar una migración que
  ponga `archived_at` (o borre) esas filas, igual que hace el contenido remoto.

### 3.4 Cuánto contenido necesita una lección

- Práctica: el sorteo reparte el pool entre ejemplos y ejercicios. Con **1 solo
  ejercicio** la práctica queda vacía, así que usa **2 o más** (la convención del
  proyecto es ≥ 6 por tema).
- Evaluación: se arman hasta `questionCount` preguntas y `exerciseCount` ejercicios
  (por defecto 10 y 5). Si hay menos, la evaluación es más corta pero no falla. La
  convención del proyecto es ≥ 15 reactivos por tema.

### 3.5 Tests que hay que actualizar

`src/shared/services/db/__tests__/database.test.ts` afirma que la limpieza cubre
exactamente `l1.1…l1.4` y `ev1.1…ev1.4`. Si agregas una lección o evaluación a esas
listas, actualiza también esa expectativa. Si añades contenido a un banco, revisa
`src/features/exercises/viewmodel/__tests__/exercise.logic.test.ts`, que recorre
`unit1Exercises` y `unit1Evaluations`.

---

## 4. Ruta B — publicar contenido desde el sistema del maestro

El servidor (`mlo-admin`: Next.js + Payload + PostgreSQL) es un **sistema aparte**;
este repo solo lo consume. Cualquier servicio que cumpla el contrato v2 sirve.

### 4.1 Del panel al teléfono

1. El maestro crea un **curso** (`catalog`) con su `key` (5 caracteres; `base` para el
   curso base).
2. Captura **unidades → lecciones → ejercicios / preguntas / evaluación**.
3. Publica una **versión** (`release`). Es inmutable: guarda la foto completa del curso
   y sus hashes. MLO nunca lee borradores ni documentos sueltos.
4. Crea un **grupo** con un **código de 6 caracteres** (sin `0/O/1/I/L`) que apunta al
   curso.
5. El alumno entra a **Perfil → Unirme a un grupo**, escribe el código y confirma.
   La app descarga el curso completo, lo valida y lo aplica de inmediato.
6. En adelante, los cambios publicados se descargan en segundo plano (al abrir la app
   y, como mucho, cada 15 minutos al volver a primer plano) y se aplican en el
   **siguiente arranque**, sin red.

### 4.2 Activar la descarga en la app

`EXPO_PUBLIC_DATA_MODE=hybrid` y `EXPO_PUBLIC_API_URL=https://<host>/api/mlo/v2`
(sin secretos, sin barra final). En local va en `.env`; para builds de EAS hay que
declararlas en el `env` del perfil `preview` de `eas.json` (hoy no están). Ver
`.env.example`. Con `local`, la pantalla de unión a grupo no se muestra.

### 4.3 Qué debe devolver el servidor

Tres endpoints: `GET /groups/{code}`, `GET /catalogs/{catalogId}/manifest` y
`GET /catalogs/{catalogId}/lessons/{lessonId}`. El detalle completo está en
[`docs/api/contrato.md`](../api/contrato.md); el mínimo de una lección es:

```json
{
  "schemaVersion": 2,
  "catalogId": "k7f3q",
  "lessonId": "k7f3q-l2.1",
  "hash": "a1b2c3d4",
  "unit": { "id": "k7f3q-u2", "number": 2, "title": "…", "description": "…",
            "difficulty": "Intermedio", "color": "violet" },
  "lesson": { "id": "k7f3q-l2.1", "unitId": "k7f3q-u2", "code": "2.1",
              "title": "…", "eyebrow": "…", "body": "…", "codeSample": "",
              "contextTitle": "…", "contextBody": "…", "synthesis": ["…"],
              "content": [{ "type": "p", "text": "…" }], "position": 0 },
  "evaluation": { "id": "k7f3q-ev2.1", "lessonId": "k7f3q-l2.1", "title": "…",
                  "description": "…", "questionCount": 10, "exerciseCount": 5 },
  "exercises": [],
  "examples": [],
  "questions": [{ "evaluationId": "k7f3q-ev2.1",
                  "question": { "id": "k7f3q-q1", "type": "mcq", "prompt": "…",
                                "options": ["…", "…"], "answer": 0, "explanation": "…" } }]
}
```

`evaluation` puede ser `null`, y entonces `questions` debe ser `[]` (lección de solo
lectura). El manifest declara `version`, `hash` y una entrada por lección
(`lessonId`, `unitId`, `hash`).

### 4.4 Reglas que descartan contenido

Si cualquiera falla, **se descarta la lección entera** (y no avanza el manifest):

- `schemaVersion` distinto de `2`, o `catalogId`/`lessonId` que no coinciden con lo
  pedido.
- El `hash` de la lección no coincide con el del manifest.
- Ids vacíos, repetidos en la lección, o ya usados por **otro curso**. Los ids
  publicados son globales: `{key del curso}-{id local}` (`k7f3q-l1.2`); en el curso
  base no llevan prefijo.
- `lesson.id`, `unit.id`, cada `exercise.lessonId`, cada `example.lessonId` y
  `evaluation.lessonId` deben ser coherentes entre sí.
- `question.id` es obligatorio.
- Una evaluación publicada debe traer al menos una pregunta; `questionCount` y
  `exerciseCount` deben ser enteros mayores que 0.
- Tipo de bloque desconocido (no hay bloques de imagen) o tabla con filas de largo
  distinto al encabezado.
- `order` con menos de 2 elementos, repetidos o vacíos; `fill` con una oración sin
  `{{…}}` o con banco inválido; `match` con menos de 2 pares o lados repetidos;
  `crossword` fuera de la cuadrícula, con palabras que no sean `A-ZÑ` o con cruces en
  conflicto; `mcq` con menos de 2 opciones, repetidas o `answer` fuera de rango.
- Ejemplos sin pasos completos (`text` y `why` no vacíos) o con `hints` que no sean
  arreglo de textos.

Además: un manifiesto vacío, con hash vacío, con lecciones repetidas, que repite
versión con otro hash o que retrocede de versión se descarta. Los `4xx` no se
reintentan; la red y los `5xx` sí.

### 4.5 Cómo comprobar sin servidor real

Usa el fixture del contrato (`src/shared/services/http/fixtures.ts`) en los tests
existentes: `remoteContent.test.ts`, `remote/__tests__/applyLessonPayload.test.ts` y
`ContentSyncProvider.test.tsx`. Para ver el estado en el dispositivo, revisa las
tablas `remote_catalogs` (último manifest) y `remote_lessons` (`applied_hash` nulo o
distinto de `hash` = pendiente de aplicar). Los fallos solo se registran con `__DEV__`.

Para dejar un APK consumiendo este contenido (variables, `eas.json`, pruebas de humo y
qué revisar), sigue [`apk-con-contenido-remoto.md`](apk-con-contenido-remoto.md).

---

## 5. Verificación

Siempre, tras cambiar contenido:

```md
npx tsc --noEmit     # tipos estrictos
npm run lint         # reglas de capas y estilo
npm test             # jest + testing-library
```

Y en la app: la lección aparece en el hub de su unidad, la lectura muestra los bloques,
la práctica sortea ≥ 2 ejercicios, la evaluación corre y el progreso sobrevive a cerrar
y reabrir. Con contenido remoto, además: publicar una versión, reabrir la app dos veces
(la primera descarga, la segunda aplica) y comprobar que retirar una lección la archiva
sin borrar el progreso.

---

## 6. Errores frecuentes

| Síntoma | Causa probable |
|---|---|
| La lección nueva no aparece | No está en `LESSONS` o su `unitId` no existe |
| El texto largo no sale | Falta la entrada en `richContent` con la clave exacta del `id` |
| Un ejercicio eliminado sigue ahí | Su lección no está en `UNIT1_LESSONS`, así que no se limpia |
| La práctica sale vacía | La lección tiene menos de 2 ejercicios |
| La evaluación sale corta | Menos preguntas/ejercicios que `questionCount`/`exerciseCount` |
| El contenido remoto no llega | `DATA_MODE` sigue en `local`, falta `EXPO_PUBLIC_API_URL`, o el manifest no cambió de versión/hash |
| Se descarga pero no se ve | `remote_lessons` está pendiente: hay que reabrir la app para aplicar |
| Un id choca | Se reutilizó un id de otro curso o de otra lección; los ids publicados no se reciclan |
