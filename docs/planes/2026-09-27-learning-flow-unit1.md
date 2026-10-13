# Agente de aprendizaje por tema (Unidad 1) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el flujo ① Lección (texto justificado) → ② Ejemplo A/B → ③ Práctica (≥6, orden mezclado, sin reintento) → ④ Evaluación (≥15, interactiva) con score y recomendación, en la Unidad 1.

**Architecture:** MVVM. Lógica pura testeable en `viewmodels/*Logic.ts`; repositorios async que reciben `SQLiteDatabase`; hooks ViewModel; vistas que solo consumen hooks. Esquema v5 con `attempts`, `examples` A/B y `questions` tipadas. Sin red.

**Tech Stack:** Expo SDK 57, Expo Router, expo-sqlite, TypeScript estricto, Jest/jest-expo.

**Spec:** `docs/especificaciones/2026-09-27-learning-flow-unit1-design.md`

## Global Constraints

- Offline-first: ninguna llamada de red.
- La vista nunca importa repositorios ni `expo-sqlite` (solo hooks).
- `npx tsc --noEmit` = 0; `npm test` verde; `npx eslint .` = 0.
- Paleta intacta (`src/theme/tokens.ts`).
- No ejecutar `git commit` sin autorización explícita del usuario.
- Tipos de práctica: `order | fill | match | crossword | justify`; evaluación añade `mcq`.
- Práctica: **una pasada**, sin reintento; incorrecto muestra solución completa + porqué.

---

### Task 1: Lógica pura — crucigrama y justificar (TDD)

**Files:**
- Modify: `src/viewmodels/exerciseLogic.ts`
- Modify: `src/viewmodels/__tests__/exerciseLogic.test.ts`

**Interfaces:**
- Consumes: `ExerciseConfig`, `CrosswordEntry` de `@/models/entities`.
- Produces:
  - `crosswordCells(config: ExerciseConfig): { row: number; col: number; entryIndexes: number[]; solution: string }[]`
  - `isCrosswordCorrect(config: ExerciseConfig, letters: Record<string, string>): boolean`
  - `matchKeywords(text: string, keywords: string[]): string[]`
  - `isJustifyCorrect(config: ExerciseConfig, text: string): boolean`
  - `normalizeLoose(value: string): string` (minúsculas, sin acentos, trim)

- [ ] **Step 1: Write the failing tests** (añadir a `exerciseLogic.test.ts`)

```ts
describe('crossword', () => {
  const config = {
    crossword: {
      rows: 3,
      cols: 3,
      entries: [
        { word: 'SOL', clue: 'astro', row: 0, col: 0, direction: 'across' as const },
        { word: 'SAL', clue: 'condimento', row: 0, col: 0, direction: 'down' as const },
      ],
    },
  };
  it('genera celdas con su solución', () => {
    const cells = crosswordCells(config);
    expect(cells).toHaveLength(3);
    expect(cells.find(c => c.row === 0 && c.col === 0)?.solution).toBe('S');
    expect(cells.find(c => c.row === 0 && c.col === 2)?.solution).toBe('L');
    expect(cells.find(c => c.row === 2 && c.col === 0)?.solution).toBe('L');
  });
  it('valida letras correctas', () => {
    expect(isCrosswordCorrect(config, { '0-0': 'S', '0-1': 'O', '0-2': 'L', '1-0': 'A', '2-0': 'L' })).toBe(true);
    expect(isCrosswordCorrect(config, { '0-0': 'X' })).toBe(false);
  });
});

describe('justify', () => {
  const config = { justify: { keywords: ['documentación', 'configuración', 'mantenimiento'], modelAnswer: '...', minMatches: 2 } };
  it('cuenta palabras clave ignorando acentos y mayúsculas', () => {
    expect(matchKeywords('La Documentacion y CONFIGURACION importan', ['documentación', 'configuración'])).toEqual(['documentación', 'configuración']);
  });
  it('exige el mínimo de coincidencias', () => {
    expect(isJustifyCorrect(config, 'Falta documentación')).toBe(false);
    expect(isJustifyCorrect(config, 'Documentación y configuración son clave')).toBe(true);
  });
});
```

- [ ] **Step 2: Run** `npx jest src/viewmodels/__tests__/exerciseLogic.test.ts` → FAIL (funciones inexistentes).

- [ ] **Step 3: Implement**

```ts
export function normalizeLoose(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface CrosswordCell {
  row: number;
  col: number;
  entryIndexes: number[];
  solution: string;
}

export function crosswordCells(config: ExerciseConfig): CrosswordCell[] {
  const crossword = config.crossword;
  if (!crossword) {
    return [];
  }
  const cells = new Map<string, CrosswordCell>();
  crossword.entries.forEach((entry, entryIndex) => {
    const stepRow = entry.direction === 'down' ? 1 : 0;
    const stepCol = entry.direction === 'across' ? 1 : 0;
    for (let offset = 0; offset < entry.word.length; offset += 1) {
      const row = entry.row + stepRow * offset;
      const col = entry.col + stepCol * offset;
      const key = `${row}-${col}`;
      const existing = cells.get(key);
      if (existing) {
        existing.entryIndexes.push(entryIndex);
      } else {
        cells.set(key, { row, col, entryIndexes: [entryIndex], solution: entry.word[offset]!.toUpperCase() });
      }
    }
  });
  return [...cells.values()];
}

export function isCrosswordCorrect(config: ExerciseConfig, letters: Record<string, string>): boolean {
  const cells = crosswordCells(config);
  return cells.length > 0 && cells.every(cell => (letters[`${cell.row}-${cell.col}`] ?? '').toUpperCase() === cell.solution);
}

export function matchKeywords(text: string, keywords: string[]): string[] {
  const normalized = normalizeLoose(text);
  return keywords.filter(keyword => normalized.includes(normalizeLoose(keyword)));
}

export function isJustifyCorrect(config: ExerciseConfig, text: string): boolean {
  const justify = config.justify;
  if (!justify) {
    return false;
  }
  return matchKeywords(text, justify.keywords).length >= justify.minMatches;
}
```

- [ ] **Step 4: Run** el test → PASS (12 existentes + nuevos).
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "feat(logic): crossword and justify helpers"`

---

### Task 2: Lógica pura — analítica de intentos (TDD)

**Files:**
- Create: `src/viewmodels/analyticsLogic.ts`
- Create: `src/viewmodels/__tests__/analyticsLogic.test.ts`

**Interfaces:**
- Consumes: `Attempt` de `@/models/entities`.
- Produces:
  - `summarizeAttempts(attempts: Attempt[]): { total: number; correct: number; accuracy: number; byType: Record<string, { total: number; correct: number }> }`
  - `weakTypes(summary, threshold = 3): string[]`
  - `recommendReview(summary, accuracyThreshold = 0.6): 'lesson' | 'practice' | 'none'`

- [ ] **Step 1: Write the failing test**

```ts
import { recommendReview, summarizeAttempts, weakTypes } from '../analyticsLogic';
import type { Attempt } from '@/models/entities';

const attempt = (itemType: Attempt['itemType'], correct: boolean, id: number): Attempt => ({
  id, accountId: 1, source: 'practice', itemId: `i${id}`, itemType, lessonId: 'l1.2', correct,
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('analyticsLogic', () => {
  it('resume aciertos y errores por tipo', () => {
    const summary = summarizeAttempts([attempt('match', false, 1), attempt('match', false, 2), attempt('match', false, 3), attempt('fill', true, 4)]);
    expect(summary.total).toBe(4);
    expect(summary.correct).toBe(1);
    expect(summary.byType.match).toEqual({ total: 3, correct: 0 });
    expect(weakTypes(summary)).toEqual(['match']);
  });
  it('recomienda leer si la precisión es baja', () => {
    const summary = summarizeAttempts([attempt('fill', false, 1), attempt('fill', false, 2), attempt('fill', false, 3)]);
    expect(recommendReview(summary)).toBe('lesson');
  });
  it('recomienda practicar si hay tipos débiles sin precisión baja global', () => {
    const attempts = [attempt('match', false, 1), attempt('match', false, 2), attempt('match', false, 3),
      ...Array.from({ length: 7 }, (_, i) => attempt('fill', true, 10 + i)),
      ...Array.from({ length: 2 }, (_, i) => attempt('order', false, 20 + i)),
      ...Array.from({ length: 3 }, (_, i) => attempt('order', true, 30 + i))];
    expect(recommendReview(summarizeAttempts(attempts))).toBe('practice');
  });
  it('no recomienda nada si todo va bien', () => {
    const attempts = Array.from({ length: 6 }, (_, i) => attempt('order', true, i));
    expect(recommendReview(summarizeAttempts(attempts))).toBe('none');
  });
});
```

- [ ] **Step 2: Run** `npx jest src/viewmodels/__tests__/analyticsLogic.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
import type { Attempt } from '@/models/entities';

export interface AttemptSummary {
  total: number;
  correct: number;
  accuracy: number;
  byType: Record<string, { total: number; correct: number }>;
}

export function summarizeAttempts(attempts: Attempt[]): AttemptSummary {
  const byType: AttemptSummary['byType'] = {};
  let correct = 0;
  for (const attempt of attempts) {
    const bucket = byType[attempt.itemType] ?? { total: 0, correct: 0 };
    bucket.total += 1;
    if (attempt.correct) {
      bucket.correct += 1;
      correct += 1;
    }
    byType[attempt.itemType] = bucket;
  }
  const total = attempts.length;
  return { total, correct, accuracy: total === 0 ? 1 : correct / total, byType };
}

export function weakTypes(summary: AttemptSummary, threshold = 3): string[] {
  return Object.entries(summary.byType)
    .filter(([, bucket]) => bucket.total - bucket.correct >= threshold)
    .map(([type]) => type);
}

export function recommendReview(summary: AttemptSummary, accuracyThreshold = 0.6): 'lesson' | 'practice' | 'none' {
  if (summary.total === 0) {
    return 'none';
  }
  if (summary.accuracy < accuracyThreshold) {
    return 'lesson';
  }
  if (weakTypes(summary).length > 0) {
    return 'practice';
  }
  return 'none';
}
```

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "feat(logic): attempt analytics and review recommendation"`

---

### Task 3: Modelo de datos v5 y migración

**Files:**
- Modify: `src/models/entities.ts`
- Modify: `src/models/schema.ts`
- Modify: `src/data/db.ts`

**Interfaces:**
- Produces: `ActivityType`, `ExerciseType`, `CrosswordEntry`, `ExerciseConfig` (ampliado), `Example` (nueva forma), `Question` con `type/config`, `Attempt`; `DATABASE_VERSION = 5`; DDL de `attempts`; migración v4→v5.

- [ ] **Step 1: Entidades** — en `src/models/entities.ts`:

```ts
export type ActivityType = 'order' | 'match' | 'fill' | 'crossword' | 'justify' | 'mcq';
export type ExerciseType = Exclude<ActivityType, 'mcq'>;

export interface CrosswordEntry {
  word: string; clue: string; row: number; col: number; direction: 'across' | 'down';
}
export interface ExerciseConfig {
  sentences?: string[];
  pairs?: MatchPair[];
  crossword?: { rows: number; cols: number; entries: CrosswordEntry[] };
  justify?: { keywords: string[]; modelAnswer: string; minMatches: number };
}

export interface ExampleStep { text: string; why: string }
export interface Example {
  id: string; lessonId: string; type: ExerciseType;
  title: string; prompt: string; config: ExerciseConfig;
  steps: ExampleStep[]; hints: string[]; explanation: string;
}
```
Cambiar `Exercise.type` a `ExerciseType`; `Question` → añadir `type: ActivityType; config: ExerciseConfig;`; añadir:

```ts
export interface Attempt {
  id: number; accountId: number; source: 'practice' | 'evaluation';
  itemId: string; itemType: ActivityType; lessonId: string; correct: boolean; createdAt: string;
}
```

- [ ] **Step 2: Schema** — `src/models/schema.ts`: `DATABASE_VERSION = 5`; añadir a `SCHEMA_DDL` la tabla `attempts` e índices (ver spec §3) y, en `questions`, las columnas `type TEXT NOT NULL DEFAULT 'mcq'` y `config TEXT NOT NULL DEFAULT '{}'`; en `examples`, la nueva forma (sin `before_state/after_state`).

- [ ] **Step 3: Migración** — `src/data/db.ts`:

```ts
    if (currentVersion < 4) { /* ...lo existente... */ }
    if (currentVersion < 5) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS attempts (...);
        CREATE INDEX IF NOT EXISTS idx_attempts_account_lesson ON attempts(account_id, lesson_id);
        CREATE INDEX IF NOT EXISTS idx_attempts_account_type ON attempts(account_id, item_type);
        DROP TABLE IF EXISTS examples;
        CREATE TABLE examples (...nueva forma...);
        ALTER TABLE questions ADD COLUMN type TEXT NOT NULL DEFAULT 'mcq';
        ALTER TABLE questions ADD COLUMN config TEXT NOT NULL DEFAULT '{}';
      `);
      await applyUnit1Content(db);
    }
```
`applyUnit1Content` se implementa en la Tarea 5.

- [ ] **Step 4: Verificar** `npx tsc --noEmit` (fallará hasta la Tarea 5 por el seed; continuar).
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "feat(data): schema v5 for attempts, examples A/B and typed questions"`

---

### Task 4: Repositorios y hooks de datos

**Files:**
- Create: `src/data/repositories/attemptRepository.ts`
- Modify: `src/data/repositories/exampleRepository.ts`
- Modify: `src/data/repositories/evaluationRepository.ts` (mapear `type/config` de preguntas)
- Create: `src/viewmodels/useAttempts.ts`

**Interfaces:**
- `insertAttempt(db, accountId, source, itemId, itemType, lessonId, correct): Promise<void>`
- `selectAttemptsByLesson(db, accountId, lessonId): Promise<Attempt[]>`
- `useAttempts(lessonId: string | null)`: `{ attempts, summary, isLoading, refresh }` (usa `summarizeAttempts`).
- `exampleRepository`: `selectExamplesByLesson`, `selectExample`, `selectExampleByLesson` mapeando la nueva forma (`type`, `config`, `steps`, `hints`, `explanation`).

- [ ] **Step 1: Implementar `attemptRepository.ts`** (patrón de `progressRepository`).
- [ ] **Step 2: Actualizar `exampleRepository.ts`** a la nueva forma; eliminar `before/after`.
- [ ] **Step 3: `evaluationRepository.ts`**: `QuestionRow` + `mapQuestion` con `type`/`config` (JSON con fallback `{}`).
- [ ] **Step 4: Implementar `useAttempts.ts`** con `refresh` y `summary`.
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "feat(data): attempt repository and example A/B mapping"`

---

### Task 5: Contenido Unidad 1 (seed + migración de contenido)

**Files:**
- Modify: `src/data/seed.ts`
- Create: `src/data/unit1Content.ts` (ejemplos A/B, ejercicios y reactivos)

**Interfaces:**
- Produces: `unit1Examples: ExampleSeed[]`, `unit1Exercises: ExerciseSeed[]`, `unit1Evaluations: EvaluationSeed[]` y `applyUnit1Content(db)` que re-siembra la Unidad 1 (idempotente).

- [ ] **Step 1: Estructuras** — extender las interfaces de seed:
  `ExampleSeed { id; lessonId; type; title; prompt; config?; steps; hints; explanation }`,
  `ExerciseSeed` con `type`/`config` (ya existe),
  `QuestionSeed` con `type?`/`config?`.
- [ ] **Step 2: Autorar el contenido** según el Apéndice A de este plan.
- [ ] **Step 3: Insertadores** — helpers con `ON CONFLICT(id) DO NOTHING` y
  `applyUnit1Content(db)`:
  1. `DELETE FROM attempts WHERE lesson_id IN ('l1.1','l1.2','l1.3','l1.4')` (inicio limpio del contenido re-sembrado).
  2. `DELETE FROM exercises WHERE lesson_id IN (...)`;
     `DELETE FROM questions WHERE evaluation_id IN ('ev1.1','ev1.2','ev1.3','ev1.4')`;
     `DELETE FROM evaluations WHERE id = 'ev1.1'`; `DELETE FROM examples WHERE lesson_id IN (...)`.
  3. Insertar `unit1Examples`, `unit1Exercises`, `unit1Evaluations` (ev1.2–1.4).
  4. Eliminar de `seedDatabase` lo obsoleto (`ex1..ex4`, `ord1.1`, `fill*`, `match*`, `ev1.1`)
     para instalaciones nuevas; dejar 1.1 **solo** con su lección.
- [ ] **Step 4: Verificar** `npx tsc --noEmit` y `npm test` en verde.
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "feat(content): unit 1 A/B examples, practice sets and 15-item evaluations"`

---

### Task 6: Componentes de actividad

**Files:**
- Create: `src/components/activities/OrderExercise.tsx` (extraído de `ejercicios/[id].tsx`)
- Create: `src/components/activities/CrosswordExercise.tsx`
- Create: `src/components/activities/JustifyExercise.tsx`
- Move: `src/components/FillExercise.tsx` → `src/components/activities/FillExercise.tsx`
- Move: `src/components/MatchExercise.tsx` → `src/components/activities/MatchExercise.tsx`
- Create: `src/components/activities/ActivityView.tsx`
- Create hooks: `useOrderEngine`, `useCrosswordEngine`, `useJustifyEngine` en `src/viewmodels/useExerciseEngine.ts`

**Interfaces:**
- `ActivityView({ type, config, onSubmit })` renderiza el componente del tipo y reporta `(answer: string, correct: boolean)`.
- Engines con la forma `{ ..., checked, isCorrect, submit(onResult?), reset }` (sin `reset` en práctica).

- [ ] **Step 1: Extraer `OrderExercise`** con los `steps` del engine de orden.
- [ ] **Step 2: `CrosswordExercise`** — rejilla desde `crosswordCells(config)`; celda selecciona
  entrada; un `TextInput` por entrada (hidden) escribe letras; `submit` compara con
  `isCrosswordCorrect`.
- [ ] **Step 3: `JustifyExercise`** — `TextInput` multilínea; `submit` usa `isJustifyCorrect`;
  siempre muestra `modelAnswer` y el porqué.
- [ ] **Step 4: `ActivityView`** con switch por tipo (incluye `mcq` para evaluación reutilizando
  `QuizOption`).
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "feat(ui): activity components for order/fill/match/crossword/justify"`

---

### Task 7: Runner de práctica

**Files:**
- Modify: `src/app/(app)/ejercicios/index.tsx` → runner (idle/en curso/resumen)
- Delete: `src/app/(app)/ejercicios/[id].tsx`
- Create: `src/viewmodels/usePracticeEngine.ts`

**Interfaces:**
- `usePracticeEngine(lessonId)` → `{ items, phase: 'idle'|'running'|'summary', index, current, summary, start, submit, next, restart }`
  - `start()` mezcla el orden (`shuffleItems(items, Math.random)`).
  - `submit(answer, correct)` registra `attempt` (source `practice`) y marca `checked`.
  - `next()` avanza sin permitir reintento.
  - `summary` usa `summarizeAttempts` + `recommendReview`.

- [ ] **Step 1: Implementar `usePracticeEngine`** (registra en `attemptRepository`).
- [ ] **Step 2: Runner**:
  - idle: lista de ejercicios (tipo + estado) + botón «Empezar práctica».
  - running: `N/total`, `ActivityView`, tras comprobar: correcto → «Siguiente»;
    incorrecto → retroalimentación + **solución completa y porqué** + «Siguiente»
    (sin «Reintentar»).
  - summary: score por tipo + recomendación (`lesson`/`practice`/`none`) y botón a
    `/lecciones/[id]` o repetir práctica.
- [ ] **Step 3: Verificar** `npx tsc --noEmit`.
- [ ] **Step 4: Commit (solo si el usuario autoriza)** `git commit -m "feat(practice): mixed-order runner with one-shot attempts and summary"`

---

### Task 8: Ejemplo guiado A/B

**Files:**
- Modify: `src/app/(app)/ejemplos/[id].tsx` → pantalla A/B
- Delete: `src/app/(app)/ejemplos/index.tsx`
- Modify: `src/app/(app)/tema/[id].tsx` (mosaico Ejemplos → `/ejemplos/[id]` del tema)
- Modify: `src/app/(app)/lecciones/[id].tsx` (pie «Ver ejemplo» → `/ejemplos/[id]`)
- Create: `src/viewmodels/useExamplePair.ts`

**Interfaces:**
- `useExamplePair(lessonId)`: `{ example, isLoading }` (usa `selectExampleByLesson`).
- Pantalla con dos variantes en una ruta: estado `variant: 'A' | 'B'`.
  - A: lista de `steps` (`text` + `why`) → «Ahora inténtalo tú».
  - B: `ActivityView` + pistas progresivas («Ver una pista») → tras comprobar,
    «Ver solución completa y el porqué» (muestra `explanation`) → «Ir a ejercicios»
    (`/ejercicios?lesson=<id>`).

- [ ] **Step 1: `useExamplePair` y carga por tema** (el hub necesita el ejemplo del tema; usar
  `useLessonHub` que ya carga `examples`).
- [ ] **Step 2: Pantalla A/B.**
- [ ] **Step 3: Hub**: mosaico Ejemplos → `/ejemplos/[id]` (primer ejemplo del tema);
  eliminar la ruta-lista.
- [ ] **Step 4: Pie de lección**: «Ver ejemplo» → `/ejemplos/[id]`.
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "feat(examples): guided A/B example flow"`

---

### Task 9: Evaluación interactiva con recomendación

**Files:**
- Modify: `src/viewmodels/useQuizEngine.ts` (soporte de `type/config` y `attempts`)
- Modify: `src/app/(app)/evaluacion/index.tsx`
- Modify: `src/components/ResultModal.tsx` (score por tipo + recomendación)

**Interfaces:**
- `useQuizEngine(questions)` → añade `current` con `type/config`, `results: Attempt[]` y
  `summary`.
- Resultado final: `score` global, `byType`, `recommendReview`.

- [ ] **Step 1: Extender `useQuizEngine`** para renderizar por tipo y registrar `attempt`
  (source `evaluation`) por reactivo.
- [ ] **Step 2: Pantalla**: `ActivityView` por reactivo; «Comprobar» → feedback → «Siguiente»;
  última → resultado.
- [ ] **Step 3: `ResultModal`**: porcentaje de aciertos, score por tipo y recomendación
  (volver a ① o ③).
- [ ] **Step 4: Verificar** `npx tsc --noEmit`.
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "feat(evaluation): interactive 15-item evaluation with recommendations"`

---

### Task 10: Lección justificada, limpieza y verificación final

**Files:**
- Modify: `src/components/RichContent.tsx` (`textAlign: 'justify'`)
- Modify: `src/app/(app)/lecciones/[id].tsx` (cuerpo justificado; pie sin evaluación para 1.1)
- Modify: `src/app/(app)/tema/[id].tsx` (mosaicos condicionales; 1.1 sin prácticas ni evaluación)
- Modify: `docs/arquitectura/mapa-navegacion.md` y `docs/estado/estado-proyecto.md`

- [ ] **Step 1: Justificar** párrafos y cuerpo de lección (`textAlign: 'justify'`).
- [ ] **Step 2: 1.1 solo lección**: sin mosaico de ejemplo/práctica/evaluación; el pie termina
  en «Terminar» (marca completada y vuelve).
- [ ] **Step 3: Actualizar docs de estado/mapa** (flujo ①–④, rutas, tipos).
- [ ] **Step 4: Verificación final**

```bash
npx tsc --noEmit            # exit 0
npm test                    # suites en verde
npx eslint .                # exit 0
npx expo export --platform android
```
- [ ] **Step 5: Commit (solo si el usuario autoriza)** `git commit -m "chore: justify lesson text and update docs"`

---

## Apéndice A — Contenido de la Unidad 1

> Redactado desde `docs/contenido/unidad-1.md`. Todo el contenido es editable en
> `src/data/unit1Content.ts`.

### A.1 Tema 1.1 — Introducción
Solo lección (se eliminan `ord1.1` y `ev1.1`). Sin ejemplo/práctica/evaluación.

### A.2 Tema 1.2 — Desarrollo de software profesional
**Ejemplo A/B** (`type: match`): enlazar atributos ↔ descripción.
- A (steps): «Leer el atributo» (por qué: identificar la propiedad de calidad) → «Buscar
  su definición en el texto» (por qué: cada atributo describe una necesidad del usuario) →
  «Verificar que no se repita la descripción» (por qué: evitar enlaces ambiguos).
- B (hints): «Concéntrate en la consecuencia de cada atributo, no en su nombre.» /
  «Confiabilidad habla de daño y ataques; eficiencia, de recursos.»
- Pares: Mantenimiento↔evolucionar con el cambio · Confiabilidad y seguridad↔no causar daño
  y resistir ataques · Eficiencia↔no desperdiciar memoria ni ciclos · Aceptabilidad↔
  comprensible, utilizable y compatible.

**Práctica (6)**
1. `order` — Actividades fundamentales del proceso → Especificación, Desarrollo, Validación, Evolución.
2. `fill` — «El buen software debe entregar la {{funcionalidad}} y el desempeño requeridos.» · «Los productos {{genéricos}} se venden en el mercado abierto.» · «Los productos {{personalizados}} se desarrollan para un cliente en particular.» · «Cerca del {{60}}% de los costos son de desarrollo.»
3. `match` — atributos ↔ descripción (los del ejemplo).
4. `justify` — «¿Por qué el software profesional no es solo el programa?» keywords: `documentación, configuración, mantenimiento, otros ingenieros, equipo`; minMatches 3.
5. `crossword` — MANTENIMIENTO, CONFIABILIDAD, EFICIENCIA, ACEPTABILIDAD, SOFTWARE, INGENIERIA (rejilla fija).
6. `fill` — «Un sistema profesional incluye programas separados y archivos de {{configuración}}.» · «Los ERP como SAP son productos {{genéricos}} adaptados al cliente.» · «En productos {{personalizados}}, el cliente controla la especificación.»

**Evaluación (15)** — 8 `mcq`, 2 `match`, 2 `fill`, 1 `order`, 1 `justify`, 1 `crossword`:
por qué no es solo el programa · atributos del buen software · actividades fundamentales ·
quién controla la especificación en productos personalizados · qué es un ERP adaptado ·
diferencia con ciencias de la computación · diferencia con ingeniería de sistemas ·
mejores métodos (no hay uno universal) + 2 enlaces de atributos + 2 frases incompletas +
1 orden de actividades + 1 justificación de la reutilización en la Web + 1 crucigrama de atributos.

### A.3 Tema 1.3 — Ética en la ingeniería de software
**Ejemplo A/B** (`type: match`): principios ↔ obligación.
- A: «Leer el principio» → «Ubicar la obligación en el código» → «Confirmar coherencia».
- B hints: «El principio PÚBLICO antepone el interés social.» / «JUICIO trata de integridad, no de tareas.»
- Pares: PÚBLICO · CLIENTE Y EMPLEADOR · JUICIO · COLEGAS con sus obligaciones.

**Práctica (6)**
1. `order` — Análisis ético: Identificar afectados → Reconocer el principio → Evaluar riesgos y alternativas → Actuar y documentar.
2. `fill` — «El código ACM/IEEE establece {{ocho}} principios.» · «El principio {{PÚBLICO}} antepone el interés del público.» · «La {{confidencialidad}} se respeta aun sin acuerdo firmado.» · «No aceptar trabajo fuera de la propia {{competencia}}.»
3. `match` — principios ↔ obligación.
4. `justify` — «¿Qué debe hacer un ingeniero ante un fallo que expone datos personales?» keywords: `interés público, protección de datos, informar, confidencialidad, riesgo`; minMatches 3.
5. `crossword` — CONFIDENCIALIDAD, COMPETENCIA, INTEGRIDAD, HONESTIDAD, ETICA, ACM.
6. `fill` — «Conocer patentes y copyright es respetar los derechos de {{propiedad intelectual}}.» · «Usar mal las computadoras de otros incluye diseminar {{malware}}.» · «Los principios se publican en códigos de {{conducta}}.»

**Evaluación (15)** — 8 `mcq`, 2 `match`, 2 `fill`, 1 `order`, 1 `justify`, 1 `crossword`:
nº de principios · principio que prioriza el interés público · confidencialidad sin contrato ·
competencia · propiedad intelectual · mal uso de computadoras · conflicto ante empleador no
ético · participación en sistemas militares + 2 enlaces de principios + 2 frases incompletas +
1 orden del análisis ético + 1 justificación ante un fallo con datos + 1 crucigrama de ética.

### A.4 Tema 1.4 — Estudios de caso
**Ejemplo A/B** (`type: match`): sistema ↔ tipo.
- A: «Leer la descripción del sistema» → «Reconocer qué controla o gestiona» → «Asignar el tipo».
- B hints: «Si controla hardware, es embebido.» / «MHC-PMS gestiona información clínica.»
- Pares: Bomba de insulina · MHC-PMS · Estación meteorológica · Mantenimiento de estación.

**Práctica (6)**
1. `order` — Bomba de insulina: Medir glucosa → Calcular dosis → Enviar pulsos → Administrar insulina.
2. `fill` — «La bomba de insulina es un sistema {{embebido}}.» · «El MHC-PMS es un sistema de {{información}}.» · «La estación meteorológica adquiere {{datos}} con sensores.» · «Las estaciones usan enlace {{satelital}}.»
3. `match` — sistema ↔ tipo.
4. `justify` — «¿Por qué la bomba de insulina es un sistema crítico de seguridad?» keywords: `dosis, glucosa, salud, disponible, confiable`; minMatches 3.
5. `crossword` — INSULINA, EMBEBIDO, MHC, SENSORES, SATELITAL, PACIENTES.
6. `match` — sistema ↔ requerimiento clave: MHC-PMS↔privacidad · meteorológica↔fiabilidad en ambiente hostil · bomba↔disponibilidad y dosis correcta.

**Evaluación (15)** — 8 `mcq`, 2 `match`, 2 `fill`, 1 `order`, 1 `justify`, 1 `crossword`:
tipo de la bomba · objetivo del MHC-PMS · conflicto privacidad/disponibilidad · ley de salud
mental · componentes de la estación · por qué se mantiene autocontenida · procesamiento local
de la estación · papel del sistema de mantenimiento + 2 enlaces + 2 frases incompletas +
1 orden de la bomba + 1 justificación de confiabilidad + 1 crucigrama de estudios de caso.

---

## Self-Review (cobertura del spec)

- §3 modelo → Tareas 3–5. §4 migración → Tareas 3, 5. §5 navegación → Tareas 7–10.
- §6 lógica pura → Tareas 1–2. §7 viewmodels → Tareas 4, 6–9. §8 UI → Tareas 6–10.
- §9 contenido → Tarea 5 + Apéndice A. §10 pruebas → Tareas 1–2, 10. §11 criterios → Tarea 10.
- Sin placeholders de código en las tareas de lógica y datos; el contenido queda inventariado
  en el Apéndice A y se materializa en `src/data/unit1Content.ts` (Tarea 5).
