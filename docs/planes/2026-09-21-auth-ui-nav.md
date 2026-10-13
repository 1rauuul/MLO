# Login local, datos por cuenta, navegación plana y UI — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir autenticación local offline, mover progreso/resultados a datos por cuenta, dejar todo el progreso en cero, reestructurar la navegación a ≤3 toques y alinear la UI a la captura de referencia.

**Architecture:** MVVM (vista → hook ViewModel → repositorio → expo-sqlite). Se añade `AuthProvider`/`useAuth` sobre `accounts`/`auth_session`; `account_id` se propaga a perfil, progreso y resultados. La migración hace `DROP TABLE` + recreación (versión 2) y siembra solo contenido.

**Tech Stack:** Expo SDK 57, Expo Router (`Stack.Protected`), expo-sqlite, expo-crypto, TypeScript estricto, Jest/jest-expo.

**Spec:** `docs/especificaciones/2026-09-21-auth-ui-nav-design.md`

## Global Constraints

- Offline-first: **ninguna llamada de red** en ninguna capa.
- La vista (`src/app`, `src/components`) **nunca** importa repositorios ni `expo-sqlite`.
- TypeScript estricto; `npx tsc --noEmit` debe salir 0.
- `Exercise`/`Result` y `Evaluation`/`Question` permanecen separadas.
- Paleta actual intacta (`src/theme/tokens.ts`): primario `#315FEC`/`#4D7CFE`, fondos oscuros.
- Única dependencia nueva: `expo-crypto` (SDK 57).
- `npx tsc --noEmit` solo queda verde a partir de la **Tarea 4** (el refactor de tipos afecta varias capas entre Tareas 2–4).
- **No ejecutar `git commit` sin autorización explícita del usuario.** Los pasos de commit del plan se omiten salvo que el usuario lo pida.

---

### Task 1: Lógica pura de autenticación (TDD)

**Files:**
- Create: `src/viewmodels/authLogic.ts`
- Test: `src/viewmodels/__tests__/authLogic.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type Digest = (input: string) => Promise<string>`
  - `normalizeUsername(raw: string): string`
  - `initials(displayName: string): string`
  - `validateRegistration(input: { displayName: string; username: string; password: string; confirm: string }): RegisterError | null`
  - `validateLogin(username: string, password: string): 'missing' | null`
  - `passwordMaterial(salt: string, password: string): string`
  - `hashPassword(password: string, salt: string, digest: Digest): Promise<string>`
  - `verifyPassword(password: string, salt: string, expectedHash: string, digest: Digest): Promise<boolean>`
  - `type RegisterError = 'name_empty' | 'username_empty' | 'username_short' | 'username_invalid' | 'password_short' | 'password_mismatch'`

- [ ] **Step 1: Write the failing test**

Create `src/viewmodels/__tests__/authLogic.test.ts`:

```ts
import {
  hashPassword,
  initials,
  normalizeUsername,
  passwordMaterial,
  validateLogin,
  validateRegistration,
  verifyPassword,
  type Digest,
} from '../authLogic';

const fakeDigest: Digest = async input => `h(${input})`;

describe('normalizeUsername', () => {
  it('recorta y pasa a minúsculas', () => {
    expect(normalizeUsername('  Valentina.Rios ')).toBe('valentina.rios');
  });
});

describe('initials', () => {
  it('toma la primera y la última palabra', () => {
    expect(initials('Valentina Ríos')).toBe('VR');
  });
  it('usa dos letras si hay una sola palabra', () => {
    expect(initials('Valentina')).toBe('VA');
  });
  it('devuelve ? si está vacío', () => {
    expect(initials('   ')).toBe('?');
  });
});

describe('validateRegistration', () => {
  const base = { displayName: 'Ana', username: 'ana', password: 'secreto', confirm: 'secreto' };
  it('acepta datos válidos', () => {
    expect(validateRegistration(base)).toBeNull();
  });
  it('rechaza nombre vacío', () => {
    expect(validateRegistration({ ...base, displayName: '  ' })).toBe('name_empty');
  });
  it('rechaza usuario corto', () => {
    expect(validateRegistration({ ...base, username: 'ab' })).toBe('username_short');
  });
  it('rechaza usuario con caracteres inválidos', () => {
    expect(validateRegistration({ ...base, username: 'ana ríos' })).toBe('username_invalid');
  });
  it('rechaza contraseña corta', () => {
    expect(validateRegistration({ ...base, password: '123', confirm: '123' })).toBe('password_short');
  });
  it('rechaza confirmación distinta', () => {
    expect(validateRegistration({ ...base, confirm: 'otro' })).toBe('password_mismatch');
  });
});

describe('validateLogin', () => {
  it('rechaza credenciales vacías', () => {
    expect(validateLogin('', 'x')).toBe('missing');
    expect(validateLogin('ana', '')).toBe('missing');
  });
  it('acepta credenciales presentes', () => {
    expect(validateLogin('ana', 'secreto')).toBeNull();
  });
});

describe('hash / verify', () => {
  it('construye el material como salt:password', () => {
    expect(passwordMaterial('s1', 'pw')).toBe('s1:pw');
  });
  it('hashea de forma determinista', async () => {
    await expect(hashPassword('pw', 's1', fakeDigest)).resolves.toBe('h(s1:pw)');
  });
  it('verifica correctamente', async () => {
    const hash = await hashPassword('pw', 's1', fakeDigest);
    await expect(verifyPassword('pw', 's1', hash, fakeDigest)).resolves.toBe(true);
    await expect(verifyPassword('otro', 's1', hash, fakeDigest)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/viewmodels/__tests__/authLogic.test.ts`
Expected: FAIL — `Cannot find module '../authLogic'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/viewmodels/authLogic.ts`:

```ts
export type Digest = (input: string) => Promise<string>;

const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export interface RegistrationInput {
  displayName: string;
  username: string;
  password: string;
  confirm: string;
}

export type RegisterError =
  | 'name_empty'
  | 'username_empty'
  | 'username_short'
  | 'username_invalid'
  | 'password_short'
  | 'password_mismatch';

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}

export function validateRegistration(input: RegistrationInput): RegisterError | null {
  if (input.displayName.trim().length === 0) {
    return 'name_empty';
  }
  const username = normalizeUsername(input.username);
  if (username.length === 0) {
    return 'username_empty';
  }
  if (username.length < 3) {
    return 'username_short';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'username_invalid';
  }
  if (input.password.length < 6) {
    return 'password_short';
  }
  if (input.password !== input.confirm) {
    return 'password_mismatch';
  }
  return null;
}

export function validateLogin(username: string, password: string): 'missing' | null {
  if (normalizeUsername(username).length === 0 || password.length === 0) {
    return 'missing';
  }
  return null;
}

export function passwordMaterial(salt: string, password: string): string {
  return `${salt}:${password}`;
}

export async function hashPassword(password: string, salt: string, digest: Digest): Promise<string> {
  return digest(passwordMaterial(salt, password));
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
  digest: Digest,
): Promise<boolean> {
  const actual = await hashPassword(password, salt, digest);
  return actual === expectedHash;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/viewmodels/__tests__/authLogic.test.ts`
Expected: PASS (todos los casos).

- [ ] **Step 5: Commit (solo si el usuario autoriza)**

```bash
git add src/viewmodels/authLogic.ts src/viewmodels/__tests__/authLogic.test.ts
git commit -m "feat(auth): pure local auth logic with tests"
```

---

### Task 2: Modelo de datos, migración y reset a cero

**Files:**
- Modify: `src/models/entities.ts`
- Modify: `src/models/schema.ts`
- Modify: `src/data/db.ts`
- Modify: `src/data/seed.ts`

**Interfaces:**
- Produces:
  - `interface Account { id: number; username: string; displayName: string; createdAt: string }`
  - `interface LearnerProfile { id: number; accountId: number; learningStyle: LearningStyle; darkMode: boolean; largeText: boolean }`
  - `interface Unit` sin `duration`
  - `DATABASE_VERSION = 2`
  - DDL con `accounts`, `auth_session` y `account_id` en `learner_profile`, `module_progress`, `results`, `evaluation_results`.
  - `migrateAndSeed(db)` que dropea y recrea cuando `user_version < 2`.

- [ ] **Step 1: Actualizar entidades**

En `src/models/entities.ts`:
1. Quitar la propiedad `duration: string;` de `interface Unit`.
2. Añadir:

```ts
export interface Account {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
}
```

3. Reemplazar `LearnerProfile` para eliminar `learnerName` y añadir `accountId`:

```ts
export interface LearnerProfile {
  id: number;
  accountId: number;
  learningStyle: LearningStyle;
  darkMode: boolean;
  largeText: boolean;
}
```

- [ ] **Step 2: Reescribir el DDL y la versión**

En `src/models/schema.ts`, cambiar `export const DATABASE_VERSION = 1;` por `= 2;` y reemplazar `SCHEMA_DDL` por:

```ts
export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_session (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY NOT NULL,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  eyebrow TEXT NOT NULL,
  body TEXT NOT NULL,
  code_sample TEXT NOT NULL DEFAULT '',
  context_title TEXT NOT NULL DEFAULT '',
  context_body TEXT NOT NULL DEFAULT '',
  synthesis TEXT NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS examples (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  complexity TEXT NOT NULL,
  title TEXT NOT NULL,
  scenario TEXT NOT NULL,
  before_state TEXT NOT NULL,
  after_state TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  instructions TEXT NOT NULL,
  correct_order TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY NOT NULL,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  options TEXT NOT NULL DEFAULT '[]',
  answer INTEGER NOT NULL,
  explanation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learner_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  learning_style TEXT NOT NULL,
  dark_mode INTEGER NOT NULL DEFAULT 1,
  large_text INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS module_progress (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_unit ON lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_examples_lesson ON examples(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_lesson ON evaluations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_evaluation ON questions(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_progress_account ON module_progress(account_id);
CREATE INDEX IF NOT EXISTS idx_results_account ON results(account_id);
CREATE INDEX IF NOT EXISTS idx_eval_results_account ON evaluation_results(account_id);
`;

export const DROP_ALL_DDL = `
DROP TABLE IF EXISTS auth_session;
DROP TABLE IF EXISTS evaluation_results;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS module_progress;
DROP TABLE IF EXISTS learner_profile;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS examples;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS accounts;
`;
```

- [ ] **Step 3: Migración destructiva en `db.ts`**

Reemplazar `migrateAndSeed` en `src/data/db.ts`:

```ts
import { DATABASE_VERSION, DROP_ALL_DDL, SCHEMA_DDL } from '@/models/schema';

export async function migrateAndSeed(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync(DROP_ALL_DDL);
  await db.execAsync(SCHEMA_DDL);
  await seedDatabase(db);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
```

- [ ] **Step 4: Seed sin duración, sin perfil y sin progreso**

En `src/data/seed.ts`:
1. Quitar `duration` de `interface UnitSeed` y de cada objeto de `units` (borrar las 5 líneas `duration: 'NN min',`).
2. Quitar el parámetro `unit.duration` del `INSERT INTO units (...) VALUES (...)`:

```ts
      await db.runAsync(
        'INSERT INTO units (id, number, title, description, difficulty, color) VALUES (?, ?, ?, ?, ?, ?)',
        unit.id,
        unit.number,
        unit.title,
        unit.description,
        unit.difficulty,
        unit.color,
      );
```

3. Eliminar por completo el bloque final que inserta `learner_profile` y el bucle de `module_progress`; la función `seedDatabase` termina tras insertar las evaluaciones y sus preguntas.

- [ ] **Step 5: Verificar que no queda rastro de duración**

Run: `rg -n "duration" src`
Expected: sin resultados.

> Nota: `npx tsc --noEmit` fallará hasta terminar la Tarea 4 (los consumidores aún usan las firmas viejas). Es esperado.

- [ ] **Step 6: Commit (solo si el usuario autoriza)**

```bash
git add src/models/entities.ts src/models/schema.ts src/data/db.ts src/data/seed.ts
git commit -m "feat(data): per-account schema and zeroed seed"
```

---

### Task 3: Repositorios por cuenta y `AuthProvider`

**Files:**
- Create: `src/data/repositories/accountRepository.ts`
- Modify: `src/data/repositories/profileRepository.ts`
- Modify: `src/data/repositories/progressRepository.ts`
- Modify: `src/data/repositories/exerciseRepository.ts`
- Modify: `src/data/repositories/evaluationRepository.ts`
- Create: `src/viewmodels/useAuth.tsx`

**Interfaces:**
- Consumes: entidades de Task 2; `authLogic` de Task 1.
- Produces:
  - `interface AccountRecord extends Account { passwordHash: string; salt: string }`
  - `insertAccount(db, input: { username: string; displayName: string; passwordHash: string; salt: string }): Promise<number>`
  - `selectAccountByUsername(db, username: string): Promise<AccountRecord | null>`
  - `selectAccountById(db, id: number): Promise<AccountRecord | null>`
  - `selectSessionAccountId(db): Promise<number | null>`, `saveSession(db, accountId: number): Promise<void>`, `clearSession(db): Promise<void>`
  - `selectProfile(db, accountId: number): Promise<LearnerProfile | null>`, `saveProfile(db, profile: LearnerProfile): Promise<void>`, `createDefaultProfile(db, accountId: number): Promise<void>`
  - `selectProgressMap(db, accountId: number): Promise<Record<string, boolean>>`, `markLessonCompleted(db, accountId: number, lessonId: string): Promise<void>`, `countCompletedByUnit(db, accountId: number, unitId: string): Promise<{ completed: number; total: number }>`, `resetAccountProgress(db, accountId: number): Promise<void>`
  - `insertResult(db, accountId: number, exerciseId: string, answer: string, isCorrect: boolean): Promise<void>`
  - `insertEvaluationResult(db, accountId: number, evaluationId: string, score: number, correctCount: number, totalCount: number): Promise<void>`, `selectRecentEvaluationResults(db, accountId: number, limit?): Promise<EvaluationResult[]>`, `selectEvaluationSummaries(db): Promise<EvaluationSummary[]>`
  - `interface EvaluationSummary { id: string; lessonId: string; title: string; description: string; lessonTitle: string; unitNumber: number }`
  - `useAuth(): { account: Account | null; isLoading: boolean; register(input): Promise<AuthOutcome>; login(username, password): Promise<AuthOutcome>; logout(): Promise<void>; resetProgress(): Promise<void> }` con `type AuthOutcome = { ok: true } | { ok: false; error: string }`.

- [ ] **Step 1: Crear `accountRepository.ts`**

```ts
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Account } from '@/models/entities';

export interface AccountRecord extends Account {
  passwordHash: string;
  salt: string;
}

interface AccountRow {
  id: number;
  username: string;
  display_name: string;
  password_hash: string;
  salt: string;
  created_at: string;
}

function mapAccount(row: AccountRow): AccountRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    salt: row.salt,
    createdAt: row.created_at,
  };
}

export async function insertAccount(
  db: SQLiteDatabase,
  input: { username: string; displayName: string; passwordHash: string; salt: string },
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO accounts (username, display_name, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
    input.username,
    input.displayName,
    input.passwordHash,
    input.salt,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

export async function selectAccountByUsername(
  db: SQLiteDatabase,
  username: string,
): Promise<AccountRecord | null> {
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE username = ?', username);
  return row ? mapAccount(row) : null;
}

export async function selectAccountById(db: SQLiteDatabase, id: number): Promise<AccountRecord | null> {
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?', id);
  return row ? mapAccount(row) : null;
}

export async function selectSessionAccountId(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ account_id: number }>(
    'SELECT account_id FROM auth_session WHERE id = 1',
  );
  return row?.account_id ?? null;
}

export async function saveSession(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO auth_session (id, account_id) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET account_id = excluded.account_id`,
    accountId,
  );
}

export async function clearSession(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM auth_session WHERE id = 1');
}
```

- [ ] **Step 2: Actualizar `profileRepository.ts`**

Reemplazar el archivo por:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';

import type { LearnerProfile, LearningStyle } from '@/models/entities';

interface ProfileRow {
  id: number;
  account_id: number;
  learning_style: LearningStyle;
  dark_mode: number;
  large_text: number;
}

function mapProfile(row: ProfileRow): LearnerProfile {
  return {
    id: row.id,
    accountId: row.account_id,
    learningStyle: row.learning_style,
    darkMode: row.dark_mode === 1,
    largeText: row.large_text === 1,
  };
}

export async function selectProfile(db: SQLiteDatabase, accountId: number): Promise<LearnerProfile | null> {
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT * FROM learner_profile WHERE account_id = ?',
    accountId,
  );
  return row ? mapProfile(row) : null;
}

export async function saveProfile(db: SQLiteDatabase, profile: LearnerProfile): Promise<void> {
  await db.runAsync(
    `INSERT INTO learner_profile (account_id, learning_style, dark_mode, large_text)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(account_id) DO UPDATE SET
       learning_style = excluded.learning_style,
       dark_mode = excluded.dark_mode,
       large_text = excluded.large_text`,
    profile.accountId,
    profile.learningStyle,
    profile.darkMode ? 1 : 0,
    profile.largeText ? 1 : 0,
  );
}

export async function createDefaultProfile(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO learner_profile (account_id, learning_style, dark_mode, large_text)
     VALUES (?, 'Pragmático', 1, 0)
     ON CONFLICT(account_id) DO NOTHING`,
    accountId,
  );
}
```

- [ ] **Step 3: Actualizar `progressRepository.ts`**

Reemplazar el archivo por:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';

interface ProgressRow {
  lesson_id: string;
  completed: number;
}

export async function selectProgressMap(
  db: SQLiteDatabase,
  accountId: number,
): Promise<Record<string, boolean>> {
  const rows = await db.getAllAsync<ProgressRow>(
    'SELECT lesson_id, completed FROM module_progress WHERE account_id = ?',
    accountId,
  );
  const map: Record<string, boolean> = {};
  for (const row of rows) {
    map[row.lesson_id] = row.completed === 1;
  }
  return map;
}

export async function markLessonCompleted(
  db: SQLiteDatabase,
  accountId: number,
  lessonId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO module_progress (account_id, lesson_id, completed, updated_at) VALUES (?, ?, 1, ?)
     ON CONFLICT(account_id, lesson_id) DO UPDATE SET completed = 1, updated_at = excluded.updated_at`,
    accountId,
    lessonId,
    new Date().toISOString(),
  );
}

export async function countCompletedByUnit(
  db: SQLiteDatabase,
  accountId: number,
  unitId: string,
): Promise<{ completed: number; total: number }> {
  const totalRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM lessons WHERE unit_id = ?',
    unitId,
  );
  const completedRow = await db.getFirstAsync<{ completed: number }>(
    `SELECT COUNT(*) AS completed
     FROM lessons l
     JOIN module_progress p ON p.lesson_id = l.id
     WHERE l.unit_id = ? AND p.account_id = ? AND p.completed = 1`,
    unitId,
    accountId,
  );
  return { completed: completedRow?.completed ?? 0, total: totalRow?.total ?? 0 };
}

export async function resetAccountProgress(db: SQLiteDatabase, accountId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM module_progress WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM evaluation_results WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM results WHERE account_id = ?', accountId);
  });
}
```

- [ ] **Step 4: Actualizar `exerciseRepository.ts`**

Cambiar solo `insertResult`:

```ts
export async function insertResult(
  db: SQLiteDatabase,
  accountId: number,
  exerciseId: string,
  answer: string,
  isCorrect: boolean,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO results (account_id, exercise_id, answer, is_correct, created_at) VALUES (?, ?, ?, ?, ?)',
    accountId,
    exerciseId,
    answer,
    isCorrect ? 1 : 0,
    new Date().toISOString(),
  );
}
```

- [ ] **Step 5: Actualizar `evaluationRepository.ts`**

Añadir `accountId` a `insertEvaluationResult` y `selectRecentEvaluationResults`, y agregar `selectEvaluationSummaries`:

```ts
export async function insertEvaluationResult(
  db: SQLiteDatabase,
  accountId: number,
  evaluationId: string,
  score: number,
  correctCount: number,
  totalCount: number,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO evaluation_results (account_id, evaluation_id, score, correct_count, total_count, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    accountId,
    evaluationId,
    Math.round(score),
    correctCount,
    totalCount,
    new Date().toISOString(),
  );
}

export async function selectRecentEvaluationResults(
  db: SQLiteDatabase,
  accountId: number,
  limit = 5,
): Promise<EvaluationResult[]> {
  const rows = await db.getAllAsync<EvaluationResultRow>(
    `SELECT er.id, er.evaluation_id, er.score, er.correct_count, er.total_count, er.created_at
     FROM evaluation_results er
     WHERE er.account_id = ?
     ORDER BY er.created_at DESC
     LIMIT ?`,
    accountId,
    limit,
  );
  return rows.map(row => ({
    id: row.id,
    evaluationId: row.evaluation_id,
    score: row.score,
    correctCount: row.correct_count,
    totalCount: row.total_count,
    createdAt: row.created_at,
  }));
}

export interface EvaluationSummary {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  lessonTitle: string;
  unitNumber: number;
}

interface EvaluationSummaryRow {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  lesson_title: string;
  unit_number: number;
}

export async function selectEvaluationSummaries(db: SQLiteDatabase): Promise<EvaluationSummary[]> {
  const rows = await db.getAllAsync<EvaluationSummaryRow>(
    `SELECT e.id, e.lesson_id, e.title, e.description, l.title AS lesson_title, u.number AS unit_number
     FROM evaluations e
     JOIN lessons l ON l.id = e.lesson_id
     JOIN units u ON u.id = l.unit_id
     ORDER BY u.number, l.position`,
  );
  return rows.map(row => ({
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    description: row.description,
    lessonTitle: row.lesson_title,
    unitNumber: row.unit_number,
  }));
}
```

En `EvaluationResultRow` se puede quitar el campo `title` (ya no se hace JOIN): dejar solo `id, evaluation_id, score, correct_count, total_count, created_at`.

- [ ] **Step 6: Crear `useAuth.tsx`**

```tsx
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  clearSession,
  insertAccount,
  saveSession,
  selectAccountById,
  selectAccountByUsername,
  selectSessionAccountId,
} from '@/data/repositories/accountRepository';
import { createDefaultProfile } from '@/data/repositories/profileRepository';
import { resetAccountProgress } from '@/data/repositories/progressRepository';
import type { Account } from '@/models/entities';

import {
  hashPassword,
  normalizeUsername,
  validateLogin,
  validateRegistration,
  verifyPassword,
  type Digest,
} from './authLogic';

const sha256: Digest = input =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);

export type AuthOutcome = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  account: Account | null;
  isLoading: boolean;
  register: (input: {
    displayName: string;
    username: string;
    password: string;
    confirm: string;
  }) => Promise<AuthOutcome>;
  login: (username: string, password: string) => Promise<AuthOutcome>;
  logout: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const accountId = await selectSessionAccountId(db);
      const loaded = accountId ? await selectAccountById(db, accountId) : null;
      if (!active) {
        return;
      }
      setAccount(loaded ? { id: loaded.id, username: loaded.username, displayName: loaded.displayName, createdAt: loaded.createdAt } : null);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db]);

  const register = useCallback<AuthContextValue['register']>(
    async input => {
      const error = validateRegistration(input);
      if (error) {
        return { ok: false, error };
      }
      const username = normalizeUsername(input.username);
      const existing = await selectAccountByUsername(db, username);
      if (existing) {
        return { ok: false, error: 'username_taken' };
      }
      const salt = Crypto.randomUUID();
      const passwordHash = await hashPassword(input.password, salt, sha256);
      const id = await insertAccount(db, {
        username,
        displayName: input.displayName.trim(),
        passwordHash,
        salt,
      });
      await createDefaultProfile(db, id);
      await saveSession(db, id);
      setAccount({ id, username, displayName: input.displayName.trim(), createdAt: new Date().toISOString() });
      return { ok: true };
    },
    [db],
  );

  const login = useCallback<AuthContextValue['login']>(
    async (username, password) => {
      if (validateLogin(username, password)) {
        return { ok: false, error: 'missing' };
      }
      const found = await selectAccountByUsername(db, normalizeUsername(username));
      if (!found) {
        return { ok: false, error: 'invalid_credentials' };
      }
      const valid = await verifyPassword(password, found.salt, found.passwordHash, sha256);
      if (!valid) {
        return { ok: false, error: 'invalid_credentials' };
      }
      await saveSession(db, found.id);
      setAccount({
        id: found.id,
        username: found.username,
        displayName: found.displayName,
        createdAt: found.createdAt,
      });
      return { ok: true };
    },
    [db],
  );

  const logout = useCallback(async () => {
    await clearSession(db);
    setAccount(null);
  }, [db]);

  const resetProgress = useCallback(async () => {
    if (!account) {
      return;
    }
    await resetAccountProgress(db, account.id);
  }, [account, db]);

  const value = useMemo<AuthContextValue>(
    () => ({ account, isLoading, register, login, logout, resetProgress }),
    [account, isLoading, register, login, logout, resetProgress],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
```

- [ ] **Step 7: Instalar expo-crypto**

Run: `npx expo install expo-crypto`
Expected: añade `expo-crypto` a `package.json` sin errores.

> Nota: `npx tsc --noEmit` aún fallará (hooks pendientes). Continúa a la Tarea 4.

- [ ] **Step 8: Commit (solo si el usuario autoriza)**

```bash
git add src/data/repositories src/viewmodels/useAuth.tsx package.json package-lock.json
git commit -m "feat(auth): account repository and auth provider"
```

---

### Task 4: Hooks ViewModel por cuenta (typecheck verde)

**Files:**
- Modify: `src/viewmodels/useLearnerProfile.tsx`
- Modify: `src/viewmodels/useCatalog.ts`
- Modify: `src/viewmodels/useModuleProgress.ts`
- Modify: `src/viewmodels/useRecentResults.ts`
- Modify: `src/viewmodels/useQuizEngine.ts`
- Modify: `src/viewmodels/useExerciseEngine.ts`
- Create: `src/viewmodels/useEvaluationsCatalog.ts`
- Create: `src/viewmodels/useLessonHub.ts`

**Interfaces:**
- Consumes: repositorios de Task 3, `useAuth` de Task 3.
- Produces:
  - `useLearnerProfile()` sin `profile.learnerName` (mismo resto de la firma).
  - `useCatalog()` igual firma; `progressMap` vacío si no hay cuenta.
  - `useModuleProgress(unitId?)` igual firma; no-ops sin cuenta.
  - `useRecentResults(limit?)` igual firma.
  - `useRecordEvaluationResult()` → `(evaluationId, score, correctCount, totalCount) => Promise<void>`.
  - `useRecordExerciseResult()` → `(exerciseId, answer, correct) => Promise<void>`.
  - `useExercisesForLesson(lessonId: string | null): { exercises: Exercise[]; isLoading: boolean }`.
  - `useEvaluationsCatalog(): { summaries: EvaluationSummary[]; isLoading: boolean }`.
  - `useLessonHub(lessonId: string | null): { lesson: Lesson | null; unit: Unit | null; examples: Example[]; exercises: Exercise[]; evaluation: Evaluation | null; completed: boolean; isLoading: boolean }`.

- [ ] **Step 1: `useLearnerProfile.tsx` dependiente de auth**

Reemplazar el cuerpo del provider (mantener el nombre de archivo y export). Claves del cambio: consumir `useAuth`, quitar `DEFAULT_PROFILE.learnerName`, y recargar al cambiar de cuenta.

```tsx
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { saveProfile, selectProfile } from '@/data/repositories/profileRepository';
import type { LearnerProfile, LearningStyle } from '@/models/entities';
import { useAuth } from './useAuth';

interface LearnerProfileContextValue {
  profile: LearnerProfile | null;
  isLoading: boolean;
  style: LearningStyle;
  darkMode: boolean;
  largeText: boolean;
  setStyle: (style: LearningStyle) => void;
  setDarkMode: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  saveQuestionnaire: (style: LearningStyle) => void;
}

const FALLBACK_STYLE: LearningStyle = 'Pragmático';
const LearnerProfileContext = createContext<LearnerProfileContextValue | null>(null);

export function LearnerProfileProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileRef = useRef<LearnerProfile | null>(null);

  useEffect(() => {
    let active = true;
    if (!account) {
      profileRef.current = null;
      setProfile(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }
    (async () => {
      const loaded = await selectProfile(db, account.id);
      if (!active) {
        return;
      }
      profileRef.current = loaded;
      setProfile(loaded);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, account]);

  const update = useCallback(
    (changes: Partial<LearnerProfile>) => {
      const current = profileRef.current;
      if (!current) {
        return;
      }
      const next = { ...current, ...changes };
      profileRef.current = next;
      setProfile(next);
      void saveProfile(db, next);
    },
    [db],
  );

  const setStyle = useCallback((style: LearningStyle) => update({ learningStyle: style }), [update]);
  const setDarkMode = useCallback((darkMode: boolean) => update({ darkMode }), [update]);
  const setLargeText = useCallback((largeText: boolean) => update({ largeText }), [update]);

  const value = useMemo<LearnerProfileContextValue>(
    () => ({
      profile,
      isLoading,
      style: profile?.learningStyle ?? FALLBACK_STYLE,
      darkMode: profile?.darkMode ?? true,
      largeText: profile?.largeText ?? false,
      setStyle,
      setDarkMode,
      setLargeText,
      saveQuestionnaire: setStyle,
    }),
    [profile, isLoading, setStyle, setDarkMode, setLargeText],
  );

  return <LearnerProfileContext.Provider value={value}>{children}</LearnerProfileContext.Provider>;
}

export function useLearnerProfile(): LearnerProfileContextValue {
  const context = useContext(LearnerProfileContext);
  if (!context) {
    throw new Error('useLearnerProfile debe usarse dentro de LearnerProfileProvider');
  }
  return context;
}
```

- [ ] **Step 2: `useCatalog.ts` con `accountId`**

```ts
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectLessonsByUnit, selectUnits } from '@/data/repositories/lessonRepository';
import { selectProgressMap } from '@/data/repositories/progressRepository';
import type { Lesson, Unit } from '@/models/entities';
import { useAuth } from './useAuth';

interface CatalogResult {
  units: Unit[];
  lessonsByUnit: Record<string, Lesson[]>;
  progressMap: Record<string, boolean>;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCatalog(): CatalogResult {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, Lesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loadedUnits = await selectUnits(db);
    const grouped: Record<string, Lesson[]> = {};
    for (const unit of loadedUnits) {
      grouped[unit.id] = await selectLessonsByUnit(db, unit.id);
    }
    const progress = account ? await selectProgressMap(db, account.id) : {};
    setUnits(loadedUnits);
    setLessonsByUnit(grouped);
    setProgressMap(progress);
    setIsLoading(false);
  }, [db, account]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { units, lessonsByUnit, progressMap, isLoading, refresh };
}
```

- [ ] **Step 3: `useModuleProgress.ts` con `accountId`**

```ts
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { countCompletedByUnit, markLessonCompleted, selectProgressMap } from '@/data/repositories/progressRepository';
import { useAuth } from './useAuth';

interface ModuleProgressResult {
  progressMap: Record<string, boolean>;
  completed: number;
  total: number;
  markCompleted: (lessonId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useModuleProgress(unitId?: string): ModuleProgressResult {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (!account) {
      setProgressMap({});
      setCompleted(0);
      setTotal(0);
      return;
    }
    setProgressMap(await selectProgressMap(db, account.id));
    if (unitId) {
      const stats = await countCompletedByUnit(db, account.id, unitId);
      setCompleted(stats.completed);
      setTotal(stats.total);
    }
  }, [db, account, unitId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markCompleted = useCallback(
    async (lessonId: string) => {
      if (!account) {
        return;
      }
      await markLessonCompleted(db, account.id, lessonId);
      await refresh();
    },
    [db, account, refresh],
  );

  return { progressMap, completed, total, markCompleted, refresh };
}
```

- [ ] **Step 4: `useRecentResults.ts` con `accountId`**

```ts
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { selectRecentEvaluationResults } from '@/data/repositories/evaluationRepository';
import type { EvaluationResult } from '@/models/entities';
import { useAuth } from './useAuth';

interface RecentResultsResult {
  results: EvaluationResult[];
  averageScore: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useRecentResults(limit = 5): RecentResultsResult {
  const db = useSQLiteContext();
  const { account } = useAuth();
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loaded = account ? await selectRecentEvaluationResults(db, account.id, limit) : [];
    setResults(loaded);
    setIsLoading(false);
  }, [db, account, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const averageScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((total, result) => total + result.score, 0) / results.length);

  return { results, averageScore, isLoading, refresh };
}
```

- [ ] **Step 5: `useQuizEngine.ts` — grabación por cuenta**

Reemplazar `useRecordEvaluationResult`:

```ts
export function useRecordEvaluationResult(): (
  evaluationId: string,
  score: number,
  correctCount: number,
  totalCount: number,
) => Promise<void> {
  const db = useSQLiteContext();
  const { account } = useAuth();
  return useCallback(
    async (evaluationId, score, correctCount, totalCount) => {
      if (!account) {
        return;
      }
      await insertEvaluationResult(db, account.id, evaluationId, score, correctCount, totalCount);
    },
    [db, account],
  );
}
```

Añadir el import `import { useAuth } from './useAuth';`.

- [ ] **Step 6: `useExerciseEngine.ts` — grabación y lista completa**

Reemplazar `useRecordExerciseResult` y añadir `useExercisesForLesson`:

```ts
export function useRecordExerciseResult(): (
  exerciseId: string,
  answer: string,
  correct: boolean,
) => Promise<void> {
  const db = useSQLiteContext();
  const { account } = useAuth();
  return useCallback(
    async (exerciseId, answer, correct) => {
      if (!account) {
        return;
      }
      await insertResult(db, account.id, exerciseId, answer, correct);
    },
    [db, account],
  );
}

interface UseExercisesForLessonResult {
  exercises: Exercise[];
  isLoading: boolean;
}

export function useExercisesForLesson(lessonId: string | null): UseExercisesForLessonResult {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setExercises([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      const loaded = await selectExercisesByLesson(db, lessonId);
      if (!active) {
        return;
      }
      setExercises(loaded);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId]);

  return { exercises, isLoading };
}
```

Añadir el import `import { useAuth } from './useAuth';`.

- [ ] **Step 7: Crear `useEvaluationsCatalog.ts`**

```ts
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { selectEvaluationSummaries, type EvaluationSummary } from '@/data/repositories/evaluationRepository';

interface EvaluationsCatalogResult {
  summaries: EvaluationSummary[];
  isLoading: boolean;
}

export function useEvaluationsCatalog(): EvaluationsCatalogResult {
  const db = useSQLiteContext();
  const [summaries, setSummaries] = useState<EvaluationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const loaded = await selectEvaluationSummaries(db);
      if (!active) {
        return;
      }
      setSummaries(loaded);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db]);

  return { summaries, isLoading };
}
```

- [ ] **Step 8: Crear `useLessonHub.ts`**

```ts
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { selectEvaluationByLesson } from '@/data/repositories/evaluationRepository';
import { selectExercisesByLesson } from '@/data/repositories/exerciseRepository';
import { selectExamplesByLesson } from '@/data/repositories/exampleRepository';
import { selectLesson } from '@/data/repositories/lessonRepository';
import type { Evaluation, Example, Exercise, Lesson, Unit } from '@/models/entities';
import { useAuth } from './useAuth';
import { useCatalog } from './useCatalog';
import { useModuleProgress } from './useModuleProgress';

interface LessonHubResult {
  lesson: Lesson | null;
  unit: Unit | null;
  examples: Example[];
  exercises: Exercise[];
  evaluation: Evaluation | null;
  completed: boolean;
  isLoading: boolean;
}

export function useLessonHub(lessonId: string | null): LessonHubResult {
  const db = useSQLiteContext();
  const { units } = useCatalog();
  const { progressMap } = useModuleProgress();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setExamples([]);
      setExercises([]);
      setEvaluation(null);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      const [loadedLesson, loadedExamples, loadedExercises, loadedEvaluation] = await Promise.all([
        selectLesson(db, lessonId),
        selectExamplesByLesson(db, lessonId),
        selectExercisesByLesson(db, lessonId),
        selectEvaluationByLesson(db, lessonId),
      ]);
      if (!active) {
        return;
      }
      setLesson(loadedLesson);
      setExamples(loadedExamples);
      setExercises(loadedExercises);
      setEvaluation(loadedEvaluation);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, lessonId]);

  const unit = units.find(item => item.id === lesson?.unitId) ?? null;

  return {
    lesson,
    unit,
    examples,
    exercises,
    evaluation,
    completed: lesson ? !!progressMap[lesson.id] : false,
    isLoading,
  };
}
```

- [ ] **Step 9: Typecheck verde**

Run: `npx tsc --noEmit`
Expected: exit 0. Si hay errores, son de pantallas que aún referencian `duration`/`learnerName`; se corrigen en la Tarea 5.

- [ ] **Step 10: Commit (solo si el usuario autoriza)**

```bash
git add src/viewmodels
git commit -m "feat(viewmodels): per-account data hooks"
```

---

### Task 5: Pantallas de login/registro y guardas de ruta

**Files:**
- Create: `src/components/TextField.tsx`
- Create: `src/app/login.tsx`
- Create: `src/app/register.tsx`
- Create: `src/app/(app)/_layout.tsx`
- Modify: `src/app/_layout.tsx`
- Move a `src/app/(app)/`: `index.tsx`, `tema/[id].tsx`, `lecciones/[id].tsx`, `ejemplos/[id].tsx`, `ejercicios/[id].tsx`, `evaluacion/index.tsx`
- Delete: `src/app/lecciones/index.tsx`, `src/app/ejemplos/index.tsx`, `src/app/ejercicios/index.tsx`

**Interfaces:**
- Consumes: `useAuth` de Task 3.
- Produces: rutas `/login`, `/register`; grupo `(app)` protegido.

- [ ] **Step 1: Crear `TextField.tsx`**

```tsx
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, style, ...rest }: TextFieldProps) {
  const { colors, radius, scale } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="eyebrow" color={colors.muted}>
        {label}
      </AppText>
      <TextInput
        {...rest}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.line,
            color: colors.text,
            borderRadius: radius.control,
            fontSize: 15 * scale,
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: { borderWidth: 1, paddingHorizontal: 14, minHeight: 48 },
});
```

- [ ] **Step 2: Crear `src/app/login.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/theme-provider';
import { useAuth } from '@/viewmodels/useAuth';

const MESSAGES: Record<string, string> = {
  missing: 'Completa usuario y contraseña.',
  invalid_credentials: 'Usuario o contraseña incorrectos.',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const result = await login(username, password);
    if (result.ok) {
      router.replace('/');
    } else {
      setError(MESSAGES[result.error] ?? 'No se pudo iniciar sesión.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="eyebrow">Objeto de aprendizaje</AppText>
        <AppText variant="title">Ingeniería de Software</AppText>
        <AppText variant="small">Continúa tu ruta de aprendizaje.</AppText>
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
        <AppText variant="heading">Iniciar sesión</AppText>
        <TextField
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="tu.usuario"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••"
        />
        {error ? (
          <AppText variant="small" color={colors.danger}>
            {error}
          </AppText>
        ) : null}
        <PrimaryButton label="Entrar" onPress={submit} />
        <SecondaryButton label="Crear cuenta" onPress={() => router.push('/register')} />
      </View>
      <AppText variant="small" style={{ marginTop: spacing.lg }}>
        Tus datos se guardan solo en este dispositivo.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingBottom: 32 },
  hero: { gap: 4, marginBottom: 20 },
  card: { borderWidth: 1, padding: 20, gap: 14 },
});
```

- [ ] **Step 3: Crear `src/app/register.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/theme-provider';
import { useAuth } from '@/viewmodels/useAuth';

const MESSAGES: Record<string, string> = {
  name_empty: 'Escribe tu nombre.',
  username_empty: 'Elige un usuario.',
  username_short: 'El usuario debe tener al menos 3 caracteres.',
  username_invalid: 'Usa solo letras, números, punto, guion o guion bajo.',
  password_short: 'La contraseña debe tener al menos 6 caracteres.',
  password_mismatch: 'Las contraseñas no coinciden.',
  username_taken: 'Ese usuario ya existe en este dispositivo.',
};

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const { colors, radius, spacing } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const result = await register({ displayName, username, password, confirm });
    if (result.ok) {
      router.replace('/');
    } else {
      setError(MESSAGES[result.error] ?? 'No se pudo crear la cuenta.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <AppText variant="eyebrow">Primer acceso</AppText>
        <AppText variant="title">Crea tu cuenta</AppText>
        <AppText variant="small">Todo se guarda de forma local y sin conexión.</AppText>
      </View>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
        <TextField label="Nombre" value={displayName} onChangeText={setDisplayName} placeholder="Valentina Ríos" />
        <TextField
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="valentina"
        />
        <TextField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />
        <TextField
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••"
        />
        {error ? (
          <AppText variant="small" color={colors.danger}>
            {error}
          </AppText>
        ) : null}
        <PrimaryButton label="Crear cuenta" onPress={submit} />
        <SecondaryButton label="Ya tengo cuenta" onPress={() => router.back()} />
      </View>
      <AppText variant="small" style={{ marginTop: spacing.lg }}>
        El progreso empieza en cero.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingBottom: 32 },
  hero: { gap: 4, marginBottom: 20 },
  card: { borderWidth: 1, padding: 20, gap: 14 },
});
```

- [ ] **Step 4: Mover rutas autenticadas al grupo `(app)` y borrar listas intermedias**

```bash
git mv src/app/index.tsx "src/app/(app)/index.tsx"
git mv "src/app/tema" "src/app/(app)/tema"
git mv "src/app/lecciones/[id].tsx" "src/app/(app)/lecciones/[id].tsx"
git mv "src/app/ejemplos/[id].tsx" "src/app/(app)/ejemplos/[id].tsx"
git mv "src/app/ejercicios/[id].tsx" "src/app/(app)/ejercicios/[id].tsx"
git mv "src/app/evaluacion" "src/app/(app)/evaluacion"
git rm src/app/lecciones/index.tsx src/app/ejemplos/index.tsx src/app/ejercicios/index.tsx
```

> En PowerShell, los `git mv` de directorios crean la carpeta de destino. Si `src/app/(app)` no existe, créala primero con `New-Item -ItemType Directory -Path "src/app/(app)"`.

- [ ] **Step 5: Crear `src/app/(app)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 6: Reescribir `src/app/_layout.tsx` con `Stack.Protected`**

```tsx
import { SplashScreen, Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateAndSeed } from '@/data/db';
import { AppThemeProvider } from '@/theme/theme-provider';
import { AuthProvider, useAuth } from '@/viewmodels/useAuth';
import { LearnerProfileProvider } from '@/viewmodels/useLearnerProfile';
import { SessionProvider } from '@/viewmodels/useSession';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateAndSeed}>
          <AuthProvider>
            <SessionProvider>
              <LearnerProfileProvider>
                <AppThemeProvider>
                  <StatusBar style="auto" />
                  <RootNavigator />
                </AppThemeProvider>
              </LearnerProfileProvider>
            </SessionProvider>
          </AuthProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { account, isLoading } = useAuth();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!account}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!account}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
```

- [ ] **Step 7: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0. Si aparecen errores de rutas tipadas por `.expo/types/router.d.ts` desactualizado, elimina ese archivo (`Remove-Item -LiteralPath ".expo/types/router.d.ts" -ErrorAction SilentlyContinue`) y vuelve a correr `npx tsc --noEmit`.

- [ ] **Step 8: Commit (solo si el usuario autoriza)**

```bash
git add src/app src/components/TextField.tsx
git commit -m "feat(auth): login/register screens and protected routes"
```

---

### Task 6: Navegación ≤3 toques (home expandible, hub directo, evaluaciones reales)

**Files:**
- Modify: `src/app/(app)/index.tsx`
- Modify: `src/app/(app)/tema/[id].tsx`
- Modify: `src/components/UnitCard.tsx`
- Modify: `src/components/SubtopicRow.tsx` (opcional, sin duración)

**Interfaces:**
- Consumes: `useLessonHub`, `useEvaluationsCatalog`, `useAuth` (Task 4/3).
- Produces: Home con unidades expandibles; hub con acciones directas.

- [ ] **Step 1: `UnitCard` expandible sin duración**

Reemplazar el cuerpo de `src/components/UnitCard.tsx` (quitar `MetadataBadge` de duración; el chip de dificultad se conserva; `onOpen` se sustituye por `onToggle`, usado por la tarjeta y la fila inferior):

```tsx
import { Pressable, StyleSheet, View } from 'react-native';

import type { Unit } from '@/models/entities';
import { useTheme } from '@/theme/theme-provider';

import { AppText } from './AppText';
import { MetadataBadge } from './MetadataBadge';
import { ProgressRing } from './ProgressRing';

interface UnitCardProps {
  unit: Unit;
  subtopicCount: number;
  progress: number;
  expanded: boolean;
  onToggle: () => void;
}

export function UnitCard({ unit, subtopicCount, progress, expanded, onToggle }: UnitCardProps) {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} temas de la unidad ${unit.number}, ${unit.title}`}
        onPress={onToggle}
        style={styles.main}>
        <View style={[styles.icon, { backgroundColor: colors.primary, borderRadius: radius.control }]}>
          <AppText variant="code" color={colors.onPrimary} weight="700">
            {String(unit.number).padStart(2, '0')}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="eyebrow">Unidad {unit.number}</AppText>
          <AppText variant="heading">{unit.title}</AppText>
          <AppText variant="small" color={colors.muted}>
            {unit.description}
          </AppText>
          <View style={styles.badges}>
            <MetadataBadge>{unit.difficulty}</MetadataBadge>
          </View>
        </View>
        <ProgressRing value={progress} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} temas de ${unit.title}`}
        onPress={onToggle}
        style={[styles.expand, { borderTopColor: colors.line }]}>
        <AppText variant="small" color={colors.text} weight="600">
          {expanded ? 'Ocultar temas' : `Ver ${subtopicCount} temas`}
        </AppText>
        <AppText variant="small" color={colors.text}>
          {expanded ? '↑' : '↓'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  main: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  icon: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  expand: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
});
```

> Nota: se eliminan `styles.detail` y el bloque expandido interno (ahora los subtemas se renderizan desde la Home).

- [ ] **Step 2: Home con unidades expandibles y tabs reales**

En `src/app/(app)/index.tsx`:

1. Imports: añade `initials` de `@/viewmodels/authLogic`, `useAuth`, `useEvaluationsCatalog`; elimina `DEFAULT`/nombres fijos.
2. En `HomeScreen`, obtener `const { account, logout, resetProgress } = useAuth();`.
3. Pasar `learnerName={account?.displayName ?? ''}` y `accountUsername={account?.username ?? ''}` a `ProfileTab`; pasar `onLogout={logout}` y `onResetProgress={resetProgress}`.
4. `ModulesTab`: quitar `onOpenUnit` de `ModulesTabProps` y de la llamada en `HomeScreen`; la expansión por defecto es la unidad en curso:

```tsx
  const [expanded, setExpanded] = useState<string | null>(null);
  const currentUnit =
    units.find(unit => (lessonsByUnit[unit.id] ?? []).some(lesson => !progressMap[lesson.id])) ?? units[0];
  const expandedId = expanded ?? currentUnit?.id ?? null;
  ...
  {units.map(unit => {
    const lessons = lessonsByUnit[unit.id] ?? [];
    const done = lessons.filter(lesson => progressMap[lesson.id]).length;
    const progress = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
    const isExpanded = expandedId === unit.id;
    return (
      <View key={unit.id} style={styles.unitBlock}>
        <UnitCard
          unit={unit}
          subtopicCount={lessons.length}
          progress={progress}
          expanded={isExpanded}
          onToggle={() => setExpanded(isExpanded ? '' : unit.id)}
        />
        {isExpanded && (
          <View style={[styles.inlineSubtopics, { paddingLeft: spacing.md }]}>
            {lessons.map(lesson => (
              <SubtopicRow
                key={lesson.id}
                lesson={lesson}
                completed={!!progressMap[lesson.id]}
                onPress={() => onOpenLesson(unit.id, lesson.id)}
              />
            ))}
          </View>
        )}
      </View>
    );
  })}
```

> `setExpanded('')` colapsa la unidad (ningún id coincide con `''`, y `expanded ?? currentUnit.id` no aplica porque `''` no es null).

5. `ModulesTab` ya no recibe `onOpenUnit`. El hero "Continuar" navega a la primera lección pendiente de la unidad en curso:

```tsx
  const nextLesson = currentLessons.find(lesson => !progressMap[lesson.id]) ?? currentLessons[0];
  ...
  onPress={() => nextLesson && onOpenLesson(currentUnit.id, nextLesson.id)}
```

6. Encabezado con datos reales:

```tsx
  <AppText variant="title">Hola, {learnerName || 'estudiante'}</AppText>
  ...
  <AppText variant="code" color={colors.primary} weight="700">
    {initials(learnerName || 'Estudiante')}
  </AppText>
```

7. `AssessmentsTab`: sustituir el contenido fijo por el catálogo real:

```tsx
interface AssessmentsTabProps {
  results: EvaluationResult[];
  onOpen: (lessonId: string) => void;
}

function AssessmentsTab({ results, onOpen }: AssessmentsTabProps) {
  const { colors, radius } = useTheme();
  const { summaries } = useEvaluationsCatalog();

  return (
    <View>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">Evaluación formativa</AppText>
          <AppText variant="title">Comprobaciones</AppText>
        </View>
      </View>

      <SectionHeading eyebrow="Disponibles" title="Tus evaluaciones" trailing={String(summaries.length).padStart(2, '0')} />
      {summaries.length === 0 ? (
        <EmptyState title="Sin evaluaciones" message="Aún no hay comprobaciones disponibles." />
      ) : (
        <View style={styles.list}>
          {summaries.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir evaluación ${item.title}`}
              onPress={() => onOpen(item.lessonId)}
              style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
              <View style={[styles.historyMark, { backgroundColor: colors.soft }]}>
                <AppText color={colors.primary} weight="700">
                  ✓
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText weight="600">{item.title}</AppText>
                <AppText variant="small">{`Unidad ${String(item.unitNumber).padStart(2, '0')} · ${item.lessonTitle}`}</AppText>
              </View>
              <AppText color={colors.muted} weight="700">
                →
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      <SectionHeading eyebrow="Resultados recientes" title="Tu historial" />
      {results.length === 0 ? (
        <EmptyState title="Sin resultados todavía" message="Completa una evaluación y aquí verás tu puntuación." />
      ) : (
        <View style={styles.list}>
          {results.map(result => (
            <View
              key={result.id}
              style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.control }]}>
              <View style={[styles.historyMark, { backgroundColor: colors.soft }]}>
                <AppText color={colors.success} weight="700">
                  ✓
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText weight="600">{`Comprobación ${result.correctCount}/${result.totalCount}`}</AppText>
                <AppText variant="small">{new Date(result.createdAt).toLocaleDateString('es-ES')}</AppText>
              </View>
              <AppText weight="700" color={colors.primary}>
                {result.score}%
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
```

> Añade `Pressable` al import de `react-native` (ya está) y `EvaluationResult` al import de `@/models/entities`.

8. `ProfileTab`: añadir `accountUsername`, `onLogout`, `onResetProgress`; mostrar el usuario y dos botones al final:

```tsx
      <SectionHeading eyebrow="Cuenta" title="Sesión" />
      <View style={styles.list}>
        <SettingRow title={learnerName} subtitle={`@${accountUsername}`} control={null} />
      </View>
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <PrimaryButton label="Cerrar sesión" onPress={onLogout} />
        <SecondaryButton label="Reiniciar mi progreso" onPress={onResetProgress} />
      </View>
```

> Importa `PrimaryButton`/`SecondaryButton` desde `@/components/Buttons`. `SettingRow` debe aceptar `control: React.ReactNode | null` (cámbialo de `React.ReactNode` a `React.ReactNode` ya acepta null).

9. Pasar `onOpen` a `AssessmentsTab` en `HomeScreen`:

```tsx
        {tab === 'assessments' && (
          <AssessmentsTab
            results={results}
            onOpen={lessonId => router.push({ pathname: '/evaluacion', params: { lesson: lessonId } })}
          />
        )}
```

- [ ] **Step 3: Reescribir el hub `tema/[id].tsx` con acciones directas**

Reemplazar el archivo por:

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/theme-provider';
import { useLessonHub } from '@/viewmodels/useLessonHub';
import { useSession } from '@/viewmodels/useSession';

export default function TopicHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? null;
  const { lesson, unit, examples, exercises, evaluation, completed } = useLessonHub(lessonId);
  const session = useSession();
  const router = useRouter();
  const { colors, radius } = useTheme();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (lesson) {
      session.openLesson(lesson.unitId, lesson.id);
    }
  }, [lesson, session]);

  if (!lesson) {
    return (
      <Screen>
        <EmptyState title="Cargando" message="Preparando el tema." />
      </Screen>
    );
  }

  const actions: { key: string; eyebrow: string; title: string; onPress: () => void }[] = [
    {
      key: 'lesson',
      eyebrow: 'Contenido',
      title: 'Lecciones: concepto, contexto y síntesis',
      onPress: () => router.push({ pathname: '/lecciones/[id]', params: { id: lesson.id } }),
    },
    ...examples.map(example => ({
      key: `ex-${example.id}`,
      eyebrow: 'Ejemplo',
      title: example.title,
      onPress: () => router.push({ pathname: '/ejemplos/[id]', params: { id: example.id } }),
    })),
    ...exercises.map((exercise, index) => ({
      key: `ej-${exercise.id}`,
      eyebrow: `Ejercicio ${String(index + 1).padStart(2, '0')}`,
      title: exercise.prompt,
      onPress: () =>
        router.push({ pathname: '/ejercicios/[id]', params: { id: exercise.id, lesson: lesson.id } }),
    })),
  ];

  if (evaluation) {
    actions.push({
      key: 'eval',
      eyebrow: 'Evaluación',
      title: evaluation.title,
      onPress: () => router.push({ pathname: '/evaluacion', params: { lesson: lesson.id } }),
    });
  }

  return (
    <Screen>
      <ScreenHeader
        onBack={() => router.back()}
        eyebrow={unit ? `Unidad ${unit.number} · Tema ${lesson.code}` : `Tema ${lesson.code}`}
        title={lesson.title}
      />

      <View
        style={[
          styles.status,
          { backgroundColor: colors.card, borderColor: completed ? colors.success : colors.line, borderRadius: radius.control },
        ]}>
        <AppText color={completed ? colors.success : colors.primary} weight="700">
          {completed ? '✓' : '◐'}
        </AppText>
        <AppText weight="600" style={styles.flex}>
          {completed ? 'Tema completado' : 'En progreso'}
        </AppText>
      </View>

      <View style={styles.list}>
        {actions.map(action => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.card },
              pressed && !reduced ? { transform: [{ scale: 0.99 }] } : null,
            ]}>
            <View style={styles.flex}>
              <AppText variant="eyebrow">{action.eyebrow}</AppText>
              <AppText weight="600">{action.title}</AppText>
            </View>
            <AppText color={colors.primary} weight="700">
              →
            </AppText>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  list: { gap: 10 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
  },
});
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit (solo si el usuario autoriza)**

```bash
git add "src/app/(app)" src/components/UnitCard.tsx
git commit -m "feat(nav): expandable home and direct-action topic hub"
```

---

### Task 7: UI alineada y limpieza final

**Files:**
- Modify: `src/theme/tokens.ts` (solo medidas/tipografía si hace falta)
- Modify: `src/app/(app)/index.tsx` (hero y secciones al look)
- Modify: `src/app/(app)/lecciones/[id].tsx` (quitar progreso ficticio `SECTION_PROGRESS`)
- Modify: `src/components/SubtopicRow.tsx` (sin duración; ya no la tiene)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: UI final.

- [ ] **Step 1: Quitar el progreso ficticio de la lección**

En `src/app/(app)/lecciones/[id].tsx`, eliminar `const SECTION_PROGRESS = [32, 68, 100];` y la barra que usa `SECTION_PROGRESS[section]`. La barra pasa a reflejar la sección real:

```tsx
      <View style={[styles.progressTrack, { backgroundColor: colors.soft }]}>
        <View
          style={[
            styles.progressValue,
            { width: `${((section + 1) / SECTION_LABELS.length) * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
```

- [ ] **Step 2: Hero y encabezado al look de la captura**

En `src/app/(app)/index.tsx`, en `ModulesTab`:
1. Hero: sobre `colors.primary`, usar eyebrow claro, título grande, y metadatos sin tiempo:

```tsx
        <AppText variant="small" color="#E6ECFF">
          {`${currentDone} de ${currentLessons.length} subtemas`}
        </AppText>
```

2. Sustituir el texto de porcentaje dentro del botón circular por una flecha grande (ya es `→`), y asegurar que el anillo de la unidad muestre `0%` cuando no hay progreso (ya ocurre con `progress = 0`).
3. Encabezado: mantener fecha + saludo + avatar con `initials(learnerName)`.

- [ ] **Step 3: Verificación de que no hay etiquetas de tiempo**

Run: `rg -n "⏱|Tiempos y estados|duration|\bmin\b" src`
Expected: sin coincidencias de tiempo en UI (si `min` aparece dentro de una palabra como "admin", no cuenta).

- [ ] **Step 4: Typecheck, tests y lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm test`
Expected: todos los suites en verde.

Run: `npx eslint .`
Expected: exit 0. Corrige imports sin usar (p. ej. `spacing`, `HubTile`) que queden tras la reestructura.

- [ ] **Step 5: Commit (solo si el usuario autoriza)**

```bash
git add src
git commit -m "feat(ui): align home/hub with reference and remove time labels"
```

---

### Task 8: Verificación final integral

**Files:**
- Ninguno nuevo.

- [ ] **Step 1: Verificación completa**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm test`
Expected: 5 suites (incluye `authLogic`) / ≥ 24 tests, todo PASS.

Run: `npx eslint .`
Expected: exit 0.

- [ ] **Step 2: Revisión de criterios de aceptación del spec**

Comprobar manualmente contra `docs/especificaciones/2026-09-21-auth-ui-nav-design.md` §11:
1. Sin sesión redirige a `login`.
2. Registro/login/logout funcionan.
3. Errores locales controlados.
4. Todo en 0% al crear cuenta.
5. Progreso aislado por cuenta.
6. Actividades a ≤3 toques.
7. Sin etiquetas de tiempo.
8. Vista sin repositorios/`expo-sqlite`.
9. `tsc`/`test`/`eslint` verdes.

- [ ] **Step 3: Commit final (solo si el usuario autoriza)**

```bash
git add -A
git commit -m "chore: final verification"
```

---

## Self-Review (cobertura del spec)

- §4 Modelo de datos → Tarea 2.
- §5 Autenticación (authLogic, repositorio, provider, guardas) → Tareas 1, 3, 5.
- §6 Datos por cuenta → Tareas 3, 4.
- §7 Migración/reset → Tarea 2.
- §8 Navegación ≤3 toques → Tareas 5, 6.
- §9 UI y retiro de tiempo → Tareas 6, 7.
- §10 Pruebas → Tareas 1, 4, 7, 8.
- §11 Criterios de aceptación → Tarea 8.
- Sin placeholders pendientes; firmas verificadas entre tareas (`accountId` consistente en repos y hooks; `useAuth`/`AuthOutcome` estables).
