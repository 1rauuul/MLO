# Contrato de API v2 — contenido publicado con maestros, cursos y clases

Revisión 2.2 (2026-10-27): las clases reemplazan a los grupos. Cada clase publica
su propio snapshot de contenido extra y el alumno puede pertenecer a varias; el
contenido se combina localmente sobre el curso base. El `schemaVersion` sigue
siendo `2`.

Solo contenido. La sincronización de progreso, las cuentas remotas y la lectura
de resultados por el maestro siguen fuera de alcance. SQLite es la fuente de
verdad local y con `DATA_MODE=local` (por defecto) no se hace ninguna petición.

- **URL base:** `EXPO_PUBLIC_API_URL = https://<host>/api/mlo/v2` (sin secretos).
- **Formato:** JSON UTF-8; fechas ISO-8601.
- **Errores:** `{ "error": string, "message": string }`.
- **`schemaVersion`:** debe ser `2`; cualquier otro valor se descarta.

## Clases

El código es de 6 caracteres en mayúsculas; el cliente acepta minúsculas y
espacios pero envía la forma canónica. Las clases no cambian el catálogo: el
alumno siempre estudia el curso base y recibe, además, el contenido extra de sus
clases.

### GET /classes/{code}

Vista previa antes de unirse. Sin caché.

```json
{
  "schemaVersion": 2,
  "class": { "id": "c1", "name": "Grupo A", "teacherName": "Profesora Ríos" },
  "published": { "version": 2, "hash": "…", "publishedAt": "2026-10-27T00:00:00.000Z" }
}
```

`published` es `null` si la clase todavía no tiene contenido publicado. `404` si
el código no existe.

### POST /classes/{code}/join

```json
{ "studentKey": "11111111-1111-4111-8111-111111111111", "studentName": "Ana Alumna" }
```

Devuelve la misma vista previa y `"joined": true`. El `studentKey` es el UUID
estable de la cuenta local; debe viajar en el respaldo para restaurar la misma
identidad. La operación es idempotente.

### DELETE /classes/{code}/members/{studentKey}

Elimina la membresía. Responde `204`. El cliente borra la clase de su lista y
deja de mostrar su contenido extra, pero conserva la caché por si vuelve.

### GET /classes/{code}/release

Último snapshot inmutable de la clase. `404` si no hay nada publicado.

```json
{
  "schemaVersion": 2,
  "class": { "id": "c1", "name": "Grupo A", "teacherName": "Profesora Ríos" },
  "version": 2,
  "hash": "…",
  "publishedAt": "2026-10-27T00:00:00.000Z",
  "lessons": [
    {
      "lessonId": "l1.2",
      "code": "1.2",
      "extras": [
        {
          "id": "x-lesson",
          "type": "lesson",
          "content": { "title": "Contexto de clase", "blocks": [{ "type": "p", "text": "…" }] }
        },
        {
          "id": "x-exercise",
          "type": "exercise",
          "content": {
            "type": "order", "prompt": "Ordena", "instructions": "",
            "correctOrder": ["uno", "dos"], "config": {}, "explanation": ""
          }
        },
        {
          "id": "x-example",
          "type": "example",
          "content": {
            "type": "match", "title": "Ejemplo", "prompt": "Relaciona",
            "config": { "pairs": [{ "left": "a", "right": "1" }, { "left": "b", "right": "2" }] },
            "steps": [{ "text": "Paso", "why": "Porque sí" }], "hints": [], "explanation": ""
          }
        }
      ]
    }
  ]
}
```

`lessonId` es el id publicado del curso base (`l1.2`); el snapshot solo lleva
contenido extra, nunca el curso completo. Los `extras` de tipo `lesson` son
bloques que se muestran debajo del contenido base; `exercise` y `example` se
suman a la práctica y a los ejemplos. El mismo `id` puede aparecer en el release
de varias clases: el cliente lo muestra una vez y junta las etiquetas.

## GET /catalogs/{catalogId}/manifest

```json
{
  "schemaVersion": 2,
  "catalogId": "k7f3q",
  "title": "Curso de prueba",
  "version": "3",
  "hash": "8f14e45f",
  "publishedAt": "2026-10-26T00:00:00.000Z",
  "lessons": [{ "lessonId": "k7f3q-l1.2", "unitId": "k7f3q-u1", "hash": "a1b2c3d4" }]
}
```

`version` es el entero incremental de `releases.version` serializado como texto;
el cliente también acepta un número y lo normaliza. `hash` no puede ir vacío,
`lessons` no puede ir vacío y no puede repetir `lessonId`.

## GET /catalogs/{catalogId}/lessons/{lessonId}

La respuesta es **siempre completa**: lo que no viene ya no existe en la
lección. `lessonId` y `evaluation.lessonId` deben coincidir; `question.id` es
obligatorio. Una lección puede ser **de solo lectura** (por ejemplo, 1.1): sin
ejercicios, sin evaluación y sin preguntas. Si publica evaluación, debe traer al
menos una pregunta. Todos los ids (unidad, lección, evaluación, ejercicios,
ejemplos y preguntas) son globales y no pueden coincidir con los de otro curso
ni con los de otra lección del mismo curso.

- `examples` solo contiene ejemplos **independientes**; los ejemplos de un
  ejercicio viajan en `exercises[].example`. Puede ser `[]`.
- El serializador debe enviar siempre los campos, aunque estén vacíos:
  `codeSample`, `contextTitle`, `contextBody`, `synthesis`, `correctOrder`,
  `options` y `answer`. El cliente normaliza los que falten.
- Preguntas `order`: `options` es la **secuencia correcta** y `answer` es `0`.
  En `fill`/`match`/`crossword`, `options` es `[]`, `answer` es `0` y la verdad
  está en `config`.
- No hay bloques de imagen: un bloque desconocido descarta la lección completa.

```json
{
  "schemaVersion": 2,
  "catalogId": "k7f3q",
  "lessonId": "k7f3q-l1.2",
  "hash": "…",
  "unit": { "id": "k7f3q-u1", "number": 1, "title": "…", "description": "…", "difficulty": "Fundamental", "color": "blue" },
  "lesson": {
    "id": "k7f3q-l1.2", "unitId": "k7f3q-u1", "code": "1.2", "title": "…",
    "eyebrow": "…", "body": "…", "codeSample": "", "contextTitle": "…",
    "contextBody": "…", "synthesis": ["…"],
    "content": [{ "type": "p", "text": "…" }], "position": 2
  },
  "evaluation": {
    "id": "k7f3q-ev1.2", "lessonId": "k7f3q-l1.2", "title": "…",
    "description": "…", "questionCount": 10, "exerciseCount": 5
  },
  "exercises": [],
  "examples": [],
  "questions": [{ "evaluationId": "k7f3q-ev1.2", "question": { "id": "k7f3q-q01", "type": "mcq", "…": "…" } }]
}
```

`evaluation` puede ser `null`.

## Reglas del cliente

1. Con `DATA_MODE=local` no se ejecuta ninguna petición; el arranque nunca
   espera a la red.
2. La descarga valida con `validateLessonPayload` y guarda en `remote_lessons`
   (área de espera). No escribe en las tablas de contenido.
3. Un fallo de validación descarta la lección y no avanza el `manifest_hash`.
   Un manifiesto vacío, con hash vacío, con lecciones repetidas o una misma
   versión con otro hash también se descartan.
4. La lección descargada debe traer el mismo `hash` que su entrada del manifest.
   Si no coincide, se descarta (protege contra una lección vieja en caché).
5. Los ids de una lección no pueden repetirse en otra lección del mismo curso;
   el cliente compara contra el área de espera y descarta el manifest si chocan.
6. Al arrancar, `applyStagedContent` aplica lo pendiente de forma local y
   devuelve las lecciones que fallaron. Las clases se sincronizan aparte: si una
   falla, se conserva su caché anterior.
7. Un `4xx` no se reintenta; la red y los `5xx` sí (backoff exponencial). Un
   `429` se muestra como límite de intentos y no altera las membresías.
8. Si falta `EXPO_PUBLIC_API_URL`, el cliente no hace peticiones relativas:
   falla con un error de configuración y el modo local sigue funcionando.
9. Una lección que deja de aparecer en el manifest se archiva (también en el
   curso base); no se borra para conservar `attempts`, `module_progress` y
   `evaluation_results`.
10. El respaldo v4 incluye `student.externalKey` y `classes`. Al importarlo se
    restauran la identidad y las membresías; los respaldos v1, v2 y v3 siguen
    aceptándose, pero no traen identidad ni clases. Si el UUID restaurado cambia,
    el cliente vuelve a unirse a sus clases con la identidad original y retira la
    identidad temporal del dispositivo. Eso evita que una reinstalación cree otro
    alumno en la lista del docente.
11. Un contenido asignado a varias clases aparece en el release de cada una al
    publicarla. El cliente deduplica por `extra.id`, junta los nombres de las
    clases y conserva la versión publicada más recientemente.
