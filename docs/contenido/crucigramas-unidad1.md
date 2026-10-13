# Crucigramas — Unidad 1

Mapa completo de los crucigramas (`type: 'crossword'`) de la Unidad 1: respuestas, pistas y
estructura de la cuadrícula.

Fuente: `src/data/unit1Content.ts`.
Motor: `src/viewmodels/exerciseLogic.ts` (`crosswordCells`, `isCrosswordCorrect`) y
`src/viewmodels/useExerciseEngine.ts` (`useCrosswordEngine`).
Componente: `src/components/activities/CrosswordExercise.tsx`.

## Cómo funciona la estructura

- Coordenadas **0-indexadas**: `row` (fila, hacia abajo) y `col` (columna, hacia la derecha).
- `direction`:
  - `across` → la letra `offset` va en `(row, col + offset)`.
  - `down` → la letra `offset` va en `(row + offset, col)`.
- Las **celdas** son la unión de las letras de todas las entradas. Una celda compartida por dos
  entradas es una **intersección**: ambas deben aportar la misma letra.
- La `solution` de cada celda se toma de la **primera** entrada que la coloca. Por eso, si dos
  entradas se cruzan con letras distintas, el crucigrama sería irresoluble. En los siete
  crucigramas de esta unidad **todas las intersecciones coinciden** (verificado).
- Validación (`isCrosswordCorrect`): el ejercicio se considera correcto cuando **todas** las
  celdas tienen la letra esperada.
- Etiquetas: se numeran en el orden del arreglo `entries`. `H1, H2, …` para `across` y
  `V1, V2, …` para `down`.
- `bank`: palabras **distractoras** extra. Se mezclan con las respuestas reales; solo rellenan
  una entrada si tienen la misma longitud.
- Caracteres válidos al escribir: `A-Z` y `Ñ`.

## Resumen

| ID | Lección | Origen | Cuadrícula | Entradas | Banco (distractores) |
|---|---|---|---|---|---|
| `cross1.2`  | `l1.2` | Ejercicio | 16 × 13 | 4 | — |
| `cross1.2a` | `l1.2` | Ejercicio | 12 × 13 | 5 | — |
| `cross1.3`  | `l1.3` | Ejercicio | 14 × 17 | 4 | PRODUCTO, JUICIO, COLEGAS, HONESTIDAD |
| `cross1.4`  | `l1.4` | Ejercicio | 12 × 13 | 4 | SENSORES, PACIENTES, SATELITAL, PRIVACIDAD |
| `ev1.2`     | `l1.2` | Evaluación (pregunta) | 16 × 13 | 3 | CONFIABILIDAD, SOFTWARE, USABILIDAD |
| `ev1.3`     | `l1.3` | Evaluación (pregunta) | 19 × 11 | 3 | INTEGRIDAD, HONESTIDAD, PRODUCTO |
| `ev1.4`     | `l1.4` | Evaluación (pregunta) | 11 × 8 | 2 | EMBEBIDO, MHC, PACIENTES |

---

## 1. `cross1.2` — Crucigrama de atributos del software (l1.2)

- **Prompt:** Crucigrama de atributos del software
- **Instrucciones:** Toca una celda y escribe la palabra que corresponde a la pista.
- **Cuadrícula:** 16 filas × 13 columnas
- **Explicación:** Los atributos esenciales son mantenimiento, confiabilidad y seguridad, eficiencia y aceptabilidad.

### Respuestas y pistas

| Etiqueta | Dirección | Fila | Col | Respuesta | Pista |
|---|---|---|---|---|---|
| H1 | across | 3 | 0 | ACEPTABILIDAD | Comprensible, utilizable y compatible con otros sistemas |
| V1 | down | 3 | 1 | CONFIABILIDAD | Fiabilidad, seguridad y protección frente a fallas y ataques |
| V2 | down | 3 | 2 | EFICIENCIA | No desperdicia memoria ni ciclos del procesador |
| V3 | down | 3 | 7 | INGENIERIA | Disciplina que cubre todos los aspectos de la producción de software |

### Intersecciones

- (3,1) ACEPTABILIDAD × CONFIABILIDAD → `C`
- (3,2) ACEPTABILIDAD × EFICIENCIA → `E`
- (3,7) ACEPTABILIDAD × INGENIERIA → `I`

### Estructura

```
.............
.............
.............
ACEPTABILIDAD
.OF....N.....
.NI....G.....
.FC....E.....
.II....N.....
.AE....I.....
.BN....E.....
.IC....R.....
.LI....I.....
.IA....A.....
.D...........
.A...........
.D...........
```

---

## 2. `cross1.2a` — Crucigrama: conceptos del desarrollo profesional (l1.2)

- **Prompt:** Crucigrama: conceptos del desarrollo profesional
- **Instrucciones:** Toca una celda y escribe la palabra que corresponde a la pista.
- **Cuadrícula:** 12 filas × 13 columnas
- **Explicación:** El crucigrama combina atributos de calidad, tipos de productos y la actividad de evolución del software.

### Respuestas y pistas

| Etiqueta | Dirección | Fila | Col | Respuesta | Pista |
|---|---|---|---|---|---|
| H1 | across | 0 | 0 | MANTENIMIENTO | Atributo que permite actualizar el software ante necesidades cambiantes |
| V1 | down | 0 | 4 | EFICIENCIA | Atributo que evita desperdiciar memoria y ciclos del procesador |
| H2 | across | 5 | 3 | GENERICO | Producto que se vende en el mercado abierto a cualquier cliente |
| V2 | down | 3 | 10 | EVOLUCION | Actividad que modifica el sistema ante requisitos cambiantes |
| H3 | across | 9 | 7 | MEDIDA | Producto personalizado: producto "a la ___" |

### Intersecciones

- (0,4) MANTENIMIENTO × EFICIENCIA → `E`
- (5,4) EFICIENCIA × GENERICO → `E`
- (5,10) GENERICO × EVOLUCION → `O`
- (9,10) EVOLUCION × MEDIDA → `I`

### Estructura

```
MANTENIMIENTO
....F........
....I........
....C.....E..
....I.....V..
...GENERICO..
....N.....L..
....C.....U..
....I.....C..
....A..MEDIDA
..........O..
..........N..
```

---

## 3. `cross1.3` — Crucigrama de ética profesional (l1.3)

- **Prompt:** Crucigrama de ética profesional
- **Instrucciones:** Toca una celda y escribe la palabra que corresponde a la pista.
- **Cuadrícula:** 14 filas × 17 columnas
- **Explicación:** Confidencialidad, competencia e integridad son deberes centrales del código de ética.

### Respuestas y pistas

| Etiqueta | Dirección | Fila | Col | Respuesta | Pista |
|---|---|---|---|---|---|
| H1 | across | 3 | 0 | CONFIDENCIALIDAD | Respeto a la información del empleador o cliente |
| V1 | down | 3 | 0 | COMPETENCIA | No aceptar trabajo fuera de la propia capacidad |
| V2 | down | 3 | 4 | INTEGRIDAD | Honestidad e independencia en el juicio |
| V3 | down | 3 | 6 | ETICA | Marco de conducta profesional |

### Banco (distractores)

`PRODUCTO`, `JUICIO`, `COLEGAS`, `HONESTIDAD`

### Intersecciones

- (3,0) CONFIDENCIALIDAD × COMPETENCIA → `C`
- (3,4) CONFIDENCIALIDAD × INTEGRIDAD → `I`
- (3,6) CONFIDENCIALIDAD × ETICA → `E`

### Estructura

```
.................
.................
.................
CONFIDENCIALIDAD.
O...N.T..........
M...T.I..........
P...E.C..........
E...G.A..........
T...R............
E...I............
N...D............
C...A............
I...D............
A................
```

---

## 4. `cross1.4` — Crucigrama de estudios de caso (l1.4)

- **Prompt:** Crucigrama de estudios de caso
- **Instrucciones:** Toca una celda y escribe la palabra que corresponde a la pista.
- **Cuadrícula:** 12 filas × 13 columnas
- **Explicación:** La estación meteorológica y la bomba ejemplifican adquisición de datos y sistemas embebidos.

### Respuestas y pistas

| Etiqueta | Dirección | Fila | Col | Respuesta | Pista |
|---|---|---|---|---|---|
| H1 | across | 3 | 0 | METEOROLOGICA | Estación a campo abierto que adquiere datos |
| V1 | down | 3 | 0 | MHC | Sistema de administración de pacientes de salud mental |
| V2 | down | 3 | 1 | EMBEBIDO | Sistema que controla un dispositivo de hardware |
| V3 | down | 3 | 10 | INSULINA | Hormona que administra la bomba automática |

### Banco (distractores)

`SENSORES`, `PACIENTES`, `SATELITAL`, `PRIVACIDAD`

### Intersecciones

- (3,0) METEOROLOGICA × MHC → `M`
- (3,1) METEOROLOGICA × EMBEBIDO → `E`
- (3,10) METEOROLOGICA × INSULINA → `I`

### Estructura

```
.............
.............
.............
METEOROLOGICA
HM........N..
CB........S..
.E........U..
.B........L..
.I........I..
.D........N..
.O........A..
.............
```

---

## 5. `ev1.2` — Crucigrama de atributos (evaluación l1.2)

- **Prompt:** Completa el crucigrama de atributos
- **Origen:** pregunta tipo `crossword` de la evaluación `ev1.2`
- **Cuadrícula:** 16 filas × 13 columnas
- **Explicación:** Mantenimiento, aceptabilidad y eficiencia son atributos esenciales del buen software.

### Respuestas y pistas

| Etiqueta | Dirección | Fila | Col | Respuesta | Pista |
|---|---|---|---|---|---|
| H1 | across | 3 | 0 | MANTENIMIENTO | Permite evolucionar ante necesidades cambiantes |
| V1 | down | 3 | 1 | ACEPTABILIDAD | Comprensible, utilizable y compatible |
| V2 | down | 3 | 4 | EFICIENCIA | No desperdicia recursos del sistema |

### Banco (distractores)

`CONFIABILIDAD`, `SOFTWARE`, `USABILIDAD`

### Intersecciones

- (3,1) MANTENIMIENTO × ACEPTABILIDAD → `A`
- (3,4) MANTENIMIENTO × EFICIENCIA → `E`

### Estructura

```
.............
.............
.............
MANTENIMIENTO
.C..F........
.E..I........
.P..C........
.T..I........
.A..E........
.B..N........
.I..C........
.L..I........
.I..A........
.D...........
.A...........
.D...........
```

---

## 6. `ev1.3` — Crucigrama de ética (evaluación l1.3)

- **Prompt:** Completa el crucigrama de ética
- **Origen:** pregunta tipo `crossword` de la evaluación `ev1.3`
- **Cuadrícula:** 19 filas × 11 columnas
- **Explicación:** Competencia, confidencialidad y ética son deberes centrales del código profesional.

### Respuestas y pistas

| Etiqueta | Dirección | Fila | Col | Respuesta | Pista |
|---|---|---|---|---|---|
| H1 | across | 3 | 0 | COMPETENCIA | No aceptar trabajo fuera de la propia capacidad |
| V1 | down | 3 | 0 | CONFIDENCIALIDAD | Respeto a la información del cliente |
| V2 | down | 3 | 4 | ETICA | Marco de conducta profesional |

### Banco (distractores)

`INTEGRIDAD`, `HONESTIDAD`, `PRODUCTO`

### Intersecciones

- (3,0) COMPETENCIA × CONFIDENCIALIDAD → `C`
- (3,4) COMPETENCIA × ETICA → `E`

### Estructura

```
...........
...........
...........
COMPETENCIA
O...T......
N...I......
F...C......
I...A......
D..........
E..........
N..........
C..........
I..........
A..........
L..........
I..........
D..........
A..........
D..........
```

---

## 7. `ev1.4` — Crucigrama de estudios de caso (evaluación l1.4)

- **Prompt:** Completa el crucigrama de estudios de caso
- **Origen:** pregunta tipo `crossword` de la evaluación `ev1.4`
- **Cuadrícula:** 11 filas × 8 columnas
- **Explicación:** La bomba administra insulina y la estación meteorológica usa sensores.

### Respuestas y pistas

| Etiqueta | Dirección | Fila | Col | Respuesta | Pista |
|---|---|---|---|---|---|
| H1 | across | 3 | 0 | INSULINA | Hormona que administra la bomba |
| V1 | down | 3 | 2 | SENSORES | Dispositivos que recogen datos del entorno |

### Banco (distractores)

`EMBEBIDO`, `MHC`, `PACIENTES`

### Intersecciones

- (3,2) INSULINA × SENSORES → `S`

### Estructura

```
........
........
........
INSULINA
..E.....
..N.....
..S.....
..O.....
..R.....
..E.....
..S.....
```

---

## Notas de mantenimiento

- El punto (`.`) en las cuadrículas representa una celda vacía (no forma parte de ninguna entrada).
- Para agregar un crucigrama: define `rows`/`cols` suficientes para que cada entrada quepa
  (`row + len ≤ rows` para `down`; `col + len ≤ cols` para `across`) y verifica que cada
  intersección comparta la misma letra en ambas entradas.
- Las palabras del banco nunca se colocan en la cuadrícula: son distractores.
