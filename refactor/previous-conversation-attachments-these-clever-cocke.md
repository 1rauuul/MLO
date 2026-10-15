# Plan: reestructurar MLO a MVVM por features + ordenar documentación

## Contexto
MLO (Expo/React Native, `1rauuul/MLO`, `main` @ `63935fe`) ya es MVVM por **capas**. Se quiere pasar a `src/features/<feature>/{model,viewmodel,view}` + `src/shared/*`, con rutas Expo Router delgadas, borrar lo que no se usa, renombrar con convención clara y dejar un repo presentable donde **no haya archivos sueltos**, incluida la documentación (reviews, estado, etc.). Sin cambiar dependencias, comportamiento ni textos de la UI.

El plan técnico detallado ya fue aprobado y está en `plans/mlo-mvvm.md` (árbol objetivo, tabla origen→destino, convención, reglas, verificación). **Este documento lo complementa**: reemplaza solo la sección "Raíz del repo: documentación ordenada" y el paso 7 de ejecución.

## Hallazgos nuevos
- `/workspaces/default/code` es un scaffold Vite sin relación con MLO. **El repo MLO no está clonado.** El primer paso es clonarlo en un directorio hermano (`/workspaces/default/MLO`) y trabajar ahí.
- Raíz de MLO hoy (suelto): `Introducción a la ISW.md`, `Unidad 1 ingdelsoftware.md`, `mapa-navegacion.html`, `status/` (5 archivos), `scripts/`. Y `docs/` mezcla 3 niveles: archivos sueltos, `reviewer/` (7), `superpowers/{plans,specs}`.
- Ningún código ni config referencia rutas de estos documentos (verificado con grep), así que moverlos es seguro. Solo hay enlaces internos entre los `.md` (p. ej. `docs/review.md`) que se reescriben.
- `status/oam-architecture-react-native.md` y `docs/reviewer/arquitectura-oam-react-native.md` son dos versiones distintas del mismo documento (difieren desde la línea 26).
- `docs/arquitectura-mlo.html` es idéntico al adjunto `arquitectura-mlo.html`.

## Estructura final de `docs/` (todo se mueve con `git mv`, nombres en minúsculas y kebab-case)
```
docs/
  README.md                         índice con un enlace y una línea por carpeta (único archivo nuevo)
  arquitectura/
    arquitectura-mlo.html
    er-mlo.html
    esquema-bd-mlo.html
    mapa-navegacion.html            (desde la raíz)
    mapa-navegacion.md              (desde status/)
    oam-react-native.md             (desde reviewer/arquitectura-oam-react-native.md)
    oam-react-native-estado.md      (desde status/oam-architecture-react-native.md; ver decisión abajo)
    analisis-tesis-vs-proyecto.md
    comparacion-propuesto-vs-implementado.md   (desde reviewer/)
  contenido/
    introduccion-isw.md             (desde la raíz)
    unidad-1.md                     (desde la raíz)
    tablas-ingenieria.md            (desde status/)
    banco-preguntas-unidad1.md
    crucigramas-unidad1.md
    crucigramas-unidad1-pistas-v2.md
    plantillas/banco-ejercicios.template.ts   (desde src/data/banks/template.ts)
  estado/
    estado-proyecto.md              (desde status/ESTADO-PROYECTO.md)
    decisiones-alcance.md           (desde reviewer/)
    siguientes-pasos.md             (desde reviewer/)
  reviews/
    review.md
    review-auditoria.md
    prompt-analisis-guiado.md       (desde reviewer/analisis.md; es un prompt, no un análisis)
  diseno/
    guidelines-visuales.md          (desde status/Guidelines.md)
  planes/                           (desde superpowers/plans/)
    2026-09-21-auth-ui-nav.md, 2026-09-27-learning-flow-unit1.md,
    2026-09-29-global-navigation.md, correcciones-ui-ejemplos.md
    2026-10-xx-refactor-mvvm-features.md   (copia de plans/mlo-mvvm.md, para que el plan quede en el repo)
  especificaciones/                 (desde superpowers/specs/)
    2026-09-21-auth-ui-nav-design.md, 2026-09-27-learning-flow-unit1-design.md,
    2026-09-29-global-navigation-design.md
```
Se eliminan `status/`, `docs/reviewer/` y `docs/superpowers/` al quedar vacíos. Las rutas internas de los `.md` se actualizan con `sed` sobre `docs/` y se comprueba con un grep de enlaces rotos.

## Raíz final
- **Configuración exigida por las herramientas** (no se puede mover sin romper Expo/ESLint/TS/npm): `app.json`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `metro.config.js`, `.gitignore`, `.env.example`.
- **Convención de GitHub/agentes**: `README.md`, `LICENSE`, `AGENTS.md`, `CLAUDE.md`.
- **Carpetas**: `src/`, `assets/`, `docs/`, y las de herramientas `.claude/`, `.opencode/`, `.vscode/`.
- `scripts/` se elimina (solo contenía `reset-project.js`).
- Resultado: 0 archivos de contenido o documentación sueltos en la raíz. Los ocho archivos de config, `README`, `LICENSE`, `AGENTS` y `CLAUDE` son la única excepción posible; los dos últimos y `README` deben estar en la raíz para que GitHub y las herramientas los encuentren.
- `README.md` (hoy el genérico de Expo) se reescribe corto: qué es MLO, cómo ejecutarlo, árbol de `src/` y enlace a `docs/README.md`. Es un cambio de documentación, no de la UI.

## Cambios al orden de ejecución (`plans/mlo-mvvm.md`)
- **Paso previo**: clonar `1rauuul/MLO` a `/workspaces/default/MLO`, crear `refactor/mvvm-features` desde `main`, correr línea base (`npx tsc --noEmit`, `npm run lint`, `npm test`) y guardar resultados.
- **Paso 7 `chore: reorganize docs`**: solo `git mv` según el árbol de arriba, más `sed` de enlaces. Sin cambios de contenido salvo enlaces.
- **Paso 8**: igual que antes, pero `template.ts` ya se movió a `docs/contenido/plantillas/`.
- **Paso 9 `docs:`**: reescribir `README.md`, crear `docs/README.md` y actualizar `AGENTS.md`/`CLAUDE.md` con la nueva estructura, convención de nombres y reglas de dependencias.
- Las reglas, la convención de nombres y la verificación por commit no cambian.

## Verificación
- Por commit: `npx tsc --noEmit`, `npm run lint`, `npm test` (mismo número de suites y tests que la línea base).
- Docs: `ls -A` de la raíz coincide con la lista de arriba; `git status` sin archivos sin rastrear; grep de enlaces `.md` rotos (`docs/`, `status/`, `reviewer/`, `superpowers/`) da 0 resultados; `git log --follow` sobre un archivo movido conserva el historial.
- Final: grep de rutas antiguas `@/(viewmodels|data|models|components|navigation|hooks|theme)/` da 0; prueba manual con `npm run web` (login → módulos → lección → ejercicios → evaluación → perfil).

## Decisiones tomadas por defecto (dime si prefieres otra)
1. Las dos versiones del documento OAM se conservan ambas (`oam-react-native.md` y `oam-react-native-estado.md`) porque difieren; no las fusiono sin consultarte.
2. `.opencode/` (skills de diseño que no se usan en esta app) y `.claude/` se dejan intactos; son carpetas de herramientas y no se tocan.
3. No hago push ni PR salvo que lo pidas.
