# Arquitectura del OAM — Adaptación de MLO-AR a React Native / Expo

## 1. Alcance de este documento

Este documento traduce el diseño conceptual y el desarrollo arquitectónico descritos en
las secciones **3. Diseño conceptual de la arquitectura MLO-AR** y **4. Desarrollo de la
arquitectura** (Rivera Alvarado, 2018) al stack tecnológico real del proyecto: **Expo
(React Native)**, **Expo Router**, **expo-sqlite** y **EAS Build**.

> **Exclusión explícita de Realidad Aumentada.** La arquitectura MLO-AR original
> contempla una subcapa de Realidad Aumentada dentro de la Capa de Interactividad
> (componentes de *Rastreo* y *Reconocimiento*, apoyados en Vuforia/Unity, con las
> clases `MenuController` e `ImageController`). Este proyecto **no incorpora RA**: no
> hay reconocimiento de marcadores, no hay motor de renderizado 3D, no hay
> dependencia de Unity. Por lo tanto, en todo lo que sigue, la Capa de Interactividad
> se redefine **sin esa subcapa**, y el OAM se mantiene 100% offline/local, sin
> sincronización en la nube ni backend.

Esta decisión debe justificarse en el reporte de residencia como una **delimitación del
alcance**, no como un incumplimiento del marco teórico: la arquitectura de capas se
conserva como guía estructural, pero se adapta a un objeto de aprendizaje orientado a
contenido de *Introducción a la Ingeniería de Software* (texto, ejemplos, ejercicios
interactivos y evaluación), donde la interacción relevante es táctil y de navegación,
no de cámara/mundo real.

> **Nota sobre prototipo vs. arquitectura de producción.** Este documento describe la
> **arquitectura objetivo de producción** del OAM: una aplicación móvil nativa sobre
> **Expo (React Native)**, con Expo Router, expo-sqlite y EAS Build. En paralelo existe
> un **prototipo de alta fidelidad** construido como aplicación web con **React DOM +
> Vite** (usado para validar el diseño de interacción y el flujo pedagógico en Figma
> Make). Ese prototipo **no es la app de producción**: emplea React del lado del DOM
> (`<div>`/`<section>` y CSS) en lugar de los componentes nativos de React Native
> (`<View>`/`<Text>`), y su único propósito es servir como referencia visual y de flujo.
> Ambas rutas son mutuamente excluyentes en la capa nativa —Capacitor envolvería la web
> app, mientras que Expo compila componentes nativos con Metro— por lo que la
> implementación definitiva sigue esta arquitectura Expo, tomando el prototipo Vite
> únicamente como maqueta de la Capa de Interactividad (véase también §7, *Prototipo de
> alta fidelidad como fuente de verdad visual*).

---

## 2. Correspondencia general MLO-AR → Proyecto Expo

| Elemento MLO-AR (Android nativo) | Equivalente en este proyecto |
| --- | --- |
| Activities / Fragments | Pantallas de **Expo Router** (rutas basadas en archivos) |
| ViewModel (Android Architecture Components) | **Hooks personalizados** (`useModuleProgress`, `useLessonContent`, `useExerciseEngine`, `useQuizEngine`, `useLearnerProfile`) |
| Room + SQLite | **expo-sqlite** |
| Repository (Java/Kotlin) | Módulo de acceso a datos en TS/JS (funciones `select*`, `insert*` por entidad) |
| Dependency Injector (Dagger 2) | Contexto de React / inyección vía hooks y providers |
| Subcapa de Realidad Aumentada (Vuforia/Unity) | **No aplica — fuera de alcance** |
| Compilación nativa Android Studio | **EAS Build** (obligatorio para iOS por desarrollo en Windows) |
| Diseño de interfaces ad-hoc | **Prototipo de alta fidelidad** como fuente de verdad visual (Figma se usó solo en la fase de prototipo) |

El patrón **MVVM** se conserva como principio rector, pero su implementación es la
idiomática de React: el "ViewModel" no es una clase sino un **hook** que encapsula
estado, efectos y llamadas al repositorio, y el "View" es el componente de pantalla que
consume ese hook.

---

## 3. Capas de la arquitectura (adaptadas, sin RA)

Siguiendo el principio de la arquitectura original: **las capas son independientes
entre sí y las capas inferiores proveen servicios a las capas superiores.**

```
┌───────────────────────────────────────────────┐
│ Capa 5 — Estándares (metadatos LOM, opcional)  │
├───────────────────────────────────────────────┤
│ Capa 4 — Estructura General                    │
│  (rutas, secciones, ViewModels/hooks)          │
├───────────────────────────────────────────────┤
│ Capa 3 — Interactividad                        │
│  (eventos táctiles, navegación, feedback)      │
│  ⛔ sin subcapa de Realidad Aumentada           │
├───────────────────────────────────────────────┤
│ Capa 2 — Personalización                       │
│  (estilo de aprendizaje, perfil del alumno)    │
├───────────────────────────────────────────────┤
│ Capa 1 — Persistencia de Datos                 │
│  (expo-sqlite, repositorios, cache local)      │
└───────────────────────────────────────────────┘
```

### 3.1 Capa de Persistencia de Datos

**Responsabilidad:** almacenamiento y manipulación de datos primitivos y recursos
(texto, imágenes) del OAM, de forma local y auto contenida (requisito de *auto
contenido* de la sección 3.1 del documento base).

Componentes:

- **Base de datos local (expo-sqlite):** control y acceso a las 6 entidades del
  esquema (ver sección 5).
- **Repositorios (módulo `data/repositories`):** una unidad por entidad —
  `lessonRepository`, `exampleRepository`, `exerciseRepository`,
  `evaluationRepository` — cada una exponiendo funciones equivalentes a las de la
  arquitectura original (`selectLessons()`, `selectLesson(id)`, `insertResult()`,
  `insertAnswer()`, etc.), pero como funciones async sobre `expo-sqlite` en vez de
  clases Java con DAO.
- **Cache de sesión:** estado en memoria (React state / context) que conserva la
  sección que el alumno está usando ante interrupciones del sistema operativo,
  equivalente al componente *Cache* original pero sin necesidad de un mecanismo
  nativo adicional.

> Repositorio de "recursos multimedia" (imágenes/animaciones) se resuelve con los
> assets estáticos de Expo, sin necesidad de un gestor de archivos dedicado, dado que
> no hay contenido de video/RA que administrar.

### 3.2 Capa de Personalización

**Responsabilidad:** adaptar el contenido presentado según el perfil del alumno.

A diferencia de la arquitectura original (que usa sensores de actividad física y nivel
de sonido ambiental — heredados del proyecto de sistemas distribuidos conscientes de
contexto), este proyecto **simplifica la personalización a variables pedagógicas**,
consistentes con el público objetivo (estudiantes de tercer año de licenciatura y
primer año de posgrado):

- **Estilo de aprendizaje:** cuestionario inicial (p. ej. CHAEA) gestionado por el
  hook `useLearnerProfile`, que determina qué tipo/cantidad de lecciones, ejemplos,
  ejercicios y evaluación se prioriza.
- **Progreso previo:** el hook `useModuleProgress` consulta el historial almacenado
  para ajustar la secuencia de contenido sugerida (repaso vs. avance).

No se contemplan variables de contexto físico (movimiento, sonido ambiental), ya que
no aportan valor al objetivo pedagógico de este OAM y añadirían dependencias de
sensores nativos fuera del alcance definido.

### 3.3 Capa de Interactividad (sin Realidad Aumentada)

**Responsabilidad:** gestionar los medios de interacción entre el alumno y el
contenido.

Componentes:

- **Recursos:** presentación del contenido (texto, imágenes) definido por el prototipo
  de alta fidelidad, renderizado mediante componentes React Native.
- **Eventos de interacción:** manejo de toques, gestos, scroll y entrada de datos —
  equivalente al componente *Eventos de interacción* original, implementado con los
  manejadores estándar de React Native (`onPress`, `onChangeText`, etc.) en lugar de
  listeners de Android.
- ~~**Subcapa de Realidad Aumentada** (Rastreo + Reconocimiento)~~ — **eliminada**.
  No existe motor de RA, ni manejo de sensores de cámara/GPS/acelerómetro para
  reconocimiento de marcadores.

Las pantallas que en la arquitectura original correspondían a Activities/Fragments se
mapean así:

| Original (Android) | Expo Router (este proyecto) |
| --- | --- |
| `PersonalizationActivity` | `app/personalizacion/index.tsx` |
| `MenuLessonActivity` | `app/lecciones/index.tsx` |
| `LessonActivity` | `app/lecciones/[id].tsx` |
| `MenuExampleActivity` / `ExampleActivity` | `app/ejemplos/index.tsx`, `app/ejemplos/[id].tsx` |
| `MenuExerciseActivity` / `ExerciseActivity` | `app/ejercicios/index.tsx`, `app/ejercicios/[id].tsx` |
| `IndicationExerciseFragment` / `AnswerExerciseFragment` | Componentes internos de la pantalla de ejercicio (`<Indicaciones />`, `<FormularioRespuesta />`) |
| `EvaluationActivity` + fragmentos | `app/evaluacion/index.tsx` con subcomponentes equivalentes |

### 3.4 Capa de Estructura General

**Responsabilidad:** organizar las secciones que componen el OAM (Tema, Ejemplos,
Ejercicios, Evaluación) y gestionar los metadatos descriptivos.

- **Navegación/estructura:** definida por **Expo Router** (file-based routing),
  equivalente a la organización de Activities de la arquitectura original.
- **ViewModels → Hooks:** cada sección tiene un hook dedicado que gestiona los datos
  a mostrar, replicando la separación de responsabilidades de los ViewModel
  originales:
  - `useLessonContent` → contenido de lecciones/ejemplos.
  - `useExerciseEngine` → lógica y estado de ejercicios (independiente de
    evaluación, por diseño — ver sección 5).
  - `useQuizEngine` → lógica y estado de evaluación final.
  - `useModuleProgress` → avance general del alumno por módulo.
  - `useLearnerProfile` → perfil y estilo de aprendizaje.
- **Metadatos:** a diferencia del estándar LOM/XML de la arquitectura original
  (pensado para publicación en un LMS), aquí los metadatos descriptivos (título,
  autor, versión, idioma) pueden mantenerse como un objeto de configuración simple
  (JSON local), ya que **no hay publicación en repositorios de aprendizaje** ni
  requerimiento de interoperabilidad SCORM/LOM real — esto debe declararse como
  limitación de alcance si el reporte exige trazabilidad con el estándar LOM.

### 3.5 Capa de Estándares

En la arquitectura original esta capa es de soporte y contempla SCORM y LOM para
garantizar portabilidad hacia sistemas LMS. Dado que este OAM es una **aplicación
móvil autónoma sin integración a LMS**, esta capa se conserva únicamente como
**referencia conceptual** (para efectos de justificar decisiones de diseño de
contenido y metadatos en el reporte), pero no se implementa como código: no hay
empaquetado SCORM ni generación de XML LOM en tiempo de ejecución.

> Si en fases posteriores el proyecto requiere exportar el contenido a un LMS, esta
> capa sería el punto de extensión natural (generar manifiesto SCORM/LOM a partir del
> JSON de metadatos ya definido en la Capa 4).

---

## 4. Patrón arquitectónico: MVVM con hooks

```
 View (pantalla / componente)
        │  usa
        ▼
 Hook "ViewModel" (useLessonContent, useExerciseEngine, ...)
        │  llama
        ▼
 Repositorio (data/repositories/*)
        │  consulta
        ▼
 expo-sqlite (Model / entidades)
```

Ventajas que se conservan respecto a la arquitectura original (sección 4.1):

- **Desacoplamiento** entre la vista y la lógica de datos: los hooks pueden
  cambiarse o probarse sin tocar el JSX de la pantalla.
- **Separación de responsabilidades:** cada hook gestiona una única sección o
  entidad, igual que los ViewModel originales.
- **Granularidad y reusabilidad:** los hooks pueden reutilizarse entre pantallas
  (p. ej. `useLearnerProfile` se consulta tanto en Lecciones como en Ejercicios para
  adaptar contenido).
- **Facilidad de prueba:** los hooks son funciones aisladas, testeables con
  `renderHook` de `@testing-library/react` sin necesidad de emulador.

---

## 5. Modelo de datos (esquema de 6 entidades)

Se conserva el esquema de 6 entidades de la arquitectura original, manteniendo
**Ejercicios y Evaluación como tablas separadas** por decisión arquitectónica
deliberada: su lógica de retroalimentación es distinta (los ejercicios ofrecen
feedback inmediato por reactivo; la evaluación calcula un puntaje acumulado al
finalizar).

| Entidad | Rol |
| --- | --- |
| `Lesson` | Contenido teórico por tema/subtema |
| `Example` | Ejemplos guiados asociados a una lección |
| `Exercise` | Reactivos de práctica (opción múltiple, completar, ordenar) |
| `Result` | Resultados/respuestas del alumno a los `Exercise` (feedback inmediato) |
| `Evaluation` | Definición de la evaluación final por tema |
| `Question` | Reactivos y respuestas asociados a una `Evaluation` (cálculo de puntaje) |

Esto reproduce exactamente la separación `Exercise/Result` vs. `Evaluation/Question`
de la arquitectura MLO-AR (sección 4.2.1), lo cual respalda —con precedente en el
marco teórico— la decisión ya tomada en este proyecto de no fusionar ambas entidades.

---

## 6. Flujo de datos entre capas (ejemplo: resolver un ejercicio)

1. El alumno abre `app/ejercicios/[id].tsx` (Capa de Interactividad).
2. La pantalla usa `useExerciseEngine(id)` (Capa de Estructura General / hook).
3. El hook llama a `exerciseRepository.selectExercise(id)` (Capa de Persistencia).
4. `expo-sqlite` retorna el registro; el hook lo transforma en estado de UI.
5. El alumno responde; `useExerciseEngine` calcula aciertos/errores localmente y
   llama a `exerciseRepository.insertResult()` para persistir el intento.
6. `useModuleProgress` (Capa de Personalización) se actualiza para reflejar el
   avance, sin intervención de red ni sincronización externa.

En ningún punto de este flujo —ni en el equivalente para evaluación, lecciones o
ejemplos— interviene cámara, sensor de movimiento o motor de renderizado 3D.

---

## 7. Consideraciones técnicas específicas del stack

- **Offline-first:** toda lectura/escritura pasa por `expo-sqlite`; no hay llamadas
  a red en ninguna capa, consistente con el requisito de *auto contenido* y
  *portabilidad* del documento base.
- **Prototipo de alta fidelidad como fuente de verdad visual:** los componentes de la
  Capa de Interactividad deben implementarse fielmente al prototipo ya construido; no se
  improvisan variantes de UI no contempladas. Figma se empleó únicamente durante la fase
  de prototipo y no forma parte del desarrollo de producción.
- **EAS Build para iOS:** dado que el desarrollo ocurre en Windows, la Capa de
  Estructura General (rutas, navegación) debe probarse localmente en Android/Expo
  Go, y validarse en iOS únicamente mediante compilaciones remotas de EAS Build
  antes de considerarse completa.
- **OpenCode / `AGENTS.md`:** las convenciones de nombres de hooks y repositorios
  descritas en este documento deben reflejarse en `AGENTS.md` para que el agente de
  codificación mantenga consistencia con esta arquitectura.

---

## 8. Resumen de la adaptación (para citar en el reporte)

> La arquitectura del OAM desarrollado retoma el modelo en capas propuesto en la
> arquitectura MLO-AR (Rivera Alvarado, 2018), conservando las capas de
> Persistencia, Personalización, Interactividad, Estructura General y Estándares, así
> como el patrón arquitectónico MVVM. Se excluye deliberadamente la subcapa de
> Realidad Aumentada de la Capa de Interactividad, dado que el alcance del presente
> proyecto se limita a contenido textual, ejemplos, ejercicios interactivos y
> evaluación para la asignatura de Ingeniería de Software, sin integración de
> tecnologías de reconocimiento de marcadores ni renderizado tridimensional. La
> implementación traduce los componentes originales (Activities, Fragments,
> ViewModel, Room/SQLite) a sus equivalentes idiomáticos en el ecosistema Expo/React
> Native (rutas de Expo Router, hooks personalizados, expo-sqlite), preservando los
> principios de separación de responsabilidades, modularidad y persistencia local
> que sustentan la arquitectura de referencia.