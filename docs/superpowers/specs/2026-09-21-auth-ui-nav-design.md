# Diseño — Login local, datos por cuenta, navegación plana y UI alineada

> Fecha: 21 de septiembre de 2026
> Estado: aprobado en conversación (diseño); pendiente revisión del spec escrito.
> Alcance: implementación real (Fases 4+), offline-first estricto.

## 1. Objetivo

Convertir el prototipo funcional en la aplicación real:

1. **Autenticación local** (registro/login/logout) sin backend, 100 % offline.
2. **Datos por cuenta**: progreso y resultados pertenecen al alumno autenticado.
3. **Progreso en cero** en todas las vistas al crear una cuenta (sin datos sembrados).
4. **Navegación con máximo 3 toques** hacia cualquier actividad.
5. **UI alineada** a la captura de referencia, conservando la paleta actual.
6. **Eliminar etiquetas de tiempo** (duración por unidad y bloque de tiempo del hub).

## 2. Restricciones

- Offline-first: **ninguna llamada de red** en ninguna capa.
- MVVM: la vista (`src/app`, `src/components`) nunca importa repositorios ni `expo-sqlite`.
- TypeScript estricto; `npx tsc --noEmit` debe salir 0.
- Separación `Exercise`/`Result` y `Evaluation`/`Question` intacta.
- Sin RA, sin sensores nativos, sin SCORM/LOM en runtime.
- Se añade una única dependencia: `expo-crypto` (SDK 57), para hash local.

## 3. Alcance

**Dentro:**
- Tablas `accounts` y `auth_session`; `learner_profile`, `module_progress`, `results` y
  `evaluation_results` con `account_id`.
- `AuthProvider`/`useAuth`, pantallas `login` y `register`, guardas de ruta.
- `authLogic.ts` puro y testeable (TDD).
- Migración con `DROP TABLE` + recreación (reset a cero) y sembrado solo de contenido.
- Reestructura de navegación (home expandible, hub con acciones directas).
- Rediseño de UI según captura; retiro de duración y bloque de tiempo.
- Acción "Reiniciar mi progreso" en Perfil.

**Fuera:**
- Recuperación de contraseña, cambio de contraseña, múltiples perfiles simultáneos en UI.
- Sincronización remota, OAuth, biometría.
- Contenido de unidades 2–5 (sigue introductorio).
- Nuevos tipos de ejercicio.

## 4. Modelo de datos

Se conservan las entidades de contenido (`units`, `lessons`, `examples`, `exercises`,
`evaluations`, `questions`). Se **elimina `duration`** de `units` (columna, entidad y UI).

### 4.1 Tablas nuevas / modificadas

```sql
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

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  created_at TEXT NOT NULL
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
```

### 4.2 Entidades TypeScript

- Nueva `Account { id: number; username: string; displayName: string; createdAt: string }`.
- `LearnerProfile` pasa a `{ id: number; accountId: number; learningStyle; darkMode; largeText }`
  (se elimina `learnerName`; el nombre viene de `Account.displayName`).
- `Unit` pierde `duration`.
- Sin cambios en `Lesson`, `Example`, `Exercise`, `Evaluation`, `Question`.

## 5. Autenticación

### 5.1 Lógica pura — `src/viewmodels/authLogic.ts`

Sin dependencias nativas; recibe el digestor como parámetro para ser 100 % testeable.

```ts
export type Digest = (input: string) => Promise<string>;

export function normalizeUsername(raw: string): string;        // trim + lower
export function initials(displayName: string): string;         // hasta 2 letras
export function passwordMaterial(salt: string, password: string): string; // `${salt}:${password}`

export type RegisterError =
  | 'name_empty' | 'username_empty' | 'username_short' | 'username_invalid'
  | 'password_short' | 'password_mismatch';

export function validateRegistration(input: {
  displayName: string; username: string; password: string; confirm: string;
}): RegisterError | null;

export function validateLogin(username: string, password: string): 'missing' | null;

export async function hashPassword(password: string, salt: string, digest: Digest): Promise<string>;
export async function verifyPassword(
  password: string, salt: string, expectedHash: string, digest: Digest,
): Promise<boolean>;
```

Reglas: usuario ≥ 3 caracteres, `[a-z0-9._-]`; contraseña ≥ 6; confirmación coincidente;
nombre no vacío.

### 5.2 Repositorio — `src/data/repositories/accountRepository.ts`

```ts
insertAccount(db, { username, displayName, passwordHash, salt }): Promise<number>
selectAccountByUsername(db, username): Promise<AccountRecord | null>
selectAccountById(db, id): Promise<AccountRecord | null>
countAccounts(db): Promise<number>
selectSessionAccountId(db): Promise<number | null>
saveSession(db, accountId): Promise<void>
clearSession(db): Promise<void>
```

`AccountRecord` incluye `passwordHash` y `salt` (solo para verificación; no se expone a la vista).

### 5.3 Provider — `src/viewmodels/useAuth.tsx`

Estado: `account: Account | null`, `isLoading: boolean`.
Métodos async que devuelven `{ ok: true } | { ok: false; error: string }`:

- `register({ displayName, username, password, confirm })`: valida, verifica usuario libre,
  genera `salt = Crypto.randomUUID()`, hashea, inserta cuenta, crea perfil por defecto
  (`Pragmático`, tema oscuro, texto normal), abre sesión.
- `login(username, password)`: busca por usuario normalizado, verifica hash, abre sesión.
- `logout()`: limpia sesión y estado.
- `resetProgress()`: delega en repositorios con el `account.id` actual.

El digest real se define una sola vez:
`const sha256: Digest = input => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);`

### 5.4 Rutas y guardas

Estructura (patrón `Stack.Protected`, documentación SDK 57):

```text
src/app/
  _layout.tsx            # SQLiteProvider > AuthProvider > providers > Stack.Protected
  login.tsx              # accesible sin sesión
  register.tsx           # accesible sin sesión
  (app)/
    _layout.tsx          # Stack de rutas autenticadas
    index.tsx            # Home (tabs Módulos / Evaluaciones / Perfil)
    tema/[id].tsx        # hub de acciones directas
    lecciones/[id].tsx
    ejemplos/[id].tsx
    ejercicios/[id].tsx
    evaluacion/index.tsx
```

- `Stack.Protected guard={!!account}` → `(app)`; `Stack.Protected guard={!account}` →
  `login` y `register`.
- `SplashScreenController` oculta el splash cuando `!isLoading`.
- `learner_profile`, `module_progress`, etc. solo se consultan con `account.id` no nulo.

## 6. Datos por cuenta

- **Perfil**: `selectProfile(db, accountId)` / `saveProfile(db, profile)` con `ON CONFLICT(account_id)`.
  `LearnerProfileProvider` espera a `useAuth().account`; mientras no haya cuenta, `profile = null`.
- **Progreso**: `selectProgressMap(db, accountId)`, `markLessonCompleted(db, accountId, lessonId)`,
  `countCompletedByUnit(db, accountId, unitId)`, `resetProgress(db, accountId)`.
- **Resultados**: `insertResult(db, accountId, ...)`;
  `insertEvaluationResult(db, accountId, ...)`, `selectRecentEvaluationResults(db, accountId, limit)`,
  `resetEvaluationResults(db, accountId)`.
- Los hooks (`useCatalog`, `useModuleProgress`, `useRecentResults`, `useQuizEngine`,
  `useExerciseEngine`) obtienen `accountId` de `useAuth` y lo pasan a los repositorios.
  Si no hay cuenta, no consultan y devuelven estado vacío.

## 7. Migración y reset a cero

- `DATABASE_VERSION = 2`.
- `migrateAndSeed(db)`: si `user_version < 2`, ejecuta `DROP TABLE IF EXISTS` en orden inverso
  de dependencias (incluidas `accounts` y `auth_session`), aplica el DDL nuevo y siembra
  **solo contenido** (unidades, lecciones, ejemplos, ejercicios, evaluaciones, preguntas).
- Se elimina del seed: inserción de `learner_profile` y el bucle de `module_progress`.
- Resultado: toda instalación (nueva o actualizada) arranca sin cuenta y con 0 % en todos los
  indicadores. El progreso y los resultados se pueblan conforme el alumno los genera.

## 8. Navegación (máximo 3 toques)

- **Home Módulos**: encabezado (fecha + "Hola, {displayName}" + avatar con iniciales reales),
  tarjeta hero de continuación, y lista de unidades. Cada unidad se **expande en línea**
  mostrando sus lecciones (la unidad en curso se muestra expandida por defecto). El
  encabezado de la unidad lleva al hub al tocarlo.
  - Home (0) → expandir unidad (1) → tocar lección (2) → tocar actividad (3).
- **Hub `tema/[id].tsx`**: chip de estado (sin reloj) y lista de acciones directas:
  - "Lecciones" → `lecciones/[id]` (concepto, contexto, síntesis).
  - Un row por **ejemplo** del tema → `ejemplos/[id]`.
  - Un row por **ejercicio** del tema → `ejercicios/[id]`.
  - "Evaluación" → `evaluacion?lesson=...`.
  - Cada acción abre su pantalla directamente; no hay pantallas-lista intermedias.
- Se **eliminan** `src/app/lecciones/index.tsx`, `src/app/ejemplos/index.tsx` y
  `src/app/ejercicios/index.tsx`.
- **Tab Evaluaciones**: lista real de evaluaciones del catálogo (derivada de las lecciones)
  con acceso directo, más el historial del alumno. Sin textos fijos.
- **Tab Perfil**: nombre real, usuario, correo/usuario mostrado, selector de estilo, ajustes
  de accesibilidad, "Cerrar sesión" y "Reiniciar mi progreso".
- `BottomTabBar` se conserva (3 tabs) con el indicador de ícono ya presente.

## 9. UI (paleta intacta)

- Tokens: sin cambios de color. Se ajustan medidas/tipografías necesarias en `src/theme/tokens.ts`.
- Home alineada a la captura: eyebrow de fecha, saludo, avatar, hero azul con botón circular,
  sección "Ruta de aprendizaje / Tus unidades" con contador de unidades.
- `UnitCard`: chip de dificultad + anillo de progreso (0 %); sin duración; fila
  "Ver temas" para expandir en línea.
- Hub: se elimina el bloque "Tiempos y estados globales" con ⏱; queda un chip de estado
  ("En progreso" / "Completado") sin reloj.
- Estados vacíos reales: sin resultados → mensaje; 0 % → anillo en cero.
- Se conserva el modo oscuro por defecto y el claro disponible.

## 10. Pruebas y verificación

- **TDD** sobre `authLogic.ts`: normalización, validaciones, `passwordMaterial`, `hashPassword`
  y `verifyPassword` con un `Digest` falso (sin tocar `expo-crypto`).
- Ajustar los tests existentes que usen firmas de repositorios afectadas (si aplica).
- Cierre obligatorio: `npx tsc --noEmit` (exit 0), `npm test` (verde), `npx eslint .` (exit 0).

## 11. Criterios de aceptación

1. Sin sesión, cualquier ruta de `(app)` redirige a `login`.
2. Registro crea cuenta + perfil y entra; login verifica credenciales; logout vuelve a login.
3. Contraseña incorrecta o usuario duplicado muestran error local, sin crashear.
4. Al crear cuenta, progreso y promedios muestran **0** en Home, hub, Evaluaciones y Perfil.
5. Completar lección/evaluación actualiza solo los datos de esa cuenta.
6. Toda actividad se alcanza en ≤ 3 toques desde Home.
7. No queda ninguna etiqueta de duración ni bloque de tiempo.
8. La vista no importa repositorios ni `expo-sqlite` (solo hooks).
9. `tsc`, `test` y `eslint` en verde.

## 12. Riesgos

- `expo-crypto` en web requiere origen seguro; en native no hay restricción. Se acepta.
- El reset por `DROP TABLE` es destructivo; es la primera vez que existen cuentas, por lo que
  no hay datos de usuario que preservar en la versión 1.
- Amplio surface de cambios en hooks; se mitiga con TDD de lógica pura y typecheck estricto.
