# Línea de tiempo de cambios

**Proyecto:** MLO — Ingeniería de Software (OAM)  
**Fuente:** 60 sesiones de OpenCode del proyecto (29 principales + 31 subagentes, 301 mensajes
del usuario, 6 090 mensajes en total) entre el 21 de septiembre y el 13 de noviembre de 2026
(base local de OpenCode), contrastadas con los 37 commits del historial de git. Las fechas son
locales (America/Mexico_City).  
**Corte:** 13 de noviembre de 2026.  
**Actualización:** 17 de noviembre de 2026 (medios en lecciones y cierre de pendientes).

## Resumen por fases

| Fase | Periodo | Enfoque | Sesiones | Commits |
|---|---|---|---|---|
| 0 | 13 sep | Commit inicial del proyecto Expo | — | `331e45c` |
| 1 | 21–29 sep | Auth offline, UI, navegación ≤3 toques, contenido y ejercicios U1 | «Revisión y mejoras UI, login, sin mocks» | `3b02fee`, `689d404` |
| 2 | 28 sep–15 oct | Banco de ejercicios/preguntas de la lección 1.2 | «Esquema de ejercicios: insertar instancia» | `689d404`, `e7d8a71`, `200128d` |
| 3 | 29 sep–7 oct | Navegación global, tabs persistentes, bloqueo de actividades, flujo de ejemplos | «Mejoras de navegación en la aplicación» + subagentes | `894b007`, `cca1a28`, `a2a7944` |
| 4 | 8–9 oct | Auditoría técnica y estabilización de datos | «Analisis» | `47dd6ae` |
| 5 | 10–13 oct | Iconos, diagramas, documentación y refactor MVVM | «UI implements», «Errors», «Diagramas», «Refactor MVVM» | `66e52c8`, `63935fe`, `ef4cf6a`, `e3cb366`, `ca01431` |
| 6 | 15 oct | Login, backup de progreso y banco de preguntas 1.2 | «UI implements», «Esquema de ejercicios» | `5d262d2`, `ef19472`, `e7d8a71` |
| 7 | 21–22 oct | Evaluación, salidas seguras, fuente bibliográfica y APK de demo | «Añadir fuente…», «Generar build APK» | `200128d`, `e67e35f` |
| 8 | 23–26 oct | Planes de revisión y migración a Expo SDK 58 | «Implementa el plan de revisión», «Línea de tiempo…» | `44a7df9`, `8ea6df9` |
| 9 | 26–31 oct | Modelo híbrido, contenido remoto y clases del panel docente | «Comparativa de consumo de servicios», «Agregar contenido…», «hot fixes app» | `170d2dd`, `bb915de`, `ce04717` |
| 10 | 31 oct–4 nov | Pulido de producto, icono y documentación del reporte | «hot fixes app», «Línea de tiempo…» | `f4659b5` |
| 11 | 5–6 nov | Contrato v3 del CMS y features X-01…X-07 | «Contrato local de contenido CMS» + 5 subagentes | `15e3b74` … `0f7de7c` |
| 12 | 7–11 nov | UI de cursos y experiencia de aprendizaje | «Creación y renderizado…», «No puedo ver el contenido en clase» | `73b8246`, `f7bb4dd` |
| 13 | 12 nov | Alumno en N cursos y estabilización de SQLite | «SQLiteProvider and network errors» | `4be6eba` |
| 14 | 12–13 nov | Contenido del CMS que no llega a la app | «Contenido del CMS no llega a la app» | sin commit |
| 15 | 13 nov | Memoria externa (Kindex) y esta línea de tiempo | «OpenCode Kindex MCP setup», «Línea de tiempo del proyecto MLO» | — |

## Detalle cronológico

### 13 sep — Base del proyecto
- Commit inicial `331e45c` con el esqueleto Expo SDK 57 + Expo Router.

### 21–29 sep — Autenticación offline, rediseño y contenido de la Unidad 1
Sesión principal: **«Revisión y mejoras UI, login, sin mocks»** (26 prompts, 638 herramientas).

- **21 sep:** autenticación local (`accounts`, `auth_session`, hash con salt), datos por cuenta
  (`learner_profile`, `module_progress`, `results`, `evaluation_results`), progreso a cero y
  guardas `Stack.Protected`; home con unidades expandibles y hub de mosaicos para llegar a
  cualquier actividad en ≤3 toques; contenido rico (`lessons.content`) y ejercicios `order`,
  `fill` y `match`. Se crean la especificación y el plan `2026-09-21-auth-ui-nav`.
- **22 sep:** documentación de estado (`status/ESTADO-PROYECTO.md`, `status/mapa-navegacion.md`).
- **23 sep:** commit `3b02fee` («Content include») con el rediseño, login/registro y contenido.
- **27 sep:** flujo de aprendizaje lección → ejemplo → práctica → evaluación; analítica sobre
  `attempts`, crucigramas, migración de esquema v4→v5; 1.1 queda como solo lectura. Plan
  `2026-09-27-learning-flow-unit1`.
- **28 sep:** ejercicios sin justificación, sin repetición, texto justificado y paso automático
  de ejemplos a ejercicios; commit `689d404`.
- **29 sep:** correcciones de crucigramas (pistas, banco de palabras) y arranque de la
  navegación global; commit `894b007`.

### 28 sep–15 oct — Banco de ejercicios y preguntas de la lección 1.2
Sesión principal: **«Esquema de ejercicios: insertar instancia»** (39 prompts).

- **28 sep:** formato de bancos (`types`, `l1.2`, `template`), fusión de los tres archivos de
  ejercicios y poda del banco; primera versión del banco de ejercicios de 1.2.
- **8 oct:** mapeo de crucigramas a documentación (`docs/crucigramas-unidad1.md`).
- **12–13 oct:** banco de preguntas (`docs/banco-preguntas-unidad1.md`) y extracción de
  ejercicios/ejemplos 1.2 a `.ts` (`docs/contenido/`).
- **15 oct:** banco de preguntas de 1.2 en runtime
  (`src/shared/services/content/banks/lesson1.2.questions.ts`, 437 líneas), temas y plan
  `docs/planes/PLAN-l1.2.md`; commit `e7d8a71`.
- **21 oct:** consolidación del banco y motor de evaluación (commit `200128d`).

### 29 sep–7 oct — Navegación global y bloqueo de actividades
Sesión principal: **«Mejoras de navegación en la aplicación»** (34 prompts), ejecutada en parte
por subagentes de implementación y revisión.

- **29 sep:** plan de navegación global: barra principal disponible en pantallas de contenido,
  regreso al contexto y botón «Regresar al tema» al terminar cada actividad.
- **30 sep:** cuatro entregas con revisión doble: helper de rutas, reestructura de rutas,
  tabs persistentes y salidas de actividades; después, bloqueo de actividades no disponibles.
- **5 oct:** flujo secuencial de ejemplos (sin elegir ejemplo), navegación contextual con
  persistencia (`last_location`) y limpieza de UI (se retira «Regresar al tema»).
- **7 oct:** corrección de los botones «Terminar»/«Tema», salidas al finalizar cada actividad
  y pruebas de flujo; commits `cca1a28` y `a2a7944`.

### 8–9 oct — Auditoría y estabilización
Sesión principal: **«Analisis»** (10 prompts).

- **8 oct:** `docs/reviews/review.md`, `docs/reviews/review-auditoria.md` y
  `docs/estado/siguientes-pasos.md`; corrección del feedback rojo/verde en móvil para igualar
  web; commit `47dd6ae`.
- **9 oct:** ejecución del plan de estabilización:
  - reset de progreso borra `attempts` y `last_location`;
  - un solo intento por pulsación en práctica (guard con `useRef`);
  - migraciones por paso con `user_version` (v5) y transacciones independientes;
  - hooks con estado de error y formularios bloqueados durante `await`;
  - evaluación registrada por `evaluation.id`;
  - contraseñas con PBKDF2-HMAC-SHA256 y rehash de cuentas legacy;
  - tests de los 8 repositorios y de pantallas; retiro de la tabla `results` y de código muerto;
  - cuestionario CHAEA abreviado y actualización de `docs/estado/estado-proyecto.md`.

### 10 oct — Iconos y pulido de UI
Sesión principal: **«UI implements»**, apoyada por 3 subagentes de revisión de pantallas.

- Migración de glifos a iconos (`Icon.tsx`), ajustes en `AppText`, `Buttons`, `QuizOption`,
  `BottomTabBar`, `SubtopicTabBar` y pantallas de módulos, evaluación y auth.
- Commit `66e52c8`. En paralelo se configuró OpenCode (plugin de ponytail, skill
  `diagram-design`), sin impacto en la app.

### 12–13 oct — Diagramas, documentación y refactor MVVM
Sesiones: **«Errors»**, **«Crear diagrama de arquitectura»**, **«contraste»**,
**«explanations»**, **«Implementar refactor MLO a MVVM por features»**.

- **12 oct:** corrección del error de migración `duplicate column name: content`; diagramas de
  arquitectura, ER y esquema de BD (`docs/arquitectura-mlo.html`, `docs/er-mlo.html`,
  `docs/esquema-bd-*.html`, `docs/diagramas-mlo.md`); comparación con la arquitectura de la
  tesis; explicación del patrón repositorio; evaluación con envío y avance automático; commit
  `63935fe`.
- **13 oct:** refactor a MVVM por features (`src/features/<feature>/{model,viewmodel,view}` y
  `src/shared/`), rutas Expo Router delgadas, reorganización de `docs/` y limpieza de la
  plantilla Expo; commits `ef4cf6a`, `e3cb366` y `ca01431`. Se actualizan `AGENTS.md`,
  `README.md` y `docs/README.md`.

### 14–15 oct — Explicaciones, login, backup y banco 1.2
- **14 oct:** sesiones de explicación del flujo datos → SQLite → repositorio → hook → pantalla;
  seguimiento del error de migración (sin cambios de código).
- **15 oct:** mejora de login/registro y `password.logic.ts` (`5d262d2`); exportación/importación
  del progreso local (`backup.logic.ts`, `backupRepository.ts`, `useProgressBackup.tsx`,
  `ef19472`); UI de login y banco de preguntas 1.2 (`e7d8a71`). Todo ello en la sesión
  «UI implements» salvo el banco, que salió de «Esquema de ejercicios». Sesión aparte sobre
  sonidos de OpenCode, sin impacto en el proyecto.

### 21 oct — Evaluación, salidas seguras y fuente bibliográfica
Sesión: **«Añadir fuente bibliográfica al final de la pantalla principal»**.

- Sección «Fuente» al final de la pantalla principal (`ModulesScreen`).
- Confirmación de salida al pulsar «Inicio»/«Tema» en Ejercicios y Evaluación (mismo modal que
  el botón atrás), con `exitGuard` y pruebas.
- Calificación de práctica sobre 10 ejercicios, 10 % por pregunta con reparto proporcional.
- Correcciones al motor de evaluación (feedback por tipo, analítica, `useQuizEngine`) y
  exportación de los diagramas a SVG. Commit `200128d`.

### 21–22 oct — APK de demo
Sesión: **«Generar build APK para una demo»**.

- **Base de datos:** seed en una sola transacción (sin transacciones anidadas), `user_version`
  al final y auto-reparación si la base está marcada como v14 pero sin catálogo; tests nuevos.
- **Login/registro:** KDF nativo con `react-native-quick-crypto` (`passwordKdf.ts`), fallback a
  `@noble/hashes`, regla ProGuard y campos separados de nombre y apellidos.
- **Carga:** spinners y estados vacíos con reintento; catálogo con consulta resumen en lugar de
  cargar todo el contenido.
- **Tamaño:** `expo-build-properties` con `arm64-v8a`, Android 12+, R8 y shrinks; retiro de
  dependencias sin uso. APK final de ~33.2 MB (antes 118.1 MB), build EAS
  `12688b6f-e408-4207-8c01-ae0d7dc16c39`.
- Documentado en `docs/informe-cambios-demo-apk.md`. Todo el trabajo, junto con los diagramas
  SVG y el capítulo del reporte, quedó en el commit `e67e35f` («MLO v1», 22 oct).

### 23–26 oct — Planes de revisión y migración a SDK 58
Sesiones: **«Implementa el plan de revisión»** (junto con «Línea de tiempo…») y
**«Comparativa de consumo de servicios»**.

- **23 oct:** ejecución de `docs/planes/PLAN-fix-review.md` y
  `docs/planes/PLAN-optimizacion-servicios.md`: corrección de ids de preguntas, duplicados de
  1.2, sorteo de ejemplos, mezcla de «ordenar», `ErrorBoundary` y `useAsyncResource`. Commit
  `44a7df9` («V1.1 handle services»).
- **26 oct:** migración a **Expo SDK 58** (React Native 0.88, React 19.3, Expo Router 58, Jest
  30, TypeScript 6): `File.write()` asíncrono, tab bar sin `navigation`, `usePreventRemove` en
  lugar de `beforeRemove`, `TextInputInstance`, `.npmrc` con `legacy-peer-deps`, R8 para Quick
  Crypto y fallback en Expo Go. Documentado en `docs/informe-migracion-sdk58.md`; commit
  `8ea6df9`.
- **26 oct:** comparativa del consumo de servicios contra `PLAN-sistema-maestro.md`; se crean
  `docs/planes/COMPARATIVA-consumo-servicios-vs-plan-maestro.md`, `PLAN-sistema-maestro.md` y
  `PLAN-mlo-contenido-remoto.md`. Preparación del modelo híbrido (`DATA_MODE`, `DataProvider`,
  cliente HTTP, `remoteContent`, validador y `ContentSyncProvider`); commit `170d2dd`.

### 27–31 oct — Clases del panel docente y modelo híbrido
Sesiones: **«Agregar contenido adicional al MLO»**, **«Modelo de base de datos en Markdown»**,
**«hot fixes app»**, **«Separar la base del núcleo y el CMS»**.

- **27 oct:** el panel docente pasa a publicar **clases** en lugar de grupos: endpoints
  `/classes`, preview/join con `course`, caché por clase (`class_cache`, `class_extras_cache`,
  `account_classes`), `classRepository`, `classSync` y validadores de release. Se retira
  `groups` y se renombran rutas y pantallas (`join-class.tsx`, `JoinClassScreen`). Respaldos v4
  con la identidad del alumno (`accounts.external_key`). Documentación
  `docs/contenido/como-agregar-contenido.md`, `apk-con-contenido-remoto.md`, `PLAN-clases.md`
  y `PLAN-ejemplos-independientes.md`; commit `bb915de`.
- **29 oct:** extracción del modelo de datos a Markdown (`docs/arquitectura/esquema-bd-mlo.md`)
  y pruebas con el proyecto publicado en Vercel (`mlo-enrichment`).
- **31 oct:** «hot fixes» de producto: `ConfirmModal` reutilizable, regla de tema completado
  (lecciones + ejemplos vistos + práctica ≥ 80 % + evaluación ≥ 80 %), ejercicios de ordenar
  con arrastre a la izquierda y colores distintos, y consolidación del modo híbrido
  (`ce04717`, «MLO is hybrid»).
- **4 nov:** nuevo icono de la app (`assets/images/icon.png` y variantes Android) y avance del
  reporte (`capitulo-4-resultados.md`); commit `f4659b5`.

### 5–7 nov — Contrato v3 del CMS y features X-01…X-07
Sesión principal: **«Contrato local de contenido CMS para MLO»**, con 5 sesiones de subagente
(MLO espera brief, MLO-01, X-05, X-06, X-07), coordinadas con el CMS (`mlo-teachers`).

- **X-01 — contrato versionado:** v3 convive con v2, hash SHA-256 sobre JSON canónico, fixtures
  copiados sin re-serializar y prueba de paridad con el CMS (`contractV3.ts`,
  `__fixtures__/v3/`). Commits `15e3b74` y `402f0a2`.
- **X-02 — cursos autorizados:** `GET /api/mlo/v3/courses` con `X-MLO-Student-Key`; el alumno
  solo ve cursos publicados y autorizados; una sincronización vacía ya no cae al curso base
  (`courseRepository`, `useCourses`, `coursesV3`). Commit `aab7c80`.
- **X-03 — subtemas y actividades:** jerarquía curso → unidad → subtema, con lecciones,
  ejemplos, ejercicios y evaluaciones colgando del subtema; `position` para respetar el orden
  editorial; N evaluaciones por subtema y evaluaciones de puras preguntas (`applyV3Content`,
  `TopicScreen`, `TopicRow`). Commits `6701aee` y `a0bd351`.
- **X-04 — grupos/clases v3:** release de grupo versionado, membresía única por curso, salida y
  reactivación, archivo lógico con conservación de progreso y filtros por `group_id` para no
  exponer contenido retirado; `DATABASE_VERSION` 20. Commit `7258feb`.
- **MLO-01 — retroalimentación:** al terminar la evaluación se muestra resultado, respuesta
  correcta y explicación por reactivo; el reintento crea un intento nuevo sin borrar los
  anteriores. Commit `5a7a667`.
- **X-05 — bibliografía APA 7:** `references[]` en el release, tabla `content_references`,
  deduplicación por id y bloque `Bibliography`; se asegura la referencia Sommerville 2011 del
  curso base. Commits `350cb75` y `40fd017`.
- **X-06 — avisos de contenido nuevo:** comparación de `version`/`hash` al abrir y cada hora en
  primer plano, con «Actualizar ahora» / «Más tarde» y botón manual (sin SSE/WebSocket). Commit
  `94766db`.
- **X-07 — invitaciones:** reclamo de enlace o código de 6 caracteres
  (`POST /api/mlo/v3/invitations/claim`), errores
  `invalid/expired/used/revoked/full/already_member`, y
  `membership.courseCatalogId` para no hardcodear `base`. Commit `0f7de7c`.

### 7 nov — UI de cursos
Sesión: **«No puedo ver el contenido en clase»**.

- Pantalla de curso (`CourseScreen`, `CourseCard`, ruta `curso/[id].tsx`) con biblioteca de
  cursos (`useCourseLibrary`), tarjetas de curso y porcentaje por unidad/subtema; el alumno ve
  sus cursos y la opción de unirse a una clase. Commit `73b8246`.
- Documentación del contrato para el CMS (`docs/api/contrato-contenido-cms.md` y
  `docs/api/decisiones-contrato-cms.md`).

### 7–11 nov — Experiencia de aprendizaje
Sesión: **«Creación y renderizado de lecciones, ejemplos y evaluaciones»**.

- Ejemplos y ejercicios limitados a 10 por flujo; al terminar los 10 ejemplos el flujo sigue a
  ejercicios y no regresa a ejemplos.
- Ejercicios de relación con marco verde/rojo en lugar de palomitas y taches; ajustes de
  arrastre y colores en «ordenar»; retoques de tokens y tarjetas de curso. Commit `f7bb4dd`
  («mejorar experiencia de aprendizaje»).

### 12 nov — Alumno en N cursos y estabilización de SQLite
Sesión: **«SQLiteProvider and network errors»**.

- Un alumno puede estar en **una clase por curso y en varios cursos**; la membresía guarda
  `course_catalog_id`, la tarjeta muestra el nombre del curso del CMS y el respaldo v5 incluye
  identidad, clases y curso de cada clase (compatible con v1–v4).
- Corrección de los errores `no such table: content_references` y `no such column: catalog_id`
  en móvil: migraciones idempotentes hasta `DATABASE_VERSION` 21 y nueva prueba de esquema
  (`migration.schema.test.ts`). Commit `4be6eba`.

### 12–13 nov — Contenido del CMS que no llega a la app
Sesión: **«Contenido del CMS no llega a la app»** (continúa en la madrugada del 13).

- Se corrige la URL base v3: `…/api/mlo/v2` pasaba a `…/api/mlov3` por un `slice` incorrecto;
  ahora se sustituye solo el segmento `v2` por `v3`.
- Se añade el estado `unpublished` (HTTP 409) al release de clase y al join, para distinguir
  «clase sin publicar» de «no encontrada».
- El release de curso deja de archivar el contenido propio de las clases: todo el archivado y
  borrado filtra `group_id IS NULL`; el contenido de grupo solo se archiva desde el release de
  su grupo. Así deja de desaparecer lo que el alumno ve en clase.
- Pruebas nuevas en `applyV3Content.test.ts`, `remoteContent.test.ts` y `client.test.ts`.
  Todo ese trabajo se integró en la entrega del 16–17 nov.

### 13 nov — Memoria externa y esta línea de tiempo
- Sesión **«OpenCode Kindex MCP setup»**: se instala y configura el MCP `kindex` como memoria
  persistente entre sesiones y se revisan las conversaciones de MLO y `mlo-teachers` para
  volcarlas al grafo. No toca el código de la app.
- Sesión **«Línea de tiempo del proyecto MLO»**: se revisan las 60 sesiones y el historial git,
  y se actualiza este documento.

### 16–17 nov — Medios en lecciones y cierre de pendientes
Sesiones de implementación del CMS y la app para el contenido multimedia; la app recibe el
contrato v3 con los bloques nuevos.

- **Medios en lecciones.** El CMS publica bloques `image` (con URL firmada y dimensiones) y
  `video` (solo YouTube). El contrato v3 pasa de 5 a 7 tipos de bloque. El curso base conserva
  sus cinco tipos para no romper clientes antiguos.
- **Render en la app.** `ContentBlock` suma `image` y `video`; `RichContent` muestra la imagen
  (`localSrc` primero) y el video con miniatura y modal (`VideoPlayer` con
  `react-native-webview`). `youtube.ts` canonicaliza los enlaces.
- **Offline.** Nueva tabla `media_cache` (el esquema se aplica también a instalaciones
  existentes con `CREATE TABLE IF NOT EXISTS`). Al sincronizar se descargan las imágenes del
  release; si una falla, la sincronización continúa y se usa la URL remota.
- **Contenido de grupos.** El release de curso ya no archiva ni borra el contenido propio de los
  grupos (`group_id IS NULL`); ese contenido solo se archiva desde el release de su grupo.
- **Unión a grupo.** El `409 unpublished` distingue una clase sin publicar de una inexistente,
  con mensaje propio en la pantalla de unirse.
- **Verificación.** 573/573 pruebas de la app y TypeScript limpio; el CMS queda con 143/143,
  lint y build en verde. La suite `updateNotice` tuvo un timeout aislado que no se reprodujo.
  El recorrido manual del editor de actividades (cuatro tipos, ejemplo y «Usar esta muestra»)
  se hizo en navegador sin guardar datos de prueba.

### 18 nov — Portada, perfil y ajustes de contenido
- **Portada.** `SplashSlides` muestra los logos de CINVESTAV al abrir la app; el splash nativo se
  retira cuando el contenido está listo. `versionCode` sube a 6 y el fondo del splash cambia.
- **Perfil.** Se elimina la lista de clases y la unión desde el perfil; queda el ajuste
  **Mostrar curso base**, persistido en `meta` (`show_base_course`). La biblioteca filtra el
  curso base cuando está apagado.
- **Curso.** La pantalla del curso ofrece **Salir del curso** con confirmación; al salir se
  refrescan los cursos y el catálogo.
- **Lección.** Se quita el paginado Concepto/Síntesis: el contenido se lee completo en una sola
  pantalla y el contenido extra de las clases queda debajo.
- **Medios y códigos.** Las imágenes se muestran con marco y fondo suave; el campo de unión
  acepta el código en mayúsculas y lo centra.
- **Contenido de grupos.** `applyV3Content` vuelve a mostrar una unidad del curso padre cuando un
  grupo agrega una lección bajo ella; las pruebas cubren el caso.
- **Verificación.** 581/581 pruebas y TypeScript limpio. El panel queda con 145/145, lint, tsc y
  build en verde.

## Estado del repositorio

- `main` con la entrega del 18 nov (portada, perfil, salida del curso, lección de una pantalla y
  unidad de grupo) sobre la del 17 nov (medios y `409 unpublished`). Árbol limpio, sin cambios
  pendientes.
- La base local sigue en `DATABASE_VERSION` 21; `media_cache` se crea con
  `CREATE TABLE IF NOT EXISTS` también en instalaciones existentes.
- Contrato de contenido en v3 con 7 tipos de bloque (v2 sigue soportado para el curso base y
  releases legacy).

## Pendientes señalados en las propias sesiones

- Probar en dispositivo la portada, el ajuste **Mostrar curso base**, **Salir del curso** y la
  lección de una sola pantalla.
- Probar en dispositivo la sincronización de imágenes (offline), el reproductor de YouTube y el
  `409` al unirse a un grupo sin publicar.
- Revisar el contenido completo de las unidades 2–5: hoy depende de lo que publique el CMS; el
  curso base v3 ya trae 25 subtemas.
- Soporte de APK de 32 bits o emuladores x86_64 si se necesita; validación del APK en un
  dispositivo físico.
- Cobertura verificada de las 9 categorías LOM (la ficha descriptiva sigue parcial).
- Evidencia del reporte (capturas y métricas) para los capítulos 3 y 4; el capítulo 3 se ha ido
  actualizando desde la sesión «Línea de tiempo…».
