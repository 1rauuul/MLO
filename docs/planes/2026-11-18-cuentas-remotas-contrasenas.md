# Plan: cuentas remotas y contraseñas

Estado: **pendiente de implementar**. La sincronización de progreso ya existe y usa
`X-MLO-Student-Key` (el `accounts.external_key` local). Este plan agrega cuentas con
contraseña en el CMS para poder iniciar sesión en un dispositivo nuevo o tras
reinstalar la app.

## Objetivo

- Registrar/iniciar sesión con usuario y contraseña contra el CMS.
- Guardar la contraseña hasheada (scrypt) en la base del CMS, nunca en texto plano.
- Emitir un token de sesión para las rutas de progreso y clases.
- Al iniciar sesión en un equipo nuevo, restaurar identidad (`externalKey`),
  progreso, cursos y clases, y dejar la sesión local lista.

## CMS (`D:\devvv\MLO-content\mlo-teachers`)

### Migración `student_accounts`

```sql
create table student_accounts (
  student_id uuid primary key references students (id) on delete cascade,
  username text not null unique check (username = lower(username)),
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table student_sessions (
  token_hash text primary key,
  student_id uuid not null references students (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index student_sessions_student_idx on student_sessions (student_id);

create table student_auth_attempts (
  id bigserial primary key,
  username text not null,
  created_at timestamptz not null default now()
);
create index student_auth_attempts_idx
  on student_auth_attempts (username, created_at desc);

alter table student_accounts enable row level security;
alter table student_sessions enable row level security;
alter table student_auth_attempts enable row level security;
```

Sin políticas RLS: la API usa el rol `postgres`, como el resto del CMS.

### `lib/student-auth.ts`

- Validar `username` (`^[a-z0-9._-]{3,32}$`), contraseña (8–128), `displayName`
  (2–80) y `externalKey` (UUID).
- `registerStudent`: upsert de `students` por `external_key`; insertar
  `student_accounts` con `hashPassword` (reutiliza `lib/password.ts`, scrypt);
  `username` duplicado → `409`.
- `loginStudent`: buscar la cuenta, `verifyPassword`; en fallo registrar intento y
  devolver `401`; límite 10 fallos/15 min por usuario (`student_auth_attempts`).
- `createStudentSession`: token de 32 bytes (`newSessionToken`), guardar
  `hashToken(token)` y expiración de 30 días.
- `requireStudent(request)`: leer `Authorization: Bearer`, hashear, buscar sesión
  vigente y devolver el alumno.
- `logoutStudent`: borrar la sesión.

### Rutas

- `POST /api/mlo/v3/auth/register`
  `{ username, password, displayName, externalKey }` →
  `{ token, student: { externalKey, username, displayName } }`.
- `POST /api/mlo/v3/auth/login`
  `{ username, password }` → mismo cuerpo; `401` credenciales, `429` límite.
- `POST /api/mlo/v3/auth/logout` (Bearer) → `204`.
- Cambiar `GET/PUT /api/mlo/v3/students/me/progress` y
  `GET /api/mlo/v3/students/me/classes` para exigir `Authorization: Bearer`.
  Durante la transición aceptar también `X-MLO-Student-Key`.
- CORS: agregar `Authorization` a `Access-Control-Allow-Headers`.

## App (`MLO-Ingenieria-software`)

### Token local

- Migración SQLite v22: `remote_session(account_id INTEGER PRIMARY KEY REFERENCES
  accounts(id) ON DELETE CASCADE, token TEXT NOT NULL, created_at TEXT NOT NULL)`.
- Repositorio `remoteSessionRepository` (`select/save/clear`) y puerto en
  `DataProvider`.
- El token no se incluye en el respaldo.

### Autenticación

- `useAuth.login`: intento local primero (offline). Si la cuenta no existe y hay
  red, `POST /auth/login`; crear la cuenta local con el `externalKey`,
  `displayName` y la contraseña escrita (PBKDF2 local), guardar el token y marcar
  `remote: true`.
- `useAuth.register`: crear la cuenta local y registrar en el CMS cuando haya red.
  Si el usuario ya existe en la nube, avisar y no duplicar. Si falla la red, dejar
  la cuenta local y reintentar en el primer guardado.
- `logout`: limpiar sesión local, borrar el token y llamar `POST /auth/logout`
  (best-effort).
- Mensajes nuevos en `auth.messages.ts`: credenciales inválidas remotas, cuenta
  ya existente, límite de intentos, sin conexión.

### Restauración en un dispositivo nuevo

1. Login remoto → crear la cuenta local con el `externalKey` remoto.
2. Guardar el token.
3. `GET /students/me/progress`; si existe, aplicar con
   `replaceProgressFromBackup`.
4. `refreshCourseList` (v3) para los cursos autorizados.
5. `GET /students/me/classes`; guardar cada membresía con `saveAccountClass` y
   bajar los releases de clase.
6. Navegar a Inicio.

El login debe mostrar “Sincronizando tu progreso…” y permitir continuar si la
descarga falla (el usuario puede reintentar desde Perfil).

### Perfil

- Los botones Guardar/Sincronizar usan el token si existe. Si no, piden la
  contraseña una vez para registrar la cuenta remota o iniciar sesión.
- “Sincronizar” mantiene la confirmación de reemplazo del progreso local.
- `DATA_MODE=local`: botones ocultos/deshabilitados.

## Seguridad

- scrypt del CMS, sal aleatoria, comparación en tiempo constante.
- Token hasheado en la DB, expiración 30 días, sin contraseña en logs.
- Límite de intentos y validación de todos los campos en el servidor.
- HTTPS obligatorio; el CMS usa el rol `postgres` (sin RLS pública).
- No se guarda la contraseña en texto plano en ningún lado.

## Pruebas

- CMS: `lib/student-auth.test.ts` (validación, hash/verify, tokens, rate limit),
  rutas con DB de prueba si el entorno lo permite.
- App: `remoteSessionRepository`, login remoto, `useProgressSync` con token,
  restauración tras login, logout.
- `npx tsc --noEmit`, `npm test` (app y CMS), `npm run build` del CMS.

## Despliegue

1. Aplicar la migración en Supabase (`npm run db:apply`).
2. Desplegar el CMS con las rutas nuevas.
3. Compilar la app; el token local requiere la migración SQLite v22.
4. Verificar: registrar → guardar → cerrar sesión → borrar datos → login →
   progreso/cursos/clases restaurados.

## Pendientes de decisión

- Recuperación de contraseña por correo (no existe canal de correo en la app).
- Guardar el token en `expo-secure-store` en lugar de SQLite.
- Refresco/renovación de sesión antes de los 30 días.
- Normalizar el progreso en tablas para reportes del docente (hoy es JSONB).
