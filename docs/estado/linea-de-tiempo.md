# Línea de tiempo de cambios

**Proyecto:** MLO — Ingeniería de Software (OAM)  
**Fuente:** 42 sesiones de OpenCode del proyecto (16 principales + 26 subagentes, 195 mensajes
del usuario) entre el 21 de septiembre y el 22 de octubre de 2026, contrastadas con el historial
de git. Las fechas son locales (America/Mexico_City).  
**Corte:** 22 de octubre de 2026.

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
| 7 | 21–22 oct | Evaluación, salidas seguras, fuente bibliográfica y APK de demo | «Añadir fuente…», «Generar build APK» | `200128d` + cambios sin commit |

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
- Documentado en `docs/informe-cambios-demo-apk.md`. **Estos cambios siguen sin commit.**

### 22 oct — Esta línea de tiempo
- Sesión **«Línea de tiempo de cambios entre sesiones»**: se revisan las 42 sesiones y el
  historial git, y se genera este documento.

## Estado del repositorio

- `main` en `200128d` («Fix: Evaluation engine»), con las ramas `fix/estabilizacion-datos` y
  `refactor/mvvm-features` ya integradas como marcadores.
- 26 archivos modificados y varios sin seguimiento corresponden al trabajo del APK
  (`eas.json`, `passwordKdf.ts`, `docs/informe-cambios-demo-apk.md`, diagramas SVG).

## Pendientes señalados en las propias sesiones

- Contenido completo de las unidades 2–5 (hoy solo introductorio).
- Cobertura verificada de las 9 categorías LOM (ficha descriptiva parcial).
- Validación del APK en dispositivo y soporte de 32 bits/emuladores x86_64 si se necesita.
- Commits pendientes del trabajo del APK y de esta documentación.
