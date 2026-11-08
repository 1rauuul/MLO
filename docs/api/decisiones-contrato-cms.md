# Decisiones de contrato CMS → MLO

- **Fecha:** 2026-11-05
- **Estado:** decisiones de producto cerradas; bloque de invitaciones pendiente.
- **Documento base:** [contrato-contenido-cms.md](./contrato-contenido-cms.md)
- **Convención de nombres:** en la interfaz y en el CMS se usa **grupo** y
  **contenido base**. En el código y en la API se conservan `class`, `classes`,
  `class_*`, `account_classes`, `/classes` y `catalog_id = 'base'`.

> Este documento registra lo decidido. No describe todavía la implementación
> completa. Donde una decisión supera lo que MLO soporta hoy, se indica
> expresamente como **brecha** para no confundir el estado actual con el
> objetivo.

---

## 1. Resumen de decisiones

| ID | Tema | Decisión | Estado |
|---|---|---|---|
| D-01 | Cursos y grupos | El grupo puede tener contenido propio adicional, no solo extras sobre lecciones existentes. | Cerrada |
| D-02 | Contenido base | Es una referencia compartida opcional. No se copia. Un curso puede usar el base o crearse vacío. | Cerrada |
| D-03 | Cursos nuevos | La primera liberación incluye cursos nuevos completos y selección de curso en MLO. | Cerrada |
| D-04 | Publicación | Curso y grupo tienen borrador/publicado. Quitar o despublicar un elemento lo oculta para todos tras sincronizar. Persistencia por archivo lógico, no borrado físico. | Cerrada |
| D-05 | Modelo de grupos | Nombre, periodo, código, cupo y docente; varios grupos por curso; un alumno puede estar en varios; el grupo se puede archivar. | Cerrada |
| D-06 | Invitaciones | Política de correo, proveedor, duración, landing y reclamo. | **Pendiente** |
| D-07 | Identidad del alumno | Se reclama con `accounts.external_key`; el correo de la invitación no tiene que coincidir. | Cerrada como principio |
| D-08 | Autoría de contenido | Sin imágenes, archivos ni enlaces en la primera liberación. El CMS valida contra el contrato de MLO y bloquea lo no soportado. | Cerrada |
| D-09 | Evaluaciones | Feedback final con resultado, respuesta correcta, explicación por reactivo y reintento. | Cerrada |
| D-10 | Bibliografía | Referencias en APA 7, capturadas por lección y consolidadas por curso. | Cerrada |
| D-11 | Nombres visibles | Cambiar a “grupo” y “contenido base” ahora; mantener identificadores internos. | Cerrada |
| D-12 | Criterios de aceptación | Escenarios demostrables para presentación y liberación. La invitación queda fuera hasta cerrar D-06. | Cerrada con pendiente |

---

## 2. Decisiones detalladas

### D-01. Cursos y grupos

**Decisión:** un grupo puede tener **contenido propio adicional**. No se limita a
agregar bloques, ejercicios o ejemplos sobre lecciones ya existentes.

Reglas de cierre:

- El grupo pertenece a un curso y **hereda** el contenido del curso.
- El contenido propio del grupo **se suma** al contenido del curso; no lo
  reemplaza.
- El contenido propio puede incluir unidades, lecciones, ejercicios, ejemplos,
  evaluaciones, preguntas y referencias propias.
- El contenido propio solo es visible para los miembros del grupo.
- El contenido del curso sigue siendo la base común para todos sus grupos.
- El CMS debe generar ids únicos. Un grupo no debe reutilizar un id del curso
  para contenido distinto.
- Si el mismo contenido se comparte entre grupos, se debe usar el mismo id para
  que MLO lo deduplique cuando corresponda.

**Brecha respecto a MLO actual:** el contrato actual solo permite extras de
clase sobre lecciones existentes (`lesson`, `exercise`, `example`) y no permite
que un grupo cree unidades, lecciones, evaluaciones ni preguntas propias. Esta
decisión exige extender el contrato de API, el almacenamiento local, los
validadores y el render.

---

### D-02. Contenido base

**Decisión:** el contenido base es una **referencia compartida y opcional**. No
se copia automáticamente al crear un curso ni un grupo.

Reglas de cierre:

- Un curso declara si usa el contenido base o no.
- Si lo usa, ve el contenido base vigente y lo combina con su contenido propio.
- Si no lo usa, el curso se crea vacío y solo tiene el contenido que se le
  agregue.
- El contenido propio del curso **se suma** al base; no lo reemplaza.
- Los grupos heredan el contenido del curso y pueden agregar contenido propio.
- No hay copia por curso ni copia por grupo en la primera liberación.
- Si el contenido base cambia y se vuelve a publicar, los cursos que lo
  referencian ven el cambio en la siguiente sincronización.
- Los cursos que no usan el contenido base no se ven afectados por esos cambios.
- Para conservar una versión anterior del base no se crea una copia: se debe
  publicar y conservar un release versionado.

**Brecha respecto a MLO actual:** hoy el contenido base está empaquetado y MLO
solo sincroniza `base`. No existe el concepto de curso que referencia o no el
base, ni la combinación de base + contenido propio de curso.

---

### D-03. Cursos nuevos en MLO

**Decisión:** la **primera liberación incluye cursos nuevos completos**. No se
limita al curso base.

Alcance cerrado:

- Crear un curso vacío desde el CMS y verlo en MLO.
- Crear un curso que use el contenido base y verlo en MLO.
- Crear un curso con contenido propio y verlo en MLO.
- Publicar, actualizar y despublicar cursos.
- Seleccionar el curso en MLO y sincronizar su contenido.

**Brecha respecto a MLO actual:** `catalogsInUse` devuelve solo `base`
(`remoteContent.ts:339`), y `BASE_CATALOG_ID` está fijado en `base` en
`useCatalog`, `useLessonContent`, `useLessonHub`, `useModuleProgress` y
`useEvaluationsCatalog`. Mostrar cursos nuevos requiere, como mínimo:

- API con listado de cursos y selección/inscripción del alumno.
- MLO con sincronización de más de un catálogo.
- SQLite con la relación alumno-curso y el curso activo.
- Navegación y estados vacíos para un curso sin contenido.
- Un mecanismo para que el alumno llegue al curso: grupo/código o selección
  directa. La invitación por correo queda pendiente en D-06.

**Riesgo:** es la decisión de mayor impacto. Sin estos cambios, los escenarios de
D-03 no se pueden demostrar en MLO.

---

### D-04. Publicación y retiro de contenido

**Decisión:** curso y grupo tienen ciclo de **borrador** y **publicado**.
Publica el **docente responsable** o un **administrador**. Un grupo solo puede
publicarse si su curso está publicado.

Reglas de cierre:

- Un elemento quitado del CMS deja de mostrarse para **todos** los alumnos,
  nuevos y existentes, en la siguiente sincronización.
- Despublicar un curso o un grupo lo oculta de MLO. No se borra el progreso.
- Si se vuelve a publicar, el contenido vuelve a mostrarse y el progreso
  asociado se conserva.
- La invisibilidad aplica **después de sincronizar**. Sin red, el alumno ve la
  última copia local hasta que vuelva a sincronizar.
- El contenido eliminado se marca como archivado/invisible; **no se borra
  físicamente** en la primera liberación.
- Se conservan las filas para no perder `attempts`, `evaluation_results`,
  historial ni trazabilidad.
- La purga física queda para una tarea de mantenimiento y solo para contenido
  sin referencias de progreso.
- Si el docente reemplaza un elemento por otro con id distinto, el anterior
  queda invisible y el progreso antiguo no se transfiere automáticamente.

**Decisión tomada por delegación:** el usuario dejó a criterio del equipo si se
borra de la base de datos. Se cierra con **archivo lógico** (soft delete), no
borrado físico, porque MLO conserva intentos y resultados que referencian
contenido.

**Brecha respecto a MLO actual:**

- MLO hoy borra físicamente ejercicios, ejemplos y preguntas que ya no vienen en
  el snapshot de la lección (`deleteMissing`, `seed.ts:680`). Debe pasar a
  archivo lógico para cumplir D-04.
- Despublicar una clase hoy no limpia ni oculta su caché
  (`classSync.ts:46-48`). Debe ocultarse y dejar de sincronizarse.
- MLO no tiene hoy un selector de curso que permita ocultar un curso
  despublicado. Depende de D-03.

---

### D-05. Modelo de grupos

**Decisión:** campos mínimos y reglas de membresía:

| Campo | Obligatorio | Regla |
|---|---:|---|
| `id` | Sí | Identificador interno del grupo. |
| `courseId` | Sí | Curso al que pertenece. |
| `name` | Sí | Nombre visible del grupo. |
| `period` | Sí | Periodo académico, por ejemplo `2026-1`. |
| `code` | Sí | Código de unión de 6 caracteres alfanuméricos en mayúsculas, único por periodo. |
| `capacity` | Sí | Cupo máximo de alumnos. |
| `teacherId` | Sí | Docente responsable. |
| `status` | Sí | `draft`, `published` o `archived`. |
| `createdAt` / `updatedAt` | Sí | Auditoría. |

Reglas cerradas:

- Un curso puede tener **varios grupos**.
- Un alumno puede estar en **varios grupos del mismo curso**.
- Si un alumno está en varios grupos, ve la unión del contenido de sus grupos,
  sin duplicar contenido que comparta el mismo id.
- El cupo es un máximo real: la API rechaza una nueva membresía cuando el grupo
  está lleno.
- No hay lista de espera en la primera liberación.
- Archivar un grupo:
  - impide nuevas membresías e invitaciones;
  - conserva el acceso de los miembros actuales en modo lectura;
  - conserva historial y progreso;
  - permite restaurarlo.
- Borrar un grupo no es físico: se archiva.
- El código de 6 caracteres se mantiene porque MLO ya normaliza y valida ese
  formato para unirse a una clase.

---

### D-06. Invitaciones — PENDIENTE

**Estado:** bloque pendiente. No se considera cerrado y no forma parte de los
criterios de aceptación hasta completar su definición.

Respuestas registradas como **propuesta provisional**, no como decisión final:

| Punto | Propuesta provisional |
|---|---|
| Correos permitidos | Cualquier correo. |
| Proveedor | Resend. |
| Duración del enlace | 3 días. |
| Alumno sin app abierta/instalada | Landing web con instrucciones y código; invitación pendiente hasta que abra o instale MLO. |
| Reclamo | Con la identidad local de MLO (ver D-07). |

Puntos que faltan por cerrar:

- Confirmar política de correo: cualquier correo, solo institucional o mixto.
- Confirmar proveedor definitivo y configuración de dominio/remitente.
- Confirmar duración final del enlace (la propuesta es 3 días; antes se habló
  de un mínimo de 2 días).
- Definir el contenido de la landing y el deep link a la app.
- Definir token: formato, expiración, un solo uso, revocación y reenvío.
- Definir límites de envío y manejo de rebotes.
- Definir qué pasa si el correo ya está asociado a otra cuenta.
- Definir si la invitación descuenta cupo al enviarse o solo al reclamarse.
- Definir permisos: quién invita (docente responsable, administrador) y si puede
  invitar a varios correos a la vez.
- Definir consentimiento y tratamiento de datos personales.
- Definir el escenario sin app instalada y el escenario con la app ya abierta.

**Decisión de alcance:** la invitación por correo no bloquea la demostración de
cursos, grupos y contenido. Para la demo se puede precargar la membresía del
alumno o usar el código del grupo.

---

### D-07. Identidad del alumno

**Decisión:** la invitación se reclama con la **identidad local de MLO**
(`accounts.external_key`). El correo usado para invitar es solo un canal de
entrega y **no tiene que coincidir** con ningún correo de la app.

Reglas:

- La identidad estable es el UUID local del alumno.
- El respaldo incluye `externalKey` y las membresías.
- Al restaurar un respaldo se conserva la misma identidad y no se duplica el
  alumno en la lista del docente.
- El correo de la invitación no crea una cuenta ni autentica al alumno.
- El enlace debe poder reclamarse desde la cuenta local que ya existe.
- Si el alumno no tiene cuenta, el flujo de invitación debe indicar cómo crearla
  y luego reclamar la invitación; el detalle exacto queda dentro de D-06.

**Estado:** cerrada como principio de identidad. La implementación concreta del
reclamo se completará cuando se cierre D-06.

---

### D-08. Autoría de contenido

**Decisión:** en la primera liberación **no se admiten imágenes, archivos ni
enlaces**. El contenido se limita a lo que MLO ya puede renderizar.

Bloques permitidos:

- `p` (párrafo)
- `h` (subtítulo)
- `bullets` (viñetas)
- `numbers` (lista numerada)
- `table` (tabla)

Tipos de ejercicio permitidos:

- `order`
- `fill`
- `match`
- `crossword`

Tipos de pregunta permitidos:

- `mcq`
- `order`
- `fill`
- `match`
- `crossword`

Reglas:

- No hay bloque de imagen, archivo adjunto ni bloque de enlace.
- Una URL escrita dentro de un párrafo se muestra como texto, no como
  hipervínculo.
- El CMS valida contra el contrato de MLO y **bloquea la publicación** si el
  contenido no cumple.
- La validación se hace en el CMS y también en la API/MLO; el CMS no es la
  única barrera.
- Los campos desconocidos no se usan para renderizar.
- Un tipo de bloque desconocido descarta la lección completa en MLO.

Campos obligatorios por tipo, tomados del contrato actual:

| Elemento | Regla mínima |
|---|---|
| Lección | `id`, `unitId`, `code`, `title`, `eyebrow`, `body`, `content`, `position`; `content` puede ser `[]` pero debe existir. |
| Unidad | `id`, `number`, `title`, `description`, `difficulty`, `color`. |
| `order` | `correctOrder` con al menos 2 elementos no vacíos y sin repetidos. |
| `fill` | `sentences` con `{{respuesta}}` y `bank` como `string[]`. |
| `match` | `pairs` con al menos 2 pares; sin repetir `left` ni `right`. |
| `crossword` | `rows`/`cols` enteros positivos, al menos una entrada, palabras `A-ZÑ` sin acentos, pistas no vacías y sin cruces contradictorios. |
| `mcq` | Al menos 2 opciones únicas y `answer` dentro del rango. |
| Evaluación | `questionCount > 0`, `exerciseCount > 0` y al menos una pregunta si hay evaluación. |
| Ejemplo independiente | Al menos un paso con `text` y `why` no vacíos. |
| Pregunta | `id` obligatorio, `prompt`, `type` y configuración correcta según el tipo. |

**Brecha respecto a MLO actual:** no hay soporte de imágenes, archivos ni
enlaces. Agregarlos requiere definir almacenamiento, validación, render y
posiblemente un nuevo bloque de contenido.

---

### D-09. Evaluaciones: feedback final

**Decisión:** al terminar una evaluación, el alumno ve:

1. Resultado global y porcentaje.
2. Respuesta correcta de cada reactivo.
3. Explicación por reactivo.
4. Opción de reintentar.

Reglas:

- El feedback se muestra al calificar, tanto para aciertos como para errores.
- La respuesta correcta se muestra según el tipo:
  - `mcq`: la opción correcta.
  - `order`: la secuencia correcta.
  - `fill`: las palabras correctas por hueco.
  - `match`: los pares correctos.
  - `crossword`: la solución de la cuadrícula.
- Cada reactivo muestra su explicación.
- El reintento genera un nuevo intento y un nuevo resultado; el historial
  anterior se conserva.
- El reintento vuelve a barajar preguntas y opciones.
- No se fija límite de reintentos en la primera liberación.
- El detalle se conserva mientras el contenido esté archivado pero disponible;
  si se hiciera una purga física, se conservaría solo el resultado global.
- Se conserva el desglose por tipo que ya muestra MLO.

**Brecha respecto a MLO actual:** hoy la pantalla de resultados muestra el
porcentaje y la explicación solo de los reactivos incorrectos, y no muestra la
respuesta correcta. Requiere ajustar la vista de resultados y el resumen.
`evaluation_results` guarda el agregado y `attempts` guarda el acierto por
reactivo; no se guarda la respuesta elegida, pero no hace falta para mostrar la
correcta.

---

### D-10. Referencias bibliográficas

**Decisión:** las referencias se capturan en **formato APA 7**, por **lección**,
y se consolidan a nivel **curso**. El contenido propio de un grupo consolida sus
propias referencias en la bibliografía del grupo.

Estructura mínima:

| Campo | Obligatorio | Regla |
|---|---:|---|
| `type` | Sí | `book`, `journalArticle`, `webPage`, `thesis`, `report`, `bookChapter`, `conferencePaper`. |
| `authors` | Sí | Uno o más autores. Cada autor con apellido y nombre/iniciales, o institución. |
| `year` | Sí | Año numérico o `s.f.` si no hay fecha. |
| `title` | Sí | Título de la obra. |
| `source` | Sí | Editorial, revista, sitio o institución. |
| `container` | No | Revista, libro contenedor o evento, para artículo o capítulo. |
| `volume` | No | Volumen, si aplica. |
| `issue` | No | Número, si aplica. |
| `pages` | No | Páginas, si aplica. |
| `doi` | No | DOI, preferido sobre URL cuando exista. |
| `url` | No | URL para páginas web o fuentes sin DOI. |
| `accessedAt` | No | Fecha de consulta para páginas web. |
| `edition` | No | Edición, si aplica. |

Reglas de cierre:

- El CMS captura los datos estructurados; MLO los renderiza en APA 7.
- Se consolidan por curso y se ordenan alfabéticamente por primer autor y año.
- Se deduplican por DOI/URL; si no hay, por título normalizado + año + primer
  autor.
- Una referencia puede aparecer en varias lecciones y se muestra una sola vez
  en la bibliografía del curso.
- Las referencias del contenido propio de un grupo van a la bibliografía del
  grupo; las del curso van a la del curso.
- Si el curso usa contenido base, las referencias del base forman parte de la
  bibliografía del curso.

**Brecha respecto a MLO actual:** hoy no existe modelo, tabla, endpoint ni
pantalla de bibliografía. Requiere un nuevo contrato, almacenamiento local,
consolidación y render.

---

### D-11. Migración y nombres visibles

**Decisión:** cambiar las etiquetas visibles **ahora** y conservar los
identificadores internos.

| Ámbito | Antes | Ahora visible | Interno que se conserva |
|---|---|---|---|
| Entidad social | Clase | **Grupo** | `class`, `classes`, `class_cache`, `class_extras_cache`, `account_classes` |
| Contenido común | Core / núcleo | **Contenido base** | `catalog_id = 'base'`, `BASE_CATALOG_ID` |
| Endpoint | `/classes/{code}` | Se documenta como grupo | `/classes/{code}` sin cambio |
| JSON | `class`, `lessons`, `extras` | Se explica como grupo | `class` sin cambio |
| UI MLO | “Contenido de tus clases” | “Contenido de tus grupos” | Sin cambio de datos |

Reglas:

- El CMS usa “grupo” en toda la interfaz y en los textos de ayuda.
- MLO usa “grupo” en las etiquetas visibles.
- La documentación de API puede describir “grupo”, pero los endpoints y campos
  JSON conservan `class`.
- No se renombran tablas, endpoints ni `catalog_id` en la primera liberación.
- El cambio de identificadores internos se evalúa en una fase posterior; no es
  requisito de esta liberación.
- El texto actual de `docs/api/contrato.md` que dice “las clases reemplazan a
  los grupos” debe alinearse con esta convención en una pasada de documentación.
  No se modificó en este documento.

---

## 3. Criterios de aceptación

La invitación por correo queda **pendiente** y no se incluye como criterio hasta
cerrar D-06. Para la demo se puede precargar la membresía del alumno o usar el
código del grupo.

| ID | Escenario | Resultado esperado | Demo | Liberación |
|---|---|---|---|---|
| A-01 | Crear un curso vacío en el CMS, sin contenido base, y publicarlo. | MLO lista el curso y permite entrar; muestra estado vacío sin errores. | Sí | Sí |
| A-02 | Crear un curso que referencia el contenido base y publicarlo. | MLO muestra las unidades y lecciones del base. | Sí | Sí |
| A-03 | Crear un curso con contenido propio (unidad, lección, ejercicio y evaluación) y publicarlo. | MLO muestra el contenido propio del curso. | Sí | Sí |
| A-04 | Crear varios grupos del mismo curso y que un alumno pertenezca a dos. | El alumno ve el contenido del curso y la unión del contenido propio de sus grupos, sin duplicados. | Sí | Sí |
| A-05 | Publicar una lección, ejercicio o evaluación nueva y sincronizar. | MLO muestra el contenido nuevo. | Sí | Sí |
| A-06 | Quitar un elemento publicado y volver a publicar. | Alumnos existentes y nuevos dejan de verlo después de sincronizar; el progreso y el historial se conservan. | Sí | Sí |
| A-07 | Despublicar un curso o un grupo. | Deja de aparecer en MLO para nuevos y existentes después de sincronizar; no se muestra la copia local; el progreso se conserva. | No | Sí |
| A-08 | Cambiar el contenido base y republicarlo. | Los cursos que referencian el base ven el cambio; los cursos sin base no cambian. | Sí | Sí |
| A-09 | Completar una evaluación y revisar el resultado. | Se ve porcentaje, respuesta correcta y explicación por reactivo; se puede reintentar y se registra un nuevo intento. | Sí | Sí |
| A-10 | Capturar referencias en dos lecciones y abrir la bibliografía del curso. | Se muestran en APA 7, consolidadas y sin duplicados. | No | Sí |
| A-11 | Intentar publicar contenido no soportado o inválido. | El CMS bloquea la publicación: imagen/archivo/enlace, bloque desconocido, ejercicio inválido o evaluación sin preguntas. | Sí | Sí |
| A-12 | Invitar a un alumno por correo. | **Pendiente de D-06.** No se evalúa todavía. | No | Pendiente |

**Demostración mínima:** A-01, A-02, A-03, A-04, A-05, A-06, A-08, A-09 y
A-11. **Liberación:** todos los escenarios anteriores, excepto A-12, que queda
pendiente.

---

## 4. Brechas técnicas que abren estas decisiones

| Decisión | Brecha principal en MLO |
|---|---|
| D-01 | El contrato actual solo permite extras de clase; no permite unidades, lecciones, evaluaciones ni preguntas propias de grupo. |
| D-02 | El contenido base está empaquetado y no existe un curso que lo referencie opcionalmente. |
| D-03 | `catalogsInUse` solo devuelve `base`; `BASE_CATALOG_ID` está fijado; no hay selector de curso ni relación alumno-curso. |
| D-04 | MLO borra ejercicios, ejemplos y preguntas; despublicar una clase no oculta su caché. |
| D-05 | El modelo actual de clase no tiene periodo, cupo ni archivo; el código es de 6 caracteres. |
| D-06 | No existe envío de invitaciones ni landing de reclamo. |
| D-07 | Ya existe `external_key` y el respaldo lo conserva; falta el flujo de reclamo. |
| D-08 | No hay bloques de imagen/archivo/enlace; el CMS debe bloquearlos. |
| D-09 | La vista de resultados no muestra la respuesta correcta y solo explica las incorrectas. |
| D-10 | No existe modelo ni pantalla de bibliografía. |
| D-11 | Solo es cambio de etiquetas visibles; no requiere migración de datos. |

---

## 5. Supuestos de cierre

Estos puntos no se respondieron de forma explícita, pero se cierran para evitar
ambigüedad:

- **D-01:** el contenido propio del grupo es adicional, no sustitutivo.
- **D-04:** publica el docente responsable o un administrador; el borrado es
  lógico, no físico; la invisibilidad aplica tras sincronizar.
- **D-05:** el cupo se hace cumplir en la API; el código es de 6 caracteres
  mayúsculas; archivar deja acceso de solo lectura a los miembros actuales.
- **D-09:** el reintento es libre en la primera liberación y cada intento se
  registra por separado.
- **D-10:** las referencias se capturan por lección y se consolidan por curso;
  el contenido propio de grupo consolida su propia bibliografía.
- **D-12:** la invitación no bloquea la demo ni la liberación de cursos, grupos
  y contenido.

---

## 6. Pendiente inmediato

Cerrar **D-06 (invitaciones)**. Hasta entonces:

- No se implementa el envío de correos ni la landing de reclamo.
- No se incluye la invitación en los criterios de aceptación.
- La demo usa membresía precargada o código de grupo.
- D-07 queda como principio de identidad, listo para aplicarse cuando D-06 se
  cierre.
