# Decisiones de alcance — MLO Ingeniería de Software

> Registro de las decisiones del Bloque C del plan `siguientes-pasos.md`, ya aplicadas en la
> rama `fix/estabilizacion-datos`. Fecha: 2026-10-08.

## C1. Autenticación local — **Conservar y justificar**

- **Decisión:** se mantiene el registro/login local (`accounts`, `auth_session`, `Stack.Protected`).
- **Justificación:** permite progreso, perfil e historial **por alumno** en un dispositivo
  compartido, sin backend ni red. Ya estaba construida y probada.
- **Mejora aplicada:** el hash pasó de SHA-256+salt a **PBKDF2-HMAC-SHA256** (100 000 iteraciones)
  con rehash transparente de cuentas legacy al iniciar sesión (`authLogic.ts`, `useAuth.tsx`).
- **Para el reporte:** declararlo como **extensión** respecto a MLO-AR (que no contempla
  administración de usuarios), justificada por el uso en dispositivo compartido.

## C2. Personalización por estilo — **Implementada como CHAEA abreviado**

- **Decisión:** se implementó el cuestionario en `src/app/(app)/(profile)/personalizacion`
  con lógica pura en `viewmodels/chaLogic.ts` (8 ítems, 2 por estilo) y persistencia del estilo
  dominante vía `useLearnerProfile.saveQuestionnaire`.
- **Alcance:** es una **versión abreviada** orientativa, no el CHAEA completo de 80 ítems; debe
  declararse así en el reporte.
- **Adaptación de contenido por estilo:** sigue siendo **parcial**; el contenido no se reordena
  automáticamente por estilo. La personalización efectiva hoy es por **desempeño**
  (`analyticsLogic.recommendReview`).

## C3. SCORM — **No se empaqueta en runtime**

- **Decisión:** se mantiene "sin empaquetado SCORM/LOM en runtime", coherente con
  `arquitectura-oam-react-native.md` y `AGENTS.md`.
- **Pendiente documental:** el `PlanDesarrollo.md` listaba un "paquete SCORM" (semana 13); debe
  corregirse o confirmarse con el asesor. Punto de extensión: `src/models/metadata.ts`.

## C4. Tabla `results` — **Eliminada**

- **Decisión:** se retiraron la tabla `results` (de `schema.ts`), la entidad `ExerciseResult`
  (`entities.ts`), `insertResult` (`exerciseRepository.ts`) y `useRecordExerciseResult`
  (`useExerciseEngine.ts`), por estar **inertes** (nadie los leía ni escribía en runtime).
- **Bitácora real:** `attempts` (`source = 'practice' | 'evaluation'`).
- **Documentos actualizados:** `AGENTS.md`.

## C5. Granularidad — **Justificar en el reporte**

- **Decisión:** el OAM cubre una asignatura de 5 unidades con subtemas; la **granularidad mínima
  es la lección** (`lessons`) y no la unidad. Se documenta como decisión de diseño frente al
  principio "tema lo menos divisible posible" de la tesis.

## C6. `attempts` compartida y `asExercise` — **Justificar en el reporte**

- **Bitácora común** (`attempts`) para práctica y evaluación: habilita analítica unificada
  (`summarizeAttempts`, `weakTypes`, `recommendReview`).
- **Reutilización de UI** (`EvaluationFlow.asExercise` adapta `Question` → `Exercise`): la
  separación de entidades se conserva; solo se reutiliza el componente de actividad con feedback
  distinto (inmediato en práctica; acumulado y con repaso final en evaluación).

## C7. Destino web — **Conservar como soporte**

- **Decisión:** se mantiene `react-native-web` y `expo export --platform web` como soporte para
  demo/desarrollo; **no** es un requisito móvil. El export web fue verificado (OK).

## C8. Dependencias sin import directo — **Auditar caso por caso**

- **Decisión:** se actualizaron los 7 paquetes a la versión esperada por SDK 57
  (`npx expo install --fix`). No se retiró ninguna dependencia solo por falta de imports
  directos (pueden ser requeridas por plugins o transitivas). Pendiente: auditoría fina con
  `expo-doctor` y revisión manual.

## F6. Ficha LOM — **Ficha descriptiva parcial**

- `src/models/metadata.ts` aporta una ficha descriptiva (título, descripción, autor, versión,
  idioma, palabras clave, estándar, fecha). **No** cubre las 9 categorías completas de IEEE
  1484.12.1. Se mantiene como **referencia conceptual**, no como empaquetado LOM.

---

## Resumen de impacto en el reporte

- **Afirmar:** MVVM con hooks, persistencia local, separación Ejercicios/Evaluación, sin RA,
  offline, autenticación local justificada, PBKDF2, cuestionario CHAEA abreviado.
- **Afirmar con matiz:** personalización (perfil + estilo abreviado + recomendación por
  desempeño); metadatos LOM parciales.
- **No afirmar sin verificar:** adaptación automática de contenido por estilo; empaquetado SCORM;
  cumplimiento completo LOM; portabilidad iOS probada en dispositivo.

---

## C9. Servicios y contenido remoto — **Offline-first con servicios opcionales** (2026-10-23)

- **Cambio de alcance:** MLO deja de declararse "sin red ni backend". Se añade una capa de
  servicios **desactivada por defecto** (`DATA_MODE = 'local'`), pensada para consumir solo
  **contenido publicado** por el sistema del maestro.
- **Qué no se hace:** no se sincroniza progreso, no hay cuentas remotas, no existen `sync/*`
  ni `auth/*`. SQLite sigue siendo la fuente de verdad local.
- **Cómo se integra:** los ViewModels consumen `useRepositories()`; un adaptador HTTP
  (`shared/services/http`) y `remoteContent.ts` validan el contenido con `parse*Seed` antes de
  aplicarlo. Si falla la red o el contenido es inválido, se conserva el contenido local.
- **Requisito para el reporte:** describir la app como **offline-first** con servicios
  opcionales, no como una app conectada. La prueba de modo avión sigue siendo válida y
  obligatoria para el comportamiento por defecto.
