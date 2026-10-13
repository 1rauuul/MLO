# Análisis: arquitectura MLO-AR (tesis) vs. arquitectura del proyecto

**Fuente de referencia:** Rivera Alvarado, L. A. (2018). *Arquitectura de Software en Capas para la Construcción de Objetos de Aprendizaje Móviles con Realidad Aumentada*. Tesis, LANIA. Secciones 3 (diseño conceptual), 4 (desarrollo) y 5.1 (comparación con trabajos relacionados).

**Proyecto analizado:** MLO Introducción a la Ingeniería de Software (Expo SDK 57, Expo Router, expo-sqlite, TypeScript).

**Alcance del análisis.** Se revisaron `AGENTS.md`, `src/models/schema.ts`, `src/data/db.ts`, `src/app/_layout.tsx`, `src/viewmodels/*` (en particular `chaLogic.ts`, `useLearnerProfile.tsx`, `authLogic.ts`), los repositorios y `src/models/metadata.ts`. Se buscaron con grep sensores, audio, cámara, ubicación y llamadas de red. Las afirmaciones marcadas como *no verificado* proceden de `docs/reviewer/` y no se comprobaron en el código.

---

## 1. Resumen

| Aspecto | Veredicto |
| --- | --- |
| Estructura en 5 capas | Se conserva. Persistencia, Personalización, Interactividad, Estructura general y Estándares existen con nombres equivalentes. |
| Patrón MVVM | Se conserva, pero con hooks de React en lugar de clases ViewModel con LiveData. Adaptación correcta. |
| Persistencia (Room → expo-sqlite) | Equivalente funcional. Mejora: migraciones versionadas con `user_version`. |
| Subcapa de Realidad Aumentada | Eliminada a propósito. Decisión correcta y documentada en `AGENTS.md`. |
| Sensores de actividad física y sonido (Personalización) | Eliminados. Decisión correcta: el proyecto es offline y sin sensores. |
| **Personalización por estilo de aprendizaje** | **Brecha principal.** El estilo se guarda y se muestra, pero no cambia el contenido. |
| Metadatos LOM | Parcial. Existe una constante descriptiva, no un XML LOM ni un generador. |
| SCORM | No implementado. El plan de trabajo lo lista como entregable, mientras `AGENTS.md` lo descarta. Hay que resolver la contradicción. |
| Autenticación | No está en la tesis. Es una extensión justificada. |

---

## 2. Comparación capa por capa

Leyenda: **Igual** = se conserva tal cual. **Adaptado** = cambia la tecnología, la idea se conserva. **Eliminado** = se descarta por alcance. **Brecha** = propuesto y no implementado. **Extensión** = no está en la tesis.

### 2.1 Capa de Persistencia de datos (tesis, sección 3.4.1 y 4.2)

| Elemento de la tesis | En el proyecto | Estado | Comentario |
| --- | --- | --- | --- |
| Room + entidades + DAO | `expo-sqlite` con DDL en `models/schema.ts` y repositorios por entidad | Adaptado | Room es una capa sobre SQLite. En RN no existe, así que el acceso directo a SQLite es lo natural. |
| `AppDatabase` (clase abstracta con DAO) | `migrateAndSeed` en `data/db.ts` sobre `SQLiteProvider` | Adaptado | Es el punto de entrada único de la base de datos. |
| `PRAGMA foreign_keys` por conexión | Activado en `migrateAndSeed` | Igual | `AGENTS.md` lo exige. Correcto. |
| Repositorios con `select*`, `insert*`, `mark*` | `data/repositories/*Repository.ts` reciben `db` como primer argumento | Igual | Coincide con la convención de `AGENTS.md`. |
| Repositorio de recursos multimedia (imágenes, video, sonido) | No existe. El contenido es texto y bloques de `RichContent` | Eliminado (parcial) | Coherente con el alcance. Si se añaden imágenes, deben ser assets de Expo, no blobs en SQLite. *No verificado: el análisis previo indica que `RichContent` no tiene bloque de imagen.* |
| Cache de la sección en uso | `last_location` persistido en SQLite y `SessionProvider` | Mejora | La tesis propone caché en memoria. Un SO móvil puede matar la app en segundo plano, así que persistirlo es más robusto. |
| Entidades `Lesson`, `Example`, `Exercise`, `Evaluation`, `Question` | Tablas con el mismo nombre (más `units`) | Igual + extensión | `units` agrupa lecciones. No aparece en la tesis. Ver §4.3. |
| Entidad `Result` | Retirada. Se usa `attempts` (bitácora) y `evaluation_results` | Adaptado | Decisión acertada: una bitácora única sirve a práctica y evaluación para analítica. |
| Entidad `Answer` | Coincide con `attempts` y `questions` | Adaptado | — |

**Lectura.** Esta capa es la más fiel a la tesis. Las diferencias son mejoras o adaptaciones razonables.

**Punto a vigilar (Durabilidad).** `db.ts` tiene una migración v2 que hace `DROP_ALL_DDL` y reseed. Es correcta para una versión temprana sin usuarios reales. Una vez que existan cuentas con progreso, esa ruta borraría datos. Recomendación: que las migraciones posteriores a la versión de publicación sean siempre incrementales (`ALTER`/`CREATE IF NOT EXISTS`) y nunca destructivas.

### 2.2 Capa de Personalización (tesis, sección 3.4.2 y 4.3)

Aquí está la diferencia más importante con la tesis.

| Elemento de la tesis | En el proyecto | Estado | Comentario |
| --- | --- | --- | --- |
| Cuestionario de estilo (Honey-Alonso) | Cuestionario CHAEA abreviado de 8 ítems en `viewmodels/chaLogic.ts`, pantalla `(profile)/personalizacion` | Adaptado | Buena elección: versión corta, puntuación pura y testeada. |
| Repositorio de personalización con `selectQuestions` y `insertAnswers` | Las respuestas no se persisten. Solo se guarda el estilo dominante (`saveQuestionnaire` → `setStyle`) | Adaptado | Aceptable para este alcance. No se guarda el historial de respuestas. |
| **Tipo de aprendizaje determina cantidad y tipo de contenido** (tesis: "los repositorios filtran por tipo de personalización") | **El estilo se guarda y se muestra en Perfil, pero ningún repositorio, hook ni pantalla lo consume para filtrar o ordenar contenido** | **Brecha** | Verificado con grep: `learningStyle` solo aparece en perfil, repositorio de perfil y `useLearnerProfile`. |
| Contexto: actividad física y sonido ambiental (clases `PreprocesoActFisica`, `PreprocesoNivelSonido`, `Personalization`) | Eliminado | Eliminado | Correcto. Esas clases en la tesis vienen de otro proyecto (Acosta, 2014). Requieren sensores, permisos y son incompatibles con offline y sin sensores de `AGENTS.md`. |
| Adaptación por progreso (no está en la tesis) | `module_progress`, `attempts`, `analyticsLogic` (`weakTypes`, `recommendReview`) | Extensión | **Es la adaptación que sí funciona.** Debería presentarse como la capa de personalización real. |
| Preferencias de accesibilidad (modo oscuro, texto ampliado) | `learner_profile.dark_mode`, `large_text`, `AppThemeProvider` | Extensión | Cubre el requisito de usabilidad. |

**Diagnóstico.** La tesis propone dos vías de personalización: por estilo y por contexto. El proyecto descarta la de contexto (correctamente) y no completa la de estilo. Hoy el sistema personaliza por desempeño, pero el estilo es decorativo.

**Recomendación (con alternativas):**

1. **Opción A, fiel a la tesis (mínimo viable).** Añadir una función pura en `viewmodels/` (por ejemplo `orderByStyle(style, items)`) que ordene ejemplos y ejercicios: los ejemplos prácticos primero para *Pragmático* y *Activo*, las explicaciones de modelo primero para *Teórico*. Es pequeña, testeable y deja el estilo visible en el contenido. Cubre el requisito de "Personalización" de la sección 3.1.
2. **Opción B, más sólida pedagógicamente.** Usar el desempeño como señal principal, que ya existe, y el estilo solo como orden inicial de desempate. La literatura sobre estilos de aprendizaje (incluido CHAEA) tiene evidencia empírica débil de que adaptar el formato al estilo mejore los resultados. Conviene decirlo en el reporte para no sobrevender la personalización.
3. **Opción C, documentar.** Describir honestamente la personalización como "perfil de estilo + recomendación de repaso por desempeño" y no como adaptación por estilo. Es válido si el reporte lo declara.

Recomiendo **B con la parte de A**: implementar el orden por estilo como función pura con prueba, y apoyar la justificación en el desempeño. Así se cumple el requisito sin afirmar un efecto que no está demostrado.

### 2.3 Capa de Interactividad (tesis, sección 3.4.3 y 4.4)

| Elemento de la tesis | En el proyecto | Estado | Comentario |
| --- | --- | --- | --- |
| Activities y Fragments | Pantallas de Expo Router y componentes React Native | Adaptado | Correspondencia directa, ver tabla de §3. |
| Recursos (fusión de contenido e interacción) | `RichContent`, `ActivityView` y sus motores | Igual | — |
| Eventos de interacción (clic, gesto, arrastre) | `onPress`, `react-native-gesture-handler`, `reanimated` | Adaptado | — |
| Tipos de actividad (no especificados en la tesis) | 4 tipos: ordenar, completar, relacionar, crucigrama | Extensión | Son las actividades de las tablas de Unidad 1. Bien alineado con el contenido. |
| Subcapa de RA: Rastreo (sensores) y Reconocimiento (cámara, marcadores) | No existe | **Eliminado** | Decisión correcta y documentada. Ver §4.1. |
| `MenuController` y `ImageController` (escenas de RA) | No existen | Eliminado | Pertenecen a la subcapa de RA. |

### 2.4 Capa de Estructura general (tesis, sección 3.4.4 y 4.5)

| Elemento de la tesis | En el proyecto | Estado | Comentario |
| --- | --- | --- | --- |
| Secciones Tema, Ejemplos, Ejercicios, Evaluación | Lecciones, ejemplos, ejercicios, evaluación, más un hub por tema (`tema/[id]`) | Igual + extensión | El hub `tema/[id]` no estaba previsto. Es una mejora de navegación. |
| ViewModels por sección (`LessonViewModel`, `ExerciseViewModel`, etc.) | Hooks `useLessonContent`, `usePracticeEngine`, `useEvaluationEngine`, `useExamplesEngine`, `useCatalog`, etc. | Adaptado | Sustituye LiveData por estado de React. Mantiene la separación vista/lógica. |
| Lógica pura separada del hook | `exerciseLogic.ts`, `evaluationLogic.ts`, `exampleLogic.ts`, `analyticsLogic.ts`, `chaLogic.ts`, `authLogic.ts` | Mejora | Es lo que hace posible probar la lógica sin renderizar. Coincide con el requisito de "facilidad de prueba" (sección 3.2). |
| Regla: la vista no importa repositorios ni `expo-sqlite` | Verificado con grep: `src/app` y `src/components` no importan `@/data` ni `expo-sqlite` (solo `_layout.tsx` monta el proveedor, como composición raíz) | Igual | Cumple la regla de `AGENTS.md`. |
| Inyección de dependencias (Dagger 2) | Providers de React (`SQLiteProvider`, `AuthProvider`, `SessionProvider`, `LearnerProfileProvider`) | Adaptado | Equivalente. Dagger no tiene sentido en RN. |
| Ejercicios y Evaluación como entidades separadas | Tablas `exercises` y `evaluations`/`questions`, motores separados | Igual | Requisito del proyecto, cumplido. La bitácora `attempts` es compartida (justificable). |
| Metadatos LOM en XML con 9 categorías (Anexo D) | `models/metadata.ts`, objeto constante con `standard: 'LOM/SCORM (referencia conceptual, no implementado en runtime)'` | Brecha | Ver §2.5. |

### 2.5 Capa de Estándares (tesis, sección 3.4.5)

| Elemento de la tesis | En el proyecto | Estado | Comentario |
| --- | --- | --- | --- |
| LOM (IEEE 1484.12.1) como metadatos | Constante TS con 8 campos básicos | Parcial | No hay generador XML ni cobertura de las 9 categorías. |
| SCORM para estructura, empaquetado y distribución | No implementado | Brecha / contradicción | `AGENTS.md` dice "sin empaquetado SCORM/LOM en runtime". El plan de trabajo (semana 13) pide un paquete SCORM. Hay que elegir una de las dos. |

**Recomendación.** Son dos decisiones distintas:

- **LOM:** generar el XML desde `metadata.ts` con una función pura y una prueba. Es pequeño (unas decenas de líneas), no necesita runtime y cumple el requisito de accesibilidad (indexación) de la sección 3.1. Como alternativa, bastaría con declarar en el reporte que se trata de una ficha descriptiva.
- **SCORM:** no lo recomiendo. Un paquete SCORM necesita un runtime web que llame a la API del LMS (`API`/`API_1484_11`) para reportar progreso. Este proyecto es una app móvil offline sin LMS. Implementarlo solo para cumplir la tesis añade complejidad sin beneficio para el usuario. Mi sugerencia: retirar el entregable SCORM del plan y explicar en el reporte que se descarta por alcance, citando la sección 1.5 de la tesis (la implementación se orienta a Android/móvil).

---

## 3. Correspondencia de pantallas

| Tesis (Android) | Proyecto (Expo Router) | Diferencia |
| --- | --- | --- |
| `PersonalizationActivity` | `(profile)/personalizacion/index.tsx` | Igual. |
| `MenuLessonActivity` | `(modules)/index.tsx` (catálogo con `UnitCard`) | El menú está en la pantalla de inicio. |
| `LessonActivity` | `(modules)/lecciones/[id].tsx` | Igual. La tesis usa WebView con HTML. El proyecto usa `RichContent` con bloques, más seguro y sin HTML en runtime. |
| `MenuExampleActivity` / `ExampleActivity` | `(modules)/ejemplos/index.tsx` | No hay menú separado: los ejemplos se recorren en secuencia con `ExampleRunner`. |
| `MenuExerciseActivity` / `ExerciseActivity` | `(modules)/ejercicios/index.tsx` | Sin menú separado, con resumen final. |
| `IndicationExerciseFragment` / `AnswerExerciseFragment` | Dentro de `ActivityView` | Un solo componente, el fragmento se vuelve un estado de la vista. |
| `EvaluationActivity` + fragmentos | `(modules)/evaluacion/index.tsx` y `(evaluations)/evaluacion/index.tsx` | Dos rutas que renderizan `EvaluationFlow`. Duplicación a revisar (ver §4.4). |
| — (no previsto) | `login.tsx`, `register.tsx`, `(evaluations)/evaluaciones` (historial) | Extensiones. |

---

## 4. Diferencias marcadas y justificación

### 4.1 Eliminadas (justificadas)

| Elemento | Por qué se elimina | ¿Está bien? |
| --- | --- | --- |
| Realidad aumentada (Vuforia, Unity, rastreo y reconocimiento) | Alcance del proyecto (`AGENTS.md`). Requiere cámara, motor nativo y marcadores impresos. | Sí. Es la decisión central de la adaptación. |
| Sensores de acelerómetro, GPS y micrófono | Offline y sin sensores nativos (`AGENTS.md`). Además son clases ajenas a la tesis. | Sí. |
| Red, servicios web y backend | Offline-first. | Sí. La tesis tampoco los necesitaba para el OAM; los analiza solo como trabajos relacionados (§2.4 de la tesis). |
| Dagger 2, LiveData, Room | Son de Android nativo. | Sí, se sustituyen por equivalentes de React y SQLite. |

### 4.2 Adaptadas (justificadas)

| Elemento | Adaptación | Evaluación |
| --- | --- | --- |
| Activities/Fragments | Rutas de Expo Router | Buena. Navegación basada en archivos y rutas tipadas. |
| ViewModel con LiveData | Hooks con estado de React | Buena. Mismo principio de separación. |
| Room | expo-sqlite con migraciones `user_version` | Buena. Más control sobre las migraciones. |
| Caché en memoria | Persistido en `last_location` | Mejora. |
| WebView con HTML | `RichContent` con bloques JSON | Mejora. Evita HTML arbitrario y es más accesible. |

### 4.3 Extensiones (no están en la tesis)

| Extensión | Evaluación |
| --- | --- |
| **Autenticación local** (`accounts`, `auth_session`, `authLogic`) | Justificable. Como cada alumno tiene su progreso, sin cuenta un dispositivo compartido mezclaría datos. La tesis (sección 2.4.3) critica los sistemas con administración de usuarios para un OAM, así que el reporte debe explicar por qué se incluye aquí: hace el progreso y la analítica por alumno. **Verificado:** `authLogic.ts` usa PBKDF2-SHA256 con 100 000 iteraciones y migra los hashes legacy de forma transparente. El análisis previo lo describía como SHA-256 simple; esa afirmación está desactualizada. |
| **Unidades** (`units`) | Agrupan varias lecciones. Entra en tensión con el requisito de granularidad de la sección 3.1 ("el tema lo menos divisible posible"). Recomiendo justificarlo como contexto de navegación, no como unidad de reutilización. |
| **Bitácora `attempts`** compartida entre práctica y evaluación | Buena decisión para analítica. Documentar la restricción. |
| **Analítica de desempeño** (`analyticsLogic`) | Es la personalización efectiva del sistema (§2.2). |
| **Hub por tema** (`tema/[id]`) | Mejora de navegación. |
| **Preferencias de accesibilidad** | Cubre el requisito de usabilidad. |

### 4.4 Deuda técnica detectada (no está en la tesis)

- **Rutas de evaluación duplicadas:** `(modules)/evaluacion` y `(evaluations)/evaluacion` renderizan el mismo `EvaluationFlow`. Conviene unificarlas en una sola ruta.
- **Duplicados de constantes:** `TYPE_LABELS`, `KNOWN_TYPES` y mensajes aparecen en varios archivos (según el análisis previo, pendiente de confirmar uno por uno).
- **Dependencias posiblemente sin uso** (según el análisis previo, *no verificado*): `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-web-browser`, `expo-device`, `expo-constants`. La tesis exige ligereza (sección 3.2): conviene comprobar cuáles se importan y retirar las que no.
- **Hooks posiblemente muertos** (según el análisis previo): `useQuizEngine` solo lo usan sus pruebas.

---

## 5. Correcciones a los documentos existentes

El análisis previo `docs/arquitectura/comparacion-propuesto-vs-implementado.md` y `docs/arquitectura/oam-react-native.md` contienen afirmaciones que este análisis contradice o no puede confirmar:

| Afirmación en el documento previo | Estado real |
| --- | --- |
| La tabla `results` escribe la práctica y "no queda claro quién escribe" | `results` **no está en `SCHEMA_DDL`**. `AGENTS.md` dice que fue retirada. La práctica escribe en `attempts`. Corregir. |
| "Autenticación con SHA-256 sin KDF" | Es **PBKDF2-SHA256** con 100 000 iteraciones (`authLogic.ts`). Corregir. |
| "La personalización es parcial: el estilo se guarda pero no condiciona el contenido" | **Correcto**, verificado. |
| "Metadatos: por verificar" | `metadata.ts` es una constante de 8 campos sin XML LOM. Verificado. |
| "Cache en memoria" | Corregido en `last_location`. El documento previo ya lo menciona, pero la arquitectura de referencia dice lo contrario. Alinear. |

---

## 6. Decisiones pendientes para el reporte

| # | Decisión | Recomendación |
| --- | --- | --- |
| 1 | Personalización por estilo | Implementar orden por estilo como función pura con prueba **y** justificar con desempeño (§2.2, opción B con parte de A). |
| 2 | LOM | Generar XML desde `metadata.ts` con una función pura y una prueba. |
| 3 | SCORM | Retirarlo del plan y justificarlo por alcance. Resolver la contradicción con `AGENTS.md`. |
| 4 | Autenticación | Conservar y justificar por progreso individual en dispositivo compartido. |
| 5 | Unidades | Conservar y justificar como contexto de navegación frente al requisito de granularidad. |
| 6 | Migraciones destructivas | Prohibir `DROP_ALL_DDL` en migraciones posteriores a la primera publicación. |
| 7 | Dependencias sin uso | Verificar con grep y retirar las que no se importen. |
| 8 | Rutas de evaluación duplicadas | Unificar en una sola ruta. |

---

## 7. Qué afirmar en el reporte

- **Sí afirmar:** arquitectura en cinco capas adaptada a React Native; MVVM mediante hooks con lógica pura probada; persistencia local con SQLite y migraciones versionadas; eliminación justificada de la realidad aumentada y de sensores; navegación y ejercicios con cuatro tipos de actividad; separación de vista y acceso a datos verificada.
- **Afirmar con matiz:** personalización (perfil de estilo y recomendación de repaso por desempeño; el estilo ordena contenido solo si se implementa la opción A); metadatos (ficha descriptiva; XML LOM solo si se implementa).
- **No afirmar:** adaptación del contenido por estilo de aprendizaje (mientras no se implemente); cumplimiento de SCORM; cumplimiento de las 9 categorías LOM; portabilidad a iOS probada.

---

## 8. Conclusión

La adaptación es fiel a la tesis en su estructura (capas, MVVM, separación de persistencia, lógica y vista) y en su principio de reutilización. Las diferencias que se ven a simple vista (sin RA, sin sensores, sin SCORM, con autenticación) son decisiones de alcance razonables, pero solo las de RA y sensores están bien documentadas en el código. La brecha real es la **personalización por estilo**: la tesis la propone como capa funcional, y el proyecto la tiene como dato sin efecto. Antes de defender la capa de personalización en el reporte, conviene implementar la opción A o declarar la opción C con honestidad.
