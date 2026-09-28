# Diseño — Agente de aprendizaje por tema (Unidad 1)

> Fecha: 27 de septiembre de 2026.
> Estado: aprobado en conversación; pendiente revisión del spec escrito.
> Alcance: rediseño del flujo ① Lección → ② Ejemplo A/B → ③ Práctica → ④ Evaluación,
> aplicado a la Unidad 1 (1.1–1.4). Offline-first, sin red.

## 1. Objetivo

Reorganizar la experiencia de aprendizaje como un tutorial guiado por tema:

1. **① Lección**: contenido con **texto justificado**, explicado como tutorial.
2. **② Ejemplo guiado A/B**: del mismo tipo de ejercicio — **A** demuestra paso a paso
   (con el porqué de cada paso); **B** lo intenta el usuario con **pistas** y botón
   «Ver solución completa y el porqué».
3. **③ Práctica**: **≥6 ejercicios** por tema en **orden mezclado** (no agrupados por tipo);
   al comprobar, si es correcto avanza; si es incorrecto muestra **retroalimentación +
   solución completa + porqué** y avanza **sin reintento**. Guarda score por ejercicio.
4. **④ Evaluación**: **≥15 reactivos** por tema mezclando tipos (con interacción);
   al final, score por tema y por tipo, y **recomendación** de volver a ① o ③.

**Fuera de alcance**: chat/LLM (el “agente” es determinista y local), RA, sensores, red.

## 2. Restricciones

- Offline-first: **cero llamadas de red**.
- Vistas solo consumen hooks; nunca importan repositorios ni `expo-sqlite`.
- TypeScript estricto; `npx tsc --noEmit` = 0; `npm test` verde; `npx eslint .` = 0.
- Se preservan las **cuentas** existentes; el contenido de la Unidad 1 se re-siembra.

## 3. Modelo de datos (esquema v5)

Se añade la tabla `attempts` y se extienden `examples` y `questions`. El contenido de la
Unidad 1 se re-siembra. `results` queda en desuso (se conserva por compatibilidad).

```sql
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source TEXT NOT NULL,            -- 'practice' | 'evaluation'
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  correct INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_account_lesson ON attempts(account_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_attempts_account_type ON attempts(account_id, item_type);
```

`examples` se **recrea** con la forma de ejemplo interactivo (sin datos de usuario asociados):

```sql
DROP TABLE IF EXISTS examples;
CREATE TABLE examples (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,              -- ordenar | conectar | completar | crucigrama | justificar
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  steps TEXT NOT NULL DEFAULT '[]',    -- Ejemplo A: [{ text, why }]
  hints TEXT NOT NULL DEFAULT '[]',    -- Ejemplo B: pistas
  explanation TEXT NOT NULL DEFAULT ''
);
```

`questions` admite tipos interactivos:

```sql
ALTER TABLE questions ADD COLUMN type TEXT NOT NULL DEFAULT 'mcq';
ALTER TABLE questions ADD COLUMN config TEXT NOT NULL DEFAULT '{}';
```

### 3.1 Tipos de actividad

```ts
export type ActivityType = 'order' | 'match' | 'fill' | 'crossword' | 'justify' | 'mcq';
export type ExerciseType = Exclude<ActivityType, 'mcq'>;

export interface MatchPair { left: string; right: string }
export interface CrosswordEntry {
  word: string;
  clue: string;
  row: number;            // 0-based
  col: number;            // 0-based
  direction: 'across' | 'down';
}
export interface ExerciseConfig {
  sentences?: string[];                                   // fill: “{{palabra}}”
  pairs?: MatchPair[];                                    // match
  crossword?: { rows: number; cols: number; entries: CrosswordEntry[] };
  justify?: { keywords: string[]; modelAnswer: string; minMatches: number };
}

export interface ExampleStep { text: string; why: string }
export interface Example {
  id: string; lessonId: string; type: ExerciseType;
  title: string; prompt: string; config: ExerciseConfig;
  steps: ExampleStep[]; hints: string[]; explanation: string;
}

export interface Question {
  id: string; evaluationId: string; orderIndex: number;
  type: ActivityType; config: ExerciseConfig;
  prompt: string; options: string[]; answer: number; explanation: string;
}

export interface Attempt {
  id: number; accountId: number;
  source: 'practice' | 'evaluation';
  itemId: string; itemType: ActivityType; lessonId: string;
  correct: boolean; createdAt: string;
}
```

## 4. Migración v4 → v5

1. `CREATE TABLE attempts` + índices.
2. `DROP TABLE examples` y recrear con la nueva forma.
3. `ALTER TABLE questions ADD COLUMN type/config`.
4. Re-sembrar contenido de Unidad 1:
   - Eliminar `exercises` y `questions` de los temas 1.1–1.4 y `evaluations` de 1.1.
   - Sembrar: ejemplo A/B por tema (1.2–1.4), 6 ejercicios por tema (1.2–1.4),
     evaluación con 15 reactivos por tema (1.2–1.4). 1.1 queda **solo lección**.
   - `module_progress` y `evaluation_results` de la cuenta se conservan (las evaluaciones
     1.2–1.4 mantienen su `id`, así que su historial no se pierde).
5. `PRAGMA user_version = 5`.

## 5. Navegación

- Home → unidad → tema (`/tema/[id]`): 4 mosaicos → Lecciones, Ejemplos, Ejercicios, Evaluación.
- **1.1**: solo Lecciones (sin mosaicos de ejemplo/práctica/evaluación; `/tema/l1.1` redirige
  a la lectura).
- **Ejemplos**: el mosaico abre directo el **Ejemplo A** (`/ejemplos/[id]`), sin lista.
  - A (recorrido paso a paso) → botón «Ahora inténtalo tú» → B (misma pantalla, variante B:
    interacción + pistas) → «Ver solución completa y el porqué» → «Ir a ejercicios».
- **Ejercicios**: el mosaico abre el runner en `/ejercicios?lesson=<id>` (la pantalla-lista
  actual se convierte en el runner; se elimina `/ejercicios/[id]`):
  - Estado inicial: lista de los ≥6 ejercicios (con tipo y estado) + «Empezar práctica».
  - En curso: un ejercicio por pantalla, orden mezclado; «Comprobar» → correcto avanza;
    incorrecto: retroalimentación + solución + porqué, y **solo** «Siguiente» (sin reintento).
  - Resumen: score por tipo y recomendación (volver a ① o ③).
- **Evaluación** (`/evaluacion?lesson=`): ≥15 reactivos mezclados; misma dinámica de una
  pasada; resultado final con score por tema/tipo y recomendación.
- Profundidad: tab (1) → tema (2) → actividad (3).

## 6. Motores puros (TDD)

- `exerciseLogic.ts`: ya tiene order/fill/match; se añade
  `isCrosswordCorrect(config, letters)`, `crosswordCells(config)`,
  `isJustifyCorrect(config, text)` y `matchKeywords(text, keywords)` (normaliza acentos,
  minúsculas y separadores).
- `analyticsLogic.ts` (nuevo):
  ```ts
  export interface AttemptSummary { total: number; correct: number; byType: Record<string, { total: number; correct: number }> }
  export function summarizeAttempts(attempts: Attempt[]): AttemptSummary;
  export function weakTypes(summary: AttemptSummary, threshold = 3): string[];
  export function recommendReview(summary: AttemptSummary, accuracy = 0.6): 'lesson' | 'practice' | 'none';
  ```
  Reglas: si `accuracy < 0.6` o hay tipos con ≥3 errores → `'lesson'`; si solo hay tipos
  débiles → `'practice'`; si no → `'none'`.

## 7. ViewModels

- `useExamplePair(exampleId)`: carga el ejemplo y expone variante A/B, pasos, pistas y
  solución; `useExampleEngine(example)`: intento del usuario en B.
- `usePracticeEngine(lessonId)`: carga los ejercicios, mezcla el orden, mantiene índice,
  registra `attempts` (source `practice`), expone feedback/solución y estado del resumen.
- `useEvaluationEngine(questions)`: extiende el actual para tipos interactivos y registra
  `attempts` (source `evaluation`).
- `useAttempts(lessonId)`: lectura de `attempts` + `summarizeAttempts` para score/patrones.
- Repositorios: `attemptRepository.ts` (`insertAttempt`, `selectAttemptsByLesson`),
  `exampleRepository` actualizado a la nueva forma, `questionRepository` con type/config.

## 8. UI

- `src/components/activities/`: `OrderExercise`, `FillExercise`, `MatchExercise`,
  `CrosswordExercise`, `JustifyExercise` (los tres primeros ya existen o se extraen del
  runner actual). Todos reciben el estado del engine y `onCheck(answer, correct)`.
- `CrosswordExercise`: rejilla predefinida por `config.crossword`; tocar celda selecciona
  entrada; un campo oculto por entrada escribe letras que se reflejan en la rejilla;
  al comprobar, cada entrada se marca correcta/incorrecta.
- `JustifyExercise`: `TextInput` multilínea; correcto si coincide ≥`minMatches` palabras
  clave; siempre muestra la solución modelo y el porqué.
- `TextCheck` (lección): `textAlign: 'justify'` en `RichContent` y en el cuerpo.
- Pantallas de resumen (práctica y evaluación) con score por tipo y recomendación.

## 9. Contenido Unidad 1 (a autorar desde `Unidad 1 ingdelsoftware.md`)

| Tema | Lección | Ejemplo A/B | Práctica | Evaluación |
|---|---|---|---|---|
| 1.1 Introducción | justificada (ya existe) | — | — | — |
| 1.2 Desarrollo profesional | par A/B | 6 ejercicios | 15 reactivos |
| 1.3 Ética | par A/B | 6 ejercicios | 15 reactivos |
| 1.4 Estudios de caso | par A/B | 6 ejercicios | 15 reactivos |

- Mezcla por tema: al menos un ejercicio de cada tipo disponible (order, match, fill,
  crossword, justify) y el resto a elección hasta ≥6.
- Evaluación: 15 reactivos que incluyan opción múltiple + al menos 2 tipos interactivos.
- El crucigrama usa rejillas **predefinidas** (posiciones y direcciones fijas) en el seed.

## 10. Pruebas y verificación

- TDD de `analyticsLogic` y de `crossword`/`justify` en `exerciseLogic`.
- Tests de `usePracticeEngine` (avance, no reintento, registro de attempt) con `renderHook`.
- Ajustar fixtures existentes (`Exercise.config`, `Question.type/config`).
- Cierre: `npx tsc --noEmit`, `npm test`, `npx eslint .`, `npx expo export --platform android`.

## 11. Criterios de aceptación

1. Lección con texto justificado en 1.1–1.4.
2. 1.1 sin ejemplo, práctica ni evaluación.
3. Cada tema 1.2–1.4 tiene un par A/B: A demuestra con porqué paso a paso; B permite
   intentar con pistas y ver la solución completa.
4. Práctica con ≥6 ejercicios en orden mezclado; incorrecto muestra solución y no permite
   reintentar ese ejercicio; se guarda un attempt por ejercicio.
5. Evaluación con ≥15 reactivos que mezclan tipos; resultado con score por tema/tipo.
6. Recomendación coherente: `lesson` si la precisión es baja, `practice` si hay tipos
   débiles (≥3 errores), `none` en otro caso.
7. Todo alcanzable en ≤3 toques desde Home; 0 llamadas de red.
8. `tsc`, `test`, `eslint` y bundle en verde.

## 12. Riesgos

- Volumen de contenido alto (18 ejercicios + 45 reactivos + 3 pares A/B); se redacta desde
  el documento fuente y se revisa por tema.
- Crucigrama: la rejilla predefinida es frágil si el contenido cambia; se versiona con el
  seed y se valida en tests (palabras encajan en la rejilla).
- Re-siembra de contenido de Unidad 1: se preservan cuentas y evaluaciones; los `results`
  antiguos de ejercicios de Unidad 1 se descartan (tabla en desuso).
