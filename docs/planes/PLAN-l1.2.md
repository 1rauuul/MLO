# Plan de implementación: lección `l1.2` (MLO) — adaptado al estado actual

> **Implementado.** El banco remoto de `l1.2` quedó integrado en la migración v14
> (ids estables desde v15). Documento conservado como registro; no confundir con v12.
>
> Adaptado el 2026-10-15 al estado real del repo (refactor MVVM por features).

Arquitectura vigente: `src/features/<feature>/{model,viewmodel,view}` y
`src/shared/{components,hooks,services,utils,model,theme}`, con rutas Expo Router delgadas en `src/app/`.
El contenido vive en `src/shared/services/content/` (según `AGENTS.md`); **no** se mueve a `feature/model`.

## Restricciones

- No se cambian dependencias ni textos de UI sin consultarlo.
- Campos de ejercicio: `id`, `lessonId`, `type`, `prompt`, `instructions`, `correctOrder`, `config`, `explanation`, `example` (`title`, `steps[{ text, why }]`, `hints[]`).
- Los ids de `l1.2` llevan sufijo de letra (`ordn`, `filln`, `matchn`, `crossn`); **no** es "prefijo n".

## Estado real de partida

- Banco real: `src/shared/services/content/banks/lesson1.2.bank.ts` (no `exports/banco1.2.ts`).
- Copia de autoría (docs): `docs/contenido/bancoejercico-ejemplo1.2.ts`.
- `DATABASE_VERSION = 11` (`src/shared/services/db/schema.ts`). El plan original decía 12 → aquí es el siguiente salto.
- No existe tabla de estado de ejemplos ni mapa `id → tema`.
- La advertencia de salida ya existe para **evaluación** (`EvaluationFlow.tsx`); falta para ejercicios y `tabPress`.

## Decisiones (validadas)

1. Poda del banco = **7 ítems**: `ordo`, `matchn`, `matcho` (duplicados) + `ordp`, `ordr`, `ords`, `ordt` (fuera de lugar). Banco resultante: 26.
2. Estado de ejemplos (sorteo + vistos): se guarda en SQLite (tabla nueva `example_state`).
3. Ubicación del banco: `src/shared/services/content/banks/` (AGENTS.md).
4. Advertencia de salida: modal propio + cubre ejercicios y el cambio de pestaña (`tabPress`).

## Pasos

### 1. Depurar el banco ✅ (hecho)
- Eliminados `ordo`, `matchn`, `matcho`, `ordp`, `ordr`, `ords`, `ordt` de `lesson1.2.bank.ts` y de la copia en docs.
- Ids únicos verificados.

### 2. Integrar el banco en la app ✅ (hecho)
- El banco ya está en `shared/services/content/banks/` y se siembra vía `applyUnit12ExerciseBank`.
- Los 9 legacy de `l1.2` = 6 de `unit1.content.ts` (`unit1Exercises`) + 3 del banco (`cross1.2a`, `fill1.2c`, `ord1.2a`).

### 3. Migración de base de datos
- Subir `DATABASE_VERSION` a `12`.
- Crear tabla `example_state (account_id, lesson_id, payload JSON, updated_at)`.
- Migración incremental (sin borrar `attempts`).

### 4. Sorteo de ejemplos y ejercicios ✅ (hecho)
- `drawGroups` sortera hasta 10 por grupo sin que un id caiga en ambos.
- Ejemplos: sortean 10, se **persisten** en `example_state` y **reanudan** donde se quedó.
- Práctica: sortean 10 **nuevos en cada entrada** (excluye los ids ya usados como ejemplo). Salir reinicia.
- Repos `draw.logic.ts` + `exampleStateRepository.ts` con tests.

### 5. Retroalimentación por reactivo ✅ (hecho)
- Tras cada reactivo, la práctica muestra acierto + `explanation` (`ExercisesScreen.tsx`).

### 6. Resumen de temas débiles ✅ (hecho)
- Mapa `id → tema` en `src/shared/services/content/topics.ts`; `weakTopics` agrupa errores por tema y el resumen los muestra.

### 7. Crucigrama ✅ (hecho)
- Al comprobar, las celdas se marcan con `success`/`danger` (`CrosswordExercise.tsx`).

### 8. Evaluación aleatoria ✅ (hecho)
- Pool por lección = **10 `questions` + 5 ejercicios = 15**, mezclados (`buildEvaluationPool`), sin repetir en la sesión.
- Barajado de opciones de cada `mcq` (respuesta reajustada) para evitar memorizar posiciones.
- Banco de preguntas por lección `banks/lesson1.2.questions.ts` (solo objetos `QuestionSeed`, a llenar) con siembra idempotente (`applyL12QuestionBank`) y bump de versión (v13).

### 9. Modal de advertencia de salida ✅ (hecho)
- `ConfirmExitModal` en `shared/components`.
- Ejercicios: al pulsar atrás avisa que, si no termina, la próxima vez empieza de cero con ítems diferentes.
- Evaluación: el `Alert` se reemplazó por el mismo modal; salir reinicia.
- Ejemplos: no avisa; guarda y reanuda en el ejemplo donde se quedó.
- Interceptar `tabPress` en la barra inferior: **pendiente** (no existe listener hoy).

### 10. Tests
- Banco (campos, ids únicos, ausencia de ids eliminados), migración v12, sorteo sin intersección, temas débiles, feedback y guard de salida.

## Lista de temas `id → tema` para l1.2 (a validar)

- `proceso` — actividades del proceso (ordn, ordo…, ord1.2)
- `atributos` — atributos de calidad (match1.2, fill1.2c, cross1.2, cross1.2a, crossn)
- `productos` — tipos de producto (match1.2b, crosso)
- `aplicaciones` — tipos de aplicación (fills, matchp, matchq)
- `retos` — retos generales y la Web (matchr, matchv, crossp)
- `conceptos` — definiciones básicas (matchs, crossq)
- `costos` — costos y prueba (fillp)
- `etico` — reservado (no aplica a l1.2)
