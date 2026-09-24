# Estado del proyecto — OAM Ingeniería de Software

> Documento de seguimiento derivado de `prototipo/PlanDesarrollo.md`.
> Fecha de corte: 13 de septiembre de 2026.
> Alcance ejecutado en esta sesión: **Fases 0–3 (núcleo funcional)**.
> Git: **no modificado** (por decisión explícita); el repositorio raíz `D:\devvv\MLO`
> sigue sin commits.

---

## 0. Actualización — implementación real (sesión posterior)

> Fecha de corte: 21–22 de septiembre de 2026. Sustituye al corte de Fases 0–3 de abajo.

**Completado en esta sesión**

- **Autenticación local offline**: `accounts` + `auth_session`, hash SHA-256 con salt
  (`expo-crypto`), `useAuth`, pantallas `login`/`register`, guardas `Stack.Protected`,
  splash hasta resolver sesión.
- **Datos por cuenta**: `learner_profile`, `module_progress`, `results` y
  `evaluation_results` con `account_id`; el perfil y el nombre salen del login.
- **Progreso a cero**: seed sin perfil ni progreso; migración v2 destruye/recrea; todo
  indicador inicia en 0 %.
- **Navegación ≤3 toques**: Home con unidades expandibles (acordeón, 1 abierta);
  hub de mosaicos para todas las lecciones salvo 1.1 (que abre directo la lectura);
  un mosaico por ejemplo y por ejercicio; sin rutas-lista intermedias; tab Evaluaciones
  con catálogo real e historial; Perfil con cierre de sesión y reinicio de progreso.
- **UI**: alineada a la referencia (hero azul, avatar con iniciales, anillos, chips),
  paleta intacta, chevrons SVG en lugar de glifos de flecha.
- **Contenido**: lectura por bloques ricos (`lessons.content`: párrafos, listas y tablas)
  para 1.1 y 1.2 desde `Introducción a la ISW.md`; `RichContent` respeta tablas.
- **Ejercicios interactivos (Unidad 1, lecciones 1.2–1.4)**: tipos `order`, `fill`
  (completar con banco de palabras) y `match` (enlazar pares), con lógica pura testeada
  (`exerciseLogic.ts`) y engines `useExerciseEngine`/`useFillEngine`/`useMatchEngine`.
  Ejemplo extra en 1.2 y evaluaciones de 1.2–1.4 ampliadas a 4 preguntas.
- **Esquema v4** con migración aditiva v3→v4 (`ALTER TABLE exercises ADD COLUMN config` +
  `applyUnit1Activities`), preservando cuentas y resultados existentes.

**Verificación (evidencia)**

| Comprobación | Comando | Resultado |
|---|---|---|
| Typecheck estricto | `npx tsc --noEmit` | exit 0 |
| Pruebas | `npm test` | 5 suites / 36 tests OK |
| Lint | `npx eslint .` | exit 0 |
| Bundle nativo | `npx expo export --platform android` | OK |

**Pendiente**

- Crucigramas (descartado por usabilidad móvil; el usuario eligió completar/enlazar/ordenar).
- Contenido de lectura por bloques ricos para 1.3–1.4 y unidades 2–5 (hoy usan `body`).
- Ejercicios interactivos para 1.1 (se dejó intencionalmente como estaba) y para unidades 2–5.
- Pruebas de repositorios contra expo-sqlite y de pantallas/flujos completos.
- Fase 4 (cuestionario CHAEA automático) y Fase 5 (EAS Build / validación en dispositivo).

---

## 1. Verificación de cierre de sesión

| Comprobación | Comando | Resultado |
|---|---|---|
| Typecheck estricto | `npx tsc --noEmit` | exit 0 |
| Pruebas | `npm test` (jest-expo) | 4 suites / 13 tests OK |
| Lint | `npx eslint .` | exit 0 |
| Bundle nativo | `npx expo export --platform android` | bundle OK (1833 módulos) |

---

## 2. Completado (Fases 0–3)

### Fase 0 — Bootstrap
- Proyecto Expo SDK 57 con Expo Router (`src/app`) ya existente, reutilizado.
- Starter demo eliminado: `explore.tsx`, tabs nativas, componentes `themed-*`,
  `app-tabs`, `animated-icon`, `web-badge`, hooks y `constants/theme` del template.
- Dependencias añadidas: `expo-sqlite`, `react-native-svg`; dev: `jest`, `jest-expo`,
  `@testing-library/react-native`, `react-test-renderer`, `eslint`, `eslint-config-expo`.
- `AGENTS.md` actualizado con arquitectura, estructura y convenciones (Plan §8).

### Fase 1 — Capa de Persistencia
- `src/models/entities.ts` — tipos de dominio (Unit, Lesson, Example, Exercise, Result,
  ExerciseResult, Evaluation, Question, EvaluationResult, LearnerProfile, ModuleProgress).
- `src/models/schema.ts` — DDL con las 6 entidades separadas
  (`Exercise`/`Result` y `Evaluation`/`Question`) + `LearnerProfile`, `ModuleProgress`
  y `EvaluationResult`. Versión de BD: 1.
- `src/models/metadata.ts` — metadatos descriptivos (LOM como referencia conceptual).
- `src/data/db.ts` — apertura, `PRAGMA`, migración y seed.
- `src/data/seed.ts` — catálogo de las 5 unidades; contenido completo de la Unidad 1
  (4 lecciones, 3 ejemplos, 4 ejercicios de orden, 4 evaluaciones) desde
  `prototipo/tablas-ingenieria.md`; perfil inicial y progreso de ejemplo.
- Repositorios (`src/data/repositories/`): `lesson`, `example`, `exercise`, `evaluation`,
  `progress`, `profile`. Todos reciben `SQLiteDatabase` como primer argumento.

### Fase 2 — ViewModels (hooks)
- `useLessonContent(lessonId)`, `useExerciseEngine(exercise)`, `useQuizEngine(questions)`,
  `useModuleProgress(unitId?)`, `useLearnerProfile()`.
- Hooks de apoyo: `useCatalog`, `useExample`, `useExerciseForLesson`, `useEvaluationForLesson`,
  `useRecordExerciseResult`, `useRecordEvaluationResult`, `useRecentResults`, `useSession`.
- Lógica pura testeable: `exerciseLogic.ts`, `quizLogic.ts`.
- Contextos: `LearnerProfileProvider` (perfil + accesibilidad) y `SessionProvider`
  (cache de sesión en memoria).
- `src/theme/` — tokens de `prototipo/Guidelines.md` y `AppThemeProvider` (modo claro/oscuro
  y texto ampliado persistidos).

### Fase 3 — Capa de Interactividad
- Rutas: `index` (Home con pestañas Módulos/Evaluaciones/Perfil), `lecciones/index`,
  `lecciones/[id]`, `tema/[id]` (hub de 4 tiles), `ejemplos/index`, `ejemplos/[id]`,
  `ejercicios/index`, `ejercicios/[id]`, `evaluacion/index`.
- Componentes reutilizables fieles al prototipo: `AppText`, `Screen`, `ScreenHeader`,
  `Buttons`, `UnitCard`, `SubtopicRow`, `HubTile`, `BottomTabBar`, `QuizOption`,
  `ResultModal`, `ProgressRing` (SVG), `Toggle`, `MetadataBadge`, `EmptyState`,
  `SectionHeading`.
- Ejercicios con feedback inmediato; evaluación con puntaje acumulado, persistencia de
  resultados e historial; accesibilidad básica (roles, labels, `prefers-reduced-motion`).

---

## 3. Pendiente (según `PlanDesarrollo.md`)

### Fase 4 — Capa de Personalización (no iniciada)
- `app/personalizacion` con cuestionario CHAEA (el estilo ya se persiste y se ajusta
  manualmente desde el Perfil; falta el cuestionario y la adaptación automática de
  contenido/secuencia con `useLearnerProfile` + `useModuleProgress`).

### Fase 5 — Empaquetado y validación (no iniciada)
- Configurar **EAS Build**; validar en iOS por compilación remota y en Android por dev build.
- Verificar explícitamente la operación 100 % offline en dispositivo.

### Fase 6 — Estándares (opcional)
- Punto de extensión LOM/SCORM a partir de `src/models/metadata.ts` (no implementado).

### Contenido / alcance de datos
- Unidades 2–5: solo contenido introductorio; el detalle completo está pendiente.
- Ejercicios: solo se implementó el tipo `order` (fidelidad al prototipo). De la
  Tabla 7 faltan los tipos *crossword*, *complete*, *filling words* y *associate words*.
- Ejemplos: la evaluación automática de ejemplo por estilo de aprendizaje es visual.

### Pruebas
- Cubierto: lógica pura (`exerciseLogic`, `quizLogic`) y hooks puros
  (`useQuizEngine`, `useExerciseEngine`) con `renderHook`.
- Falta: pruebas de repositorios contra `expo-sqlite`, de las pantallas y de los flujos
  de navegación/persistencia completos.

---

## 4. Desviaciones y decisiones tomadas

1. **Raíz de rutas `src/app`** (no `app/` en la raíz): es la raíz real configurada del
   proyecto Expo Router; el plan la listaba como `app/`.
2. **Ruta añadida `tema/[id]`**: el plan no la listaba, pero era necesaria para conservar
   el hub de 4 tiles del prototipo de alta fidelidad.
3. **Tabla `EvaluationResult`**: extensión sobre las 6 entidades para persistir el puntaje
   acumulado y alimentar el historial; no contradice la separación
   `Exercise`/`Result` y `Evaluation`/`Question`.
4. **Firmas de hooks**: `useExerciseEngine` y `useQuizEngine` reciben la entidad ya cargada
   (no el id) para mantener la lógica pura y testeable; los loaders
   (`useExerciseForLesson`, `useEvaluationForLesson`) resuelven el acceso a SQLite.
   La vista sigue consumiendo solo hooks.
5. **Fuentes del sistema** en lugar de Google Fonts por CDN, para cumplir el requisito
   offline-first.
6. **`.expo/types/router.d.ts`** (rutas tipadas) se eliminó por estar desactualizado;
   se regenera al ejecutar `npm run start`.
7. **ESLint**: no existía configuración; se creó `eslint.config.js` con
   `eslint-config-expo`. La regla `react-hooks/set-state-in-effect` se desactiva porque
   los hooks hacen carga asíncrona al montar.

---

## 5. Cómo ejecutar

```bash
npm install
npm run start      # Expo dev server (Expo Go / dev build)
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
npm test           # Jest
npx tsc --noEmit   # Typecheck
npx eslint .       # Lint
```

---

## 6. Notas de alcance

- `prototipo/` se mantiene **solo como fuente de verdad visual**; no se importa ni se
  ejecuta en producción y está excluido de `tsconfig.json` y de ESLint.
- No hay RA, ni sensores nativos, ni empaquetado SCORM/LOM en runtime, ni llamadas de red.
