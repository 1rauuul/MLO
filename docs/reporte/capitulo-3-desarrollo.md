# Capítulo 3. Desarrollo

Este capítulo responde a tres preguntas sobre el objeto de aprendizaje móvil (OAM) construido: qué se hizo, cómo se hizo y qué resultados se obtuvieron. La descripción del sistema final se basa en el código del repositorio; la reconstrucción del proceso, en el historial de git y en las especificaciones, planes, decisiones y contratos del proyecto. Cuando una afirmación depende de documentación externa al repositorio se indica expresamente con un marcador de confirmación.

El alcance del producto es una aplicación móvil offline-first (los servicios están desactivados por defecto) para la asignatura *Introducción a la Ingeniería de Software*. El sistema cubre la Unidad 1 con contenido completo y deja las unidades 2 a 5 con contenido introductorio. Esta delimitación se retoma en la sección 3.3, porque condiciona la comparación entre objetivos y resultados.

## 3.1 ¿Qué se hizo?

### 3.1.1 Problema y delimitación

El sistema resuelve la necesidad de disponer de un objeto de aprendizaje autocontenido, instalable en un teléfono Android, que permita al estudiante recorrer el ciclo lectura → ejemplo guiado → práctica → evaluación sin conexión a internet por defecto y sin infraestructura de servidor obligatoria. El problema no era solo de contenido: el proyecto requería conservar el avance por estudiante, ofrecer retroalimentación inmediata en la práctica, calcular un puntaje en la evaluación y mantener un historial consultable. En un dispositivo compartido, esas funciones exigen identificar al alumno; por ello se incorporó autenticación local, una extensión respecto de la arquitectura de referencia MLO-AR, que no contempla administración de usuarios.

La delimitación es explícita y verificable en el código y en la documentación de arquitectura: no hay realidad aumentada, no se usan sensores nativos y no se empaqueta SCORM ni LOM en tiempo de ejecución. El comportamiento por defecto es local (`DATA_MODE = 'local'`): ninguna capa ejecuta peticiones de red. De forma opcional, el modo `hybrid` permite descargar contenido publicado desde un servicio externo; el progreso, las cuentas y la evaluación siguen siendo estrictamente locales. La aplicación se distribuye como APK de Android y, como soporte adicional para demostración, puede exportarse a web. El destino principal es móvil; la web no se considera un requisito del producto.

[CONFIRMAR: redactar aquí la delimitación institucional del reporte —población, periodo y alcance geográfico—, que no consta en el repositorio.]

### 3.1.2 Funcionalidades del sistema

La aplicación se organiza en tres pestañas persistentes: Módulos, Evaluaciones y Perfil. La pestaña Módulos presenta las cinco unidades del curso con sus lecciones; cada unidad se expande y muestra el avance. Al elegir una lección distinta de la 1.1 se abre un *hub* temático con cuatro destinos —lección, ejemplos, ejercicios y evaluación—, mientras que la 1.1 abre directamente la lectura porque se definió como contenido de solo lectura. La portada incluye un bloque de continuación que recupera la última ubicación registrada por el estudiante. En modo híbrido, el Perfil permite consultar las clases inscritas, unirse a una clase mediante un código de seis caracteres y abandonar una clase; las clases agregan contenido sobre el curso base y no sustituyen su catálogo.

La lectura se presenta por bloques ricos: párrafos, listas, tablas y muestras de código. Cuando existen contenidos extra publicados por las clases del estudiante, la lección muestra bloques adicionales identificados con los nombres de las clases; si el mismo extra aparece en varias clases, se muestra una sola vez con sus etiquetas combinadas. Los ejemplos guiados se recorren en secuencia, sin un menú intermedio de selección, y ofrecen dos variantes: una resuelta paso a paso con la justificación de cada paso y otra en la que el estudiante intenta la actividad con pistas y puede revelar la solución. Cuando el ejemplo tiene guía curada —título, pasos y pistas—, el runner la usa; si no, cae en una guía derivada de la actividad. Al terminar la secuencia se puede solicitar un nuevo sorteo. La práctica plantea hasta diez ejercicios por sesión a partir de un sorteo único por cuenta y lección, integrando también los ejercicios extra de las clases y evitando duplicados. Admite cuatro tipos de actividad: ordenar pasos, completar espacios con un banco de palabras, relacionar pares y resolver un crucigrama. Cada respuesta recibe retroalimentación inmediata y, al finalizar, se muestra un resumen con aciertos por tipo y por tema.

La evaluación formal combina dos fuentes: preguntas del banco de evaluación y ejercicios interactivos. En el curso base se seleccionan diez preguntas y cinco ejercicios por sesión; el modelo permite configurar esos conteos por evaluación. Se descartan los reactivos con enunciados repetidos, se mezclan y se barajan las opciones de las preguntas de opción múltiple. Cada reactivo vale el mismo porcentaje y se califica como correcto o incorrecto; el resultado se expresa como porcentaje de aciertos. El puntaje se guarda y alimenta el historial de la pestaña Evaluaciones, que muestra la calificación y el desglose por tipo de actividad, además de una recomendación de repaso cuando el desempeño es bajo.

El Perfil permite consultar las clases inscritas, abandonar una clase, editar el estilo de aprendizaje, alternar el modo oscuro y el texto ampliado, reiniciar el progreso y exportar o importar un respaldo del avance en formato JSON. La personalización incluye un cuestionario CHAEA abreviado de ocho ítems, dos por cada estilo —activo, reflexivo, teórico y pragmático—, que calcula el estilo dominante y lo persiste. El respaldo v4 incluye la identidad externa estable del alumno, las clases inscritas, los intentos, el progreso, los resultados y la ubicación; los formatos v1, v2 y v3 siguen siendo aceptados. La navegación incorpora una guarda de salida: si el estudiante intenta abandonar una práctica o evaluación en curso mediante el botón físico de Android, el gesto de iOS, el retroceso del encabezado, la barra inferior o una navegación programática, el sistema intercepta la acción y pide confirmación.

Cuando la aplicación se configura en modo híbrido, el contenido publicado por un servicio externo puede actualizar el curso base y las clases sin modificar el flujo del estudiante. La descarga se valida antes de guardarse en cachés locales; el arranque no espera a la red y la actualización se ejecuta en segundo plano. Si falla la red o la validación, se conserva la caché anterior; el progreso y las cuentas nunca salen del dispositivo.

[INSERTAR CAPTURA: pantalla de inicio de sesión y pantalla de registro.]
[INSERTAR CAPTURA: pestaña Módulos con las unidades, el avance y el bloque «Continuar donde lo dejaste».]
[INSERTAR CAPTURA: hub temático con los cuatro destinos.]
[INSERTAR CAPTURA: lección con contenido rico, incluida una tabla.]

### 3.1.3 Stack tecnológico

La aplicación se implementó con Expo SDK 58 sobre React Native 0.88 y React 19.3, en TypeScript con configuración estricta. La navegación usa Expo Router 58 con rutas tipadas y organización por grupos. La persistencia se resuelve con `expo-sqlite`; la interfaz gráfica complementaria se apoya en `react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-screens` y `react-native-safe-area-context`. La autenticación utiliza derivación de claves PBKDF2-HMAC-SHA256 con `react-native-quick-crypto` cuando está disponible en el runtime nativo y `@noble/hashes` como respaldo, lo que permite ejecutar la aplicación en Expo Go sin el módulo nativo. El respaldo se resuelve con `expo-file-system` para crear y seleccionar el archivo JSON y con `expo-sharing` para compartirlo.

El aseguramiento de calidad se apoya en Jest 30 con `jest-expo` 58 y `@testing-library/react-native`; el análisis estático se realiza con ESLint y `tsc`. La distribución usa EAS Build con un perfil `preview` que genera APK y un perfil `production` que genera App Bundle. La configuración de compilación restringe el APK a `arm64-v8a`, fija Android 12 (API 31) como mínimo, activa R8, la reducción de recursos y una regla ProGuard para el módulo criptográfico nativo. El APK de demostración de la etapa 5 quedó en aproximadamente 33.2 MB, frente a los 118.1 MB del primer build universal. La migración a SDK 58 se verificó con `expo-doctor`, exports local de Android y web, `expo prebuild` y el arranque de Metro; todavía no se ha generado un nuevo build final de EAS.

El comportamiento por defecto no realiza llamadas de red: `DATA_MODE = 'local'` desactiva la capa HTTP. Se añadió, de forma opcional, un cliente `fetch` propio en `src/shared/services/http/` y una fuente de contenido remoto validada con `parse*Seed` y `validateLessonPayload`; solo se activan con `DATA_MODE = 'hybrid'`. El cliente normaliza la URL base, aplica un tiempo límite de ocho segundos y dos reintentos para errores de red y respuestas 5xx, y clasifica los errores de configuración, del servidor, de parseo y de límite de peticiones. La sincronización se ejecuta en segundo plano mediante `ContentSyncProvider`, con límite temporal entre actualizaciones, y escribe primero en `remote_lessons`; `applyStagedContent` aplica los datos localmente en otro momento. No hay sincronización de progreso, cuentas remotas ni secretos en el cliente.

Con el contrato v2.2 cada maestro publica sus propias clases y contenidos extra. El alumno puede unirse con un código de 6 caracteres; las clases no cambian el catálogo base, sino que agregan bloques de lección, ejemplos y ejercicios sobre él. La identidad del alumno se conserva en `accounts.external_key` como UUID estable. La descarga ocurre en segundo plano (`ContentSyncProvider`) y nunca bloquea el arranque: los releases de clase quedan en `class_cache` y sus extras en `class_extras_cache`. Los respaldos v4 incluyen la identidad y las clases, y siguen aceptando los formatos v1, v2 y v3.

### 3.1.4 Arquitectura de software

La arquitectura sigue el patrón MVVM adaptado a React. La vista es un componente de pantalla; el ViewModel es un hook que encapsula estado, efectos y llamadas al repositorio; el modelo son las entidades y los repositorios; la persistencia es `expo-sqlite`. La regla de dependencias es unidireccional: Vista → ViewModel → Modelo → servicios compartidos. Las rutas de `src/app` son deliberadamente delgadas: reexportan una vista o montan un layout, de modo que la lógica no vive en el árbol de rutas. Desde la etapa 7, los ViewModels no importan `expo-sqlite`: reciben los repositorios por `useRepositories()` desde `shared/services/data/DataProvider`, y una regla de ESLint (`no-restricted-imports`) impide la dependencia directa.

El código se organiza por *features*. Cada carpeta de `src/features` —`auth`, `classes`, `profile`, `modules`, `examples`, `exercises` y `evaluations`— contiene `model`, `viewmodel` y `view`, además de sus pruebas. La carpeta `src/shared` concentra componentes reutilizables, hooks, tema, utilidades, tipos y servicios de base de datos, contenido, datos y HTTP. Esta separación permite que una feature consuma el ViewModel o el Modelo de otra, pero nunca su Vista. La estructura completa se documenta en `AGENTS.md` y se refleja en los 191 archivos TypeScript del directorio `src`.

[SUGERIR FIGURA 3.1: diagrama de componentes y capas. Debe mostrar las tres capas lógicas —Vista, ViewModel y Modelo—, las siete features con sus carpetas, `src/shared`, `expo-sqlite` y, en una banda aparte, `shared/services/{data,http}` con la dirección única de dependencias. Puede reutilizarse o adaptarse el diagrama de `docs/arquitectura/arquitectura-mlo.html`.]

La capa de persistencia utiliza una base SQLite local llamada `mlo.db`, con modo WAL y claves foráneas activas por conexión. El esquema tiene 20 tablas y 14 índices, y su versión actual es 17 (`DATABASE_VERSION = 17`). Las tablas núcleo son `units`, `lessons`, `examples`, `exercises`, `evaluations` y `questions`. `units` y `lessons` incorporan `catalog_id` y `archived_at`; `evaluations` incorpora `archived_at`, `question_count` y `exercise_count`, lo que permite separar cursos, retirar contenido sin perder progreso y configurar el tamaño de una evaluación. Las tablas de soporte son `accounts` y `auth_session` para la sesión local, incluyendo `external_key` como identidad estable; `attempts` como bitácora de intentos de práctica y evaluación, con `score_correct` y `score_total` para el puntaje parcial; `evaluation_results` para el puntaje acumulado; `learner_profile` para estilo y accesibilidad; `module_progress` para el avance por lección; `last_location` para reanudar la sesión; `example_state` para conservar el sorteo y el índice del ejemplo en curso; `meta` para hashes de contenido; `class_cache` para releases de clase; `class_extras_cache` para bloques, ejemplos y ejercicios extra; `account_classes` para las membresías locales; y `remote_catalogs`/`remote_lessons` como área de espera del contenido publicado.

La separación entre ejercicios y evaluación se conserva en tablas, motores y rutas. La bitácora `attempts` es compartida y distingue el origen con la columna `source`; esa decisión habilita la analítica unificada. La evaluación reutiliza el componente de actividad para presentar preguntas y ejercicios, pero mantiene su propio motor de calificación y su propio registro de resultados.

[SUGERIR FIGURA 3.2: modelo entidad-relación de las 20 tablas, con claves primarias, foráneas y cardinalidades. Debe mostrar `class_cache`, `class_extras_cache`, `account_classes`, `remote_catalogs`, `remote_lessons`, `meta`, `external_key`, `archived_at` y la versión 17 del esquema. El proyecto ya cuenta con `docs/arquitectura/er-mlo.html` y `docs/arquitectura/esquema-bd-mlo.html` como base.]

La inicialización de la base ocurre en `migrateAndSeed`, invocado por `SQLiteProvider`. En una instalación nueva se crea el esquema completo y se siembra el contenido; en una instalación existente se aplican migraciones incrementales desde la versión registrada en `PRAGMA user_version`. La migración v17 añade la identidad externa UUID de las cuentas y reemplaza el modelo anterior de un grupo por cuenta por membresías múltiples en `account_classes`, con una caché global de clases y sus extras. El contenido base permanece asociado al catálogo `base`; las clases agregan contenido extra sin cambiar de catálogo. El contenido se siembra desde archivos TypeScript: `seed.ts` define unidades y lecciones; `unit1.content.ts` contiene ejemplos, ejercicios y evaluaciones; `lesson1.2.bank.ts` aporta 26 ejercicios y `lesson1.2.questions.ts` aporta 33 preguntas con identificadores estables. En total se siembran 5 unidades, 25 lecciones, 44 ejercicios, 76 preguntas y 35 ejemplos guiados.

La siembra de contenido usa *upsert* (`ON CONFLICT DO UPDATE`), de modo que una instalación existente recibe los textos corregidos sin cambiar de versión de esquema. Después del *upsert* se eliminan los ejercicios, ejemplos y preguntas huérfanos de las lecciones gestionadas, sin tocar `attempts`. Un hash FNV-1a del contenido empaquetado se guarda en la tabla `meta`; en cada arranque se compara y, solo si cambió, se re-sincroniza el contenido en una transacción. Las migraciones aplican el contenido y el cambio de `user_version` dentro del mismo paso atómico.

El flujo de datos típico comienza en la pantalla, que invoca un hook; el hook consulta uno o varios repositorios; el repositorio ejecuta SQL sobre `expo-sqlite` y devuelve entidades; el hook transforma el resultado en estado y la vista lo renderiza. Al responder una actividad, el hook calcula el resultado, lo registra en `attempts` y actualiza el resumen; el avance de la lección se persiste en `module_progress`. En el modo por defecto, ninguna de estas etapas usa la red. En `hybrid`, solo la sincronización de contenido publicado consulta el servicio antes de que la vista consuma los datos.

La capa de datos expone puertos por feature. `createRepositories(db)` liga las funciones de los 12 repositorios a un objeto inyectable y `useRepositories()` lo entrega a los ViewModels; así un adaptador remoto puede sustituir al acceso SQLite sin tocar las pantallas. La validación de entrada vive en `shared/utils/validate.ts` y `shared/services/content/remote/validateLessonPayload.ts`, donde además se comprueban ids, relaciones entre unidad, lección y evaluación, reglas específicas de cada tipo de ejercicio y ausencia de colisiones entre cursos.

[SUGERIR FIGURA 3.3: diagrama de secuencia «responder un ejercicio». Debe mostrar Pantalla → `usePracticeEngine` → `attemptRepository` → `expo-sqlite`, y el retorno del resumen a la vista.]

La navegación se organiza en un `Stack` raíz con dos zonas protegidas: `(app)` cuando existe sesión y `login`/`register` cuando no la hay. Dentro de `(app)` se monta un `Tabs` con tres grupos: `(modules)`, `(evaluations)` y `(profile)`. Las rutas de contenido viven bajo `(modules)`: `tema/[id]`, `lecciones/[id]`, `ejemplos`, `ejercicios` y `evaluacion`. La pestaña Evaluaciones incluye el catálogo y el historial, y reutiliza el mismo flujo de evaluación. La ubicación se persiste en `last_location` y se traduce a una ruta con `hrefForLocation`, lo que permite reanudar la lección, el ejemplo, la práctica o la evaluación.

[SUGERIR FIGURA 3.4: mapa de navegación. Debe mostrar el Stack raíz, las tres pestañas, el hub temático, los cuatro flujos de actividad y las rutas de retorno. El proyecto tiene `docs/arquitectura/mapa-navegacion.html` como antecedente, pero debe actualizarse al estado actual.]

[SUGERIR FIGURA 3.5: diagrama de los dos modos de datos y del área de espera. Debe contrastar `DATA_MODE='local'` (ViewModel → puertos → SQLite, sin HTTP) con `hybrid` (descarga en segundo plano → `remote_lessons` → aplicación local posterior), e indicar que un fallo remoto conserva el contenido local.]

La compilación y distribución se resolvieron con EAS Build. El perfil `preview` produce un APK instalable; el perfil `production`, un App Bundle. La configuración de `app.json` fija `versionCode` 3, `minSdkVersion` 31, una sola arquitectura (`arm64-v8a`), R8 y reducción de recursos. La aplicación se identificó con el paquete `com.mlo.ingenieriasoftware`.

## 3.2 ¿Cómo se hizo?

El trabajo se organizó en ocho etapas lógicas. La frontera entre etapas no siempre coincide con una fecha exacta, porque algunas actividades se solaparon —por ejemplo, el banco de contenido de la lección 1.2 se inició antes de cerrar la navegación—; la agrupación responde a la lógica de construcción, no a un corte cronológico estricto. La tabla siguiente resume las etapas y después se explica cada una.

| Etapa | Periodo | Resultado principal |
|---|---|---|
| 1. Cimientos y núcleo offline | 13–29 sep | Auth local, datos por cuenta, esquema SQLite, contenido de la Unidad 1, navegación básica |
| 2. Navegación y flujo pedagógico | 29 sep–7 oct | Tabs persistentes, rutas por contexto, reanudación, bloqueo de actividades, flujo secuencial de ejemplos |
| 3. Contenido y evaluación a escala | 28 sep–15 oct | Banco de 1.2, evaluación de 10 + 5, analítica |
| 4. Estabilización y refactor | 8–15 oct | Corrección de integridad, PBKDF2, pruebas de repositorios, MVVM por features, CHAEA abreviado, respaldo de progreso |
| 5. Endurecimiento para la demo | 21–22 oct | Guarda de salida, calificación por sesión, corrección del seed, KDF nativo, APK de 33.2 MB |
| 6. Corrección tras revisión externa | 23 oct | Migración v15, contenido re-sincronizable, ejemplos curados, sorteo conjunto, guarda de salida completa |
| 7. Servicios opcionales y puertos de datos | 23–24 oct | `DATA_MODE` local por defecto, `DataProvider`, cliente HTTP, contenido remoto validado, respaldo v2 |
| 8. Clases y contenido extra sobre el curso base | 26–27 oct | Migración v17, caché de clases, extras deduplicados, identidad UUID y respaldo v4 |
| 9. Migración tecnológica y cierre del contrato de clases | 27 oct | Expo SDK 58, contrato v2.2, caché de clases, nuevos endpoints y 57 suites de prueba |

### 3.2.1 Etapa 1: cimientos y núcleo offline (13–29 de septiembre)

La primera etapa construyó el esqueleto de la aplicación y el núcleo funcional. Se partió de un proyecto Expo SDK 57 con Expo Router y se eliminó el contenido de demostración. Se añadieron `expo-sqlite`, `react-native-svg`, Jest, `jest-expo`, `@testing-library/react-native` y ESLint. En paralelo se definieron las entidades, el esquema, los repositorios y los primeros ViewModels.

La decisión estructural más importante fue adoptar MVVM con hooks en lugar de reproducir clases ViewModel. Se argumentó que los hooks son la forma idiomática de React, permiten separar estado y efectos y son testeables sin emulador. Otra decisión fue almacenar el contenido en SQLite en lugar de dejarlo en archivos consumidos directamente por las vistas: así el contenido se versiona con migraciones y puede actualizarse sin recompilar la interfaz. Se conservó la separación entre `exercises` y `evaluations` porque la retroalimentación es distinta —inmediata por reactivo en la práctica, acumulada al final en la evaluación—.

En esta etapa se incorporó autenticación local con `accounts` y `auth_session`, se asociaron perfil, progreso y resultados a la cuenta y se estableció que todo indicador iniciara en cero. También se construyó la navegación de tres toques: home con unidades expandibles, hub de mosaicos para las lecciones y acceso directo a la lectura de 1.1. El contenido de la Unidad 1 se migró a bloques ricos y se añadieron los primeros ejercicios de ordenar, completar y relacionar.

Los problemas aparecieron por el crecimiento del esquema y del contenido. Cada nueva capacidad —contenido rico, configuración de ejercicios, tipos de pregunta y banco de la lección 1.2— exigió una migración aditiva y una relectura del contenido sembrado. La solución fue versionar el esquema con `PRAGMA user_version`, aplicar migraciones por pasos y re-sembrar el contenido de la Unidad 1 sin borrar cuentas. El esquema llegó a la versión 5 en esta etapa y `attempts` quedó como bitácora real; la tabla `results`, que aún existía, se retiró más tarde por estar inerte.

### 3.2.2 Etapa 2: navegación y flujo pedagógico (29 de septiembre–7 de octubre)

La segunda etapa convirtió un conjunto de pantallas en un recorrido continuo. Se mantuvo la barra principal dentro de las pantallas de contenido, se agruparon las rutas en `(modules)`, `(evaluations)` y `(profile)` y se hicieron persistentes las pestañas. Se añadió la persistencia de la última ubicación y el bloque «Continuar donde lo dejaste». Se bloquearon las actividades aún no disponibles y se definió que, al terminar una lección, un ejemplo, una práctica o una evaluación, el estudiante pudiera volver al hub del tema o al inicio.

La decisión de fondo fue tratar la navegación como estado persistente y no como una secuencia de pantallas. `last_location` guarda unidad, lección, código y sección; `hrefForLocation` traduce ese estado a una ruta. Así, una interrupción del sistema operativo no obliga a reiniciar el recorrido. Otra decisión fue eliminar los menús intermedios: los ejemplos se recorren en secuencia y las prácticas se resuelven como sesión, lo que reduce toques y evita la dispersión.

El trabajo se ejecutó con un plan dividido en tareas —helper de rutas, reestructura de rutas, tabs persistentes y salidas de actividades— y cada tarea se sometió a revisión. Esa forma de trabajo detectó problemas que no aparecían en la ejecución manual: rutas que no resolvían el contexto y botones «Terminar» y «Tema» sin efecto. La resolución combinó pruebas de navegación, pruebas de componentes y una revisión final del cambio completo. El resultado se consolidó en los commits `cca1a28` y `a2a7944`.

### 3.2.3 Etapa 3: contenido y evaluación a escala (28 de septiembre–15 de octubre)

La tercera etapa amplió el contenido y convirtió la evaluación en un proceso reproducible. Se definió un formato de banco de ejercicios y preguntas, se fusionaron tres fuentes de ejercicios para la lección 1.2 y se podó el resultado. Se añadieron 26 ejercicios y 33 preguntas a la lección 1.2, se documentaron los crucigramas y se creó una plantilla para seguir creciendo el banco.

La decisión técnica fue sembrar el banco desde TypeScript hacia SQLite y usar identificadores estables. La práctica y los ejemplos sortean hasta diez elementos del banco; la garantía de que un mismo reactivo no aparezca en ambas pantallas se consolidó en la etapa 6 con un sorteo único. La evaluación se separó en un *pool* de preguntas y otro de ejercicios: se eligen diez y cinco respectivamente, se mezclan y se barajan las opciones de las preguntas de opción múltiple. La calificación de la práctica se calcula sobre la sesión sorteada, no sobre el total del banco, y cada reactivo pesa lo mismo; cuando la actividad tiene varios componentes internos se otorga puntaje parcial. La analítica agregada por tipo y por tema produce una recomendación de repaso.

Los problemas fueron de dos tipos. Por un lado, la calidad del contenido: preguntas que no se mostraban, opciones cuya posición correcta era memorizable, crucigramas con una rejilla que no cabía en pantalla, ejercicios repetidos entre práctica y evaluación y diferencias entre web y móvil al marcar una respuesta. Por otro, la consistencia del banco: duplicados entre archivos y preguntas que no correspondían al tema. La solución fue barajar opciones y reajustar el índice correcto, sortear sin repetición, separar los *pools*, igualar el comportamiento de marcación entre plataformas y escribir pruebas para la lógica de sorteo y calificación.

### 3.2.4 Etapa 4: estabilización y refactor (8–15 de octubre)

La cuarta etapa no añadió funcionalidades visibles: corrigió la base sobre la que se apoyan. Una auditoría interna identificó problemas de integridad de datos —el reinicio de progreso no borraba intentos ni ubicación—, un efecto secundario dentro de un actualizador de estado que podía duplicar intentos, migraciones no atómicas y un hash de contraseña que no era una función de derivación. Se corrigieron los tres primeros problemas y se sustituyó el hash por PBKDF2-HMAC-SHA256 con 100 000 iteraciones, con rehash transparente de las cuentas antiguas al iniciar sesión.

La decisión metodológica fue priorizar la integridad sobre las funciones nuevas. Se estableció una secuencia: primero datos, después robustez, luego decisiones de alcance, después limpieza y al final contenido y validación. Esa secuencia evitó que un fallo de persistencia se mezclara con un cambio de interfaz. También se decidió retirar la tabla `results` y el código muerto asociado, porque nadie la leía ni escribía en tiempo de ejecución; la bitácora real es `attempts`.

El refactor más grande fue la reorganización a MVVM por features. Se movieron pantallas, hooks y repositorios a `src/features/<feature>`, se dejó `src/shared` para lo común y se adelgazaron las rutas. El cambio tocó más de 130 archivos y obligó a actualizar pruebas, rutas y documentación. Se complementó con una limpieza de la plantilla Expo, la reorganización de `docs/` y la actualización de `AGENTS.md`, `README.md` y del índice de documentación. Al cierre de la etapa, la suite tenía 34 archivos de prueba y 208 pruebas, y la cobertura reportada era de 83.75 % de sentencias; esa cifra no es comparable con la medición actual porque el conjunto de archivos medidos cambió.

En esta etapa también se añadieron la exportación e importación del progreso y la mejora de los formularios de acceso. El respaldo se definió como un JSON versionado con progreso por lección, intentos y resultados de evaluación, validado antes de importarse. La personalización se completó con un cuestionario CHAEA abreviado de ocho ítems, que calcula y persiste el estilo dominante; se documentó que la adaptación de contenido por estilo seguía pendiente y que la personalización efectiva era, y sigue siendo, por desempeño.

### 3.2.5 Etapa 5: endurecimiento para la demo (21–22 de octubre)

La quinta etapa preparó una demostración instalable. Se añadió la sección «Fuente» en la portada, se extendió la confirmación de salida a las pestañas de Ejercicios y Evaluación, se ajustó la calificación de la práctica a diez ejercicios y se corrigió el motor de evaluación. Además, se exportaron los diagramas a SVG.

El problema más costoso apareció en el build. El primer arranque fallaba porque `seedDatabase` abría una transacción y, dentro, el banco de preguntas abría otra; SQLite no permite transacciones anidadas y el seed se revertía. Como la versión ya se había marcado como 14, los arranques posteriores omitían la siembra y dejaban el catálogo vacío. La solución fue sembrar en una sola transacción, escribir `user_version` solo al final y añadir una auto-reparación: si la base está marcada como versión 14 pero no tiene unidades ni lecciones, se vuelve a sembrar sin borrar cuenta ni progreso.

El segundo problema fue el tiempo de acceso. La derivación PBKDF2 en JavaScript puro tardaba alrededor de cuarenta segundos en el teléfono. Se sustituyó por `react-native-quick-crypto` —PBKDF2 nativo sobre OpenSSL— con respaldo en `@noble/hashes` para web, y se añadió una regla ProGuard para que R8 no eliminara las clases del módulo nativo. El tercer problema fue el tamaño: el APK universal pesaba 118.1 MB. Se restringió a `arm64-v8a`, se activaron R8 y la reducción de recursos y se retiraron dependencias directas sin uso; el APK final quedó en 33.2 MB. El cuarto problema fue la percepción de carga: se añadieron indicadores de actividad, estados vacíos con reintento y una consulta resumida del catálogo para no cargar el contenido completo de cada lección en la portada.

### 3.2.6 Etapa 6: corrección tras la revisión (23 de octubre)

La sexta etapa nació de una revisión externa del repositorio. El informe de revisión identificó trece problemas y el proyecto los tradujo en un plan de corrección con bloques de contenido, ejemplos, motores, guarda de salida e higiene. La revisión no se limitó a señalar defectos: fijó criterios de aceptación y pruebas para cada corrección.

El primer bloque corrigió la propagación del contenido. La siembra usaba `ON CONFLICT DO NOTHING`, de modo que las instalaciones existentes nunca recibían los textos corregidos; además, los identificadores de las preguntas del banco eran posicionales y se desalineaban al insertar o reordenar. Se sustituyó por *upsert* con actualización de todas las columnas, se añadieron identificadores explícitos a las 33 preguntas del banco, se migraron los identificadores antiguos y se re-mapeó `attempts.item_id`. Para evitar una migración por cada cambio de texto se creó la tabla `meta` con un hash del contenido empaquetado: si el hash no cambia, no se re-sincroniza nada. La migración v15 crea `meta`, renombra los identificadores y re-sincroniza el contenido en una sola transacción. También se omiten al sembrar los enunciados duplicados entre la evaluación embebida y el banco, y se añadió una deduplicación por enunciado al armar el *pool*.

El segundo bloque corrigió los ejemplos. El runner usaba una explicación genérica repetida en cada paso y pistas por tipo de actividad. Ahora `useExamplesEngine` carga la tabla `examples`, empareja cada ejercicio con su ejemplo por identificador y el runner muestra el título, los pasos y las pistas propios. Se redactaron bloques de ejemplo para los nueve ejercicios de la lección 1.2 que carecían de ellos, con lo que la base pasa a contener 35 ejemplos guiados. Al terminar la secuencia se ofrece la acción «Nuevo sorteo».

El tercer bloque corrigió el reparto de actividades. Antes, la práctica solo excluía los identificadores usados como ejemplo y el campo de ejercicios sorteados se guardaba vacío; si el estudiante abría Ejercicios antes que Ejemplos, podía recibir el mismo reactivo en ambas pantallas. Se creó un sorteo único por cuenta y lección (`ensureLessonDraw`) que reparte el pool en dos grupos disjuntos y persiste ambos. El reparto reserva la mitad del pool para ejemplos, de modo que con bancos pequeños ninguna pantalla queda vacía. El reinicio de progreso y la importación de un respaldo borran también `example_state`, y el motor de ejemplos dejó de escribir dentro de un actualizador de estado.

El cuarto bloque generalizó la guarda de salida. La implementación anterior solo cubría el botón del encabezado y la barra inferior; el botón físico de Android y el gesto de iOS escapaban del aviso. Se creó el hook `useExitGuard`, que intercepta `beforeRemove`, desactiva el gesto nativo mientras hay progreso sin guardar y registra la guarda para la barra inferior. Con ello quedan cubiertos el botón físico, el gesto, el encabezado, las pestañas y la navegación programática.

El quinto bloque corrigió los motores de actividad: el estado restaurado se consume una sola vez, deja de aplicarse al reiniciar y la mezcla de los ejercicios de ordenar no devuelve el orden correcto cuando hay al menos dos elementos distintos. El sexto bloque atendió la higiene: comparación de hashes en tiempo constante, retiro de la constante sin uso, sustitución del `require` de una prueba, movimiento de `eslint-config-expo` a dependencias de desarrollo y exclusión de artefactos generados en `.gitignore`.

Los problemas de esta etapa fueron, sobre todo, de propagación y de estado. El contenido corregido no llegaba a las bases existentes; los identificadores posicionales rompían la trazabilidad de los intentos; el reparto dependía del orden en que se abrieran las pantallas; el reinicio conservaba el sorteo anterior; y la mezcla podía coincidir con la solución. Cada corrección se acompañó de pruebas específicas: actualización de contenido desde v14, conservación de intentos, limpieza de huérfanos, migración de identificadores, ausencia de intersección en el sorteo, consumo único del estado restaurado, mezcla distinta del orden correcto y cobertura del modal de salida. Al cierre, el typecheck pasó sin errores, el análisis estático quedó sin advertencias y la suite alcanzó 45 archivos y 281 pruebas. Los cambios de esta etapa permanecen en el árbol de trabajo, sin commit.

### 3.2.7 Etapa 7: servicios opcionales y puertos de datos (23–24 de octubre)

La séptima etapa cambió el alcance de integración sin cambiar el comportamiento por defecto. El proyecto dejó de declararse «sin red ni backend» y pasó a definirse como *offline-first* con servicios opcionales. La decisión quedó registrada como C9: se consume únicamente contenido publicado por el sistema del maestro; no se sincroniza el progreso, no hay cuentas remotas ni se implementan los endpoints de sincronización o autenticación. SQLite sigue siendo la fuente de verdad local.

La primera decisión técnica fue desacoplar los ViewModels de `expo-sqlite`. Se creó `shared/services/data/DataProvider.tsx`, que construye un objeto de puertos por feature a partir de la base (`createRepositories(db)`) y lo entrega con `useRepositories()`. Todos los ViewModels que consultaban la base pasaron a consumir ese objeto, y una regla de ESLint (`no-restricted-imports`) prohíbe importar `expo-sqlite` desde `features/*/viewmodel`. La medida prepara el terreno para sustituir el adaptador local por uno remoto sin reescribir las pantallas.

La segunda fue introducir un modo de datos explícito. `DATA_MODE` se lee de `EXPO_PUBLIC_DATA_MODE` y vale `local` por defecto; solo con `hybrid` se habilita la capa HTTP. El cliente de `shared/services/http/client.ts` usa `fetch` nativo, sin dependencias nuevas, con tiempo límite de ocho segundos, dos reintentos con retroceso exponencial para errores de red y respuestas 5xx, errores tipados (`NetworkError`, `HttpError`, `ParseError`) y un gancho para el token. La URL base se configura con `EXPO_PUBLIC_API_URL`; no se almacenan secretos en el cliente.

La tercera fue definir el contenido remoto como una fuente opcional y validada. `remoteContent.ts` descarga un manifiesto con versión y hash por lección, compara el hash con el último descargado y obtiene únicamente las lecciones modificadas. Los payloads pasan por validación estructural y reglas específicas de cada tipo de actividad antes de guardarse. La escritura se hace en una transacción y el contenido local se conserva ante cualquier fallo.

La cuarta fue el endurecimiento del estado asíncrono. Se añadió `useAsyncResource` para estandarizar los estados de carga, éxito y error, se incorporó un `ErrorBoundary` en el layout raíz y se añadieron capturas de error a los motores de práctica, evaluación, ejemplos, ejercicios y respaldo. El respaldo pasó a la versión 2 e incluye el estado del sorteo y la última ubicación, manteniendo la lectura de las versiones anteriores. La migración v15 incorporó `score_correct` y `score_total` a `attempts`, de modo que el puntaje parcial de la práctica queda persistido y no solo en memoria.

La verificación de esta etapa cubrió el cliente HTTP, los validadores, el contenido remoto y el modo local: el typecheck pasó sin errores, ESLint quedó sin errores ni advertencias y la suite alcanzó 48 archivos y 297 pruebas. No se probó contra un servidor real; el contrato `docs/api/contrato.md` y los fixtures fueron la referencia. La base de esta etapa quedó registrada en `44a7df9`; las correcciones posteriores permanecen en el árbol de trabajo.

### 3.2.8 Etapa 8: clases y contenido extra sobre el curso base (26–27 de octubre)

La octava etapa reemplazó el modelo anterior de grupos y cursos activos por un modelo de clases que agrega contenido al curso base. El esquema evolucionó a la versión 17 mediante una migración que añadió `accounts.external_key`, las tablas `class_cache`, `class_extras_cache` y `account_classes`, y los índices correspondientes. El catálogo `base` sigue siendo el único catálogo de lecciones; las clases no lo sustituyen, sino que publican extras asociados a sus lecciones.

La decisión técnica más importante fue separar la membresía del contenido cacheado. `account_classes` registra las clases a las que pertenece cada cuenta; `class_cache` conserva el release y sus metadatos; `class_extras_cache` almacena bloques de lección, ejemplos y ejercicios. Así, una clase puede compartirse entre alumnos y el contenido descargado no necesita duplicarse por cuenta. Los extras con el mismo `extra_id` en varias clases se agrupan y se muestran una sola vez, acompañados por las etiquetas de las clases correspondientes.

La integración se extendió a los flujos existentes. `useLessonContent` y `useLessonHub` cargan bloques y ejemplos extra; `selectPracticeExercisesByLesson` incorpora ejercicios de clase al sorteo de práctica; `selectExamplesWithExtras` los integra al flujo guiado; y la pantalla de lección muestra el contenido adicional con el nombre de la clase. La práctica conserva el mismo motor, retroalimentación y registro de intentos del contenido base.

También se sustituyó la identidad implícita de la cuenta local por un UUID estable en `external_key`. La migración v17 genera esa identidad para cuentas existentes y los registros nuevos la crean al registrarse. El respaldo evolucionó a la versión 4 e incluye el alumno y sus clases; al importarlo, el sistema puede volver a asociar la identidad restaurada con las clases y retirar la identidad temporal del dispositivo cuando existe conexión. Los respaldos v1, v2 y v3 continúan siendo compatibles.

El contenido de clase se sincroniza con `/classes/{code}`, `/classes/{code}/join`, `/classes/{code}/members/{studentKey}` y `/classes/{code}/release`. `ContentSyncProvider` actualiza primero el curso base y después las clases inscritas. Si una clase no tiene release publicado o falla la red, conserva su caché anterior. La validación del release comprueba la versión del contrato, la identidad de la clase, los ids de extras, los bloques de lectura y los tipos de ejemplo y ejercicio antes de guardar la caché.

### 3.2.9 Etapa 9: migración tecnológica y cierre del contrato de clases (27 de octubre)

La novena etapa actualizó el entorno de ejecución de Expo SDK 57 a SDK 58, con React Native 0.88, React 19.3, Expo Router 58, Jest 30 y `jest-expo` 58. Se ajustaron las APIs asíncronas de `expo-file-system`, la barra de pestañas, la protección de navegación en Expo Router, los tipos estrictos de React Native y la compatibilidad de Quick Crypto con Expo Go mediante un fallback a `@noble/hashes`. Se añadió `.npmrc` para resolver el peer opcional de React Native Testing Library sin reescribir la suite existente.

En paralelo se cerró la revisión 2.2 del contrato de clases. Los códigos se normalizan a mayúsculas, la respuesta distingue preview y release, y la caché se valida contra la clase, versión y hash publicados. La documentación del proyecto se actualizó con una guía para agregar contenido, un exportador del curso base y una guía para generar un APK que consuma contenido remoto. Las clases sustituyeron completamente la nomenclatura anterior de grupos en las rutas, ViewModels, repositorios y documentación operativa.

La prueba de un perfil EAS híbrido, el release de ida y vuelta del curso base y la validación contra un servidor real permanecen pendientes. El modo local continúa siendo el predeterminado; `eas.json` todavía no activa `hybrid`. También quedan pendientes la generación automática del fixture desde el esquema del servidor y una prueba con SQLite real o en dispositivo.

Al cierre de esta etapa y de las correcciones de compatibilidad, el typecheck pasó sin errores, ESLint quedó sin errores ni advertencias y la suite alcanzó 57 archivos y 363 pruebas. La migración se verificó con `expo-doctor`, exports locales de Android y web, `expo prebuild` y el arranque de Metro; no se generó todavía un nuevo build final de EAS. Parte de la etapa quedó incorporada en `8ea6df9`; los arreglos posteriores permanecen en el árbol de trabajo.

### 3.2.10 Metodología de desarrollo

El autor desarrolló el sistema de manera iterativa, desde la definición de su alcance y arquitectura hasta la integración, depuración y verificación de las funciones. Como guía mantuvo `AGENTS.md`, que registra el stack, la estructura MVVM por *features*, las reglas de dependencia y los comandos de validación. Para organizar cambios de mayor alcance elaboró especificaciones y planes en `docs/especificaciones` y `docs/planes`, y contrastó la implementación con el esquema de datos, los flujos de navegación y las decisiones documentadas.

El trabajo se dividió en incrementos funcionales: primero se establecieron la persistencia local, la autenticación y el recorrido de aprendizaje; después se ampliaron los bancos y la evaluación; posteriormente se estabilizaron las migraciones, se reorganizó el código por *features* y, finalmente, se incorporaron el consumo opcional de contenido, las clases y la migración a SDK 58. En cada incremento el autor definió los criterios esperados, revisó los cambios en contexto, atendió errores detectados y mantuvo pruebas de regresión para proteger las funciones existentes. Las tareas con riesgo de integridad de datos se acompañaron de migraciones transaccionales y pruebas; las de contrato remoto, de validadores y respuestas simuladas.

La verificación se realizó con `npx tsc --noEmit`, `npm run lint` y `npm test -- --runInBand`; para la migración tecnológica se añadieron `expo-doctor`, `expo export`, `expo prebuild` y el arranque de Metro. Al corte de este capítulo, el historial de git contiene 19 commits hasta `8ea6df9` («Migrate to SDK 58»); los ajustes posteriores siguen sin commit. Las decisiones de alcance —por ejemplo, mantener la autenticación local, retirar la tabla `results`, conservar la personalización por desempeño y dejar la red desactivada por defecto— se registraron en la documentación del proyecto.

Entre los problemas que requirieron revisión se encontraron defectos en migraciones y siembra de datos, contenido que no se actualizaba en instalaciones existentes, ids posicionales que podían desalinear intentos y dependencias entre la selección de ejemplos y ejercicios. Se corrigieron mediante migraciones versionadas, sincronización por hashes, ids estables, reglas de validación y pruebas automatizadas. La revisión también permitió identificar límites aún abiertos: el contrato y el consumo remoto no se han validado contra el servidor del maestro y la cobertura de algunas rutas y hooks continúa siendo parcial.

## 3.3 ¿Qué resultados se obtuvieron?

### 3.3.1 Comparación entre objetivos y resultados

Los objetivos que pueden contrastarse con evidencia en el repositorio son los del plan de arquitectura y las fases del proyecto. Los objetivos específicos del capítulo 1 no están transcritos en el repositorio, por lo que la tabla debe cotejarse con ellos antes de la entrega final.

| Objetivo | Estado | Evidencia |
|---|---|---|
| Aplicación móvil offline-first, con servicios opcionales | Completo | `DATA_MODE='local'` por defecto (sin llamadas); `expo-sqlite` como fuente de verdad; capa HTTP y contenido remoto solo con `hybrid`; APK instalable |
| Consumo opcional de contenido publicado | Parcial | Cliente HTTP, contrato v2.2, validadores, caché de clases y extras probados con fixtures; falta el servidor real, el fixture generado desde su esquema y activar `hybrid` en EAS |
| Clases y contenido extra sobre el curso base | Completo en el cliente | `account_classes`, `class_cache`, `class_extras_cache`, `useClasses`, unión/salida, deduplicación y etiquetas |
| Adaptación de la arquitectura MLO-AR sin realidad aumentada | Completo | Capas de persistencia, personalización, interactividad, estructura y estándares documentadas; exclusión de RA verificada en código y dependencias |
| Patrón MVVM con separación Vista/ViewModel/Modelo | Completo | `src/app` delgado, `src/features/<f>/{model,viewmodel,view}`, regla de dependencias en `AGENTS.md` |
| Contenido, ejemplos, ejercicios y evaluación de la Unidad 1 | Completo | Unidad 1 con cuatro lecciones, contenido rico y tres evaluaciones; 44 ejercicios, 76 preguntas y 35 ejemplos en el banco |
| Ejercicios y evaluación como entidades separadas | Completo | Tablas, motores y rutas separadas; bitácora común `attempts` justificada |
| Retroalimentación inmediata en práctica | Completo | `usePracticeEngine`, `ActivityView`, resumen por tipo y tema |
| Puntaje acumulado e historial de evaluación | Completo | 10 preguntas + 5 ejercicios; `evaluation_results`; pestaña Evaluaciones |
| Progreso por estudiante y reanudación | Completo | `module_progress`, `last_location`, bloque «Continuar»; progreso filtrado por catálogo y auth local |
| Personalización por estilo de aprendizaje | Parcial | CHAEA abreviado de 8 ítems y estilo persistido; el contenido no se reordena por estilo |
| Analítica y recomendación de repaso | Completo | `analytics.logic.ts`: resumen por tipo/tema, tipos débiles y recomendación |
| Accesibilidad básica | Parcial | Modo oscuro, texto ampliado, roles y etiquetas; sin auditoría formal de accesibilidad |
| Metadatos LOM | No implementado | No existe módulo de metadatos; solo insignias visuales de dificultad y número de subtemas |
| Empaquetado SCORM/LOM | No implementado por alcance | Decisión documentada; sin generación de manifiestos |
| Contenido completo de las unidades 2–5 | Pendiente | Las unidades 2–5 tienen lecciones introductorias; sin ejercicios ni evaluaciones |
| Portabilidad iOS validada | Pendiente | El proyecto es multiplataforma, pero no hay evidencia de compilación o prueba en iOS |
| Validación formal de usabilidad | Pendiente | No hay estudio con usuarios ni instrumento aplicado |

[CONFIRMAR: cotejar esta tabla con los objetivos específicos y generales del capítulo 1 y ajustar la columna «Estado».]

### 3.3.2 Funcionalidades completas, parciales y pendientes

Quedaron completas las funciones que sostienen el recorrido pedagógico: autenticación local, catálogo con avance, lectura por bloques ricos, ejemplos guiados en dos variantes con contenido curado, práctica con cuatro tipos de actividad y retroalimentación inmediata, evaluación con quince reactivos y puntaje, historial, analítica, perfil, respaldo de progreso, membresías de clase, contenido extra deduplicado y guarda de salida en todos los caminos de navegación. También quedó completa la infraestructura técnica: esquema versionado hasta v17, migraciones atómicas, contenido re-sincronizable por hash, caché de clases, sorteo conjunto sin intersección, archivado de contenido retirado, identidad estable de cuentas, pruebas automatizadas, análisis estático y build local de Android/web. La base para servicios quedó preparada con puertos inyectables, cliente HTTP con errores tipados, validación en la frontera, cachés remotas y conservación del contenido local ante fallos.

Quedaron parciales la personalización por estilo, la accesibilidad, la cobertura de pruebas de algunas capas y el despliegue remoto. El cuestionario CHAEA calcula y guarda el estilo dominante, pero el contenido no se reordena ni se filtra según ese estilo; la adaptación efectiva es por desempeño. La accesibilidad cuenta con modo oscuro, texto ampliado y etiquetas, pero no con una auditoría formal. El modo híbrido, las clases, la validación y las cachés están implementados y probados con fixtures, pero no se han ejercitado contra un servidor real ni mediante un perfil EAS híbrido. El fixture del cliente sigue siendo manual, no generado desde el esquema del panel. La cobertura actual no se ha vuelto a medir después de la migración a SDK 58; la última medición disponible es de 69.70 % de sentencias, 63.86 % de ramas y 69.32 % de líneas sobre `src/**`.

Quedaron pendientes el contenido completo de las unidades 2 a 5, los metadatos LOM, el empaquetado SCORM, la activación controlada del perfil EAS `hybrid`, la validación contra el panel del maestro, la prueba de ida y vuelta del curso base, la validación en iOS, la prueba en dispositivos de 32 bits y la evaluación formal de usabilidad. Las unidades 2–5 existen en el catálogo con lecciones introductorias, pero no tienen ejercicios ni evaluaciones. El APK se restringió a `arm64-v8a`, por lo que no se instala en equipos de 32 bits ni en emuladores x86_64 sin una configuración adicional.

### 3.3.3 Limitaciones conocidas

La primera limitación es de alcance del contenido. El sistema demuestra el modelo completo en la Unidad 1, pero no cubre las cinco unidades con la misma profundidad. Cualquier afirmación sobre la eficacia del OAM en el curso completo debe formularse como expectativa, no como resultado medido.

La segunda es la personalización. El estilo de aprendizaje se identifica con una versión abreviada de ocho ítems y se almacena, pero no modifica la secuencia ni el tipo de contenido. La recomendación de repaso se basa en el desempeño registrado. Por tanto, el sistema personaliza por historial de respuestas, no por estilo.

La tercera es la evaluación empírica. El repositorio contiene pruebas automatizadas y verificaciones de compilación, pero no un estudio con estudiantes que mida aprendizaje, usabilidad o retención. Las métricas disponibles son técnicas: cobertura, número de pruebas, tamaño del APK y resultado de las compilaciones.

La cuarta es la seguridad. La autenticación es local y está pensada para separar perfiles en un dispositivo compartido, no para proteger información sensible en un escenario adversario. El hash usa PBKDF2 con sal e iteraciones y se rehashea al iniciar sesión. La identidad externa se comparte con el panel únicamente cuando se ejecutan operaciones de clases en modo híbrido; no hay recuperación de cuentas ni sincronización de progreso.

La quinta es la portabilidad. El destino principal es Android; la web se conserva como soporte de demostración y iOS no se validó en dispositivo. El APK está limitado a una arquitectura y a Android 12 o superior.

La sexta es la deuda residual. La cobertura de rutas, hooks de carga y adaptador de datos sigue siendo baja. Las migraciones v15, v16 y v17 se probaron con pruebas automatizadas, pero no con un respaldo real exportado desde una instalación v14 ni con un curso de clases real; los tests de persistencia usan un doble de SQLite y no verifican todas las restricciones de claves foráneas con el motor real. La desactivación del gesto de iOS tampoco se validó en un dispositivo físico. Los cambios posteriores a los commits de SDK 58 y servicios permanecen en el árbol de trabajo.

La séptima es la integración remota. El modo híbrido está implementado, pero se probó con fixtures, no con el panel de clases desplegado. El contrato v2.2 documenta la forma acordada desde la perspectiva del cliente, pero el serializador y el esquema del panel no están en este repositorio y requieren una prueba de ida y vuelta. El fixture usado por MLO es manual. Todavía falta activar un perfil de EAS para este modo. El contrato de clases no admite imágenes y exige releases válidos; esas restricciones deben mantenerse en el panel. El arranque no espera a la red: la descarga se realiza en segundo plano y la aplicación queda en caché local. No existe sincronización de progreso, cuentas remotas ni consulta de resultados académicos por parte del docente. Estas ausencias son deliberadas y deben declararse como alcance, no como fallo.

### 3.3.4 Evidencia y verificación

La verificación técnica se ejecutó sobre el estado actual del repositorio. El typecheck estricto terminó sin errores. La suite completa pasó con 57 suites y 363 pruebas. ESLint reportó cero errores y cero advertencias. La cobertura no se ha vuelto a medir después de la migración a SDK 58; la última medición disponible sobre `src/**` fue de 69.70 % de sentencias, 63.86 % de ramas y 69.32 % de líneas. La migración se verificó con `expo-doctor` (20/20 comprobaciones), exports locales de Android y web, `expo prebuild` y Metro. El build de demostración de la etapa 5 se completó con EAS, con `versionCode` 3 y un APK de aproximadamente 33.2 MB; todavía no se ha generado el nuevo APK con SDK 58 (`versionCode` 4).

[INSERTAR CAPTURA: salida de `npx tsc --noEmit` sin errores.]
[INSERTAR CAPTURA: salida de `npm test -- --runInBand` con 57 suites y 363 pruebas.]
[INSERTAR CAPTURA: salida de `npm run lint` sin errores ni advertencias.]
[INSERTAR CAPTURA: página del build de EAS o del artefacto APK.]
[INSERTAR CAPTURA: APK instalado en el dispositivo, con la versión y el tamaño.]

Para respaldar la afirmación de funcionamiento offline se recomienda una prueba explícita: activar el modo avión, reiniciar la aplicación y recorrer una lección, una práctica y una evaluación. La prueba debe ejecutarse con `DATA_MODE` sin configurar (valor local). Esa prueba no está registrada en el repositorio y debe realizarse antes de la entrega.

[INSERTAR CAPTURA: aplicación en modo avión, con una actividad completada y el progreso conservado tras reiniciar.]
[INSERTAR CAPTURA: ejecución con `DATA_MODE='hybrid'` y servidor simulado, mostrando que el contenido se actualiza en segundo plano; y el mismo arranque sin red, mostrando que se conserva el contenido local.]

### 3.3.5 Evidencia por reunir

La lista siguiente reúne toda la evidencia que debe recopilarse para sostener el capítulo. Los marcadores de captura ya están distribuidos en el texto; esta lista sirve como control de recolección.

1. Captura de login y registro, incluidos los mensajes de validación.
2. Captura de la pestaña Módulos con unidades, avance y bloque de continuación.
3. Captura del hub temático con los cuatro destinos.
4. Captura de una lección con párrafos, lista, tabla y muestra de código.
5. Captura de un ejemplo guiado en variante A y en variante B, incluida la acción «Nuevo sorteo».
6. Captura de una práctica con retroalimentación correcta e incorrecta.
7. Captura del resumen de práctica con aciertos por tipo y por tema.
8. Captura de una evaluación en curso, con al menos un reactivo de opción múltiple y uno interactivo.
9. Captura del resumen de evaluación con puntaje y recomendación.
10. Captura del historial de evaluaciones.
11. Captura del perfil con modo oscuro, texto ampliado y reinicio de progreso.
12. Captura del cuestionario CHAEA y del estilo predominante calculado.
13. Captura de exportación e importación del respaldo de progreso.
14. Captura de la confirmación de salida desde el botón físico de Android y desde la barra inferior.
15. Captura del Perfil mostrando el curso base, las clases inscritas, el docente y las acciones de unirse/salir.
16. Captura del flujo de unión a una clase: código, confirmación y descarga del release.
17. Captura del APK instalado, con la versión y el tamaño visibles.
18. Captura de la aplicación en modo avión, con progreso conservado tras reiniciar.
19. Captura de las salidas de `tsc`, `jest` y `lint`.
20. Captura de la página del build de EAS y del artefacto descargado.
21. Diagrama de componentes (figura 3.1) y diagrama entidad-relación (figura 3.2), actualizados al estado actual.
22. Diagrama de secuencia «responder un ejercicio» (figura 3.3), mapa de navegación (figura 3.4) y diagrama de modos de datos (figura 3.5).
23. Diagrama del área de espera: `ContentSyncProvider` → `remote_lessons` → `applyStagedContent` → tablas de contenido.
24. Evidencia de la migración v14 → v17: ejecutar la app con una base v14 con intentos y verificar que conserva el progreso, genera la identidad externa, actualiza el contenido base y crea las estructuras de clases.
25. [CONFIRMAR: objetivos específicos del capítulo 1 para cerrar la tabla 3.3.1.]
26. [CONFIRMAR: si el reporte exige ficha LOM y empaquetado SCORM; el código actual no los implementa.]
27. [CONFIRMAR: si se realizó alguna prueba con usuarios o validación en iOS; no hay registro en el repositorio.]
28. [CONFIRMAR: autoría y derechos del contenido textual y de los bancos de ejercicios y preguntas.]
29. Contrato de API (`docs/api/contrato.md`) y prueba del modo híbrido: manifiesto válido, contenido inválido descartado y conservación del contenido local sin red.
30. Evidencia de que `DATA_MODE='local'` no genera peticiones HTTP (registro de red vacío durante un recorrido completo).
