# Comparación: arquitectura propuesta vs. implementación real del OAM

**Fecha de elaboración:** 8 de octubre de 2026

## 1. Propósito y fuentes

Este documento contrasta tres cosas:

1. **Lo propuesto en la tesis**: arquitectura MLO-AR (Rivera Alvarado, 2018), secciones 3 (diseño conceptual) y 4 (desarrollo).
2. **Lo propuesto para este proyecto**: adaptación a Expo/React Native sin Realidad Aumentada (`arquitectura-oam-react-native.md`) y plan de trabajo agosto–noviembre 2026.
3. **Lo implementado**: según el análisis de solo lectura `review.md` del repositorio.

> **Limitación.** La columna "Implementado" se basa únicamente en lo que reporta `review.md`; no se inspeccionó el código directamente. Los puntos marcados **Por verificar** son aquellos que el review no confirma ni desmiente.

**Leyenda de estado**

| Estado | Significado |
| --- | --- |
| Cumple | Implementado de forma coherente con lo propuesto |
| Parcial | Existe, pero incompleto o con diferencias relevantes |
| No implementado | Propuesto, sin evidencia en el código |
| Extensión | Implementado, pero no estaba en lo propuesto |
| Por verificar | El review no da evidencia suficiente |

---

## 2. Resumen ejecutivo

| Aspecto | Estado |
| --- | --- |
| Patrón MVVM (View → ViewModel → Repository → SQLite) | Cumple |
| Delimitación sin RA, sin sensores, sin red | Cumple |
| Ejercicios y Evaluación como entidades separadas | Cumple (con dos puntos de contacto a justificar) |
| Cuatro secciones (lecciones, ejemplos, ejercicios, evaluación) | Cumple |
| Capa de Persistencia | Cumple (con extensiones) |
| Capa de Personalización | Parcial |
| Capa de Interactividad (sin RA) | Cumple |
| Capa de Estructura General | Cumple |
| Capa de Estándares (LOM / SCORM) | Parcial (metadatos sí; SCORM no) |
| Ligereza (dependencias) | Parcial |
| Autenticación y cuentas locales | Extensión no prevista |

---

## 3. Comparación por capa

### 3.1 Capa de Persistencia de Datos

| Componente | Tesis (MLO-AR) | Propuesto en este proyecto | Implementado | Estado |
| --- | --- | --- | --- | --- |
| Base de datos | Room sobre SQLite, entidades + DAO | `expo-sqlite` | `expo-sqlite` con `migrateAndSeed` en `SQLiteProvider`, WAL, `foreign_keys=ON`, `user_version = 10` | Cumple |
| Repositorios | 5: Personalization, Lesson, Example, Exercise, Evaluation | Un módulo por entidad en `data/repositories` | 8 repositorios: account, profile, progress, lesson, exercise/example, evaluation, attempt, location. Todos reciben `db` como primer argumento | Cumple (ampliado) |
| Cache | Conserva la sección en uso ante interrupciones | Estado en memoria (React state/context) | `last_location` persistida en SQLite + `SessionProvider` (`resumeHref`, "Continúa donde lo dejaste") | Cumple (mejor que lo propuesto) |
| Repositorio de recursos multimedia | Imágenes, animaciones, video, sonido | Assets estáticos de Expo | `RichContent` soporta bloques `p`, `h`, `bullets`, `numbers`, `table`; el review no menciona bloque de imagen | Por verificar |
| Almacenamiento de contenido | Datos en BD, actualizables por repositorio | Contenido en BD | Contenido en `unit1Content.ts`/`seed.ts`, aplicado por migraciones (`applyUnit1Content`, `applyUnit12ExerciseBank`). Campos JSON como TEXT | Parcial (ver 4, Durabilidad) |

### 3.2 Capa de Personalización

| Componente | Tesis (MLO-AR) | Propuesto en este proyecto | Implementado | Estado |
| --- | --- | --- | --- | --- |
| Tipo de aprendizaje | Cuestionario (Honey-Alonso) que determina cantidad y tipo de contenido; repositorios filtran por tipo de personalización | Cuestionario CHAEA vía `useLearnerProfile` | `learner_profile` con estilo (por defecto `'Pragmático'`) y selector manual en Perfil. `saveQuestionnaire` existe sin consumidores; el review no muestra ningún lugar donde el estilo filtre o cambie el contenido | Parcial |
| Contexto (actividad física, sonido) | Sensores del dispositivo | Excluido (sin sensores) | No hay permisos ni sensores | Cumple (delimitación) |
| Progreso previo | No contemplado explícitamente | `useModuleProgress` ajusta secuencia | `module_progress` + `useModuleProgress`; `analyticsLogic` (`summarizeAttempts`, `weakTypes`, `recommendReview`) recomienda repaso según desempeño | Cumple / Extensión |
| Preferencias de accesibilidad | No contemplado | No contemplado | `dark_mode` y texto ampliado en el perfil; `AppThemeProvider` deriva el tema del perfil | Extensión |

**Lectura:** la adaptación que existe es **por desempeño**, no **por estilo de aprendizaje**. El estilo se almacena y se elige, pero no condiciona el contenido (según el review).

### 3.3 Capa de Interactividad (sin Realidad Aumentada)

| Componente | Tesis (MLO-AR) | Propuesto en este proyecto | Implementado | Estado |
| --- | --- | --- | --- | --- |
| Recursos | Contenido presentado por Activities/Fragments | Componentes React Native | Componentes "tontos" reutilizables (`Screen`, `RichContent`, `UnitCard`, `HubTile`, etc.) | Cumple |
| Eventos de interacción | Clics, gestos, arrastre | Manejadores estándar de RN | `onPress`, gestos con `react-native-gesture-handler`, animaciones con `reanimated` | Cumple |
| Tipos de ejercicio | No especificados | Opción múltiple, completar, ordenar | 4 motores por tipo en `ActivityView`: ordenar, completar, relacionar, crucigrama. Coincide con las plantillas de `tablas-ingenieria` | Cumple |
| Subcapa de Realidad Aumentada | Rastreo + Reconocimiento (Vuforia/Unity) | **Excluida** | No hay permisos de cámara/ubicación/sensores ni motor de RA | Cumple (delimitación) |

### 3.4 Capa de Estructura General

| Componente | Tesis (MLO-AR) | Propuesto en este proyecto | Implementado | Estado |
| --- | --- | --- | --- | --- |
| Navegación/secciones | Activities | Expo Router (file-based) | Expo Router con `Stack.Protected`, `Tabs` con `AppTabBar` personalizada, grupos `(modules)`, `(evaluations)`, `(profile)` | Cumple |
| ViewModels | Clases `ViewModel` por sección | Hooks por sección | `src/viewmodels/` con hooks por sección y lógica pura separada (`exerciseLogic`, `quizLogic`, `analyticsLogic`, `authLogic`, `exampleLogic`) | Cumple |
| Metadatos | LOM en XML (9 categorías) | Objeto JSON simple | `src/models/metadata.ts` + `MetadataBadge` en `UnitCard`. El review no detalla su contenido | Por verificar |

### 3.5 Capa de Estándares

| Componente | Tesis (MLO-AR) | Propuesto en este proyecto | Plan de trabajo | Implementado | Estado |
| --- | --- | --- | --- | --- | --- |
| LOM | Metadatos IEEE 1484.12.1 | Referencia conceptual | Semana 4: ficha de metadatos LOM | `metadata.ts` presente; falta confirmar cobertura de las categorías | Por verificar |
| SCORM | Empaquetado y distribución | **No se implementa** | Semana 13: "paquete de distribución SCORM" como entregable | Sin evidencia de empaquetado | No implementado |

> **Inconsistencia a resolver.** El documento de arquitectura previo afirmaba que no habría empaquetado SCORM, pero el plan de trabajo lo lista como entregable. Hay que decidir cuál prevalece y alinear ambos documentos.

---

## 4. Cumplimiento de requerimientos de la tesis

### 4.1 Requerimientos de objetos de aprendizaje móviles (sección 3.1)

| Requerimiento | Evidencia en la implementación | Estado |
| --- | --- | --- |
| Visualizar contenido | `lecciones/[id].tsx` con `useLessonContent` | Cumple |
| Visualizar ejemplos | `ejemplos/index.tsx` con `useExamplesEngine` y `ExampleRunner` (variantes A/B) | Cumple |
| Resolver ejercicios | `ejercicios/index.tsx` con `usePracticeEngine`, feedback inmediato | Cumple |
| Realizar evaluación | `EvaluationFlow` con `useEvaluationEngine`, puntaje e historial | Cumple |
| Interactividad | Táctil, 4 tipos de actividad, sin RA | Cumple |
| Personalización | Estilo almacenado, sin adaptación de contenido por estilo | Parcial |
| Accesibilidad (indexación por metadatos) | `metadata.ts` presente | Por verificar |
| Contenido estandarizado | Estructura fija de 4 secciones y bloques de `RichContent` | Cumple |
| Granularidad | Unidad con varias lecciones/subtemas (p. ej. 1.1, 1.2…) frente a "tema lo menos divisible posible" | Por justificar |
| Reutilización | Contenido embebido en la app, sin paquete exportable | Parcial |
| Portabilidad | Android/iOS vía Expo; build iOS en EAS por confirmar | Por verificar |
| Durabilidad | Contenido actualizable por migraciones versionadas, no por un repositorio externo; migraciones tempranas destructivas (`DROP_ALL_DDL` + re-seed) | Parcial |
| Usabilidad | Accesibilidad cuidada (`accessibilityRole/Label/State`); evaluación formal pendiente (semana 12 del plan) | Parcial |
| Auto contenido | Offline total, cero llamadas de red | Cumple |
| Autoría | El review no menciona créditos de fuentes ni derechos | Por verificar |

### 4.2 Requerimientos de aplicación móvil (sección 3.2)

| Requerimiento | Evidencia en la implementación | Estado |
| --- | --- | --- |
| Navegabilidad | Tabs + Stacks con `anchor`, tab bar contextual (`SubtopicTabBar`), rutas tipadas | Cumple |
| Ligereza | 7 dependencias declaradas sin uso: `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-web-browser`, `expo-device`, `expo-constants`; varias también como plugins en `app.json` | Parcial |
| Extensibilidad | Capas y hooks desacoplados; sin sensores por delimitación | Cumple |
| Modularidad | Separación clara; duplicados menores (`TYPE_LABELS` en 3 lugares, `KNOWN_TYPES` en 4, wrappers idénticos de evaluación) | Cumple (con deuda) |
| Facilidad de prueba y mantenibilidad | 22 archivos de test, lógica pura extraída, TypeScript `strict` | Cumple |
| Persistencia de datos | SQLite local con migraciones | Cumple |

---

## 5. Modelo de datos

La tesis define **6 entidades** en `AppDatabase`. El proyecto tiene **14 tablas**: las 6 núcleo más 8 de soporte.

| Entidad (tesis) | Tabla(s) implementada(s) | Observación |
| --- | --- | --- |
| Lesson | `lessons` | Agrupadas en `units` (no existe en la tesis) |
| Example | `examples` | — |
| Exercise | `exercises` | — |
| Result | `results` | El review muestra que la práctica escribe en `attempts`; no queda claro quién escribe en `results` |
| Evaluation | `evaluations` | — |
| Question | `questions` | — |

| Tabla adicional | Función | Estado |
| --- | --- | --- |
| `accounts`, `auth_session` | Cuentas locales y sesión | Extensión |
| `units` | Agrupación de lecciones | Extensión |
| `attempts` | Bitácora de intentos, compartida entre práctica y evaluación (`source`) | Extensión |
| `evaluation_results` | Resultado final de cada evaluación | Extensión |
| `learner_profile` | Estilo y preferencias del alumno | Extensión |
| `module_progress` | Avance por lección | Extensión |
| `last_location` | Última ubicación para "Continuar" | Extensión |

### Separación Ejercicios / Evaluación

| Dimensión | Estado de la separación |
| --- | --- |
| Tablas de contenido y resultados | Separadas (`exercises`/`results` vs `evaluations`/`questions`/`evaluation_results`) |
| Motores de lógica | Separados (`usePracticeEngine` vs `useEvaluationEngine`) |
| Rutas y navegación | Separadas (sección `ejercicios` vs pestaña `evaluaciones`) |
| Bitácora de intentos | **Compartida** (`attempts`, con `source = 'practice' \| 'evaluation'`) |
| Componentes de presentación | **Reutilizados**: la evaluación adapta `Question` → `Exercise` (`asExercise`) para usar `ActivityView` |

Las dos últimas filas no rompen la separación de entidades, pero como es una restricción documentada, conviene justificarlas explícitamente (bitácora común para analítica; reutilización de UI con feedback distinto).

---

## 6. Hooks y nombres

| Propuesto | Implementado | Observación |
| --- | --- | --- |
| `useLessonContent` | `useLessonContent` (+ `useLessonHub`) | Cumple |
| `useExerciseEngine` | `usePracticeEngine` | Renombrado. `useExerciseEngine` existe, pero es solo el motor del ejercicio de ordenar dentro de `ActivityView` |
| `useQuizEngine` | `useEvaluationEngine` (en el archivo `useQuizEngine.ts`) | El hook llamado `useQuizEngine` es código muerto (solo lo usan sus tests) |
| `useModuleProgress` | `useModuleProgress` | Cumple |
| `useLearnerProfile` | `useLearnerProfile` | Cumple |
| — | `useAuth`, `useSession`, `useCatalog`, `useExamplesEngine`, `useRecentResults`, `useEvaluationsCatalog` | No propuestos |

**Para el reporte:** citar `usePracticeEngine` y `useEvaluationEngine` como los hooks reales de ejercicios y evaluación.

---

## 7. Pantallas: de Activities/Fragments a Expo Router

| Tesis (Android) | Propuesto en el .md | Implementado (`src/app/(app)/...`) |
| --- | --- | --- |
| `PersonalizationActivity` | `app/personalizacion/index.tsx` | **No existe**; solo el selector de estilo en `(profile)/perfil/index.tsx` |
| `MenuLessonActivity` | `app/lecciones/index.tsx` | `(modules)/index.tsx` (catálogo con `UnitCard` expandibles) |
| `LessonActivity` | `app/lecciones/[id].tsx` | `(modules)/lecciones/[id].tsx` |
| `MenuExampleActivity` / `ExampleActivity` | `app/ejemplos/...` | `(modules)/ejemplos/index.tsx` (secuencia con `ExampleRunner`, sin menú separado) |
| `MenuExerciseActivity` / `ExerciseActivity` | `app/ejercicios/...` | `(modules)/ejercicios/index.tsx` (sesión con resumen final, sin menú separado) |
| `EvaluationActivity` + fragmentos | `app/evaluacion/index.tsx` | `(modules)/evaluacion/index.tsx` y `(evaluations)/evaluacion/index.tsx` (ambos renderizan `EvaluationFlow`) |
| — | — | `(modules)/tema/[id].tsx`: hub de cada tema (no previsto) |
| — | — | `(evaluations)/evaluaciones/index.tsx`: catálogo e historial (no previsto) |
| — | — | `login.tsx`, `register.tsx` (no previstos) |

---

## 8. Extensiones no previstas

| Extensión | Descripción | Riesgo / observación |
| --- | --- | --- |
| Autenticación local | Registro, login, sesión, `Stack.Protected`. Hash SHA-256 con salt (`authLogic.ts`) | No está en MLO-AR ni en el .md. La tesis (2.4.3) critica ambientes completos con administración de usuarios frente a un objeto de aprendizaje. El review señala que no es un KDF |
| Unidades (`units`) | Agrupan lecciones | Tensión con el requisito de granularidad |
| Analítica de desempeño | `summarizeAttempts`, `weakTypes`, `recommendReview` | Puede sustentar la capa de Personalización por desempeño |
| Tema y accesibilidad | Modo oscuro, texto ampliado, `AppThemeProvider` | Compatible con el objetivo de usabilidad |
| Continuación de sesión | `last_location`, `resumeHref` | Mejora sobre el cache propuesto |
| Destino web | `react-native-web`, `output: "single"` | Fuera del alcance móvil declarado; confirmar si es intencional |
| Compilador y rutas tipadas | `reactCompiler`, `typedRoutes` | Sin impacto arquitectónico, pero conviene mencionarlo en el stack |

---

## 9. Correcciones necesarias al documento de arquitectura previo

| Afirmación en `arquitectura-oam-react-native.md` | Realidad | Corrección |
| --- | --- | --- |
| "Se conserva el esquema de 6 entidades" | 14 tablas (6 núcleo + 8 de soporte) | Reescribir como "6 entidades núcleo + tablas de soporte" |
| Cache como estado en memoria | `last_location` persistente en SQLite | Actualizar |
| Capa de Estándares sin empaquetado SCORM | Plan de trabajo lo exige en la semana 13 | Decidir y alinear |
| Hooks `useExerciseEngine` / `useQuizEngine` | `usePracticeEngine` / `useEvaluationEngine` | Actualizar nombres |
| Rutas `app/lecciones/[id].tsx`, etc. | `src/app/(app)/(modules)/...` con hub `tema/[id]` | Actualizar tabla de rutas |
| Personalización por estilo vía cuestionario | Selector manual, sin cuestionario ni filtrado | Describir lo real o implementar |
| Metadatos como JSON simple | `models/metadata.ts` (contenido no confirmado) | Verificar y describir |
| No menciona autenticación | Existe y es relevante | Incluir como extensión documentada |

---

## 10. Decisiones y acciones pendientes

| # | Tema | Opciones | Prioridad |
| --- | --- | --- | --- |
| 1 | Autenticación local | Conservar y justificar (progreso por alumno en dispositivo compartido) **o** simplificar a perfil local sin credenciales | Alta |
| 2 | Personalización por estilo | Implementar cuestionario y filtrado **o** describirla en el reporte como perfil + recomendación por desempeño | Alta |
| 3 | SCORM | Generar paquete en semana 13 **o** corregir el plan de trabajo | Alta |
| 4 | Justificar `attempts` compartida y `asExercise` | Redactar la justificación junto a la restricción Ejercicios/Evaluación | Media |
| 5 | Verificar `results` | Confirmar quién escribe en esa tabla y que `resetProgress` también limpie `attempts` y `last_location` | Media |
| 6 | Verificar `metadata.ts` | Contrastar con la ficha LOM de la semana 4 | Media |
| 7 | Dependencias sin uso | Retirar las 7 dependencias y plugins asociados | Media |
| 8 | Código muerto | Retirar `useQuizEngine` (hook), `useAttempts`, `useExample`, `useScaledFont`, `src/global.css`, repositorios sin uso | Baja |
| 9 | Duplicados | Centralizar `TYPE_LABELS`, `MESSAGES`, `KNOWN_TYPES` y el wrapper de evaluación | Baja |
| 10 | Granularidad | Justificar unidades con varios subtemas frente al requisito de la tesis | Baja |
| 11 | Actualizar documentación | Sincronizar `arquitectura-oam-react-native.md` y `AGENTS.md` con la sección 9 | Media |

---

## 11. Qué afirmar (y qué no) en el reporte

- **Sí afirmar:** arquitectura en capas con patrón MVVM mediante hooks; persistencia local con SQLite; separación entre ejercicios y evaluación; ausencia deliberada de RA; funcionamiento offline; lógica probada con pruebas automatizadas.
- **Afirmar con matiz:** personalización (perfil con estilo seleccionable y recomendación de repaso basada en desempeño); estándares (metadatos descriptivos siguiendo LOM, si se confirma la cobertura); esquema de datos (seis entidades de la arquitectura de referencia más tablas de soporte).
- **No afirmar sin implementar o verificar:** adaptación del contenido por estilo de aprendizaje; empaquetado SCORM; cumplimiento completo de las 9 categorías LOM; portabilidad a iOS probada.
