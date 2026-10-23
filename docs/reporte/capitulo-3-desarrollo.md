# Capítulo 3. Desarrollo

Este capítulo responde a tres preguntas sobre el objeto de aprendizaje móvil (OAM) construido: qué se hizo, cómo se hizo y qué resultados se obtuvieron. La descripción del sistema final se basa en el código del repositorio; la reconstrucción del proceso, en el historial de git y en el registro de las 42 sesiones de trabajo asistido por agente de inteligencia artificial (16 sesiones principales y 26 subsesiones de revisión o implementación, con 195 instrucciones del autor). Cuando una afirmación depende de documentación externa al repositorio se indica expresamente con un marcador de confirmación.

El alcance del producto es una aplicación móvil offline para la asignatura *Introducción a la Ingeniería de Software*. El sistema cubre la Unidad 1 con contenido completo y deja las unidades 2 a 5 con contenido introductorio. Esta delimitación se retoma en la sección 3.3, porque condiciona la comparación entre objetivos y resultados.

## 3.1 ¿Qué se hizo?

### 3.1.1 Problema y delimitación

El sistema resuelve la necesidad de disponer de un objeto de aprendizaje autocontenido, instalable en un teléfono Android, que permita al estudiante recorrer el ciclo lectura → ejemplo guiado → práctica → evaluación sin conexión a internet y sin infraestructura de servidor. El problema no era solo de contenido: el proyecto requería conservar el avance por estudiante, ofrecer retroalimentación inmediata en la práctica, calcular un puntaje en la evaluación y mantener un historial consultable. En un dispositivo compartido, esas funciones exigen identificar al alumno; por ello se incorporó autenticación local, una extensión respecto de la arquitectura de referencia MLO-AR, que no contempla administración de usuarios.

La delimitación es explícita y verificable en el código y en la documentación de arquitectura: no hay realidad aumentada, no se usan sensores nativos, no existe comunicación de red y no se empaqueta SCORM ni LOM en tiempo de ejecución. La aplicación se distribuye como APK de Android y, como soporte adicional para demostración, puede exportarse a web. El destino principal es móvil; la web no se considera un requisito del producto.

[CONFIRMAR: redactar aquí la delimitación institucional del reporte —población, periodo y alcance geográfico—, que no consta en el repositorio.]

### 3.1.2 Funcionalidades del sistema

La aplicación se organiza en tres pestañas persistentes: Módulos, Evaluaciones y Perfil. La pestaña Módulos presenta las cinco unidades del curso con sus lecciones; cada unidad se expande y muestra el avance. Al elegir una lección distinta de la 1.1 se abre un *hub* temático con cuatro destinos —lección, ejemplos, ejercicios y evaluación—, mientras que la 1.1 abre directamente la lectura porque se definió como contenido de solo lectura. La portada incluye un bloque de continuación que recupera la última ubicación registrada por el estudiante.

La lectura se presenta por bloques ricos: párrafos, listas, tablas y muestras de código. Los ejemplos guiados se recorren en secuencia, sin un menú intermedio de selección, y ofrecen dos variantes: una resuelta paso a paso con la justificación de cada paso y otra en la que el estudiante intenta la actividad con pistas y puede revelar la solución. La práctica plantea hasta diez ejercicios por sesión, seleccionados de un banco y sin repetir los que ya se usaron como ejemplo. Admite cuatro tipos de actividad: ordenar pasos, completar espacios con un banco de palabras, relacionar pares y resolver un crucigrama. Cada respuesta recibe retroalimentación inmediata y, al finalizar, se muestra un resumen con aciertos por tipo y por tema.

La evaluación formal combina dos fuentes: preguntas del banco de evaluación y ejercicios interactivos. Por cada sesión se seleccionan diez preguntas y cinco ejercicios, se mezclan y se barajan las opciones de las preguntas de opción múltiple. Cada uno de los quince reactivos vale el mismo porcentaje y se califica como correcto o incorrecto; el resultado se expresa como porcentaje de aciertos. El puntaje se guarda y alimenta el historial de la pestaña Evaluaciones, que muestra la calificación y el desglose por tipo de actividad, además de una recomendación de repaso cuando el desempeño es bajo.

El Perfil permite consultar y editar el estilo de aprendizaje, alternar el modo oscuro y el texto ampliado, reiniciar el progreso y exportar o importar un respaldo del avance en formato JSON. La personalización incluye un cuestionario CHAEA abreviado de ocho ítems, dos por cada estilo —activo, reflexivo, teórico y pragmático—, que calcula el estilo dominante y lo persiste. La navegación incorpora una guarda de salida: si el estudiante intenta abandonar una práctica o evaluación en curso mediante las pestañas o el botón de retroceso, el sistema pide confirmación.

[INSERTAR CAPTURA: pantalla de inicio de sesión y pantalla de registro.]
[INSERTAR CAPTURA: pestaña Módulos con las unidades, el avance y el bloque «Continuar donde lo dejaste».]
[INSERTAR CAPTURA: hub temático con los cuatro destinos.]
[INSERTAR CAPTURA: lección con contenido rico, incluida una tabla.]

### 3.1.3 Stack tecnológico

La aplicación se implementó con Expo SDK 57 sobre React Native 0.86 y React 19.2, en TypeScript con configuración estricta. La navegación usa Expo Router 57 con rutas tipadas y organización por grupos. La persistencia se resuelve con `expo-sqlite`; la interfaz gráfica complementaria se apoya en `react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-screens` y `react-native-safe-area-context`. La autenticación utiliza derivación de claves PBKDF2-HMAC-SHA256 con `react-native-quick-crypto` en Android e iOS y `@noble/hashes` como respaldo en web. El respaldo se resuelve con `expo-file-system` para crear y seleccionar el archivo JSON y con `expo-sharing` para compartirlo.

El aseguramiento de calidad se apoya en Jest con `jest-expo` y `@testing-library/react-native`; el análisis estático se realiza con ESLint y `tsc`. La distribución usa EAS Build con un perfil `preview` que genera APK y un perfil `production` que genera App Bundle. La configuración de compilación restringe el APK a `arm64-v8a`, fija Android 12 (API 31) como mínimo, activa R8, la reducción de recursos y una regla ProGuard para el módulo criptográfico nativo. El APK de demostración quedó en aproximadamente 33.2 MB, frente a los 118.1 MB del primer build universal.

No se incluyó ninguna biblioteca cliente de red ni se registran llamadas `fetch`, `axios` o `XMLHttpRequest` en `src/`. Esa ausencia es coherente con el requisito de funcionamiento offline y con la decisión de no integrar servicios externos.

### 3.1.4 Arquitectura de software

La arquitectura sigue el patrón MVVM adaptado a React. La vista es un componente de pantalla; el ViewModel es un hook que encapsula estado, efectos y llamadas al repositorio; el modelo son las entidades y los repositorios; la persistencia es `expo-sqlite`. La regla de dependencias es unidireccional: Vista → ViewModel → Modelo → servicios compartidos. Las rutas de `src/app` son deliberadamente delgadas: reexportan una vista o montan un layout, de modo que la lógica no vive en el árbol de rutas.

El código se organiza por *features*. Cada carpeta de `src/features` —`auth`, `profile`, `modules`, `examples`, `exercises` y `evaluations`— contiene `model`, `viewmodel` y `view`, además de sus pruebas. La carpeta `src/shared` concentra componentes reutilizables, hooks, tema, utilidades, tipos y servicios de base de datos y contenido. Esta separación permite que una feature consuma el ViewModel o el Modelo de otra, pero nunca su Vista. La estructura completa se documenta en `AGENTS.md` y se refleja en los 154 archivos TypeScript del directorio `src`.

[SUGERIR FIGURA 3.1: diagrama de componentes y capas. Debe mostrar las tres capas lógicas —Vista, ViewModel y Modelo—, las seis features con sus carpetas, `src/shared`, `expo-sqlite` y la dirección única de dependencias. Puede reutilizarse o adaptarse el diagrama de `docs/arquitectura/arquitectura-mlo.html`.]

La capa de persistencia utiliza una base SQLite local llamada `mlo.db`, con modo WAL y claves foráneas activas por conexión. El esquema tiene 14 tablas y 9 índices, y su versión actual es 14 (`DATABASE_VERSION = 14`). Las tablas núcleo son `units`, `lessons`, `examples`, `exercises`, `evaluations` y `questions`. Las tablas de soporte son `accounts` y `auth_session` para la sesión local; `attempts` como bitácora de intentos de práctica y evaluación; `evaluation_results` para el puntaje acumulado; `learner_profile` para estilo y accesibilidad; `module_progress` para el avance por lección; `last_location` para reanudar la sesión y `example_state` para conservar el sorteo y el índice del ejemplo en curso.

La separación entre ejercicios y evaluación se conserva en tablas, motores y rutas. La bitácora `attempts` es compartida y distingue el origen con la columna `source`; esa decisión habilita la analítica unificada. La evaluación reutiliza el componente de actividad para presentar preguntas y ejercicios, pero mantiene su propio motor de calificación y su propio registro de resultados.

[SUGERIR FIGURA 3.2: modelo entidad-relación de las 14 tablas, con claves primarias, foráneas y cardinalidades. El proyecto ya cuenta con `docs/arquitectura/er-mlo.html` y `docs/arquitectura/esquema-bd-mlo.html`, que pueden servir de base; debe actualizarse el número de tablas y la versión del esquema.]

La inicialización de la base ocurre en `migrateAndSeed`, invocado por `SQLiteProvider`. En una instalación nueva se crea el esquema completo y se siembra el contenido; en una instalación existente se aplican migraciones incrementales desde la versión registrada en `PRAGMA user_version`. El contenido se siembra desde archivos TypeScript: `seed.ts` define unidades y lecciones; `unit1.content.ts` contiene ejemplos, ejercicios y evaluaciones; `lesson1.2.bank.ts` aporta 26 ejercicios y `lesson1.2.questions.ts` aporta 33 preguntas. En total se siembran 5 unidades, 25 lecciones, 44 ejercicios, 78 preguntas y 26 filas de ejemplo. La siembra es idempotente mediante `ON CONFLICT DO NOTHING` y, desde la corrección del build de demostración, se ejecuta en una sola transacción.

El flujo de datos típico comienza en la pantalla, que invoca un hook; el hook consulta uno o varios repositorios; el repositorio ejecuta SQL sobre `expo-sqlite` y devuelve entidades; el hook transforma el resultado en estado y la vista lo renderiza. Al responder una actividad, el hook calcula el resultado, lo registra en `attempts` y actualiza el resumen; el avance de la lección se persiste en `module_progress`. En ningún punto del flujo interviene la red.

[SUGERIR FIGURA 3.3: diagrama de secuencia «responder un ejercicio». Debe mostrar Pantalla → `usePracticeEngine` → `attemptRepository` → `expo-sqlite`, y el retorno del resumen a la vista.]

La navegación se organiza en un `Stack` raíz con dos zonas protegidas: `(app)` cuando existe sesión y `login`/`register` cuando no la hay. Dentro de `(app)` se monta un `Tabs` con tres grupos: `(modules)`, `(evaluations)` y `(profile)`. Las rutas de contenido viven bajo `(modules)`: `tema/[id]`, `lecciones/[id]`, `ejemplos`, `ejercicios` y `evaluacion`. La pestaña Evaluaciones incluye el catálogo y el historial, y reutiliza el mismo flujo de evaluación. La ubicación se persiste en `last_location` y se traduce a una ruta con `hrefForLocation`, lo que permite reanudar la lección, el ejemplo, la práctica o la evaluación.

[SUGERIR FIGURA 3.4: mapa de navegación. Debe mostrar el Stack raíz, las tres pestañas, el hub temático, los cuatro flujos de actividad y las rutas de retorno. El proyecto tiene `docs/arquitectura/mapa-navegacion.html` como antecedente, pero debe actualizarse al estado actual.]

La compilación y distribución se resolvieron con EAS Build. El perfil `preview` produce un APK instalable; el perfil `production`, un App Bundle. La configuración de `app.json` fija `versionCode` 3, `minSdkVersion` 31, una sola arquitectura (`arm64-v8a`), R8 y reducción de recursos. La aplicación se identificó con el paquete `com.mlo.ingenieriasoftware`.

## 3.2 ¿Cómo se hizo?

El trabajo se organizó en cinco etapas lógicas. La frontera entre etapas no siempre coincide con una fecha exacta, porque algunas actividades se solaparon —por ejemplo, el banco de contenido de la lección 1.2 se inició antes de cerrar la navegación—; la agrupación responde a la lógica de construcción, no a un corte cronológico estricto. La tabla siguiente resume las etapas y después se explica cada una.

| Etapa | Periodo | Resultado principal |
|---|---|---|
| 1. Cimientos y núcleo offline | 13–29 sep | Auth local, datos por cuenta, esquema SQLite, contenido de la Unidad 1, navegación básica |
| 2. Navegación y flujo pedagógico | 29 sep–7 oct | Tabs persistentes, rutas por contexto, reanudación, bloqueo de actividades, flujo secuencial de ejemplos |
| 3. Contenido y evaluación a escala | 28 sep–15 oct | Banco de 1.2, sorteo sin repetición, evaluación de 10 + 5, analítica |
| 4. Estabilización y refactor | 8–15 oct | Corrección de integridad, PBKDF2, pruebas de repositorios, MVVM por features, CHAEA abreviado, respaldo de progreso |
| 5. Endurecimiento para la demo | 21–22 oct | Guarda de salida, calificación por sesión, corrección del seed, KDF nativo, APK de 33.2 MB |

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

La decisión técnica fue sembrar el banco desde TypeScript hacia SQLite y usar identificadores estables. La práctica y los ejemplos sortean hasta diez elementos del banco, evitando que un mismo reactivo se use como ejemplo y como ejercicio en la misma sesión. La evaluación se separó en un *pool* de preguntas y otro de ejercicios: se eligen diez y cinco respectivamente, se mezclan y se barajan las opciones de las preguntas de opción múltiple. La calificación de la práctica se calcula sobre la sesión sorteada, no sobre el total del banco, y cada reactivo pesa lo mismo; cuando la actividad tiene varios componentes internos se otorga puntaje parcial. La analítica agregada por tipo y por tema produce una recomendación de repaso.

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

### 3.2.6 Metodología de trabajo con agente de inteligencia artificial

El desarrollo se realizó con un agente de codificación integrado en el repositorio, guiado por el archivo `AGENTS.md`. Ese archivo fijó el stack, la arquitectura, las convenciones de nombres, las reglas de dependencia y los comandos de verificación. Antes de implementar cambios grandes se redactaron especificaciones y planes en `docs/especificaciones` y `docs/planes`; el agente los leía junto con el código y después modificaba los archivos.

El ciclo de trabajo fue iterativo: el autor describía el cambio en lenguaje natural; el agente inspeccionaba el código, proponía o ejecutaba la modificación y corría las verificaciones; el autor revisaba el resultado y decidía el siguiente paso. Las verificaciones fueron `npx tsc --noEmit`, `npm test -- --runInBand` y `npm run lint`; en las etapas de cierre se añadieron `expo export`, `expo-doctor` y la compilación con EAS. Las tareas de mayor riesgo se dividieron en entregas y se sometieron a subsesiones de revisión con criterios explícitos de conformidad con la especificación. Esas revisiones produjeron correcciones concretas antes de cada commit.

El registro de sesiones permite cuantificar el proceso: 42 sesiones, 195 instrucciones del autor y 26 subsesiones de implementación o revisión. El historial de git muestra 16 commits en la rama principal, con mensajes que separan funcionalidad, refactor y documentación. La revisión humana no se limitó a aceptar el código: el autor validó decisiones de alcance —por ejemplo, conservar la autenticación local, retirar la tabla `results` o mantener la personalización por desempeño— y probó el APK en un dispositivo.

[CONFIRMAR: describir el grado exacto de revisión humana línea por línea y si el asesor participó en la validación de cada entrega; el repositorio solo documenta la revisión por pruebas, las subsesiones de revisión y la validación del APK.]

El uso del agente tuvo riesgos que se manifestaron en el proceso. El más visible fue la acumulación de deuda en el esquema y en la duplicación de contenido, que obligó a una etapa completa de estabilización. También aparecieron dependencias sin uso y código muerto, que se retiraron después de una auditoría. La mitigación consistió en pruebas automatizadas, revisiones separadas y una lista de pendientes verificable. El agente no sustituyó la validación empírica: el funcionamiento en el dispositivo, el tamaño del APK y la corrección del login se comprobaron con builds reales.

## 3.3 ¿Qué resultados se obtuvieron?

### 3.3.1 Comparación entre objetivos y resultados

Los objetivos que pueden contrastarse con evidencia en el repositorio son los del plan de arquitectura y las fases del proyecto. Los objetivos específicos del capítulo 1 no están transcritos en el repositorio, por lo que la tabla debe cotejarse con ellos antes de la entrega final.

| Objetivo | Estado | Evidencia |
|---|---|---|
| Aplicación móvil offline, sin red ni backend | Completo | Sin llamadas de red en `src/`; `expo-sqlite` como única persistencia; APK instalable |
| Adaptación de la arquitectura MLO-AR sin realidad aumentada | Completo | Capas de persistencia, personalización, interactividad, estructura y estándares documentadas; exclusión de RA verificada en código y dependencias |
| Patrón MVVM con separación Vista/ViewModel/Modelo | Completo | `src/app` delgado, `src/features/<f>/{model,viewmodel,view}`, regla de dependencias en `AGENTS.md` |
| Contenido, ejemplos, ejercicios y evaluación de la Unidad 1 | Completo | Unidad 1 con cuatro lecciones, contenido rico y tres evaluaciones; 44 ejercicios y 78 preguntas en el banco |
| Ejercicios y evaluación como entidades separadas | Completo | Tablas, motores y rutas separadas; bitácora común `attempts` justificada |
| Retroalimentación inmediata en práctica | Completo | `usePracticeEngine`, `ActivityView`, resumen por tipo y tema |
| Puntaje acumulado e historial de evaluación | Completo | 10 preguntas + 5 ejercicios; `evaluation_results`; pestaña Evaluaciones |
| Progreso por estudiante y reanudación | Completo | `module_progress`, `last_location`, bloque «Continuar»; auth local |
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

Quedaron completas las funciones que sostienen el recorrido pedagógico: autenticación local, catálogo con avance, lectura por bloques ricos, ejemplos guiados en dos variantes, práctica con cuatro tipos de actividad y retroalimentación inmediata, evaluación con quince reactivos y puntaje, historial, analítica, perfil, respaldo de progreso y guarda de salida. También quedó completa la infraestructura técnica: esquema versionado, migraciones, siembra idempotente, pruebas automatizadas, análisis estático y build de Android.

Quedaron parciales la personalización por estilo, la accesibilidad y la cobertura de pruebas de algunas capas. El cuestionario CHAEA calcula y guarda el estilo dominante, pero el contenido no se reordena ni se filtra según ese estilo; la adaptación efectiva es por desempeño. La accesibilidad cuenta con modo oscuro, texto ampliado y etiquetas, pero no con una auditoría formal. La cobertura actual es de 68.27 % de sentencias, 60.63 % de ramas y 67.96 % de líneas sobre `src/**`; las rutas y varios hooks de carga no están cubiertos.

Quedaron pendientes el contenido completo de las unidades 2 a 5, los metadatos LOM, el empaquetado SCORM, la validación en iOS, la prueba en dispositivos de 32 bits y la evaluación formal de usabilidad. Las unidades 2–5 existen en el catálogo con lecciones introductorias, pero no tienen ejercicios ni evaluaciones. El APK se restringió a `arm64-v8a`, por lo que no se instala en equipos de 32 bits ni en emuladores x86_64 sin una configuración adicional.

### 3.3.3 Limitaciones conocidas

La primera limitación es de alcance del contenido. El sistema demuestra el modelo completo en la Unidad 1, pero no cubre las cinco unidades con la misma profundidad. Cualquier afirmación sobre la eficacia del OAM en el curso completo debe formularse como expectativa, no como resultado medido.

La segunda es la personalización. El estilo de aprendizaje se identifica con una versión abreviada de ocho ítems y se almacena, pero no modifica la secuencia ni el tipo de contenido. La recomendación de repaso se basa en el desempeño registrado. Por tanto, el sistema personaliza por historial de respuestas, no por estilo.

La tercera es la evaluación empírica. El repositorio contiene pruebas automatizadas y verificaciones de compilación, pero no un estudio con estudiantes que mida aprendizaje, usabilidad o retención. Las métricas disponibles son técnicas: cobertura, número de pruebas, tamaño del APK y resultado de las compilaciones.

La cuarta es la seguridad. La autenticación es local y está pensada para separar perfiles en un dispositivo compartido, no para proteger información sensible en un escenario adversario. El hash usa PBKDF2 con sal e iteraciones y se rehashea al iniciar sesión, pero no hay recuperación de cuentas ni sincronización.

La quinta es la portabilidad. El destino principal es Android; la web se conserva como soporte de demostración y iOS no se validó en dispositivo. El APK está limitado a una arquitectura y a Android 12 o superior.

La sexta es la deuda residual. El análisis estático no reporta errores, pero sí dos advertencias: un `require` en una prueba y una constante sin uso en `usePracticeEngine`. La cobertura de rutas y hooks de carga es baja. Estas limitaciones no impiden la demostración, pero deben declararse en el reporte.

### 3.3.4 Evidencia y verificación

La verificación técnica se ejecutó sobre el estado actual del repositorio. El typecheck estricto terminó sin errores. La suite completa pasó con 42 archivos de prueba y 257 pruebas. ESLint reportó cero errores y dos advertencias. La cobertura sobre `src/**` fue de 68.27 % de sentencias, 60.63 % de ramas y 67.96 % de líneas. El build de demostración se completó con EAS, con `versionCode` 3 y un APK de aproximadamente 33.2 MB.

[INSERTAR CAPTURA: salida de `npx tsc --noEmit` sin errores.]
[INSERTAR CAPTURA: salida de `npm test -- --runInBand` con 42 suites y 257 pruebas.]
[INSERTAR CAPTURA: salida de `npm run lint` con 0 errores y 2 advertencias.]
[INSERTAR CAPTURA: página del build de EAS o del artefacto APK.]
[INSERTAR CAPTURA: APK instalado en el dispositivo, con la versión y el tamaño.]

Para respaldar la afirmación de funcionamiento offline se recomienda una prueba explícita: activar el modo avión, reiniciar la aplicación y recorrer una lección, una práctica y una evaluación. Esa prueba no está registrada en el repositorio y debe realizarse antes de la entrega.

[INSERTAR CAPTURA: aplicación en modo avión, con una actividad completada y el progreso conservado tras reiniciar.]

### 3.3.5 Evidencia por reunir

La lista siguiente reúne toda la evidencia que debe recopilarse para sostener el capítulo. Los marcadores de captura ya están distribuidos en el texto; esta lista sirve como control de recolección.

1. Captura de login y registro, incluidos los mensajes de validación.
2. Captura de la pestaña Módulos con unidades, avance y bloque de continuación.
3. Captura del hub temático con los cuatro destinos.
4. Captura de una lección con párrafos, lista, tabla y muestra de código.
5. Captura de un ejemplo guiado en variante A y en variante B.
6. Captura de una práctica con retroalimentación correcta e incorrecta.
7. Captura del resumen de práctica con aciertos por tipo y por tema.
8. Captura de una evaluación en curso, con al menos un reactivo de opción múltiple y uno interactivo.
9. Captura del resumen de evaluación con puntaje y recomendación.
10. Captura del historial de evaluaciones.
11. Captura del perfil con modo oscuro, texto ampliado y reinicio de progreso.
12. Captura del cuestionario CHAEA y del estilo predominante calculado.
13. Captura de exportación e importación del respaldo de progreso.
14. Captura de la confirmación de salida al intentar abandonar una práctica o evaluación.
15. Captura del APK instalado, con la versión y el tamaño visibles.
16. Captura de la aplicación en modo avión, con progreso conservado tras reiniciar.
17. Captura de las salidas de `tsc`, `jest` y `lint`.
18. Captura de la página del build de EAS y del artefacto descargado.
19. Diagrama de componentes (figura 3.1) y diagrama entidad-relación (figura 3.2), actualizados al estado actual.
20. Diagrama de secuencia «responder un ejercicio» (figura 3.3) y mapa de navegación (figura 3.4).
21. [CONFIRMAR: objetivos específicos del capítulo 1 para cerrar la tabla 3.3.1.]
22. [CONFIRMAR: si el reporte exige ficha LOM y empaquetado SCORM; el código actual no los implementa.]
23. [CONFIRMAR: si se realizó alguna prueba con usuarios o validación en iOS; no hay registro en el repositorio.]
24. [CONFIRMAR: autoría y derechos del contenido textual y de los bancos de ejercicios y preguntas.]
