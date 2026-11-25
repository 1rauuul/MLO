# Historial de evolución — CMS MLO (`mlo-teachers`)

Registro legible de los cambios del panel y su impacto en la app. El estado detallado del
panel vive en el repositorio `mlo-teachers` (`PLAN.md`); los contratos, en
`mlo-teachers/docs/contracts/`; y la cronología de la app en `linea-de-tiempo.md`.

## 2026-11-26 · Cierre pre-deadline: API v3 única, migraciones registradas y CI

### Panel (`mlo-teachers`)

- **API v3 única.** Se eliminaron las rutas `/api/mlo/v2/**`; la API pública quedó solo
  en `/api/mlo/v3`. El panel renombró las clases a **grupos** en la interfaz
  (`/grupos`, `/grupos/[id]`, `/grupos/[id]/contenido`). Las tablas `releases` y
  `class_releases` se conservan como datos históricos/internos y no se borraron filas.
- **Rate limit de `join`.** `POST /api/mlo/v3/classes/{code}/join` responde `429
  rate_limited` al superar 100 peticiones por IP o 1000 globales cada 15 minutos.
- **CORS configurable.** `CORS_ALLOWED_ORIGIN` define el origen permitido con `Vary:
  Origin`; sin la variable, desarrollo permite `*` y producción no emite CORS. La API
  admite `Authorization`, `X-MLO-Student-Key` y `Content-Type`.
- **Migraciones registradas.** `npm run db:migrate` aplica las pendientes en una
  transacción por archivo y las registra en `schema_migrations`; `--status` lista las
  pendientes y `--baseline` marca una base existente. `npm test` descubre
  `lib/**/*.test.ts` y excluye los `*.db.test.ts`.
- **Prueba E2E HTTP v3.** Siembra curso, tema, lección, release, grupo y extra
  temporales; prueba preview, join, release y manifest; limpia todo al final.
- **CI.** `.github/workflows/ci.yml` ejecuta test, lint, `tsc` y build en cada push y PR.
- **Documentación.** README, `PLAN.md`, `DESPLIEGUE-GCLOUD.md` y el contrato v3
  actualizados al estado real (v3 única, `/grupos`, migraciones y requisitos de entorno).

### App (`MLO-Ingenieria-software`)

- **Cliente único v3.** `apiBaseUrl()` devuelve la base v3 tal cual; se eliminaron el
  cliente `http` v2 y la conversión de `/v2` a `/v3`. Cursos, clases, releases, cuentas y
  progreso usan `httpV3`.
- **SecureStore.** El token de alumno se guarda en `expo-secure-store`; al leer una fila
  antigua con token en SQLite se migra y se borra de SQLite. En web se usa el fallback
  del almacenamiento seguro. `remote_session` conserva caducidad, huella y estado de
  sincronización.
- **CI/CD.** CI con `tsc`, Jest y lint; `eas.json` usa `hybrid` y la API v3 en `preview`
  y `production`; workflow manual de EAS preview. No se generó ningún build.
- **Verificación.** CMS 185 pruebas (`test:db` 13, incluida la E2E v3), lint, `tsc` y build
  en verde; app 581 pruebas, `tsc` y lint limpios. La prueba en dispositivo queda
  pendiente.

## 2026-11-24 · Cuentas de alumno, progreso en la nube y pulido del panel

### Panel (`mlo-teachers`)

- **Cuentas de alumno.** Tablas `student_accounts`, `student_sessions` y
  `student_auth_attempts`; contraseñas con scrypt, sesiones Bearer de 30 días y límite de
  10 intentos por usuario cada 15 minutos. `lib/student-auth.ts` centraliza alta, login,
  logout y la resolución de identidad.
- **API de cuentas.** `POST /api/mlo/v3/auth/register`, `login` y `logout`; `GET/PUT
  /api/mlo/v3/students/me/progress` y `GET /api/mlo/v3/students/me/classes` aceptan
  `Authorization: Bearer` y conservan `X-MLO-Student-Key` durante la transición. CORS
  admite `Authorization` y las respuestas van con `Cache-Control: no-store`.
- **Progreso.** El respaldo v5 se guarda por alumno en `student_progress` con límite de
  2 MB; el cliente puede restaurarlo al iniciar sesión en otro equipo.
- **Pulido del panel.** Confirmaciones compartidas (`confirm-dialog`), marcas de campo
  obligatorio, foco y validación en formularios, página 404, icono del sitio y limpieza de
  assets de ejemplo.
- **Preparación de pruebas.** Migración `20261119000000_reset_courses_and_groups.sql`:
  elimina grupos, cursos no base y progreso en la nube, conservando docentes, alumnos,
  media y el curso base.
- **Documentación.** README, `DATABASE teacher.md`, contrato v3, `PLAN.md` (la identidad del
  alumno pasa a cuenta con usuario/contraseña) y el diseño/plan de cuentas remotas.
- **Verificación.** 157/157 tests, `lint`, `tsc` y `build` en verde; migraciones
  `student_accounts` y `student_progress` aplicadas en la base.

> Estado al registrar esta entrada: buena parte de esta entrega sigue **sin commit** en el
> repo del panel; el commit `d46330a password manage` cubre la primera parte de progreso y
> clases con Bearer.

## 2026-11-25 · Rate limits por IP, vinculación desde el panel y recuperación con `sent_at`

### Panel (`mlo-teachers`)

- **Rate limits por IP para aulas.** Límites por IP en una ventana de 15 minutos: login de
  alumno 300, registro 100, vinculación 100 y login de docente 60. Los límites globales (y por
  correo para el docente) siguen siendo el guard contra fuerza bruta. Una prueba real contra la
  base (`test:db`) verifica que una sala de 40 alumnos cabe en login/registro/vinculación desde
  una IP y que el limiter bloquea al superar una regla pequeña; el índice
  `auth_rate_limits_created_idx` acelera la limpieza.
- **Código de vinculación desde el panel.** En `/grupos/[id]` el docente dueño o el admin emite
  para un alumno un código de 6 dígitos (vence en 30 minutos) que se guarda hasheado
  (`student_link_codes.code_hash`) con un solo pendiente por alumno. La columna **Cuenta**
  muestra la insignia **En la nube** cuando el alumno ya tiene cuenta (por la existencia de
  `student_accounts`, expuesto como `hasAccount`; no hay una columna `linked`).
- **Recuperación con guardado previo.** El código/token se persiste **sin enviar** antes del
  correo y solo un código con `sent_at is not null` es utilizable; un fallo de envío conserva el
  código anterior y no deja filas pendientes, y dos solicitudes concurrentes envían un solo
  correo. Migraciones `20261125000004` y `20261125000005`.

### App (`MLO-Ingenieria-software`)

- **Vinculación.** `needsRemoteLink` ahora depende de la existencia de la fila `remote_session`
  (incluidos los dos fallbacks de login offline); una cuenta en la nube no vuelve a mostrar
  “Vincular cuenta” tras cerrar sesión. `DATABASE_VERSION` 24.
- **Revisión final.** Las respuestas de recuperación son genéricas: un correo inexistente y un
  envío fallido devuelven lo mismo (`ok`), y `email_unavailable` queda solo para fallos de
  configuración (proveedor o `APP_BASE_URL`). Una fila de `remote_session` sin token muestra
  “sesión caducada” (no “no está en la nube”) y deshabilita el botón **Sincronizar ahora**. El
  reenvío de invitación se serializa con el bloqueo del maestro: dos pulsaciones concurrentes
  envían un solo correo.
- **Verificación.** Panel 184/184 (`test:db` 11/11), `lint`, `tsc` y `build` en verde; la app
  queda con 579/579 y TypeScript limpio. El recorrido manual en navegador/dispositivo queda
  pendiente.

## 2026-11-18 · Editor de contenido del grupo y seguimiento de cambios

### Panel (`mlo-teachers`)

- **Editar contenido del grupo.** Nueva pantalla `/grupos/[id]/contenido` con todas las
  lecciones, ejemplos, ejercicios y evaluaciones del grupo, numerados por unidad y subtema.
- **Editores propios del grupo.** Ejemplos y ejercicios se editan en
  `/grupos/[id]/contenido/{ejemplos|ejercicios}/[id]`, con la misma vista previa interactiva de
  la lección.
- **Vista previa interactiva en Contenido adicional.** El editor muestra la actividad
  (ordenar, completar, relacionar, crucigrama) funcionando antes de guardar.
- **Cambios pendientes.** La tabla `class_content_changes` (con triggers sobre lecciones,
  ejemplos, ejercicios, evaluaciones, unidades y subtemas) registra qué subtemas cambiaron desde
  la última publicación. La tarjeta **Versión del grupo** muestra el último cambio y los
  subtemas pendientes.
- **Editar estructura desde el grupo.** Unidades y subtemas se editan con `unit-edit-form` y el
  modo `?vista=estructura&volver=…`; los enlaces conservan la ruta de vuelta con `backTo`.
- **Confirmaciones centradas.** Los pop ups de **Guardar curso** y **Publicar grupo** centran el
  mensaje y simplifican el texto.
- **Invitaciones.** Página HTTPS `/join` para abrir la invitación y enlace para abrir MLO local
  desde el correo. Corregido el color del selector de curso.
- **Pruebas.** 145/145, `lint`, `tsc` y `build` en verde; migraciones de cambios de contenido
  aplicadas en la base.

### App (`MLO-Ingenieria-software`)

- **Portada.** Slides de bienvenida con los logos de CINVESTAV (`SplashSlides`), splash nativo
  retirado y `versionCode` 6.
- **Perfil.** Ajuste **Mostrar curso base** persistente; la lista de clases y la unión a clase
  pasaron a la pantalla del curso.
- **Curso.** Botón **Salir del curso** con confirmación y limpieza de la clase activa.
- **Lección.** Se eliminó el paginado Concepto/Síntesis: todo el contenido se lee en una sola
  pantalla, con el contenido extra de las clases debajo.
- **Medios.** Las imágenes se muestran con marco y fondo suave; el campo para unirse a una clase
  acepta el código en mayúsculas y lo centra.
- **Contenido de grupos.** Una unidad del curso padre vuelve a mostrarse si un grupo agrega una
  lección bajo ella (`applyV3Content`).
- **Pruebas.** 581/581 y TypeScript limpio.

| Verificación | Resultado |
|---|---|
| `npm test` (panel) | 145/145 |
| `npm run lint` + `tsc` + `build` (panel) | Sin errores |
| `npx jest` (app) | 581/581 |
| `tsc` (app) | Sin errores |

## 2026-11-17 · Medios en lecciones, invitaciones y editor de actividades

### Panel (`mlo-teachers`)

- **Imágenes y video en lecciones.** Bloques `image` y `video` en el contenido editable, en el
  orden que elige el maestro. El contrato v3 pasa de 5 a 7 tipos de bloque. El curso base no
  muestra los controles multimedia para no alterar el payload v2 que consume la app antigua.
- **Imágenes.** Subida desde el navegador (máx. 1600 px, JPEG/PNG/WebP, 3 MB), tabla `media`
  con una sola copia por hash, endpoint `GET /api/media/[id]` con ETag y URLs firmadas con
  `MEDIA_SECRET`. Al publicar, `src` se convierte en una URL absoluta firmada (`APP_BASE_URL`).
- **Video.** Solo YouTube (`watch`, `youtu.be`, `shorts`, `embed`); la app muestra miniatura y
  reproduce en un modal. El video requiere conexión.
- **Invitaciones por correo.** El mensaje incluye un código de respaldo; se guarda el historial
  de entrega (`sent_at`, `delivery_error`) y hay un límite de 60 altas por hora y docente.
- **Evaluaciones.** Se aplicó la migración que permite actividades directas al subtema; crear
  evaluación y guardar preguntas ahora devuelve el error al formulario y la publicación rechaza
  una evaluación sin preguntas.
- **Editor de actividades.** Botón **Ver muestra** en los formularios de ejercicio y ejemplo:
  muestra completa por tipo (ordenar, completar, relacionar, crucigrama), chips ligados a los
  campos y **Usar esta muestra** para copiarla. Las muestras se validan con las reglas estrictas
  de publicación. La vista previa del crucigrama muestra las pistas con `H1`/`V1` y el número de
  letras.

### App (`MLO-Ingenieria-software`)

- **Render de medios.** `ContentBlock` suma `image` y `video`; `RichContent` muestra imágenes
  (`localSrc` primero) y video con miniatura; `VideoPlayer` usa `react-native-webview`.
- **Offline.** Tabla `media_cache` y descarga de imágenes al sincronizar; si falla una descarga,
  la sincronización continúa y se usa la URL remota. `mediaPath.ts` centraliza la ruta local.
- **Contenido de grupos.** El release de curso ya no archiva ni borra el contenido propio de los
  grupos (`group_id IS NULL`); así no desaparece lo que el alumno ve en su clase.
- **Unión a grupo.** La unión y el release distinguen una clase sin publicar (`409 unpublished`)
  de una inexistente, con mensaje propio en la pantalla de unirse.
- **Pruebas.** 573/573 en verde; TypeScript limpio. La suite `updateNotice` tuvo un timeout
  aislado que no se reprodujo al repetirla.

### Verificación de esta entrega

| Comando | Resultado |
|---|---|
| `npm test` (panel) | 143/143 |
| `npm run lint` (panel) | Sin errores |
| `npx tsc --noEmit` (panel) | Sin errores |
| `npm run build` (panel) | Compila |
| `npx tsc --noEmit` (app) | Sin errores |
| `npx jest` (app) | 573/573 |
| Migraciones | `media`, RLS de medios e historial de invitaciones aplicadas en la base |

Recorrido manual en navegador de la referencia visual: los cuatro tipos, el modal de ejemplo y
**Usar esta muestra**. No se guardaron datos de prueba.

### Despliegue

Configurar en el CMS `APP_BASE_URL` y `MEDIA_SECRET`. Sin esos valores, las URLs de las imágenes
publicadas no se pueden firmar. Las migraciones de medios e invitaciones ya están aplicadas en la
base compartida.

## 2026-11-13 · Flujo del panel docente

- **Guardar** publica el curso y confirma en un pop up; se eliminó la pantalla intermedia
  `/cursos/[id]/publicar`.
- **Publicar grupo** confirma en un pop up e indica el código para unirse.
- Cards de grupos más compactas (3 columnas) y ordenadas por más nuevos.
- Numeración `unidad.subtema` en el grupo, la cabecera del subtema y Contenido adicional.
- Unirse a un grupo y crear invitaciones exigen una publicación previa (`409 unpublished`).

## 2026-10-27 · Base del CMS y contrato v3

- Panel Next.js 16 con auth propia, cursos, unidades, subtemas, lecciones, ejercicios, ejemplos
  y evaluaciones.
- Core compartido importado una sola vez; el maestro solo agrega contenido propio.
- Publicación por snapshot inmutable con hashes; API `/api/mlo/v2` y `/api/mlo/v3`.
- Clases con código fijo, alumnos por UUID estable, contenido extra y publicación por grupo.
- App MLO adaptada al contrato v3, identidad del alumno, caché de clases y respaldo de progreso.
