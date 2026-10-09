# Siguientes pasos propuestos — MLO Ingeniería de Software

> Fecha: 2026-10-08. Documento de propuesta; no modifica código.
> Fuentes: `status/ESTADO-PROYECTO.md`, `docs/reviewer/review.md`, `docs/reviewer/review-auditoria.md`,
> `docs/reviewer/arquitectura-oam-react-native.md`, `docs/reviewer/comparacion-propuesto-vs-implementado.md`.
> Referencias de código con `archivo:símbolo:línea` al estado actual del repositorio.

---

## 1. Estado consolidado (qué sabemos hoy)

**Funciona y está verificado** (auditoría del 2026-10-08):

| Comprobación | Resultado actual | Resultado histórico (ESTADO-PROYECTO) |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | exit 0 |
| `npm run lint` | exit 0 | exit 0 |
| `npm test -- --runInBand` | **22 suites / 145 tests** | 5 suites / 36 tests |
| Cobertura | 66.82 % (tocado) / 49.92 % (`src/**`) | no medida |
| `expo export` web/Android/iOS | OK (2.5 / 4.4 / 4.2 MB) | Android OK |
| `npx expo-doctor` | 20/21 (7 paquetes con patch desactualizado) | no ejecutado |

**Completo (Fases 0–3 + sesión 21–22 sep):** auth local, datos por cuenta, navegación ≤3 toques,
contenido Unidad 1 por bloques ricos, ejemplos A/B, práctica (order/fill/match/crossword), evaluación
con analítica (`attempts`), esquema `user_version=10`, UI alineada al prototipo.

**Brechas abiertas (comparación + auditoría):**
- **Corrección de datos (P1):** AUD-01 `resetProgress` incompleto, AUD-02 efecto secundario en
  actualizador de estado, AUD-03 migración v5 borra `attempts`.
- **Robustez (P2):** AUD-04 migración no atómica, AUD-05 sin manejo de errores, AUD-06 hash no KDF,
  AUD-07 `recordedRef`, AUD-08 doble envío, AUD-09 repositorios sin tests.
- **Decisiones de alcance sin cerrar** (comparación §10): autenticación, personalización CHAEA,
  SCORM, tabla `results`, granularidad, destino web.
- **Deuda (P3):** AUD-10…AUD-20 (código muerto, duplicación, deps sin uso, a11y, seed no idempotente).
- **Pendiente del plan:** Fase 4 (CHAEA), Fase 5 (EAS Build/validación en dispositivo), contenidos y
  ejercicios de Unidades 2–5, pruebas de pantallas/flujos, ficha LOM.

**Principio de orden:** primero integridad de datos (P1), luego robustez (P2), después decisiones
de alcance (documentar), luego limpieza (P3) y al final contenido/validación. Cada bloque cierra con
verificación por comandos y criterios de aceptación medibles.

---

## 2. Bloque A — Integridad de datos (P1). Hacer primero

**Objetivo:** eliminar las tres fuentes de pérdida/duplicación de datos del alumno antes de añadir
cualquier funcionalidad nueva.

### A1. Completar `resetProgress` (AUD-01)
- **Qué:** `resetAccountProgress` (`src/data/repositories/progressRepository.ts:57-62`) solo borra
  `module_progress`, `evaluation_results` y `results`. Debe borrar también `attempts` y
  `last_location`, y limpiar el estado de sesión en memoria (`useSession.tsx:58`).
- **Dónde:** `progressRepository.ts`, `useAuth.tsx:137-142` (`resetProgress`), `useSession.tsx:95`
  (`clear`), `perfil/index.tsx:39-53`.
- **Criterio de aceptación:** tras "Reiniciar mi progreso": `SELECT COUNT(*) FROM attempts WHERE
  account_id=?` = 0, sin fila en `last_location`, y Módulos no muestra "Continuar" apuntando a la
  lección previa.
- **Prueba de regresión:** mock que capture los `DELETE` de `resetAccountProgress` y afirme que
  incluye `attempts` y `last_location`; opcional: integración con BD en memoria.
- **Verificación:** `npx tsc --noEmit` + `npm test`.

### A2. Sacar el efecto secundario del actualizador de estado (AUD-02)
- **Qué:** en `usePracticeEngine.submit` (`src/viewmodels/usePracticeEngine.ts:83-97`) el
  `insertAttempt` se ejecuta dentro de `setAnswered(updater => …)`. Los updaters deben ser puros;
  con StrictMode/React Compiler pueden ejecutarse dos veces → filas duplicadas en `attempts`.
- **Dónde:** `usePracticeEngine.ts:85-94`. Patrón correcto ya existente en
  `useEvaluationEngine.submit` (`useQuizEngine.ts:207-228`).
- **Criterio de aceptación:** un único `insertAttempt` por pulsación de "Comprobar".
- **Prueba de regresión:** `renderHook` con mock de `insertAttempt`; disparar `submit` dos veces y
  afirmar `toHaveBeenCalledTimes(1)`.
- **Verificación:** `npm test`.

### A3. Preservar `attempts` en la migración a v5 (AUD-03)
- **Qué:** el bloque `if (currentVersion < 5)` de `migrateAndSeed` (`src/data/db.ts:37-68`) llama
  `applyUnit1Content(db)` con el parámetro por defecto `clearAttempts = true` (`src/data/seed.ts:247`),
  que ejecuta `DELETE FROM attempts WHERE lesson_id IN ('l1.1'…'l1.4')` (`seed.ts:249-254`).
- **Dónde:** `db.ts:67` → `applyUnit1Content(db, false)`, como ya hacen los bloques v6 (`db.ts:70`)
  y v8 (`db.ts:76`).
- **Criterio de aceptación:** migrar desde `user_version=4` no elimina filas de `attempts`.
- **Prueba de regresión:** caso en `src/data/db.test.ts` con `user_version=4` que afirme que no se
  ejecuta `DELETE FROM attempts`.
- **Verificación:** `npm test -- src/data/db.test.ts`.

**Criterio de salida del Bloque A:** los tres P1 resueltos con test de regresión; suite completa
verde.

---

## 3. Bloque B — Robustez (P2)

### B1. Manejo de errores y bloqueo de doble envío (AUD-05 + AUD-08)
- **Qué:** añadir `try/catch` + estado `error` a los hooks de carga (`useAuth.tsx:84-130`,
  `useCatalog.ts:26-37`, `useLessonContent.ts:30-41`, `useModuleProgress.ts:27-40`,
  `useRecentResults.ts:22-26`) y estado `submitting` (deshabilitar botones) en
  `login.tsx:65` y `register.tsx:84`.
- **Criterio de aceptación:** ante error de BD, `isLoading=false` + error visible con reintento;
  un doble tap produce un solo intento y ninguna promesa rechazada sin manejar.
- **Prueba de regresión:** hook test con repositorio que lance; screen test de `RegisterScreen`
  con doble `onPress` → una sola llamada.

### B2. Migraciones atómicas (AUD-04)
- **Qué:** envolver cada paso de `migrateAndSeed` (`db.ts:14-96`) en `withTransactionAsync` y fijar
  `PRAGMA user_version` dentro del mismo paso (hoy queda fuera, `db.ts:96`).
- **Criterio de aceptación:** un fallo intermedio no deja `user_version` avanzado y el reintento
  es idempotente (sin `ALTER … ADD COLUMN` duplicado).
- **Prueba de regresión:** mock de `runAsync` que lance en un `ALTER`; segunda pasada sin
  duplicados.

### B3. Reiniciar `recordedRef` al cambiar de lección (AUD-07)
- **Qué:** en `EvaluationFlow.tsx:98,113-123` el `recordedRef` nunca vuelve a `false`; si Expo
  Router reutiliza la instancia con otro `lesson`, el resultado no se registra.
- **Criterio de aceptación:** cada evaluación completada inserta exactamente un registro aunque
  cambie la lección.
- **Prueba de regresión:** renderizar `EvaluationFlow` con dos `lesson` distintos → dos llamadas a
  `record`.

### B4. Endurecer el hash de credenciales (AUD-06)
- **Qué:** sustituir SHA-256+salt de una pasada (`authLogic.ts:69-80`, digest en `useAuth.tsx:34`)
  por PBKDF2 (WebCrypto) con iteraciones, y estrategia de rehash en login para cuentas existentes.
- **Nota:** es local sin red; la severidad es P2, pero conviene hacerlo junto al bloque B para no
  volver a tocar auth.
- **Criterio de aceptación:** el hash almacenado es de una KDF con iteraciones; `verifyPassword`
  sigue pasando tests.

### B5. Tests de repositorios (AUD-09)
- **Qué:** cubrir `accountRepository`, `progressRepository`, `evaluationRepository`,
  `attemptRepository`, `lessonRepository`, `exerciseRepository`, `exampleRepository`,
  `profileRepository` (hoy 0 %, salvo `locationRepository`). Usar el patrón de
  `locationRepository.test.ts` (mock que captura SQL/params) o expo-sqlite en memoria.
- **Criterio de aceptación:** ≥80 % de sentencias por repositorio.

**Criterio de salida del Bloque B:** ningún P2 abierto; cobertura de repositorios ≥80 %.

---

## 4. Bloque C — Decisiones de alcance (documentar antes de seguir)

Estas decisiones condicionan bloques posteriores. Recomendación basada en costo/beneficio:

| # | Decisión (comparación §10) | Recomendación propuesta | Impacto |
|---|---|---|---|
| C1 | Autenticación local (extensión no prevista) | **Conservar y justificar** en el reporte: permite progreso por alumno en dispositivo compartido y ya está construida y probada. Redactar el párrafo de justificación. | Bajo (ya existe) |
| C2 | Personalización por estilo (CHAEA) | **Dos velocidades:** (a) documentar ya lo real —selector manual + recomendación por desempeño (`recommendReview`)— como cumplimiento parcial; (b) implementar el cuestionario en `app/personalizacion` como Fase 4 opcional **después** de los bloques A–B. `saveQuestionnaire` (`useLearnerProfile.tsx:27`) ya está preparado. | Medio |
| C3 | SCORM vs. plan de trabajo (semana 13) | **Corregir el plan**: mantener "sin empaquetado SCORM en runtime" (coherente con `arquitectura-oam-react-native.md:170-181` y `AGENTS.md`); dejar LOM como ficha descriptiva (`metadata.ts`). Alinear `PlanDesarrollo.md` y confirmar con el asesor. | Documental |
| C4 | Tabla `results` inerte (AUD-10) | **Eliminar** `results` + `Result`/`ExerciseResult` + `insertResult` + `useRecordExerciseResult` y actualizar `AGENTS.md`/documentos (la bitácora real es `attempts`). Alternativa: documentar como entidad de referencia teórica sin uso runtime. | Bajo |
| C5 | Granularidad (unidades con subtemas vs. tesis) | **Justificar** en el reporte: el OAM cubre una asignatura con 5 unidades y subtemas por unidad; la granularidad mínima es la lección (`lessons`), no la unidad. | Documental |
| C6 | `attempts` compartida + `asExercise` | **Justificar** explícitamente junto a la restricción Ejercicios/Evaluación: bitácora común para analítica y reutilización de `ActivityView` con feedback distinto. | Documental |
| C7 | Destino web (`react-native-web`) | **Conservar** (útil para demo y ya exporta); declararlo como soporte adicional, no requisito móvil. | Bajo |
| C8 | Dependencias sin import directo (AUD-13) | **Auditar caso por caso** con `npx expo install --check`; retirar solo las confirmadas innecesarias (no por falta de imports). | Bajo |

**Criterio de salida del Bloque C:** cada decisión registrada en `docs/reviewer/` o en el reporte,
y los documentos afectados (`arquitectura-oam-react-native.md`, `AGENTS.md`, `PlanDesarrollo.md`)
alineados con lo decidido.

---

## 5. Bloque D — Limpieza y deuda técnica (P3)

Solo después de C4/C8 (algunas limpiezas dependen de decisiones):

| Tarea | Detalle | Verificación |
|---|---|---|
| D1 | Retirar código muerto (AUD-11/AUD-20): `useQuizEngine` (motor), `useAttempts`, `useExample`, `useExercise`, `useExerciseForLesson`, `useRecordExerciseResult`, `selectUnit`, `selectAllLessons`, `selectExample`, `selectExampleByLesson`, `useScaledFont`, `ResultModal`, `src/global.css`, `metadata.ts` o integrarlo (C3) | `npx tsc --noEmit` + suite verde; búsqueda de símbolos huérfanos |
| D2 | Centralizar duplicados (AUD-12): `TYPE_LABELS` (3 copias), `MESSAGES` (2), filtros `KNOWN_TYPES` (4), wrapper de evaluación | una sola fuente por constante |
| D3 | `homeTabForRoute` seguro ante rutas desconocidas (AUD-14, `tabRoutes.ts:24`) | test por ruta + ruta desconocida |
| D4 | Accesibilidad de blanks en `FillExercise.tsx:56-72` (AUD-15): `accessibilityRole`/`Label` | inspección + test de a11y si se integra |
| D5 | `seedDatabase` idempotente con `ON CONFLICT DO NOTHING` (AUD-19, `seed.ts:288-315`) | test de doble ejecución |
| D6 | Actualizar patch de paquetes (AUD-17): `npx expo install --check` | `expo-doctor` 21/21 + exports |
| D7 | Documentar FK por conexión (AUD-18, `db.ts:16`) | nota en `db.ts`/`AGENTS.md` |
| D8 | AUD-16 (N+1 y doble carga): **no refactorizar sin medición**; si se mide mejora, `Promise.all` en `useCatalog.ts:29-31` y un solo disparo de `refresh` por foco | medición antes/después |

**Criterio de salida:** suite verde, `expo-doctor` 21/21, cero símbolos huérfanos (o lista
justificada), exports OK en las tres plataformas.

---

## 6. Bloque E — Pruebas y cobertura

1. **Repositorios** (B5) — prioridad máxima de testing.
2. **Pantallas:** `login.tsx`, `register.tsx`, `(modules)/index.tsx`, `lecciones/[id].tsx`,
   `perfil/index.tsx` (hoy 0 %). Usar `@testing-library/react-native` con providers mockeados
   (patrón ya usado en `components/__tests__/*`).
3. **Flujos end-to-end de persistencia:** registrar → completar lección → práctica → evaluación →
   historial → `resetProgress` (valida A1).
4. **Meta de cobertura global (`src/**`)**: ≥70 % statements, con repositorios ≥80 %.

**Verificación:** `npm test -- --runInBand --coverage --collectCoverageFrom="src/**/*.{ts,tsx}"`.

---

## 7. Bloque F — Validación, contenido y fases 4–6 del plan

| Tarea | Origen | Notas |
|---|---|---|
| F1 | EAS Build Android (dev build) + iOS (compilación remota) | Fase 5 del plan; en Windows iOS requiere EAS |
| F2 | Validación 100 % offline en dispositivo (vuelo en avión, reinicio de app, migración con datos) | criterio de Fase 5 |
| F3 | Contenido completo Unidades 2–5 (hoy introductorio en `seed.ts:121-151`) | Fase de contenido |
| F4 | Ejercicios y evaluaciones para Unidades 2–5 (patrón de `unit1Content.ts`) | misma infraestructura de tipos |
| F5 | (Condicional a C2) Cuestionario CHAEA en `app/personalizacion` + filtrado de contenido por estilo | Fase 4 |
| F6 | Ficha de metadatos LOM con cobertura verificada de categorías (C3) | contraste con semana 4 del plan |

**Criterio de salida:** build instalado y validado en Android e iOS; todo el contenido y las
actividades de las 5 unidades presentes; decisión C2 implementada o documentada como limitación.

---

## 8. Roadmap propuesto (iteraciones)

| Iteración | Contenido | Entrada | Salida verificable |
|---|---|---|---|
| I1 — Datos | A1, A2, A3 | suite verde actual | P1 cerrados + tests de regresión |
| I2 — Robustez | B1–B5 | I1 | P2 cerrados; repos ≥80 % |
| I3 — Decisiones + limpieza | C1–C8, D1–D8 | I2 | decisiones documentadas; `expo-doctor` 21/21; sin huérfanos |
| I4 — Pruebas | E | I3 | cobertura global ≥70 % |
| I5 — Validación y contenido | F1–F4 | I4 | EAS builds + unidades 2–5 completas |
| I6 — Personalización/cierre | F5 (si se decide), F6, sincronización documental | I5 | reporte alineado con implementación real |

Cada iteración debe actualizar `status/ESTADO-PROYECTO.md` (tabla de verificación: tsc, lint,
tests, cobertura, expo-doctor, export) y, cuando aplique, `docs/reviewer/arquitectura-oam-react-native.md`
y `AGENTS.md` (correcciones listadas en comparación §9).

---

## 9. Comandos de verificación continuos

```bash
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm test -- --runInBand --coverage --collectCoverageFrom="src/**/*.{ts,tsx}"
npx expo-doctor
npx expo export --platform web
npx expo export --platform android
npx expo export --platform ios
```

---

## 10. Riesgos de esta propuesta

- **A3 toca migraciones ya liberadas:** los usuarios con `user_version` 2–4 que ya migraron y
  perdieron intentos no pueden recuperarse (dato ya perdido); la corrección evita futuros casos.
  Documentar en changelog de migración.
- **B4 (KDF) cambia el formato de hash:** requiere compatibilidad de lectura para cuentas
  existentes (rehash en login).
- **C4 (eliminar `results`)** contradice literalmente la frase "mantiene `Exercise`/`Result` como
  tablas separadas" de `AGENTS.md`; si se elimina, actualizar `AGENTS.md` y el apartado teórico del
  reporte en el mismo cambio.
- **D6 (actualizar paquetes):** aunque son patches, conviene correr suite + exports tras el bump.

---

## 11. Resumen en una frase

**Primero curar la base de datos (A), blindar la robustez (B), cerrar las decisiones de alcance
(C), limpiar (D), probar (E) y solo entonces añadir validación en dispositivo y contenido
(F) — con verificación por comandos en cada iteración.**
