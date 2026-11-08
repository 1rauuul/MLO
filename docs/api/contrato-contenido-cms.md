# Contrato de contenido CMS → MLO

Documento de análisis del estado actual del repositorio. Describe cómo MLO
consume, valida, persiste y renderiza el contenido que recibe del CMS: cursos
publicados, lecciones, ejemplos, ejercicios, evaluaciones, preguntas y contenido
extra de clases (grupos).

No se modificó código de la aplicación al elaborar este informe.

> En el código, “grupo” se llama **clase** (`class`). Los endpoints usan
> `/classes/...`, no `/groups/...`.

---

## Índice

1. [Punto de partida: local vs. híbrido](#1-punto-de-partida-local-vs-híbrido)
2. [Endpoints que consume MLO](#2-endpoints-que-consume-mlo)
3. [Contrato del curso publicado](#3-contrato-del-curso-publicado)
4. [Payload completo de una lección](#4-payload-completo-de-una-lección)
5. [Contrato del release de clase (grupo)](#5-contrato-del-release-de-clase-grupo)
6. [Persistencia en SQLite](#6-persistencia-en-sqlite)
7. [Quién consume y renderiza cada elemento](#7-quién-consume-y-renderiza-cada-elemento)
8. [Sincronización, hash, borrado, red y offline](#8-sincronización-hash-borrado-red-y-offline)
9. [Contenido base local vs. contrato remoto](#9-contenido-base-local-vs-contrato-remoto)
10. [Limitaciones actuales que el CMS debe respetar](#10-limitaciones-actuales-que-el-cms-debe-respetar)
11. [Referencias exactas](#11-referencias-exactas)

---

## 1. Punto de partida: local vs. híbrido

| Modo | Qué pasa con el contenido |
|---|---|
| `DATA_MODE='local'` (por defecto) | No se hace ninguna petición de red. El contenido viene empaquetado en `src/shared/services/db/seed.ts`, `richContent.ts`, `unit1.content.ts` y `banks/`. |
| `DATA_MODE='hybrid'` | Además del contenido local, `ContentSyncProvider` descarga cursos publicados y releases de clase en segundo plano. |

El arranque nunca espera a la red. `migrateAndSeed` primero siembra el contenido
local y después aplica lo remoto ya validado que esté pendiente
(`src/shared/services/db/database.ts:34-51` y `:319-322`).

**Importante para el CMS:** hoy la sincronización automática de cursos solo
consulta el catálogo `base`:

```ts
// src/shared/services/content/remoteContent.ts:339-341
export async function catalogsInUse(_db: SQLiteDatabase): Promise<string[]> {
  return ['base'];
}
```

Por tanto, el contrato de curso publicado se consume en
`/catalogs/base/manifest` y `/catalogs/base/lessons/{lessonId}`. Los fixtures
`k7f3q` sirven para pruebas, pero la ruta activa de la app es `base`.

El fixture real de referencia es:

- `src/shared/services/content/remote/__fixtures__/panelRelease.json` →
  manifest real con 25 lecciones y payload completo por lección.
- `src/shared/services/content/remote/__fixtures__/panelClassRelease.json` →
  release real de una clase.

---

## 2. Endpoints que consume MLO

| Contrato | Endpoint | Validador | Destino |
|---|---|---|---|
| Curso publicado: manifiesto | `GET /catalogs/{catalogId}/manifest` | `parseCatalogManifest` (`remoteContent.ts:42`) | `remote_catalogs` |
| Curso publicado: lección | `GET /catalogs/{catalogId}/lessons/{lessonId}` | `validateLessonPayload` (`validateLessonPayload.ts:337`) | `remote_lessons` (área de espera) |
| Clase: vista previa | `GET /classes/{code}` | `parseClassPreview` (`validateClassRelease.ts:65`) | `class_cache` |
| Clase: release | `GET /classes/{code}/release` | `parseClassRelease` (`validateClassRelease.ts:153`) | `class_cache` + `class_extras_cache` |
| Clase: unirse | `POST /classes/{code}/join` | `parseClassPreview` | `account_classes` |
| Clase: salir | `DELETE /classes/{code}/members/{studentKey}` | Solo HTTP 204 | Borra `account_classes` |

No existen endpoints de cursos, unidades, ejercicios o evaluaciones por
separado. Todo el curso viaja dentro del manifest y de cada payload de lección.
Las unidades se envían repetidas dentro de cada lección.

---

## 3. Contrato del curso publicado

### 3.1 Manifest

```json
{
  "schemaVersion": 2,
  "catalogId": "base",
  "title": "Ingeniería de Software",
  "version": "7",
  "hash": "manifest-hash-7",
  "publishedAt": "2026-11-05T00:00:00.000Z",
  "lessons": [
    { "lessonId": "l1.2", "unitId": "u1", "hash": "l1.2-hash-7" }
  ]
}
```

| Campo | Obligatorio | Tipo / regla |
|---|---:|---|
| `schemaVersion` | Sí | Número exacto `2`. Si es `"2"` se rechaza. |
| `catalogId` | Sí | Debe coincidir exactamente con el de la URL. Hoy: `base`. |
| `title` | Sí | String. Se guarda en `remote_catalogs.title`, pero la app no lo renderiza. |
| `version` | Sí | String no vacío **o** entero. El cliente normaliza el entero a string (`manifestVersion`, `remoteContent.ts:30`). |
| `hash` | Sí | String no vacío. |
| `publishedAt` | Sí | String. No se valida formato ISO, solo que sea string. |
| `lessons` | Sí | Array no vacío. |
| `lessons[].lessonId` | Sí | String no vacío. No puede repetirse en el manifest. |
| `lessons[].unitId` | Sí | String no vacío. **Se valida pero no se usa para persistir**; la unidad real viene en el payload de la lección. |
| `lessons[].hash` | Sí | String no vacío. Debe coincidir con `hash` del payload de la lección (`refreshCatalog`, `remoteContent.ts:277`). |

Validaciones adicionales del manifest (`refreshCatalog`,
`remoteContent.ts:236-336`):

- Si `manifest_hash` guardado es igual al nuevo, no descarga nada.
- Misma `version` con otro `hash` → se descarta el manifest (`ParseError`).
- Versión numérica que retrocede → se descarta.
- Todas las lecciones se validan **antes** de escribir. Si una falla, no avanza
  el manifest.
- Un `lessonId` no puede pertenecer a dos lecciones del mismo catálogo.
- Las lecciones que desaparecen del manifest se archivan, no se borran.

### 3.2 Unidad

La unidad no tiene endpoint propio; viaja dentro de cada lección.

```json
{
  "id": "u1",
  "number": 1,
  "title": "Introducción",
  "description": "Software de calidad más allá de programar.",
  "difficulty": "Fundamental",
  "color": "blue"
}
```

| Campo | Obligatorio | Tipo / regla |
|---|---:|---|
| `id` | Sí | String. Debe ser igual a `lesson.unitId`. |
| `number` | Sí | Entero. Ordena las unidades (`selectUnits`, `lessonRepository.ts:75`). |
| `title` | Sí | String. Puede ser vacío. |
| `description` | Sí | String. Puede ser vacío. |
| `difficulty` | Sí | `Fundamental` \| `Intermedio` \| `Avanzado`. |
| `color` | Sí | `blue` \| `violet` \| `green`. |

Validador: `parseUnit` (`validateLessonPayload.ts:288-305`). La unidad se hace
upsert por `id`; si dos lecciones envían la misma unidad con datos distintos,
gana la última aplicada.

### 3.3 Lección

```json
{
  "id": "l1.2",
  "unitId": "u1",
  "code": "1.2",
  "title": "Desarrollo de software profesional",
  "eyebrow": "Módulo 01 · Lección 02",
  "body": "Resumen de la lección.",
  "codeSample": "",
  "contextTitle": "Trabajo coordinado y trazable",
  "contextBody": "Requisitos, versiones y pruebas dejan evidencia.",
  "synthesis": ["Idea clave 1", "Idea clave 2"],
  "content": [
    { "type": "p", "text": "Primer párrafo." }
  ],
  "position": 1
}
```

| Campo | Obligatorio | Tipo / regla |
|---|---:|---|
| `id` | Sí | Debe ser igual al `lessonId` de la URL y al del payload. |
| `unitId` | Sí | Debe ser igual a `unit.id`. |
| `code` | Sí | String. Es el número visible (`1.2`). No se exige único. |
| `title` | Sí | String. |
| `eyebrow` | Sí | String. |
| `body` | Sí | String. Se usa como respaldo si `content` está vacío. |
| `codeSample` | No | String; si falta se normaliza a `""`. Se guarda, pero la UI actual no lo muestra. |
| `contextTitle` | No | String; si falta se normaliza a `""`. Se guarda, pero la UI actual no lo muestra. |
| `contextBody` | No | String; si falta se normaliza a `""`. Se guarda, pero la UI actual no lo muestra. |
| `synthesis` | No | `string[]`; si falta se normaliza a `[]`. Se muestra en la pestaña “Síntesis”. |
| `content` | **Sí** | Array de bloques. Omitirlo rechaza toda la lección. Puede ser `[]`. |
| `position` | Sí | Entero. Ordena dentro de la unidad. |

Validador: `parseLesson` (`validateLessonPayload.ts:307-335`) y
`validateLessonPayload` (`:337-489`).

### 3.4 Bloques de contenido

Solo existen cinco tipos. **Un tipo desconocido descarta la lección completa.**
No hay bloques de imagen.

```json
{ "type": "p", "text": "Párrafo" }
{ "type": "h", "text": "Subtítulo" }
{ "type": "bullets", "items": ["Punto A", "Punto B"] }
{ "type": "numbers", "items": ["Paso 1", "Paso 2"] }
{ "type": "table", "header": ["Concepto", "Definición"], "rows": [["A", "B"]] }
```

Reglas (`parseContentBlocks`, `validateLessonPayload.ts:102-137`):

- `p` y `h`: `text` string obligatorio.
- `bullets` y `numbers`: `items` debe ser `string[]`.
- `table`: `header` debe ser `string[]`; `rows` debe ser `string[][]`; **cada
  fila debe tener exactamente la misma cantidad de celdas que el header**.
- Render: `RichContent` (`src/features/modules/view/RichContent.tsx:8`).

### 3.5 Ejercicios

Un ejercicio siempre pertenece a una lección y usa `type` de
`order | fill | match | crossword`. **`mcq` no es un tipo válido de ejercicio**;
solo existe como pregunta de evaluación (`EXERCISE_TYPES`, `entities.ts:13`).

Campos comunes:

| Campo | Obligatorio | Tipo / regla |
|---|---:|---|
| `id` | Sí | String. Único en el curso. |
| `lessonId` | Sí | Debe ser igual a `lesson.id`. |
| `type` | Sí | `order` \| `fill` \| `match` \| `crossword`. |
| `prompt` | Sí | String. |
| `instructions` | Sí | String. Puede ser `""`. |
| `correctOrder` | En la práctica sí | `string[]`. Para `order` es la secuencia correcta; para los demás se envía `[]`. Si se omite, MLO lo normaliza a `[]`. |
| `config` | Según el tipo | Objeto. Si falta se normaliza a `{}`. |
| `explanation` | No | String; si falta queda `""`. |
| `example` | No | Ejemplo embebido del ejercicio. |

Validadores: `parseExerciseSeed` (`validate.ts:124-163`) y `validateExercise`
(`validateLessonPayload.ts:263-277`).

#### `order`

```json
{
  "id": "ord1.2",
  "lessonId": "l1.2",
  "type": "order",
  "prompt": "Ordena las actividades del proceso",
  "instructions": "Usa las flechas para ordenar.",
  "correctOrder": ["Especificar", "Desarrollar", "Validar"],
  "config": {},
  "explanation": "El proceso va de especificación a validación."
}
```

- `correctOrder`: mínimo 2 elementos, ninguno vacío, sin repetidos
  (`validateOrder`, `:139-146`).
- El cliente mezcla la secuencia al mostrarla (`scrambleOrder`,
  `exercise.logic.ts:40`).

#### `fill`

```json
{
  "id": "fill1.2",
  "lessonId": "l1.2",
  "type": "fill",
  "prompt": "Completa la definición",
  "instructions": "Toca un espacio y elige una palabra.",
  "correctOrder": [],
  "config": {
    "sentences": ["El {{requisito}} describe una necesidad."],
    "bank": ["requisito", "diseño"]
  },
  "explanation": "El requisito describe la necesidad."
}
```

- Cada oración debe contener al menos un hueco `{{respuesta}}`
  (`validateFill`, `:148-164`).
- La respuesta se extrae del texto entre `{{...}}` (`extractFillAnswers`,
  `exerciseRules.ts:5`).
- `bank` puede contener distractores; las respuestas correctas se agregan
  automáticamente al banco visual (`buildFillBank`, `exercise.logic.ts:104`).
- Comparación: `trim().toLowerCase()` (`normalizeAnswer`,
  `exercise.logic.ts:78`).

#### `match`

```json
{
  "id": "match1.2",
  "lessonId": "l1.2",
  "type": "match",
  "prompt": "Enlaza cada atributo con su descripción",
  "instructions": "Toca un atributo y después su descripción.",
  "correctOrder": [],
  "config": {
    "pairs": [
      { "left": "Mantenimiento", "right": "Puede evolucionar" },
      { "left": "Eficiencia", "right": "No desperdicia recursos" }
    ]
  },
  "explanation": "Cada atributo describe una propiedad distinta."
}
```

- Mínimo 2 pares (`validateMatch`, `:166-182`).
- `left` y `right` no vacíos.
- No puede repetirse un `left` ni un `right`.
- Los `right` se mezclan al mostrarse (`useMatchEngine`,
  `useExerciseEngine.ts:360`).

#### `crossword`

```json
{
  "id": "cross1.2",
  "lessonId": "l1.2",
  "type": "crossword",
  "prompt": "Crucigrama de conceptos",
  "instructions": "Escribe las palabras.",
  "correctOrder": [],
  "config": {
    "crossword": {
      "rows": 3,
      "cols": 5,
      "entries": [
        { "word": "SOL", "clue": "Estrella", "row": 0, "col": 0, "direction": "across" },
        { "word": "SAL", "clue": "Condimento", "row": 0, "col": 0, "direction": "down" }
      ]
    },
    "bank": ["LUNA"]
  },
  "explanation": "Las palabras comparten la S."
}
```

- `rows` y `cols` enteros positivos; al menos una entrada
  (`validateCrossword`, `:184-221`).
- `word` solo admite `A-Z` y `Ñ`: `/^[A-ZÑ]+$/`. No acentos, espacios ni
  minúsculas.
- `clue` no vacío.
- `direction`: `across` o `down`.
- La palabra debe caber en la cuadrícula.
- Si dos palabras comparten celda, la letra debe coincidir; si no, se rechaza.
- `config.bank` es opcional y añade distractores al banco visual
  (`CrosswordExercise.tsx:59`).

#### Ejemplo embebido en un ejercicio

```json
{
  "example": {
    "title": "Las cuatro actividades del proceso",
    "steps": [
      { "text": "Especificar qué debe hacer el sistema", "why": "Fija el problema." },
      { "text": "Validar contra lo acordado", "why": "Confirma lo pedido." }
    ],
    "hints": ["Piensa qué ocurre antes de escribir código."]
  }
}
```

- `title`: string obligatorio.
- `steps`: array obligatorio; al menos un paso; `text` y `why` no vacíos.
- `hints`: `string[]`; si falta se normaliza a `[]`.
- El ejemplo hereda del ejercicio: `id`, `lessonId`, `type`, `prompt`,
  `config` y `explanation` (`exampleFromExercise`, `seed.ts:250`).

### 3.6 Ejemplos independientes

Los ejemplos independientes viajan en `examples[]`. Los ejemplos de un
ejercicio **no** van aquí; van dentro de `exercises[].example`.

```json
{
  "id": "exA1.2",
  "lessonId": "l1.2",
  "type": "match",
  "title": "Atributos del buen software",
  "prompt": "Enlaza cada atributo con su descripción",
  "config": {
    "pairs": [
      { "left": "Mantenimiento", "right": "Puede evolucionar" },
      { "left": "Eficiencia", "right": "No desperdicia recursos" }
    ]
  },
  "steps": [
    { "text": "Leer el atributo", "why": "Identifica la propiedad." },
    { "text": "Buscar su definición", "why": "Cada atributo tiene una consecuencia." }
  ],
  "hints": ["Concéntrate en la consecuencia, no en el nombre."],
  "explanation": "Cada atributo describe una propiedad distinta."
}
```

| Campo | Obligatorio | Regla |
|---|---:|---|
| `id` | Sí | Único en el curso. |
| `lessonId` | Sí | Igual a `lesson.id`. |
| `type` | Sí | `order` \| `fill` \| `match` \| `crossword`. No `mcq`. |
| `title` | Sí | String. |
| `prompt` | Sí | String. |
| `config` | No | Objeto; por defecto `{}`. |
| `steps` | Sí en la práctica | Array; al menos un paso con `text` y `why` no vacíos (`validateExample`, `:279-286`). |
| `hints` | No | `string[]`; por defecto `[]`. |
| `explanation` | No | String; por defecto `""`. |

**Limitación:** el validador de ejemplos **no valida `config` según el tipo**.
Un ejemplo `match` sin `pairs` pasa la validación, pero se renderiza vacío. El
CMS debe enviar la configuración correcta por su cuenta.

Además, un ejemplo independiente de tipo `order` es aceptado por el validador,
pero `syntheticExamples` lo excluye de la pantalla de ejemplos
(`example.logic.ts:4-19`).

### 3.7 Evaluación y preguntas

La evaluación es opcional. Una lección puede ser de solo lectura:
`evaluation: null` y `questions: []`.

```json
{
  "id": "ev1.2",
  "lessonId": "l1.2",
  "title": "Evaluación: Desarrollo de software profesional",
  "description": "Proceso, productos y calidad.",
  "questionCount": 5,
  "exerciseCount": 3
}
```

| Campo | Obligatorio | Regla |
|---|---:|---|
| `id` | Sí | String; único en el curso. |
| `lessonId` | Sí | Igual a `lesson.id`. |
| `title` | Sí | String. |
| `description` | Sí | String. |
| `questionCount` | Sí | Entero **> 0**. Es el cupo de preguntas del banco. |
| `exerciseCount` | Sí | Entero **> 0**. Es el cupo de ejercicios de la lección. |

Reglas globales:

- Si hay evaluación, debe haber al menos una pregunta (`:454-456`).
- Si no hay evaluación, no puede haber preguntas (`:457-459`).
- `questionCount` y `exerciseCount` son **cupos**, no tamaños exactos. Si el
  banco tiene menos, se usan los disponibles (`buildEvaluationPool`,
  `evaluation.logic.ts:98`).
- La evaluación mezcla preguntas del banco y ejercicios de la lección; cada
  reactivo vale 1.
- Las opciones de las preguntas `mcq` se barajan al mostrar
  (`shuffleQuestionOptions`, `:58`).

Preguntas:

```json
{
  "evaluationId": "ev1.2",
  "question": {
    "id": "ev1.2-q1",
    "type": "mcq",
    "prompt": "¿Qué se hace primero?",
    "options": ["Especificar", "Validar"],
    "answer": 0,
    "explanation": "Primero se especifica.",
    "config": {}
  }
}
```

| Campo | Obligatorio | Regla |
|---|---:|---|
| `evaluationId` | Sí | Igual a `evaluation.id`. |
| `question.id` | **Sí** | String no vacío. A diferencia del seed local, aquí no se autogenera. |
| `question.type` | Sí | `mcq` \| `order` \| `fill` \| `match` \| `crossword`. |
| `question.prompt` | Sí | String. |
| `question.options` | No | `string[]`; por defecto `[]`. |
| `question.answer` | No | Entero; por defecto `0`. |
| `question.explanation` | No | String; por defecto `""`. |
| `question.config` | No | Objeto; por defecto `{}`. |

Estructura por tipo de pregunta (`validateQuestionRules`, `:239-261`):

| Tipo | Estructura correcta |
|---|---|
| `mcq` | `options` con al menos 2 opciones únicas; `answer` es el índice 0-based dentro de `options` y debe estar en rango. |
| `order` | `options` es la **secuencia correcta** (mínimo 2, sin vacíos ni repetidos); `answer` se envía `0`. No usa `correctOrder`. |
| `fill` | `options: []`, `answer: 0`; la verdad está en `config.sentences` con huecos `{{...}}` y `config.bank`. |
| `match` | `options: []`, `answer: 0`; la verdad está en `config.pairs` (mínimo 2, sin repetir extremos). |
| `crossword` | `options: []`, `answer: 0`; la verdad está en `config.crossword` con las mismas reglas del ejercicio. |

El contrato recomienda enviar siempre `options` y `answer`, aunque estén vacíos
o en `0`, tal como hace el panel real (`panelRelease.json:1904-1920`).

---

## 4. Payload completo de una lección

Ejemplo válido para `catalogId = "base"`, sobrescribiendo la lección `l1.2` y
sus elementos. Los ids coinciden a propósito con los del contenido base; si se
usan ids nuevos, MLO crea elementos adicionales.

```json
{
  "schemaVersion": 2,
  "catalogId": "base",
  "lessonId": "l1.2",
  "hash": "l1.2-hash-7",
  "unit": {
    "id": "u1",
    "number": 1,
    "title": "Introducción",
    "description": "Software de calidad más allá de programar.",
    "difficulty": "Fundamental",
    "color": "blue"
  },
  "lesson": {
    "id": "l1.2",
    "unitId": "u1",
    "code": "1.2",
    "title": "Desarrollo de software profesional",
    "eyebrow": "Módulo 01 · Lección 02",
    "body": "El desarrollo profesional se organiza en actividades y deja evidencia del trabajo.",
    "codeSample": "",
    "contextTitle": "Trabajo coordinado y trazable",
    "contextBody": "Requisitos, versiones y pruebas dejan evidencia.",
    "synthesis": [
      "Especificar define qué debe hacer el sistema.",
      "La validación confirma que se cumplen los requisitos."
    ],
    "content": [
      { "type": "p", "text": "El desarrollo de software profesional se realiza en equipo." },
      { "type": "h", "text": "Actividades del proceso" },
      {
        "type": "bullets",
        "items": ["Especificación", "Desarrollo", "Validación", "Evolución"]
      },
      {
        "type": "table",
        "header": ["Concepto", "Definición"],
        "rows": [["Requisito", "Necesidad que el sistema debe satisfacer"]]
      }
    ],
    "position": 1
  },
  "evaluation": {
    "id": "ev1.2",
    "lessonId": "l1.2",
    "title": "Evaluación: Desarrollo de software profesional",
    "description": "Proceso, productos y calidad.",
    "questionCount": 5,
    "exerciseCount": 3
  },
  "exercises": [
    {
      "id": "ord1.2",
      "lessonId": "l1.2",
      "type": "order",
      "prompt": "Ordena las actividades del proceso",
      "instructions": "Usa las flechas para ordenar.",
      "correctOrder": ["Especificar", "Desarrollar", "Validar"],
      "config": {},
      "explanation": "El proceso va de especificación a validación.",
      "example": {
        "title": "Actividades del proceso",
        "steps": [
          { "text": "Especificar el problema", "why": "Fija el alcance." },
          { "text": "Validar lo construido", "why": "Confirma lo acordado." }
        ],
        "hints": ["Piensa qué ocurre antes de escribir código."]
      }
    },
    {
      "id": "fill1.2",
      "lessonId": "l1.2",
      "type": "fill",
      "prompt": "Completa la definición",
      "instructions": "Toca un espacio y elige una palabra.",
      "correctOrder": [],
      "config": {
        "sentences": ["El {{requisito}} describe una necesidad."],
        "bank": ["requisito", "diseño"]
      },
      "explanation": "El requisito describe la necesidad.",
      "example": {
        "title": "Requisito y diseño",
        "steps": [
          { "text": "Leer la oración", "why": "El contexto da la pista." },
          { "text": "Elegir la palabra", "why": "El requisito describe la necesidad." }
        ],
        "hints": ["Piensa en lo que se acuerda con el cliente."]
      }
    },
    {
      "id": "match1.2",
      "lessonId": "l1.2",
      "type": "match",
      "prompt": "Enlaza cada atributo con su descripción",
      "instructions": "Toca un atributo y después su descripción.",
      "correctOrder": [],
      "config": {
        "pairs": [
          { "left": "Mantenimiento", "right": "Puede evolucionar" },
          { "left": "Eficiencia", "right": "No desperdicia recursos" }
        ]
      },
      "explanation": "Cada atributo describe una propiedad distinta."
    },
    {
      "id": "cross1.2",
      "lessonId": "l1.2",
      "type": "crossword",
      "prompt": "Crucigrama de conceptos",
      "instructions": "Escribe las palabras.",
      "correctOrder": [],
      "config": {
        "crossword": {
          "rows": 3,
          "cols": 5,
          "entries": [
            { "word": "SOL", "clue": "Estrella", "row": 0, "col": 0, "direction": "across" },
            { "word": "SAL", "clue": "Condimento", "row": 0, "col": 0, "direction": "down" }
          ]
        },
        "bank": ["LUNA"]
      },
      "explanation": "Las palabras comparten la S."
    }
  ],
  "examples": [
    {
      "id": "exA1.2",
      "lessonId": "l1.2",
      "type": "match",
      "title": "Atributos del buen software",
      "prompt": "Enlaza cada atributo con su descripción",
      "config": {
        "pairs": [
          { "left": "Mantenimiento", "right": "Puede evolucionar" },
          { "left": "Eficiencia", "right": "No desperdicia recursos" }
        ]
      },
      "steps": [
        { "text": "Leer el atributo", "why": "Identifica la propiedad." },
        { "text": "Buscar su definición", "why": "Cada atributo tiene una consecuencia." }
      ],
      "hints": ["Concéntrate en la consecuencia, no en el nombre."],
      "explanation": "Cada atributo describe una propiedad distinta."
    }
  ],
  "questions": [
    {
      "evaluationId": "ev1.2",
      "question": {
        "id": "ev1.2-q1",
        "type": "mcq",
        "prompt": "¿Qué se hace primero?",
        "options": ["Especificar", "Validar"],
        "answer": 0,
        "explanation": "Primero se especifica.",
        "config": {}
      }
    },
    {
      "evaluationId": "ev1.2",
      "question": {
        "id": "ev1.2-q2",
        "type": "order",
        "prompt": "Ordena el proceso",
        "options": ["Especificar", "Desarrollar", "Validar"],
        "answer": 0,
        "explanation": "El proceso va de la especificación a la validación.",
        "config": {}
      }
    },
    {
      "evaluationId": "ev1.2",
      "question": {
        "id": "ev1.2-q3",
        "type": "fill",
        "prompt": "Completa la frase",
        "options": [],
        "answer": 0,
        "explanation": "El requisito describe la necesidad.",
        "config": {
          "sentences": ["El {{requisito}} describe una necesidad."],
          "bank": ["diseño"]
        }
      }
    },
    {
      "evaluationId": "ev1.2",
      "question": {
        "id": "ev1.2-q4",
        "type": "match",
        "prompt": "Enlaza cada concepto",
        "options": [],
        "answer": 0,
        "explanation": "Cada concepto tiene su definición.",
        "config": {
          "pairs": [
            { "left": "Requisito", "right": "Necesidad" },
            { "left": "Diseño", "right": "Solución" }
          ]
        }
      }
    },
    {
      "evaluationId": "ev1.2",
      "question": {
        "id": "ev1.2-q5",
        "type": "crossword",
        "prompt": "Completa el crucigrama",
        "options": [],
        "answer": 0,
        "explanation": "Las palabras comparten la S.",
        "config": {
          "crossword": {
            "rows": 3,
            "cols": 5,
            "entries": [
              { "word": "SOL", "clue": "Estrella", "row": 0, "col": 0, "direction": "across" },
              { "word": "SAL", "clue": "Condimento", "row": 0, "col": 0, "direction": "down" }
            ]
          }
        }
      }
    }
  ]
}
```

Manifest correspondiente:

```json
{
  "schemaVersion": 2,
  "catalogId": "base",
  "title": "Ingeniería de Software",
  "version": "7",
  "hash": "manifest-hash-7",
  "publishedAt": "2026-11-05T00:00:00.000Z",
  "lessons": [
    { "lessonId": "l1.2", "unitId": "u1", "hash": "l1.2-hash-7" }
  ]
}
```

---

## 5. Contrato del release de clase (grupo)

Una clase **no cambia el catálogo ni el curso base**. Solo agrega bloques,
ejercicios y ejemplos sobre lecciones existentes. No puede agregar unidades,
lecciones nuevas, evaluaciones ni preguntas.

### 5.1 Vista previa

```json
{
  "schemaVersion": 2,
  "class": {
    "id": "4dba127d-01c2-44f2-b639-dfc230ac09bb",
    "name": "Clase contrato MLO",
    "teacherName": "Docente contrato"
  },
  "published": {
    "version": 2,
    "hash": "class-hash-2",
    "publishedAt": "2026-10-27T22:56:58.231Z"
  }
}
```

- `published` puede ser `null` o venir ausente.
- `class.id`, `name` y `teacherName` deben ser strings no vacíos
  (`parseClassInfo`, `validateClassRelease.ts:56`).
- `published.version` entero > 0; `hash` no vacío; `publishedAt` string.
- El código de clase se normaliza a mayúsculas y sin espacios
  (`canonicalClassCode`, `remoteContent.ts:89`); la pantalla de unirse exige 6
  caracteres (`useJoinClass.ts:48`).

### 5.2 Release

```json
{
  "schemaVersion": 2,
  "class": {
    "id": "4dba127d-01c2-44f2-b639-dfc230ac09bb",
    "name": "Clase contrato MLO",
    "teacherName": "Docente contrato"
  },
  "version": 2,
  "hash": "class-hash-2",
  "publishedAt": "2026-10-27T22:56:58.231Z",
  "lessons": [
    {
      "lessonId": "l1.2",
      "code": "1.2",
      "extras": [
        {
          "id": "42ac6e3f-59dc-4a53-a262-a9f03190d133",
          "type": "exercise",
          "content": {
            "type": "order",
            "prompt": "Ordena los pasos",
            "instructions": "",
            "correctOrder": ["Requisitos", "Diseño"],
            "config": {},
            "explanation": "",
            "example": null
          }
        },
        {
          "id": "6963d455-7ba4-4de8-b04b-70729b9b706f",
          "type": "lesson",
          "content": {
            "title": "Contexto de la clase",
            "blocks": [
              { "type": "p", "text": "Texto extra de la clase." }
            ]
          }
        },
        {
          "id": "e7530ea4-44d5-4605-8eeb-6a5855a3deaf",
          "type": "example",
          "content": {
            "type": "match",
            "title": "Ejemplo de relación",
            "prompt": "Relaciona",
            "config": {
              "pairs": [
                { "left": "a", "right": "1" },
                { "left": "b", "right": "2" }
              ]
            },
            "steps": [
              { "text": "Paso", "why": "Porque sí" }
            ],
            "hints": [],
            "explanation": ""
          }
        }
      ]
    }
  ]
}
```

| Campo | Obligatorio | Regla |
|---|---:|---|
| `schemaVersion` | Sí | Número exacto `2`. |
| `class` | Sí | Igual que en la vista previa. |
| `version` | Sí | Entero > 0. |
| `hash` | Sí | String no vacío. |
| `publishedAt` | Sí | String. |
| `lessons` | Sí | Array. |
| `lessons[].lessonId` | Sí | String no vacío. Debe existir en `lessons`; si no, falla la FK al guardar. |
| `lessons[].code` | Sí | String no vacío. **No se guarda ni se valida contra la lección real**. |
| `lessons[].extras` | Sí | Array. |
| `extras[].id` | Sí | String no vacío. **Único en todo el release**, no solo dentro de la lección. |
| `extras[].type` | Sí | `lesson` \| `exercise` \| `example`. |
| `extras[].content` | Sí | Objeto según el tipo. |

Tipos de extra:

| `type` | `content` esperado | Validación real |
|---|---|---|
| `lesson` | `{ "title"?: string, "blocks": ContentBlock[] }` | `blocks` debe pasar `parseContentBlocks`. `title` opcional, por defecto `""`. Un extra con `blocks: []` se acepta y luego se descarta al renderizar (`extraToLesson`, `classRepository.ts:294`). |
| `exercise` | `{ type, prompt, instructions, correctOrder, config?, explanation?, example? }` | `parseExerciseSeed` con `id` y `lessonId` tomados del extra. Para `order`, `correctOrder` debe tener al menos 2 elementos. **No se validan las reglas de `fill`, `match` ni `crossword`.** |
| `example` | `{ type, title, prompt, config?, steps, hints, explanation }` | `parseExampleSeed` con `id` y `lessonId` del extra. `steps` debe ser array; `hints` array; `explanation` string. **No valida el `config` según el tipo.** |

Diferencias importantes entre el extra de clase y el contrato de curso:

- En extras de clase, `correctOrder`, `instructions`, `steps`, `hints` y
  `explanation` **sí deben venir** (no se aplican los defaults del payload de
  lección).
- `example: null` es válido en un ejercicio extra.
- El `id` y `lessonId` dentro de `content` se ignoran: MLO usa los del extra.
- El mismo `extra.id` en varias clases se deduplica. El contenido que gana es el
  de la clase publicada más recientemente; las etiquetas de todas las clases se
  unen (`selectExtrasByLesson`, `classRepository.ts:228-274`).

---

## 6. Persistencia en SQLite

Esquema: `src/shared/services/db/schema.ts`.

| Elemento | Tabla | Columnas relevantes |
|---|---|---|
| Curso remoto | `remote_catalogs` | `catalog_id`, `title`, `version`, `manifest_hash`, `lesson_ids` (JSON), `fetched_at` |
| Lección en espera | `remote_lessons` | `catalog_id`, `lesson_id`, `hash`, `payload` (JSON completo), `fetched_at`, `applied_hash` |
| Unidad | `units` | `id`, `number`, `title`, `description`, `difficulty`, `color`, `catalog_id`, `archived_at` |
| Lección | `lessons` | `id`, `unit_id`, `code`, `title`, `eyebrow`, `body`, `code_sample`, `context_title`, `context_body`, `synthesis` (JSON), `content` (JSON), `position`, `catalog_id`, `archived_at` |
| Ejemplo | `examples` | `id`, `lesson_id`, `type`, `title`, `prompt`, `config` (JSON), `steps` (JSON), `hints` (JSON), `explanation` |
| Ejercicio | `exercises` | `id`, `lesson_id`, `type`, `prompt`, `instructions`, `correct_order` (JSON), `config` (JSON), `explanation` |
| Evaluación | `evaluations` | `id`, `lesson_id`, `title`, `description`, `question_count`, `exercise_count`, `archived_at` |
| Pregunta | `questions` | `id`, `evaluation_id`, `order_index`, `type`, `config` (JSON), `prompt`, `options` (JSON), `answer`, `explanation` |
| Clase | `class_cache` | `class_id`, `class_code`, `class_name`, `teacher_name`, `version`, `hash`, `published_at`, `fetched_at` |
| Extras de clase | `class_extras_cache` | `class_id`, `extra_id`, `lesson_id`, `type`, `payload` (JSON de `content`), `position` |
| Membresía | `account_classes` | `account_id`, `class_id`, `class_code`, `joined_at` |
| Intento | `attempts` | `account_id`, `source`, `item_id`, `item_type`, `lesson_id`, `correct`, `score_correct`, `score_total` |
| Resultado de evaluación | `evaluation_results` | `account_id`, `evaluation_id`, `score`, `correct_count`, `total_count` |

Flujo de aplicación de una lección (`applyLessonPayload`, `seed.ts:567-678`),
todo dentro de una transacción:

1. Upsert de `units` por `id`.
2. Upsert de `lessons` por `id`.
3. Si hay evaluación: upsert de `evaluations`; si no, archiva las evaluaciones
   de la lección y borra sus preguntas.
4. Borra los `exercises` de la lección que ya no vienen y hace upsert de los
   nuevos.
5. Borra los `examples` de la lección que ya no vienen y hace upsert de los
   nuevos.
6. Además de los ejemplos independientes, materializa en `examples` el ejemplo
   embebido de cada ejercicio, usando el **mismo id del ejercicio**
   (`exampleFromExercise`, `seed.ts:250-265`).
7. Borra las `questions` de la evaluación que ya no vienen y hace upsert de las
   nuevas, con `order_index` = posición en el array.

Si cualquier escritura falla, la transacción revierte y la lección queda
pendiente para el próximo arranque.

---

## 7. Quién consume y renderiza cada elemento

| Elemento | Repositorio | Hook / ViewModel | Vista |
|---|---|---|---|
| Unidades y lecciones | `lessonRepository.ts` (`selectUnits`, `selectLessons`, `selectLesson`) | `useCatalog` (`useCatalog.ts:18`), `useLessonContent` (`:16`), `useLessonHub` (`:22`) | `ModulesScreen`, `UnitCard`, `TopicScreen`, `LessonScreen` |
| Bloques `lesson.content` | — | `useLessonContent` | `RichContent` dentro de `LessonScreen` |
| Síntesis | — | `useLessonContent` | `LessonScreen`, pestaña “Síntesis” |
| Ejemplos independientes | `exampleRepository.ts` (`selectExamplesByLesson`, `selectExamplesWithExtras`) | `useExamplesEngine` (`:24`), `useLessonHub` | `ExamplesScreen` → `ExampleRunner` |
| Ejemplos embebidos de ejercicio | `exampleRepository.ts` (se materializan en `examples`) | `useExamplesEngine` | `ExampleRunner` |
| Ejercicios | `exerciseRepository.ts` (`selectExercisesByLesson`, `selectPracticeExercisesByLesson`) | `usePracticeEngine` (`:84`), `useExercisesForLesson` (`:115`), `useExamplesEngine` | `ExercisesScreen` → `ActivityView` → `OrderExercise` / `FillExercise` / `MatchExercise` / `CrosswordExercise` |
| Evaluación | `evaluationRepository.ts` (`selectEvaluationByLesson`, `selectQuestions`) | `useEvaluationForLesson` (`useQuizEngine.ts:36`), `useEvaluationEngine` (`:143`) | `EvaluationFlow`, `EvaluationScreen` |
| Catálogo de evaluaciones | `evaluationRepository.ts` (`selectEvaluationSummaries`) | `useEvaluationsCatalog` | `EvaluationsScreen` |
| Extras de clase tipo `lesson` | `classRepository.ts` (`selectLessonExtras`, `extraToLesson`) | `useLessonContent` | `LessonScreen`, sección “Contenido de tus clases” |
| Extras de clase tipo `exercise` | `classRepository.ts` (`selectExtrasByLesson`, `extraToExercise`) + `exerciseRepository.selectPracticeExercisesByLesson` | `usePracticeEngine`, `useExamplesEngine` | `ExercisesScreen`, `ExamplesScreen` |
| Extras de clase tipo `example` | `classRepository.ts` (`extraToExample`) + `exampleRepository.selectExamplesWithExtras` | `useExamplesEngine` | `ExamplesScreen` |

Detalles de render:

- `LessonScreen` muestra `lesson.content` con `RichContent`; si `content` está
  vacío, muestra `lesson.body`.
- La sección “Contenido de tus clases” muestra los extras `lesson` debajo del
  contenido base, con el nombre de las clases (`LessonScreen.tsx:139-163`).
- `ExamplesScreen` arma la lista con ejercicios sorteados + ejemplos
  independientes; los ejemplos independientes de tipo `order` se excluyen.
- `ExercisesScreen` usa `usePracticeEngine`, que sortea hasta 10 ejercicios por
  cuenta y lección; el sorteo se guarda en `example_state`
  (`lessonDraw.ts:32-66`).
- `EvaluationFlow` mezcla hasta `questionCount` preguntas y hasta
  `exerciseCount` ejercicios de la lección, baraja el orden y las opciones
  `mcq` (`evaluation.logic.ts:98-116`).
- La práctica guarda puntaje parcial por reactivo interno en `attempts`; la
  evaluación guarda correcto/incorrecto por reactivo y un `evaluation_results`
  con porcentaje.

---

## 8. Sincronización, hash, borrado, red y offline

| Situación | Comportamiento exacto |
|---|---|
| Manifest con el mismo `hash` guardado | No se descarga ninguna lección (`refreshCatalog`, `:247`). |
| Misma `version` con otro `hash` | Se rechaza el manifest completo (`:250-253`). |
| Versión numérica que retrocede | Se rechaza (`:255-262`). |
| Lección descargada con `hash` distinto al del manifest | Se descarta toda la actualización; no se escribe nada (`:277-279`). |
| Una lección falla validación | No se guarda ninguna lección del lote y el manifest no avanza (`:273-290`). |
| Contenido eliminado de una lección | `applyLessonPayload` borra de `exercises`, `examples` y `questions` lo que ya no viene. Los `attempts` y `evaluation_results` se conservan. |
| Evaluación eliminada (`evaluation: null`) | La evaluación se archiva y se borran sus preguntas. |
| Lección eliminada del manifest | Se marca `lessons.archived_at`; no se borra. También se archivan sus evaluaciones. Una unidad sin lecciones activas se archiva (`archiveMissingLessons`, `applyStagedContent.ts:70-116`). |
| Fallo de red en curso | Se conserva la caché anterior. No se borra contenido. |
| `4xx` | No se reintenta. |
| `5xx` o error de red | Se reintenta hasta 2 veces con backoff exponencial (`client.ts:53-69`). |
| Timeout | 8 segundos (`client.ts:53`). |
| `429` | Se clasifica como `rate_limited`; no altera membresías. |
| Falta `EXPO_PUBLIC_API_URL` | `ConfigError`; el modo local sigue funcionando. |
| `DATA_MODE='local'` | `refreshCatalogs` no hace peticiones; `ContentSyncProvider` no sincroniza; la pantalla de unirse a clase está bloqueada (`JoinClassScreen.tsx:30`). |
| Actualización del contenido empaquetado | `syncContentIfChanged` reescribe el contenido base y pone `applied_hash = NULL` en `remote_lessons` del catálogo `base`; el remoto ya validado se reaplica en el siguiente arranque (`seed.ts:513-530`). |
| Clase con mismo `version` y `hash` | No se descarga el release (`classSync.ts:50-57`). |
| Clase con release incoherente con la vista previa | Se rechaza (`classSync.ts:59-66`). |
| Fallo al actualizar una clase | Se conserva su caché anterior; las demás clases siguen (`classSync.ts:22-30`). |
| Salir de una clase | Se borra la membresía local; **la caché de la clase se conserva** pero deja de mostrarse (`useClasses.tsx:40-50`). |
| Unirse a una clase | Se guarda la membresía y se intenta descargar el release; si falla, la membresía queda y el contenido se sincroniza después (`useJoinClass.ts:67-89`). |

---

## 9. Contenido base local vs. contrato remoto

El contenido empaquetado usa las mismas entidades, pero con algunas diferencias
que el CMS no debe imitar:

| Aspecto | Base local | Contrato remoto |
|---|---|---|
| Unidades | `seed.ts` → `units` | Se repiten dentro de cada lección (`unit`). |
| Texto largo | `richContent.ts` separado de la lección | Viaja en `lesson.content`. |
| `catalog_id` | Default `base` | `payload.catalogId` explícito. |
| `id` de pregunta | Opcional; se autogenera `evX-qN` o `evX-bank-qN` | **Obligatorio** en `question.id`. |
| Evaluación | `EvaluationSeed` con `questions[]` anidados; sin counts | `evaluation` separada de `questions[]`; `questionCount` y `exerciseCount` obligatorios. |
| Ejemplos | `unit1Examples` y `example` embebido en ejercicios | Igual, pero `examples[]` es opcional y los embebidos van en `exercises[].example`. |
| Extras de clase | No existen | Solo remotos, en `class_extras_cache`. |
| Hash | `CONTENT_HASH` interno del bundle | Hash por manifest y por lección, con comparación estricta. |

Archivos locales relevantes:

- `src/shared/services/db/seed.ts` → `units`, `unitOneLessons`,
  `simpleLessons`, `writeContentSync`, `applyLessonPayload`.
- `src/shared/services/content/unit1.content.ts` → `unit1Examples`,
  `unit1Exercises`, `unit1Evaluations`.
- `src/shared/services/content/richContent.ts` → bloques de `lesson.content`.
- `src/shared/services/content/banks/lesson1.2.bank.ts` y
  `lesson1.2.questions.ts`.
- `docs/contenido/como-agregar-contenido.md` → guía existente para la ruta
  local.

---

## 10. Limitaciones actuales que el CMS debe respetar

1. **Solo se sincroniza el catálogo `base`.** No hay selección de curso ni
   descarga de otros catálogos desde la app. `/catalogs/base/...` es la ruta
   real.
2. **No hay entidad “curso” en SQLite.** El curso solo existe como `catalog_id`
   y como fila en `remote_catalogs`; su `title` no se renderiza.
3. **No hay endpoint de unidades.** Cada lección debe repetir su unidad. La
   última lección aplicada gana si hay datos contradictorios.
4. **Los ids son globales.** Un id no puede repetirse entre lecciones del mismo
   catálogo ni coincidir con ids de otro catálogo. MLO compara contra el área de
   espera y contra otros catálogos (`remoteContent.ts:172-201`,
   `:280-288`).
5. **Para reemplazar el contenido base hay que usar los ids existentes**
   (`u1`, `l1.2`, `ev1.2`, `ord1.2`, etc.). Si se usan ids prefijados como
   `base-l1.2`, MLO crea una lección nueva en lugar de actualizar `l1.2`.
6. **El payload de lección es un snapshot completo.** No hay actualizaciones
   parciales: si un ejercicio, ejemplo o pregunta no viene, se elimina.
7. **`lesson.content` es obligatorio** y debe existir aunque sea `[]`.
8. **No hay bloques de imagen.** Un `type` desconocido descarta la lección
   completa.
9. **Una evaluación con preguntas debe tener al menos una pregunta.** Una
   lección con evaluación no puede publicar `questions: []`.
10. **Una pregunta sin evaluación se rechaza.** Una lección sin evaluación debe
    llevar `questions: []` y `evaluation: null`.
11. **`questionCount` y `exerciseCount` deben ser enteros positivos**, incluso si
    el banco real es más pequeño. Son cupos, no tamaños exactos.
12. **El `id` de pregunta es obligatorio en remoto**, aunque el seed local lo
    permita opcional.
13. **`mcq` no es un tipo de ejercicio.** Solo es un tipo de pregunta.
14. **No se valida el `config` de los ejemplos independientes ni de los extras
    de clase** contra su tipo. El CMS debe enviarlo correcto por su cuenta.
15. **Los ejemplos independientes necesitan al menos un paso** con `text` y
    `why` no vacíos.
16. **`fill` exige `{{...}}` en cada oración**; el banco puede contener
    distractores, pero las respuestas se extraen del texto.
17. **`match` exige al menos 2 pares y no permite repetir `left` ni `right`.**
18. **`crossword` solo admite palabras `A-ZÑ`, sin acentos**, y debe caber en la
    cuadrícula sin cruces contradictorios.
19. **El orden de las preguntas guardado no es el orden visible.** La
    evaluación baraja todo al mostrar.
20. **Las preguntas y ejercicios por encima de los cupos pueden no mostrarse
    nunca.**
21. **Las clases no pueden crear lecciones, unidades, evaluaciones ni
    preguntas.** `class_extras_cache.lesson_id` tiene FK a `lessons`; si la
    lección no existe, el release falla al guardar.
22. **Las clases solo agregan contenido** (`lesson`, `exercise`, `example`); no
    reemplazan el contenido base.
23. **Un extra de clase con `blocks: []` se acepta pero no se muestra.** Un
    extra de ejercicio `fill`/`match`/`crossword` con configuración inválida
    también se acepta y puede renderizarse vacío.
24. **El `code` de la lección dentro del release de clase no se guarda ni se
    verifica** contra la lección real.
25. **Los `extra.id` se deduplican entre clases.** Si dos clases publican el
    mismo `id` con contenidos distintos, gana el de la clase publicada más
    recientemente según `class_cache.published_at`.
26. **Despublicar una clase (`published: null`) no limpia la caché local.**
    `refreshClassRelease` retorna sin borrar `class_extras_cache`; si la clase
    ya tenía un release, el alumno puede seguir viendo el contenido anterior
    (`classSync.ts:46-48`).
27. **La versión de una clase no se exige monotónica.** A diferencia del
    catálogo, un release con versión menor puede sobrescribir la caché de la
    clase.
28. **El `hash` de una lección no se recalcula.** El CMS debe asegurarse de que
    el hash publicado coincida exactamente con el del manifest; MLO solo compara
    strings.
29. **`publishedAt` no se valida como ISO-8601**, solo como string.
30. **`codeSample`, `contextTitle` y `contextBody` se guardan pero la UI actual
    no los muestra.** El contenido visible sale de `content`, `body` y
    `synthesis`.
31. **No hay sincronización de progreso, cuentas remotas ni resultados hacia el
    panel.** El progreso es local.
32. **Un fallo en una lección bloquea todo el lote del manifiesto**, porque MLO
    valida todas antes de escribir.
33. **El área de espera solo se aplica al arrancar** (o al llamar explícitamente
    `applyStagedContent`). Una descarga en segundo plano no cambia la pantalla
    en caliente.
34. **La caché de una clase sí se aplica al momento de unirse o refrescar**, no
    requiere reinicio.
35. **No se puede confiar en `unitId` del manifest** para validar la unidad: MLO
    no compara ese campo con `payload.unit.id`.
36. **El código de clase se normaliza a mayúsculas y sin espacios**, y la
    pantalla de unión exige 6 caracteres; el servidor debe usar ese formato
    canónico.

---

## 11. Referencias exactas

| Función / archivo | Qué hace |
|---|---|
| `src/shared/services/content/remote/validateLessonPayload.ts:337` | `validateLessonPayload`: valida el payload completo de una lección. |
| `.../validateLessonPayload.ts:102` | `parseContentBlocks`: valida `p`, `h`, `bullets`, `numbers`, `table`. |
| `.../validateLessonPayload.ts:139` | `validateOrder`. |
| `.../validateLessonPayload.ts:148` | `validateFill`. |
| `.../validateLessonPayload.ts:166` | `validateMatch`. |
| `.../validateLessonPayload.ts:184` | `validateCrossword`. |
| `.../validateLessonPayload.ts:223` | `validateMcq`. |
| `.../validateLessonPayload.ts:239` | `validateQuestionRules`. |
| `.../validateLessonPayload.ts:263` | `validateExercise`. |
| `.../validateLessonPayload.ts:279` | `validateExample`. |
| `src/shared/utils/validate.ts:74` | `parseExampleSeed`. |
| `.../validate.ts:100` | `parseQuestionSeed`. |
| `.../validate.ts:124` | `parseExerciseSeed`. |
| `src/shared/services/content/remoteContent.ts:42` | `parseCatalogManifest`. |
| `.../remoteContent.ts:236` | `refreshCatalog`: hash, versión, descarga y área de espera. |
| `.../remoteContent.ts:339` | `catalogsInUse`: solo `base`. |
| `src/shared/services/content/remote/applyStagedContent.ts:21` | `applyStagedContent`: aplica pendientes sin red. |
| `.../applyStagedContent.ts:70` | `archiveMissingLessons`: archiva lecciones, evaluaciones y unidades retiradas. |
| `src/shared/services/db/seed.ts:567` | `applyLessonPayload`: persistencia transaccional. |
| `src/shared/services/db/seed.ts:513` | `syncContentIfChanged`: reaplica el remoto base tras cambiar el bundle. |
| `src/shared/services/db/schema.ts` | DDL de todas las tablas. |
| `src/shared/services/content/remote/validateClassRelease.ts:65` | `parseClassPreview`. |
| `.../validateClassRelease.ts:153` | `parseClassRelease`. |
| `.../validateClassRelease.ts:97` | `parseLessonExtra`. |
| `src/features/classes/model/classRepository.ts:153` | `storeClassRelease`. |
| `.../classRepository.ts:228` | `selectExtrasByLesson`: deduplicación por `extra.id`. |
| `.../classRepository.ts:294` | `extraToLesson`, `extraToExercise`, `extraToExample`. |
| `src/features/modules/model/lessonRepository.ts:75` | `selectUnits`, `selectLessons`, `selectLesson`. |
| `src/features/exercises/model/exerciseRepository.ts:48` | `selectExercisesByLesson`, `selectPracticeExercisesByLesson`. |
| `src/features/examples/model/exampleRepository.ts:69` | `selectExamplesByLesson`, `selectExamplesWithExtras`. |
| `src/features/evaluations/model/evaluationRepository.ts:84` | `selectEvaluationByLesson`, `selectQuestions`. |
| `src/features/exercises/viewmodel/exercise.logic.ts` | Corrección y puntaje de `order`, `fill`, `match`, `crossword`. |
| `src/features/evaluations/viewmodel/evaluation.logic.ts:41` | `isAnswerCorrect` y armado del pool de evaluación. |
| `src/features/modules/view/RichContent.tsx:8` | Render de bloques. |
| `src/features/modules/view/LessonScreen.tsx:24` | Render de lección y extras de clase. |
| `src/features/exercises/view/activities/ActivityView.tsx:32` | Render de ejercicios. |
| `src/features/evaluations/view/EvaluationFlow.tsx:66` | Render de evaluación. |
| `src/shared/services/http/client.ts:53` | Timeout y reintentos. |
| `src/shared/services/content/ContentSyncProvider.tsx:16` | Sincronización en segundo plano y throttle de 15 min. |
| `src/shared/services/content/remote/__fixtures__/panelRelease.json` | Release real completo del panel (25 lecciones, `catalogId: "base"`). |
| `src/shared/services/content/remote/__fixtures__/panelClassRelease.json` | Release real de una clase. |
| `src/shared/services/content/__tests__/remoteContent.test.ts` | Pruebas del contrato de curso. |
| `src/shared/services/content/remote/__tests__/validateClassRelease.test.ts` | Pruebas del contrato de clase. |
| `src/shared/services/content/remote/__tests__/applyLessonPayload.test.ts` | Pruebas de persistencia. |
| `src/shared/services/content/remote/__tests__/panelRelease.test.ts` | Valida el fixture real del panel. |
| `src/shared/services/content/remote/__tests__/panelClassRelease.test.ts` | Valida el fixture real de clase. |

---

**Alcance del análisis:** el informe es estático, sobre el código y los
fixtures del repositorio; no se ejecutaron la app ni los tests. **Riesgo
principal:** el CMS puede producir JSON sintácticamente válido que MLO rechace
por reglas de ids, hash, conteos de evaluación o configuración de crucigramas;
conviene validar contra `panelRelease.json` y `panelClassRelease.json` antes de
publicar.
