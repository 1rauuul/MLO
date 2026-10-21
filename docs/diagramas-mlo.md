# Diagramas de MLO — guía explicativa

Este documento explica **qué muestra cada diagrama, cómo leerlo y de dónde sale cada dato** del código. Todos los diagramas son archivos HTML autocontenidos (SVG en línea + CSS) y se abren directo en el navegador.

- Proyecto: **MLO — Introducción a la Ingeniería de Software**
- Stack: Expo SDK 57 + Expo Router + `expo-sqlite` + TypeScript estricto
- Base de datos: SQLite local `mlo.db` (offline-first, **cero red**)
- Skin de los diagramas: por defecto del skill *diagram-design* (papel `#f5f5f5`, tinta `#2d3142`, acento `#bf4520`)

---

## 0. Inventario de archivos

| Archivo | Tipo de diagrama | Lienzo | Qué representa |
|---|---|---|---|
| `docs/arquitectura-mlo.html` | Arquitectura (capas) | 1280×720 | Capas MVVM, providers, datos y store offline |
| `docs/er-mlo.html` | Entidad-relación (conceptual) | 1280×720 | 8 entidades del dominio y sus cardinalidades |
| `docs/esquema-bd-mlo.html` | Esquema físico #1 | 1280×720 | Contenido: `units`, `lessons`, `examples`, `exercises`, `evaluations` |
| `docs/esquema-bd-cuenta-mlo.html` | Esquema físico #2 | 1280×720 | Identidad: `accounts`, `auth_session`, `learner_profile`, `last_location` |
| `docs/esquema-bd-progreso-mlo.html` | Esquema físico #3 | 1280×720 | Actividad: `accounts`, `module_progress`, `attempts`, `evaluation_results` |

Para verlos: abre cualquier `.html` con doble clic. En pantallas angostas el SVG conserva su ancho legible (1280px) dentro de un contenedor con scroll horizontal; al imprimir se escala para caber.

---

## 1. Diagrama de arquitectura (`arquitectura-mlo.html`)

### 1.1 Propósito

Responder: **¿qué capa puede importar a cuál, y cómo llega un dato desde la pantalla hasta el disco?** La regla dura del proyecto es que la vista **nunca** importa repositorios ni `expo-sqlite`; solo consume hooks.

### 1.2 Cómo leerlo

Se lee **de arriba hacia abajo** (presentación → viewmodel → datos → store). Las tres bandas grises son *zonas* (capas); las cajas blancas son unidades; las flechas son dependencias/llamadas.

### 1.3 Zonas y nodos

| Zona | Nodo | Etiqueta técnica | Qué contiene en el código |
|---|---|---|---|
| **PRESENTACIÓN** | `Pantallas & rutas` | `src/app · Expo Router · guards` | Rutas delgadas (`export { default } from '@/features/…/view/…Screen'`), `_layout.tsx`, guards de sesión (`Stack.Protected`) |
| | `Componentes RN` | `src/components · tema · AppText` | Componentes reutilizables (`AppText`, `Buttons`, `Screen`, `QuizOption`, `RichContent`, `EvaluationFlow`…), tema y tokens |
| **VIEWMODEL** | `Providers` | `Auth · Session · LearnerProfile` | `useAuth.tsx`, `useSession.tsx`, `useLearnerProfile.tsx` (contextos React) |
| | `Hooks de negocio` | `useLessonContent · usePracticeEngine · useQuizEngine …` | Hooks de `src/viewmodels`: `useLessonContent`, `usePracticeEngine`, `useQuizEngine`, `useExamplesEngine`, `useModuleProgress`, `useCatalog`, `useEvaluationsCatalog`, `useRecentResults`, `useLessonHub` |
| | `Lógica pura` | `*Logic.ts · tests unitarios` | `auth.logic.ts`, `exercise.logic.ts`, `evaluation.logic.ts`, `example.logic.ts`, `cha.logic.ts`, `analytics.logic.ts` |
| **DATOS** | `Repositorios` | `src/data/repositories · async` | `lessonRepository`, `exerciseRepository`, `exampleRepository`, `evaluationRepository`, `progressRepository`, `profileRepository`, `accountRepository`, `attemptRepository`, `locationRepository` |
| | `Modelos & esquema` | `src/models · entities · schema DDL` | `entities.ts` (tipos), `schema.ts` (`SCHEMA_DDL`, índices, `DATABASE_VERSION`), `metadata.ts` |
| | `Seed & contenido` | `src/data · unit1Content · banks` | `seed.ts` (`migrateAndSeed`, `seedDatabase`), `unit1Content.ts`, `richContent.ts`, `banks/` |
| **STORE (focal)** | `expo-sqlite` | `mlo.db · PRAGMA foreign_keys · migrate + seed` | Base local abierta por `SQLiteProvider` en `src/app/_layout.tsx` |

### 1.4 Aristas (dependencias)

1. **Pantallas → Hooks**: las pantallas consumen hooks de negocio.
2. **Componentes → Hooks**: los componentes también consumen hooks (p. ej. `usePracticeEngine`).
3. **Providers → Hooks**: los contextos de sesión/perfil alimentan a los hooks (etiqueta `CONTEXTO`).
4. **Lógica pura → Hooks**: los hooks delegan el cálculo testeable en `*Logic.ts`.
5. **Hooks → Repositorios**: los hooks piden datos a los repositorios (etiqueta `SQL-REPO`).
6. **Modelos → Repositorios**: el DDL/tipos definen qué columnas consultan los repositorios.
7. **Seed → expo-sqlite** (punteada, `SEED`): la inicialización carga contenido en la base.
8. **Repositorios → expo-sqlite** (acento, `LEE/ESC.`): es el flujo de datos real; por eso es el elemento focal.

### 1.5 Decisiones de diseño

- **Una sola zona focal** (el store) + una sola flecha de acento: la regla del skill es 1–2 acentos, no un semáforo.
- **Providers existe como nodo propio** porque `_layout.tsx` anida `SQLiteProvider → AuthProvider → SessionProvider → LearnerProfileProvider`, y ese orden de anidamiento es la razón por la que los hooks ven la sesión y el perfil.
- **Seed se separa de Modelos**: el DDL define la forma; el seed la puebla. Son responsabilidades distintas aunque vivan cerca (`src/data`).
- **No se dibujó una llamada red**: el proyecto no tiene red; si apareciera `fetch`, sería un error de arquitectura, no un flujo del diagrama.

---

## 2. Modelo entidad-relación (`er-mlo.html`)

### 2.1 Propósito

Responder: **¿cuáles son las “cosas” del dominio y cómo se relacionan?** Este diagrama es **conceptual** (entidades y cardinalidad), no físico: las líneas unen *cajas*, no columnas.

### 2.2 Cómo leerlo

Hay dos clústeres y un puente:

- **Clúster de identidad y analítica** (izquierda): `Cuenta` (focal, raíz), `Perfil & sesión`, `Intento`.
- **Clúster de contenido** (derecha): `Unidad`, `Lección`, `Actividad`, `Evaluación`.
- **Puente** (centro): `Progreso`, que asocia **Cuenta × Lección** (N:M).

Cada caja lleva `ENTIDAD`, el nombre y sus campos. `#` = llave primaria, `→` = foránea. La cardinalidad aparece en los extremos (`1`, `N`) y algunas relaciones llevan verbo (`CONFIGURA`, `AVANZA EN`, `PERTENECE A`).

### 2.3 Entidades (8)

| Entidad | Tablas físicas que agrupa | Campos mostrados |
|---|---|---|
| **Cuenta** | `accounts` | `# id`, `username · UNIQUE`, `display_name`, `password_hash · PBKDF2`, `salt · created_at` |
| **Perfil & sesión** | `learner_profile` + `auth_session` + `last_location` | `→ account_id · 1:1 UNIQUE`, `learning_style · CHAEA`, `dark_mode · large_text`, `auth_session (id=1)`, `last_location · section` |
| **Intento** | `attempts` | `# id`, `→ account_id · N:1`, `source · practice|evaluation`, `item_id · item_type · correct` |
| **Progreso** | `module_progress` | `→ account_id · → lesson_id` (PK compuesta), `completed · 0/1`, `updated_at` |
| **Unidad** | `units` | `# id`, `number`, `title · description`, `difficulty · color` |
| **Lección** | `lessons` | `# id`, `→ unit_id`, `code · title`, `eyebrow · body`, `content · synthesis · position` |
| **Actividad** | `examples` + `exercises` | `# id`, `→ lesson_id`, `type · order|match|fill|crossword`, `prompt · instructions`, `config · steps/hints · explanation` |
| **Evaluación** | `evaluations` + `questions` + `evaluation_results` | `# id`, `→ lesson_id`, `questions: order_index · type · answer`, `results: score · correct/total` |

### 2.4 Relaciones y cardinalidad

| # | Relación | Cardinalidad | Significado |
|---|---|---|---|
| R1 | Cuenta — Perfil & sesión | **1 : 1** | Una cuenta tiene un perfil y una ubicación (`UNIQUE account_id`) |
| R2 | Cuenta — Intento | **1 : N** | Una cuenta acumula muchos intentos |
| R3 | Cuenta — Progreso | **1 : N** | Una cuenta tiene una fila de progreso por lección |
| R4 | Progreso — Lección | **N : 1** | Cada fila de progreso pertenece a una lección |
| R5 | Unidad — Lección | **1 : N** | Una unidad agrupa muchas lecciones |
| R6 | Lección — Actividad | **1 : N** | Una lección contiene ejemplos/ejercicios |
| R7 | Lección — Evaluación | **1 : N** | Una lección puede tener evaluación(es) |

> **Relación colapsada no dibujada:** `evaluation_results` también apunta a `accounts`, pero como se fusionó dentro de **Evaluación**, ese vínculo Cuenta→Evaluación queda implícito. Se indica aquí para no dar una imagen falsa del modelo.

### 2.5 Colapsos de fidelidad (E/R)

El tipo E/R tiene un presupuesto de **máximo 8 entidades**; el esquema físico tiene 13 tablas. Los colapsos aplicados:

| Tablas originales | Entidad E/R | Motivo |
|---|---|---|
| `learner_profile`, `auth_session`, `last_location` | **Perfil & sesión** | Las tres son 1:1 con la cuenta; conceptualmente son “el estado del aprendiz” |
| `examples`, `exercises` | **Actividad** | Ambas son actividades de una lección y comparten forma (`lesson_id`, `type`, `config`) |
| `evaluations`, `questions`, `evaluation_results` | **Evaluación** | Evaluación con sus preguntas y sus resultados |
| `attempts` | **Intento** | Se mantiene separada: es la bitácora real (práctica **y** evaluación) |

`units`, `lessons`, `accounts`, `module_progress` se mantienen 1:1 con su tabla.

---

## 3. Esquemas físicos (3 lienzos)

### 3.1 Por qué hay tres

El tipo *database schema* tiene un presupuesto de **máximo 5 tablas y 6 FK por diagrama**, porque un lienzo con 13 tablas deja de ser un esquema legible y se vuelve un volcado de `\d+`. Por eso se dividió en **tres subsistemas** y se dijo explícitamente qué queda fuera de cada lienzo. Juntos cubren **12 de las 13 tablas**; `questions` se menciona como hija de `evaluations` (no dibujada).

En los tres, cada tabla muestra: `TABLA` + nombre, columnas con su **tipo SQL**, **chips** (`PK`, `FK`, `NN`, `UQ`), filas de **desbordamiento** (`+ N columnas`) e **índices** relevantes. Cada FK une **la fila de la columna** con la fila de la columna referenciada (no caja-con-caja), y lleva su acción `CASCADE`.

### 3.2 Subsistema 1 — Contenido (`esquema-bd-mlo.html`)

**Tablas:** `units`, `lessons`, `examples`, `exercises`, `evaluations` (5).
**Forma:** `units 1—N lessons 1—N {examples, exercises, evaluations}`.

| Tabla | Columnas clave | FK |
|---|---|---|
| `units` | `id` PK · `number` · `title` · `description` · `difficulty` · `color` | — |
| `lessons` | `id` PK · `unit_id` · `code` · `title` · `eyebrow` · `body` · `code_sample` · `content` · `synthesis` · `context_*` · `position` | `unit_id → units.id` |
| `examples` | `id` PK · `lesson_id` · `type` · `title` · `prompt` · `config` · `steps` · `hints` · `explanation` | `lesson_id → lessons.id` |
| `exercises` | `id` PK · `lesson_id` · `type` · `prompt` · `instructions` · `correct_order` · `config` · `explanation` | `lesson_id → lessons.id` |
| `evaluations` | `id` PK · `lesson_id` · `title` · `description` | `lesson_id → lessons.id` |

- Índice visible: `idx_lessons_unit (unit_id)`.
- **Foco:** la FK `lessons → examples` (en acento) y la cabecera de `lessons` con tinte, porque `lessons` es la tabla a la que **cascada** toda la jerarquía.
- **Fuera de lienzo:** `questions` (hija `1:N` de `evaluations`).

### 3.3 Subsistema 2 — Identidad y personalización (`esquema-bd-cuenta-mlo.html`)

**Tablas:** `accounts`, `auth_session`, `learner_profile`, `last_location` (4).
**Forma:** tres relaciones **1:1** desde `accounts`.

| Tabla | Columnas clave | FK |
|---|---|---|
| `accounts` | `id` PK · `username` UQ · `display_name` · `password_hash` · `salt` · `created_at` | — |
| `auth_session` | `id` PK (`CHECK id = 1`) · `account_id` | `account_id → accounts.id` |
| `learner_profile` | `id` PK · `account_id` UQ · `learning_style` · `dark_mode` · `large_text` | `account_id → accounts.id` |
| `last_location` | `account_id` PK · `unit_id` · `lesson_id` · `lesson_code` · `section` · `updated_at` | `account_id → accounts.id` |

- Las **tres** foráneas comparten la PK de `accounts`; por eso se dibujan como un abanico de tres puertos distintos sobre la fila `id` (regla de puertos del skill).
- `auth_session` es una tabla singleton: `CHECK (id = 1)` garantiza una sola sesión persistida.
- `last_location` usa `account_id` como PK: es 1:1 por diseño (retomar donde se dejó).
- **Fuera de lienzo:** `module_progress` (va en el subsistema 3).

### 3.4 Subsistema 3 — Progreso y actividad (`esquema-bd-progreso-mlo.html`)

**Tablas:** `accounts`, `module_progress`, `attempts`, `evaluation_results` (4).
**Forma:** todas cuelgan de `accounts`; dos referencias externas anotadas.

| Tabla | Columnas clave | FK |
|---|---|---|
| `accounts` | (ancla, igual que arriba) | — |
| `module_progress` | `account_id` PK/FK · `lesson_id` PK/FK · `completed` · `updated_at` | `account_id → accounts.id`; `lesson_id → lessons.id` (externo) |
| `attempts` | `id` PK · `account_id` · `source` · `item_id` · `item_type` · `lesson_id` · `correct` · `created_at` | `account_id → accounts.id` |
| `evaluation_results` | `id` PK · `account_id` · `evaluation_id` · `score` · `correct_count` · `total_count` · `created_at` | `account_id → accounts.id`; `evaluation_id → evaluations.id` (externo) |

- **Clave compuesta:** `module_progress PRIMARY KEY (account_id, lesson_id)` — un registro por cuenta y lección.
- `attempts.lesson_id` es **TEXT sin FK declarada** (por eso no hay línea): se conserva como dato histórico, no como integridad referencial.
- Referencias externas (`lessons`, `evaluations`) se anotan en la columna porque esas tablas viven en los otros lienzos; dibujarlas aquí obligaría a duplicar tablas y a gastar presupuesto.
- Índices visibles: `idx_attempts_account_lesson`, `idx_eval_results_account`, `idx_progress_account` (mencionado).

### 3.5 Inventario completo de las 13 tablas

| # | Tabla | PK | FK (cascada) | Aparece en |
|---|---|---|---|---|
| 1 | `accounts` | `id` | — | esquemas 2 y 3 |
| 2 | `auth_session` | `id` (CHECK =1) | `account_id → accounts` | esquema 2 |
| 3 | `units` | `id` | — | esquema 1 |
| 4 | `lessons` | `id` | `unit_id → units` | esquema 1 |
| 5 | `examples` | `id` | `lesson_id → lessons` | esquema 1 |
| 6 | `exercises` | `id` | `lesson_id → lessons` | esquema 1 |
| 7 | `evaluations` | `id` | `lesson_id → lessons` | esquema 1 |
| 8 | `questions` | `id` | `evaluation_id → evaluations` | *no dibujada (nota)* |
| 9 | `attempts` | `id` | `account_id → accounts` | esquema 3 |
| 10 | `evaluation_results` | `id` | `account_id → accounts`, `evaluation_id → evaluations` | esquema 3 |
| 11 | `learner_profile` | `id` | `account_id → accounts` (UNIQUE) | esquema 2 |
| 12 | `module_progress` | `(account_id, lesson_id)` | `account_id → accounts`, `lesson_id → lessons` | esquema 3 |
| 13 | `last_location` | `account_id` | `account_id → accounts` | esquema 2 |

### 3.6 Índices declarados en el DDL

```
idx_lessons_unit           lessons(unit_id)
idx_examples_lesson        examples(lesson_id)
idx_exercises_lesson       exercises(lesson_id)
idx_evaluations_lesson     evaluations(lesson_id)
idx_questions_evaluation   questions(evaluation_id)
idx_progress_account       module_progress(account_id)
idx_eval_results_account   evaluation_results(account_id)
idx_attempts_account_lesson attempts(account_id, lesson_id)
idx_attempts_account_type   attempts(account_id, item_type)
```

### 3.7 Integridad referencial

- `migrateAndSeed` activa `PRAGMA foreign_keys = ON` **sobre la conexión del `SQLiteProvider`**. El pragma es por conexión: una segunda conexión sin reactivarlo **no** haría cumplir las cascadas (esto ya está documentado en `AGENTS.md`).
- Todas las FK del esquema declaran `ON DELETE CASCADE`: borrar una unidad borra sus lecciones, y con ellas ejemplos, ejercicios, evaluaciones (y sus preguntas).
- `auth_session.id = 1` y `last_location.account_id` como PK refuerzan las relaciones 1:1.

### 3.8 Seguridad y credenciales

- `accounts` guarda `password_hash` y `salt`; el hash se deriva con **PBKDF2-HMAC-SHA256** (`src/viewmodels/auth.logic.ts`).
- Las cuentas con hash legacy SHA-256 se re-hashean de forma transparente al iniciar sesión.
- Los diagramas **no** exponen valores de credenciales; solo nombres de columna y tipos.

---

## 4. Correspondencia código ↔ diagrama

| Nivel del diagrama | Archivo(s) reales |
|---|---|
| Presentación / View | `src/app/**`, `src/components/**`, `src/theme/**` |
| Providers | `src/viewmodels/useAuth.tsx`, `useSession.tsx`, `useLearnerProfile.tsx`, `src/app/_layout.tsx` |
| Hooks (ViewModel) | `src/viewmodels/use*.ts(x)` |
| Lógica pura | `src/viewmodels/*Logic.ts` |
| Repositorios | `src/data/repositories/*Repository.ts` |
| Modelos / DDL | `src/models/entities.ts`, `src/models/schema.ts` |
| Seed / contenido | `src/data/db.ts` (`migrateAndSeed`), `src/data/seed.ts`, `src/data/unit1Content.ts`, `src/data/richContent.ts`, `src/data/banks/**` |
| Store | `expo-sqlite` · `DATABASE_NAME = 'mlo.db'` |

---

## 5. Límites asumidos y fidelidad

| Diagrama | Presupuesto del tipo | Usado | Recortes / notas |
|---|---|---|---|
| Arquitectura | 9 nodos · 12 flechas · 2 acentos | 9 nodos · 8 flechas · 2 acentos | `seed` y `modelos` separados; no se dibuja red (no existe) |
| E/R | 8 entidades · 12 relaciones | 8 entidades · 7 relaciones | 13 tablas → 8 entidades (colapsos en §2.5); Cuenta→Evaluación implícita |
| Schema contenido | 5 tablas · 6 FK | 5 tablas · 4 FK | `questions` fuera de lienzo |
| Schema identidad | 5 tablas · 6 FK | 4 tablas · 3 FK | `module_progress` va en el 3 |
| Schema actividad | 5 tablas · 6 FK | 4 tablas · 3 FK | `lessons`/`evaluations` como FK externas anotadas |

**Nota sobre el alcance de los esquemas físicos:** no son un volcado completo del `CREATE TABLE`; muestran las columnas que cuentan la historia (con filas `+ N columnas` para el resto) y solo los índices relevantes, tal como exige el tipo. El DDL completo y autoritativo está en `src/models/schema.ts`.

---

## 6. Exportar a PNG / SVG

Los diagramas se generan como HTML (fuente de verdad). Si se necesitan PNG/SVG para una entrega, se pueden producir desde el HTML con el helper del skill:

```bash
python3 ~/.config/opencode/skills/diagram-design/scripts/export_svg.py docs/arquitectura-mlo.html
```

El SVG exportado conserva el diagrama (no las tarjetas/encabezado editoriales). No se generaron exportes automáticamente porque no se pidieron.

---

## 7. Verificación

Los cinco HTML pasan el *self-check* del skill (contrato SVG accesible: `role="img"`, `aria-labelledby` resolviendo `title`/`desc` primero-hijo, IDs únicos por slug, archivo autocontenido):

```
OK docs/arquitectura-mlo.html
OK docs/er-mlo.html
OK docs/esquema-bd-mlo.html
OK docs/esquema-bd-cuenta-mlo.html
OK docs/esquema-bd-progreso-mlo.html
```

El chequeo automático cubre accesibilidad y seguridad de archivo único; las reglas de conectores (ortogonalidad, puertos, máscaras) se aplicaron a mano, y los detalles visuales conviene revisarlos abriendo cada archivo.
