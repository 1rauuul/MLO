# Mapa de navegación — MLO Ingeniería de Software

> Estado actual del código (`src/app`). Offline-first; sesión local en SQLite (`auth_session`).
> Guarda global: sin cuenta solo existen `/login` y `/register`; con cuenta, todo el grupo `(app)`.

## 1. Árbol de rutas

```text
_root (Stack + Stack.Protected)
├── /login                  # acceso sin sesión
│   ├── [Entrar]            → router.replace('/')  (si credenciales válidas)
│   └── [Crear cuenta]      → /register
├── /register               # alta local (nombre, usuario, contraseña)
│   ├── [Crear cuenta]      → router.replace('/')  (si validación OK)
│   └── [Ya tengo cuenta]   → back → /login
└── (app)/                  # grupo protegido (requiere account)
    ├── /                   # Home · BottomTabBar con 3 tabs en pantalla
    │   ├── tab Módulos
    │   │   ├── [avatar]            → tab Perfil
    │   │   ├── [hero Continuar]    → lección 1.1: /lecciones/[id] · resto: /tema/[id]
    │   │   ├── [UnitCard / Ver N temas]  → expande/colapsa en línea (acordeón, 1 abierto)
    │   │   └── [SubtopicRow]       → lección 1.1: /lecciones/[id] · resto: /tema/[id]
    │   ├── tab Evaluaciones
    │   │   ├── [fila evaluación]   → /evaluacion?lesson=<lessonId>
    │   │   └── historial (sin navegación)
    │   └── tab Perfil
    │       ├── estilo / accesibilidad (en pantalla)
    │       ├── [Cerrar sesión]       → logout → guarda redirige a /login
    │       └── [Reiniciar mi progreso] → Alert confirm → borra datos de la cuenta
    ├── /tema/[id]          # Hub del tema (chip de estado: En progreso / Completado)
    │   ├── lección 1.1     → router.replace → /lecciones/l1.1 (sin menú)
    │   └── resto           → mosaicos 2×2 (solo los que tienen contenido)
    │       ├── [Lecciones]  → /lecciones/[id]
    │       ├── [Ejemplo N]  → /ejemplos/[id] (un mosaico por ejemplo)
    │       ├── [Ejercicio N]→ /ejercicios/[id]?lesson=<id> (un mosaico por ejercicio)
    │       └── [Evaluación] → /evaluacion?lesson=<id>
    ├── /lecciones/[id]     # Lectura: tabs Concepto | Síntesis (progreso 1/2)
    │   │                   # Concepto renderiza bloques ricos (párrafos, listas, tablas)
    │   └── [pie] Continuar → Síntesis
    │       └── [pie] Ver ejemplo → /ejemplos/[id]      (si hay ejemplo)
    │           | Practicar       → /ejercicios/[id]    (si no hay ejemplo y hay ejercicio)
    │           | Evaluación      → /evaluacion         (si solo hay evaluación)
    │           | Terminar        → back                (marca la lección completada)
    ├── /ejemplos/[id]      # Ejemplo resuelto (Antes → Después)
    │   └── [Volver al tema]→ back
    ├── /ejercicios/[id]    # Ejercicio interactivo: ordenar, completar (banco de palabras) o enlazar pares
    │   └── feedback inmediato + persiste Result (answer = asignación JSON)
    └── /evaluacion         # Quiz acumulado (persiste EvaluationResult + marca completada)
        ├── [×] / [Cerrar]  → back
        └── ResultModal     → [Reintentar] reinicia · [Cerrar] back
```

## 2. Diagrama

```mermaid
flowchart TD
  L[/login/] -->|registro| R[/register/]
  R -->|crear cuenta| H
  L -->|entrar| H

  subgraph APP["(app) — protegido"]
    H["/ · Home"]
    H -->|tab| EV["tab Evaluaciones"]
    H -->|tab| PF["tab Perfil"]
    H -->|unidad + lección ≠ 1.1| T["/tema/[id] · Hub mosaicos"]
    H -->|lección 1.1| LE11["/lecciones/l1.1 · lectura"]
    H -->|hero continuar| T
    EV -->|fila| Q["/evaluacion"]
    T -->|1.1 (redirect)| LE11
    T -->|Lecciones| LE["/lecciones/[id]"]
    T -->|Ejemplos| EX["/ejemplos/[id]"]
    T -->|Ejercicios| EJ["/ejercicios/[id]"]
    T -->|Evaluación| Q
    LE -->|pie: Ver ejemplo| EX
    LE -->|pie: Practicar| EJ
    LE -->|pie: Evaluación| Q
    PF -->|cerrar sesión| L
  end
```

## 3. Profundidad de toques (desde Home)

| Destino | Toques |
|---|---|
| Tab Evaluaciones / Perfil | 1 |
| Lectura de 1.1 (unidad → lección) | 2 |
| Evaluación de cualquier tema (vía tab) | 2 |
| Lección / ejemplo / ejercicio / evaluación de un tema ≠ 1.1 | 3 (unidad → lección → mosaico) |
| Ejercicio/evaluación de 1.1 (vía pie de lectura) | 3–4 (unidad → lección → sección → pie) |

## 4. Reglas vigentes

- Sin sesión, cualquier ruta de `(app)` redirige a `/login` (`Stack.Protected`).
- El splash se mantiene hasta que `useAuth` resuelve la sesión.
- La lección 1.1 no tiene hub: entra directo a la lectura (`/tema/l1.1` redirige).
- El contenido de lectura vive en `lessons.content` (bloques JSON: `p`, `h`, `bullets`,
  `numbers`, `table`) sembrado desde `src/data/richContent.ts`; migración aditiva v2→v3
  (`ALTER TABLE` + `UPDATE`).
- Tipos de ejercicio: `order` (columna `correct_order`) + `fill`/`match`
  (columna `config` JSON, esquema v4, migración aditiva v3→v4 con `applyUnit1Activities`).
- Progreso y resultados se escriben siempre con el `account_id` activo.
- No existen rutas-lista intermedias (`lecciones/`, `ejemplos/`, `ejercicios/` sin id): todo abre directo.
