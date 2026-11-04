# Capítulo 3. Desarrollo

Este capítulo describe el procedimiento seguido para construir el objeto de aprendizaje móvil (OAM) de Introducción a la Ingeniería de Software. Las actividades se organizan mediante las cinco fases de MOAM: análisis, diseño, desarrollo, evaluación orientada al producto y publicación (Saldaña Hernández et al., 2018). Esta organización relaciona las decisiones pedagógicas con la arquitectura y la implementación del recurso.

MOAM se utiliza como marco para ordenar y contrastar el proceso documentado. La implementación técnica se realizó de forma iterativa y algunas actividades se superpusieron. Por ello, la correspondencia con las fases no supone que todos sus pasos se ejecutaran de manera secuencial ni que todos sus entregables estén terminados. Se distinguen las actividades documentadas, las previstas en el plan de trabajo y aquellas cuya realización requiere evidencia adicional.

La reconstrucción del trabajo parte del borrador técnico, la documentación del proyecto, las plantillas de contenido y el plan de trabajo de agosto a noviembre de 2026. Las características del producto obtenido, las métricas finales, el cumplimiento de objetivos y las capturas de funcionamiento se presentan en el capítulo 4.

## 3.1 Fase 1. Análisis

### 3.1.1 Definición de la audiencia objetivo

El recurso se planteó para estudiantes de tercer año de licenciatura y primer año de maestría vinculados con ingeniería de software. La justificación del proyecto considera que estos estudiantes cuentan con conocimientos previos y requieren oportunidades de repaso fuera del aula. El acceso desde un teléfono y la consulta con conectividad limitada orientaron la definición de los requisitos.

El primer paso de MOAM propone caracterizar a la audiencia, incluidos su nivel educativo y estilo de aprendizaje. El plan de trabajo contempla un perfil del estudiante y la aplicación de CHAEA. La aplicación incorpora un cuestionario abreviado de ocho ítems que registra una preferencia dominante; su implementación no demuestra que se haya realizado un diagnóstico con la población objetivo ni que esa adaptación del instrumento cuente con validación. La caracterización de participantes debe sustentarse con los registros correspondientes.

[CONFIRMAR: grupo destinatario efectivo, número de estudiantes, institución receptora, conocimientos previos, dispositivos disponibles y evidencia del diagnóstico inicial. Resolver la discrepancia entre Instituto Tecnológico de Tehuacán y Cinvestav presente en el borrador general.]

### 3.1.2 Establecimiento de metas de aprendizaje

La selección temática se centró en la introducción a la ingeniería de software, el desarrollo profesional, la ética y los estudios de caso. Las metas educativas deben relacionar estos contenidos con lo que el estudiante podrá reconocer, explicar o aplicar después de utilizar el recurso. Se distinguen de los objetivos del proyecto, que se refieren al diseño, la construcción y la evaluación del OAM.

El plan de trabajo prevé una matriz de objetivos, competencias e indicadores. Las plantillas disponibles permiten identificar el dominio temático, pero no sustituyen una matriz de resultados de aprendizaje medibles. Para mantener la trazabilidad, cada meta deberá vincularse con una lección, un ejemplo, una actividad y un criterio de evaluación.

[INCORPORAR EVIDENCIA: matriz de metas de aprendizaje, competencias disciplinares e indicadores, validada por el responsable académico. No declarar su aplicación mientras solo se disponga del entregable planeado.]

### 3.1.3 Selección y adquisición del contenido educativo

El contenido se organizó en los cuatro componentes propuestos por MOAM: lecciones, ejemplos, ejercicios y evaluación. Las plantillas de ingeniería de software describen los temas, situaciones problemáticas, soluciones y representaciones de actividad. Incluyen niveles de complejidad fundamental, intermedio y avanzado para orientar la progresión de las tareas.

Las lecciones abordan conceptos introductorios, desarrollo profesional, ética y casos. Los ejemplos relacionan estas nociones con problemas como la ausencia de un proceso de desarrollo, el reporte de fallos y la privacidad. Los ejercicios utilizan operaciones de completar, ordenar, asociar y resolver crucigramas. Durante la implementación, las plantillas se transformaron en bancos estructurados con identificadores estables y respuestas verificables.

La selección de formatos prevista en las plantillas incluye texto, audio, imagen, video y animación. Esa previsión no debe confundirse con los formatos efectivamente incorporados al producto. El alcance implementado se describe en el capítulo 4, junto con las evidencias del contenido disponible.

[CONFIRMAR: fuentes concretas del contenido, edición y capítulos del libro utilizado, revisión académica y permisos o licencias de los materiales. Incorporar también la plantilla del banco de evaluación, que no aparece como tabla independiente en las plantillas 5 a 7 disponibles.]

### 3.1.4 Descripción de los metadatos

El paso 4 de MOAM propone describir el objeto mediante IEEE LOM para facilitar su identificación y recuperación. El cronograma contempla una ficha con categorías generales, técnicas y educativas, entre otras. En el borrador técnico no se documenta una ficha LOM terminada ni un generador de metadatos implementado.

La descripción de metadatos se mantiene, por tanto, como una actividad prevista que requiere su propio entregable. Una ficha externa al programa podría documentar el objeto sin que exista un módulo de metadatos en tiempo de ejecución, pero su existencia y contenido deberán verificarse antes de reportar este paso como concluido.

## 3.2 Fase 2. Diseño

### 3.2.1 Diseño y organización del contenido académico

Los pasos 5 y 6 de MOAM se relacionan con la transformación del contenido en una estructura consultable desde un teléfono. Se definió una jerarquía de unidades, lecciones y actividades, y un recorrido que conecta lectura, ejemplo guiado, práctica y evaluación. Esta separación permite distinguir la consulta de información, la demostración, la ejercitación con retroalimentación y la comprobación del desempeño.

La navegación se diseñó con tres áreas persistentes: Módulos, Evaluaciones y Perfil. Desde Módulos se accede a un tema y a sus componentes; la lección introductoria 1.1 se trató como lectura directa. Se incorporaron rutas de retorno y la recuperación de la última ubicación para apoyar la continuidad cuando el estudiante interrumpe la sesión.

[INSERTAR FIGURA: mapa de navegación actualizado, elaborado a partir de docs/arquitectura/mapa-navegacion.html. Verificar que represente el flujo actual.]

### 3.2.2 Diseño de la interfaz

El diseño de la interfaz atendió la lectura y la interacción en pantallas pequeñas. Se utilizaron componentes compartidos para conservar la consistencia entre pantallas y se incorporaron estados de carga, mensajes de error, confirmaciones de salida, modo oscuro y texto ampliado. Estas decisiones se relacionan con el paso 7 de MOAM, que contempla tanto la apariencia como el comportamiento de la interfaz.

La distribución del contenido buscó reducir pasos de navegación: los ejemplos se recorren en secuencia y la práctica se presenta como una sesión. Las decisiones se ajustaron durante el desarrollo a partir de problemas identificados en formularios, actividades y navegación. Su presencia no sustituye una evaluación formal de usabilidad.

### 3.2.3 Prototipo y verificación de requisitos

Los pasos 8 y 9 de MOAM contemplan un prototipo y su contraste con los requisitos. El plan de trabajo prevé un prototipo navegable de alta fidelidad y un catálogo de pantallas validado. Los materiales revisados no permiten establecer qué versión del prototipo se utilizó, con quién se verificó ni qué observaciones produjo.

[INCORPORAR EVIDENCIA: archivo o enlace del prototipo, fecha, catálogo de pantallas y registro de verificación. Las capturas del producto terminado deben ubicarse en el capítulo 4 y no presentarse como evidencia de un prototipo previo.]

### 3.2.4 Diseño de la arquitectura y de los datos

La arquitectura de referencia MLO-AR se adaptó al desarrollo con React Native y a un alcance sin realidad aumentada. Se eligió una organización MVVM mediante hooks y repositorios para separar la presentación, el estado y la persistencia. La operación local orientó el diseño de SQLite como fuente de datos del dispositivo; posteriormente se añadió la recepción opcional de contenido publicado por un servicio externo.

Los párrafos siguientes describen cómo esas decisiones se materializaron en la arquitectura documentada. El diagrama de capas y el modelo entidad-relación deben acompañar esta explicación para hacer visible la relación entre componentes.

La arquitectura sigue el patrón MVVM adaptado a React. La vista es un componente de pantalla; el ViewModel es un hook que encapsula estado, efectos y llamadas al repositorio; el modelo son las entidades y los repositorios; la persistencia es `expo-sqlite`. La regla de dependencias es unidireccional: Vista → ViewModel → Modelo → servicios compartidos. Las rutas de `src/app` son deliberadamente delgadas: reexportan una vista o montan un layout, de modo que la lógica no vive en el árbol de rutas. Desde la etapa 7, los ViewModels no importan `expo-sqlite`: reciben los repositorios por `useRepositories()` desde `shared/services/data/DataProvider`, y una regla de ESLint (`no-restricted-imports`) impide la dependencia directa.

El código se organiza por *features*. Cada carpeta de `src/features` —`auth`, `classes`, `profile`, `modules`, `examples`, `exercises` y `evaluations`— contiene `model`, `viewmodel` y `view`, además de sus pruebas. La carpeta `src/shared` concentra componentes reutilizables, hooks, tema, utilidades, tipos y servicios de base de datos, contenido, datos y HTTP. Esta separación permite que una feature consuma el ViewModel o el Modelo de otra, pero nunca su Vista. La estructura completa se documenta en `AGENTS.md` y se refleja en los 191 archivos TypeScript del directorio `src`.

La capa de persistencia utiliza una base SQLite local llamada `mlo.db`, con modo WAL y claves foráneas activas por conexión. El esquema tiene 20 tablas y 14 índices, y su versión actual es 17 (`DATABASE_VERSION = 17`). Las tablas núcleo son `units`, `lessons`, `examples`, `exercises`, `evaluations` y `questions`. `units` y `lessons` incorporan `catalog_id` y `archived_at`; `evaluations` incorpora `archived_at`, `question_count` y `exercise_count`, lo que permite separar cursos, retirar contenido sin perder progreso y configurar el tamaño de una evaluación. Las tablas de soporte son `accounts` y `auth_session` para la sesión local, incluyendo `external_key` como identidad estable; `attempts` como bitácora de intentos de práctica y evaluación, con `score_correct` y `score_total` para el puntaje parcial; `evaluation_results` para el puntaje acumulado; `learner_profile` para estilo y accesibilidad; `module_progress` para el avance por lección; `last_location` para reanudar la sesión; `example_state` para conservar el sorteo y el índice del ejemplo en curso; `meta` para hashes de contenido; `class_cache` para releases de clase; `class_extras_cache` para bloques, ejemplos y ejercicios extra; `account_classes` para las membresías locales; y `remote_catalogs`/`remote_lessons` como área de espera del contenido publicado.

La separación entre ejercicios y evaluación se conserva en tablas, motores y rutas. La bitácora `attempts` es compartida y distingue el origen con la columna `source`; esa decisión habilita la analítica unificada. La evaluación reutiliza el componente de actividad para presentar preguntas y ejercicios, pero mantiene su propio motor de calificación y su propio registro de resultados.

La inicialización de la base ocurre en `migrateAndSeed`, invocado por `SQLiteProvider`. En una instalación nueva se crea el esquema completo y se siembra el contenido; en una instalación existente se aplican migraciones incrementales desde la versión registrada en `PRAGMA user_version`. La migración v17 añade la identidad externa UUID de las cuentas y reemplaza el modelo anterior de un grupo por cuenta por membresías múltiples en `account_classes`, con una caché global de clases y sus extras. El contenido base permanece asociado al catálogo `base`; las clases agregan contenido extra sin cambiar de catálogo. El contenido se siembra desde archivos TypeScript: `seed.ts` define unidades y lecciones; `unit1.content.ts` contiene ejemplos, ejercicios y evaluaciones; `lesson1.2.bank.ts` aporta 26 ejercicios y `lesson1.2.questions.ts` aporta 33 preguntas con identificadores estables. En total se siembran 5 unidades, 25 lecciones, 44 ejercicios, 76 preguntas y 35 ejemplos guiados.

La siembra de contenido usa *upsert* (`ON CONFLICT DO UPDATE`), de modo que una instalación existente recibe los textos corregidos sin cambiar de versión de esquema. Después del *upsert* se eliminan los ejercicios, ejemplos y preguntas huérfanos de las lecciones gestionadas, sin tocar `attempts`. Un hash FNV-1a del contenido empaquetado se guarda en la tabla `meta`; en cada arranque se compara y, solo si cambió, se re-sincroniza el contenido en una transacción. Las migraciones aplican el contenido y el cambio de `user_version` dentro del mismo paso atómico.

El flujo de datos típico comienza en la pantalla, que invoca un hook; el hook consulta uno o varios repositorios; el repositorio ejecuta SQL sobre `expo-sqlite` y devuelve entidades; el hook transforma el resultado en estado y la vista lo renderiza. Al responder una actividad, el hook calcula el resultado, lo registra en `attempts` y actualiza el resumen; el avance de la lección se persiste en `module_progress`. En el modo por defecto, ninguna de estas etapas usa la red. En `hybrid`, solo la sincronización de contenido publicado consulta el servicio antes de que la vista consuma los datos.

La capa de datos expone puertos por feature. `createRepositories(db)` liga las funciones de los 12 repositorios a un objeto inyectable y `useRepositories()` lo entrega a los ViewModels; así un adaptador remoto puede sustituir al acceso SQLite sin tocar las pantallas. La validación de entrada vive en `shared/utils/validate.ts` y `shared/services/content/remote/validateLessonPayload.ts`, donde además se comprueban ids, relaciones entre unidad, lección y evaluación, reglas específicas de cada tipo de ejercicio y ausencia de colisiones entre cursos.

La navegación se organiza en un `Stack` raíz con dos zonas protegidas: `(app)` cuando existe sesión y `login`/`register` cuando no la hay. Dentro de `(app)` se monta un `Tabs` con tres grupos: `(modules)`, `(evaluations)` y `(profile)`. Las rutas de contenido viven bajo `(modules)`: `tema/[id]`, `lecciones/[id]`, `ejemplos`, `ejercicios` y `evaluacion`. La pestaña Evaluaciones incluye el catálogo y el historial, y reutiliza el mismo flujo de evaluación. La ubicación se persiste en `last_location` y se traduce a una ruta con `hrefForLocation`, lo que permite reanudar la lección, el ejemplo, la práctica o la evaluación.

La compilación y distribución se resolvieron con EAS Build. El perfil `preview` produce un APK instalable; el perfil `production`, un App Bundle. La configuración de `app.json` fija `versionCode` 4, `minSdkVersion` 31, una sola arquitectura (`arm64-v8a`), R8 y reducción de recursos. La aplicación se identificó con el paquete `com.mlo.ingenieriasoftware`.

[INSERTAR FIGURA: diagrama de componentes y capas actualizado.]
[INSERTAR FIGURA: modelo entidad-relación actualizado y legible; trasladar a anexos si requiere una página completa.]
[INSERTAR FIGURA: secuencia de respuesta a un ejercicio y persistencia del intento.]

## 3.3 Fase 3. Desarrollo

### 3.3.1 Construcción de los componentes del objeto

El paso 10 de MOAM comprende la construcción del recurso. En este proyecto se implementaron la persistencia local, la autenticación por cuenta, las pantallas de contenido, los motores de ejemplos y ejercicios, la evaluación y el seguimiento del progreso. Los bancos se cargaron desde archivos estructurados hacia SQLite, conservando la separación entre práctica con retroalimentación inmediata y evaluación con calificación final.

La implementación se organizó mediante especificaciones, planes y decisiones del repositorio. Los cambios se integraron por incrementos y se revisaron con análisis estático, comprobación de tipos y pruebas automatizadas. Las migraciones y las validaciones de contenido acompañaron los cambios que podían afectar la integridad de los datos.

### 3.3.2 Pruebas de validación durante la construcción

El paso 11 verifica la presentación y navegación del recurso implementado. El procedimiento técnico utilizó `npx tsc --noEmit`, `npm run lint` y `npm test -- --runInBand`. En la migración del entorno se añadieron comprobaciones con `expo-doctor`, exportaciones para Android y web, generación del proyecto nativo y arranque de Metro. El borrador también registra una instalación del APK y una comprobación manual del modo híbrido contra el panel desplegado.

Estas verificaciones atienden errores de implementación y regresiones. Sus resultados consolidados y los límites de la evidencia se presentan en el capítulo 4. No equivalen a la evaluación tecnológica, pedagógica y de usabilidad prevista en la fase 4 de MOAM.

### 3.3.3 Secuencia de implementación y corrección

La bitácora siguiente conserva las diez etapas técnicas del borrador y las sitúa dentro de la construcción iterativa. Sus fechas reconstruyen el proceso documentado; no reemplazan las fechas del cronograma previsto ni acreditan por sí mismas el cumplimiento de todas las fases de MOAM. Las cifras intermedias de pruebas y compilación se conservan como antecedentes del proceso; el corte final se concentra en el capítulo 4.

#### 3.3.3.1 Etapa 1: cimientos y núcleo offline (13–29 de septiembre)

La primera etapa construyó el esqueleto de la aplicación y el núcleo funcional. Se partió de un proyecto Expo SDK 57 con Expo Router y se eliminó el contenido de demostración. Se añadieron `expo-sqlite`, `react-native-svg`, Jest, `jest-expo`, `@testing-library/react-native` y ESLint. En paralelo se definieron las entidades, el esquema, los repositorios y los primeros ViewModels.

La decisión estructural más importante fue adoptar MVVM con hooks en lugar de reproducir clases ViewModel. Se argumentó que los hooks son la forma idiomática de React, permiten separar estado y efectos y son testeables sin emulador. Otra decisión fue almacenar el contenido en SQLite en lugar de dejarlo en archivos consumidos directamente por las vistas: así el contenido se versiona con migraciones y puede actualizarse sin recompilar la interfaz. Se conservó la separación entre `exercises` y `evaluations` porque la retroalimentación es distinta —inmediata por reactivo en la práctica, acumulada al final en la evaluación—.

En esta etapa se incorporó autenticación local con `accounts` y `auth_session`, se asociaron perfil, progreso y resultados a la cuenta y se estableció que todo indicador iniciara en cero. También se construyó la navegación de tres toques: home con unidades expandibles, hub de mosaicos para las lecciones y acceso directo a la lectura de 1.1. El contenido de la Unidad 1 se migró a bloques ricos y se añadieron los primeros ejercicios de ordenar, completar y relacionar.

Los problemas aparecieron por el crecimiento del esquema y del contenido. Cada nueva capacidad —contenido rico, configuración de ejercicios, tipos de pregunta y banco de la lección 1.2— exigió una migración aditiva y una relectura del contenido sembrado. La solución fue versionar el esquema con `PRAGMA user_version`, aplicar migraciones por pasos y re-sembrar el contenido de la Unidad 1 sin borrar cuentas. El esquema llegó a la versión 5 en esta etapa y `attempts` quedó como bitácora real; la tabla `results`, que aún existía, se retiró más tarde por estar inerte.

#### 3.3.3.2 Etapa 2: navegación y flujo pedagógico (29 de septiembre–7 de octubre)

La segunda etapa convirtió un conjunto de pantallas en un recorrido continuo. Se mantuvo la barra principal dentro de las pantallas de contenido, se agruparon las rutas en `(modules)`, `(evaluations)` y `(profile)` y se hicieron persistentes las pestañas. Se añadió la persistencia de la última ubicación y el bloque «Continuar donde lo dejaste». Se bloquearon las actividades aún no disponibles y se definió que, al terminar una lección, un ejemplo, una práctica o una evaluación, el estudiante pudiera volver al hub del tema o al inicio.

La decisión de fondo fue tratar la navegación como estado persistente y no como una secuencia de pantallas. `last_location` guarda unidad, lección, código y sección; `hrefForLocation` traduce ese estado a una ruta. Así, una interrupción del sistema operativo no obliga a reiniciar el recorrido. Otra decisión fue eliminar los menús intermedios: los ejemplos se recorren en secuencia y las prácticas se resuelven como sesión, lo que reduce toques y evita la dispersión.

El trabajo se ejecutó con un plan dividido en tareas —helper de rutas, reestructura de rutas, tabs persistentes y salidas de actividades— y cada tarea se sometió a revisión. Esa forma de trabajo detectó problemas que no aparecían en la ejecución manual: rutas que no resolvían el contexto y botones «Terminar» y «Tema» sin efecto. La resolución combinó pruebas de navegación, pruebas de componentes y una revisión final del cambio completo. El resultado se consolidó en los commits `cca1a28` y `a2a7944`.

#### 3.3.3.3 Etapa 3: contenido y evaluación a escala (28 de septiembre–15 de octubre)

La tercera etapa amplió el contenido y convirtió la evaluación en un proceso reproducible. Se definió un formato de banco de ejercicios y preguntas, se fusionaron tres fuentes de ejercicios para la lección 1.2 y se podó el resultado. Se añadieron 26 ejercicios y 33 preguntas a la lección 1.2, se documentaron los crucigramas y se creó una plantilla para seguir creciendo el banco.

La decisión técnica fue sembrar el banco desde TypeScript hacia SQLite y usar identificadores estables. La práctica y los ejemplos sortean hasta diez elementos del banco; la garantía de que un mismo reactivo no aparezca en ambas pantallas se consolidó en la etapa 6 con un sorteo único. La evaluación se separó en un *pool* de preguntas y otro de ejercicios: se eligen diez y cinco respectivamente, se mezclan y se barajan las opciones de las preguntas de opción múltiple. La calificación de la práctica se calcula sobre la sesión sorteada, no sobre el total del banco, y cada reactivo pesa lo mismo; cuando la actividad tiene varios componentes internos se otorga puntaje parcial. La analítica agregada por tipo y por tema produce una recomendación de repaso.

Los problemas fueron de dos tipos. Por un lado, la calidad del contenido: preguntas que no se mostraban, opciones cuya posición correcta era memorizable, crucigramas con una rejilla que no cabía en pantalla, ejercicios repetidos entre práctica y evaluación y diferencias entre web y móvil al marcar una respuesta. Por otro, la consistencia del banco: duplicados entre archivos y preguntas que no correspondían al tema. La solución fue barajar opciones y reajustar el índice correcto, sortear sin repetición, separar los *pools*, igualar el comportamiento de marcación entre plataformas y escribir pruebas para la lógica de sorteo y calificación.

#### 3.3.3.4 Etapa 4: estabilización y refactor (8–15 de octubre)

La cuarta etapa no añadió funcionalidades visibles: corrigió la base sobre la que se apoyan. Una auditoría interna identificó problemas de integridad de datos —el reinicio de progreso no borraba intentos ni ubicación—, un efecto secundario dentro de un actualizador de estado que podía duplicar intentos, migraciones no atómicas y un hash de contraseña que no era una función de derivación. Se corrigieron los tres primeros problemas y se sustituyó el hash por PBKDF2-HMAC-SHA256 con 100 000 iteraciones, con rehash transparente de las cuentas antiguas al iniciar sesión.

La decisión metodológica fue priorizar la integridad sobre las funciones nuevas. Se estableció una secuencia: primero datos, después robustez, luego decisiones de alcance, después limpieza y al final contenido y validación. Esa secuencia evitó que un fallo de persistencia se mezclara con un cambio de interfaz. También se decidió retirar la tabla `results` y el código muerto asociado, porque nadie la leía ni escribía en tiempo de ejecución; la bitácora real es `attempts`.

El refactor más grande fue la reorganización a MVVM por features. Se movieron pantallas, hooks y repositorios a `src/features/<feature>`, se dejó `src/shared` para lo común y se adelgazaron las rutas. El cambio tocó más de 130 archivos y obligó a actualizar pruebas, rutas y documentación. Se complementó con una limpieza de la plantilla Expo, la reorganización de `docs/` y la actualización de `AGENTS.md`, `README.md` y del índice de documentación. Al cierre de la etapa, la suite tenía 34 archivos de prueba y 208 pruebas, y la cobertura reportada era de 83.75 % de sentencias; esa cifra no es comparable con la medición actual porque el conjunto de archivos medidos cambió.

En esta etapa también se añadieron la exportación e importación del progreso y la mejora de los formularios de acceso. El respaldo se definió como un JSON versionado con progreso por lección, intentos y resultados de evaluación, validado antes de importarse. La personalización se completó con un cuestionario CHAEA abreviado de ocho ítems, que calcula y persiste el estilo dominante; se documentó que la adaptación de contenido por estilo seguía pendiente y que la personalización efectiva era, y sigue siendo, por desempeño.

#### 3.3.3.5 Etapa 5: endurecimiento para la demo (21–22 de octubre)

La quinta etapa preparó una demostración instalable. Se añadió la sección «Fuente» en la portada, se extendió la confirmación de salida a las pestañas de Ejercicios y Evaluación, se ajustó la calificación de la práctica a diez ejercicios y se corrigió el motor de evaluación. Además, se exportaron los diagramas a SVG.

El problema más costoso apareció en el build. El primer arranque fallaba porque `seedDatabase` abría una transacción y, dentro, el banco de preguntas abría otra; SQLite no permite transacciones anidadas y el seed se revertía. Como la versión ya se había marcado como 14, los arranques posteriores omitían la siembra y dejaban el catálogo vacío. La solución fue sembrar en una sola transacción, escribir `user_version` solo al final y añadir una auto-reparación: si la base está marcada como versión 14 pero no tiene unidades ni lecciones, se vuelve a sembrar sin borrar cuenta ni progreso.

El segundo problema fue el tiempo de acceso. La derivación PBKDF2 en JavaScript puro tardaba alrededor de cuarenta segundos en el teléfono. Se sustituyó por `react-native-quick-crypto` —PBKDF2 nativo sobre OpenSSL— con respaldo en `@noble/hashes` para web, y se añadió una regla ProGuard para que R8 no eliminara las clases del módulo nativo. El tercer problema fue el tamaño: el APK universal pesaba 118.1 MB. Se restringió a `arm64-v8a`, se activaron R8 y la reducción de recursos y se retiraron dependencias directas sin uso; el APK final quedó en 33.2 MB. El cuarto problema fue la percepción de carga: se añadieron indicadores de actividad, estados vacíos con reintento y una consulta resumida del catálogo para no cargar el contenido completo de cada lección en la portada.

#### 3.3.3.6 Etapa 6: corrección tras la revisión (23 de octubre)

La sexta etapa nació de una revisión externa del repositorio. El informe de revisión identificó trece problemas y el proyecto los tradujo en un plan de corrección con bloques de contenido, ejemplos, motores, guarda de salida e higiene. La revisión no se limitó a señalar defectos: fijó criterios de aceptación y pruebas para cada corrección.

El primer bloque corrigió la propagación del contenido. La siembra usaba `ON CONFLICT DO NOTHING`, de modo que las instalaciones existentes nunca recibían los textos corregidos; además, los identificadores de las preguntas del banco eran posicionales y se desalineaban al insertar o reordenar. Se sustituyó por *upsert* con actualización de todas las columnas, se añadieron identificadores explícitos a las 33 preguntas del banco, se migraron los identificadores antiguos y se re-mapeó `attempts.item_id`. Para evitar una migración por cada cambio de texto se creó la tabla `meta` con un hash del contenido empaquetado: si el hash no cambia, no se re-sincroniza nada. La migración v15 crea `meta`, renombra los identificadores y re-sincroniza el contenido en una sola transacción. También se omiten al sembrar los enunciados duplicados entre la evaluación embebida y el banco, y se añadió una deduplicación por enunciado al armar el *pool*.

El segundo bloque corrigió los ejemplos. El runner usaba una explicación genérica repetida en cada paso y pistas por tipo de actividad. Ahora `useExamplesEngine` carga la tabla `examples`, empareja cada ejercicio con su ejemplo por identificador y el runner muestra el título, los pasos y las pistas propios. Se redactaron bloques de ejemplo para los nueve ejercicios de la lección 1.2 que carecían de ellos, con lo que la base pasa a contener 35 ejemplos guiados. Al terminar la secuencia se ofrece la acción «Nuevo sorteo».

El tercer bloque corrigió el reparto de actividades. Antes, la práctica solo excluía los identificadores usados como ejemplo y el campo de ejercicios sorteados se guardaba vacío; si el estudiante abría Ejercicios antes que Ejemplos, podía recibir el mismo reactivo en ambas pantallas. Se creó un sorteo único por cuenta y lección (`ensureLessonDraw`) que reparte el pool en dos grupos disjuntos y persiste ambos. El reparto reserva la mitad del pool para ejemplos, de modo que con bancos pequeños ninguna pantalla queda vacía. El reinicio de progreso y la importación de un respaldo borran también `example_state`, y el motor de ejemplos dejó de escribir dentro de un actualizador de estado.

El cuarto bloque generalizó la guarda de salida. La implementación anterior solo cubría el botón del encabezado y la barra inferior; el botón físico de Android y el gesto de iOS escapaban del aviso. Se creó el hook `useExitGuard`, que intercepta `beforeRemove`, desactiva el gesto nativo mientras hay progreso sin guardar y registra la guarda para la barra inferior. Con ello quedan cubiertos el botón físico, el gesto, el encabezado, las pestañas y la navegación programática.

El quinto bloque corrigió los motores de actividad: el estado restaurado se consume una sola vez, deja de aplicarse al reiniciar y la mezcla de los ejercicios de ordenar no devuelve el orden correcto cuando hay al menos dos elementos distintos. El sexto bloque atendió la higiene: comparación de hashes en tiempo constante, retiro de la constante sin uso, sustitución del `require` de una prueba, movimiento de `eslint-config-expo` a dependencias de desarrollo y exclusión de artefactos generados en `.gitignore`.

Los problemas de esta etapa fueron, sobre todo, de propagación y de estado. El contenido corregido no llegaba a las bases existentes; los identificadores posicionales rompían la trazabilidad de los intentos; el reparto dependía del orden en que se abrieran las pantallas; el reinicio conservaba el sorteo anterior; y la mezcla podía coincidir con la solución. Cada corrección se acompañó de pruebas específicas: actualización de contenido desde v14, conservación de intentos, limpieza de huérfanos, migración de identificadores, ausencia de intersección en el sorteo, consumo único del estado restaurado, mezcla distinta del orden correcto y cobertura del modal de salida. Al cierre, el typecheck pasó sin errores, el análisis estático quedó sin advertencias y la suite alcanzó 45 archivos y 281 pruebas. El estado de integración de estos cambios debe cotejarse con el historial correspondiente al corte del reporte.

#### 3.3.3.7 Etapa 7: servicios opcionales y puertos de datos (23–24 de octubre)

La séptima etapa cambió el alcance de integración sin cambiar el comportamiento por defecto. El proyecto dejó de declararse «sin red ni backend» y pasó a definirse como *offline-first* con servicios opcionales. La decisión quedó registrada como C9: se consume únicamente contenido publicado por el sistema del maestro; no se sincroniza el progreso, no hay cuentas remotas ni se implementan los endpoints de sincronización o autenticación. SQLite sigue siendo la fuente de verdad local.

La primera decisión técnica fue desacoplar los ViewModels de `expo-sqlite`. Se creó `shared/services/data/DataProvider.tsx`, que construye un objeto de puertos por feature a partir de la base (`createRepositories(db)`) y lo entrega con `useRepositories()`. Todos los ViewModels que consultaban la base pasaron a consumir ese objeto, y una regla de ESLint (`no-restricted-imports`) prohíbe importar `expo-sqlite` desde `features/*/viewmodel`. La medida prepara el terreno para sustituir el adaptador local por uno remoto sin reescribir las pantallas.

La segunda fue introducir un modo de datos explícito. `DATA_MODE` se lee de `EXPO_PUBLIC_DATA_MODE` y vale `local` por defecto; solo con `hybrid` se habilita la capa HTTP. El cliente de `shared/services/http/client.ts` usa `fetch` nativo, sin dependencias nuevas, con tiempo límite de ocho segundos, dos reintentos con retroceso exponencial para errores de red y respuestas 5xx, errores tipados (`NetworkError`, `HttpError`, `ParseError`) y un gancho para el token. La URL base se configura con `EXPO_PUBLIC_API_URL`; no se almacenan secretos en el cliente.

La tercera fue definir el contenido remoto como una fuente opcional y validada. `remoteContent.ts` descarga un manifiesto con versión y hash por lección, compara el hash con el último descargado y obtiene únicamente las lecciones modificadas. Los payloads pasan por validación estructural y reglas específicas de cada tipo de actividad antes de guardarse. La escritura se hace en una transacción y el contenido local se conserva ante cualquier fallo.

La cuarta fue el endurecimiento del estado asíncrono. Se añadió `useAsyncResource` para estandarizar los estados de carga, éxito y error, se incorporó un `ErrorBoundary` en el layout raíz y se añadieron capturas de error a los motores de práctica, evaluación, ejemplos, ejercicios y respaldo. El respaldo pasó a la versión 2 e incluye el estado del sorteo y la última ubicación, manteniendo la lectura de las versiones anteriores. La migración v15 incorporó `score_correct` y `score_total` a `attempts`, de modo que el puntaje parcial de la práctica queda persistido y no solo en memoria.

La verificación de esta etapa cubrió el cliente HTTP, los validadores, el contenido remoto y el modo local: el typecheck pasó sin errores, ESLint quedó sin errores ni advertencias y la suite alcanzó 48 archivos y 297 pruebas. No se probó contra un servidor real; el contrato `docs/api/contrato.md` y los fixtures fueron la referencia. La base de esta etapa quedó registrada en `44a7df9`; las correcciones posteriores permanecen en el árbol de trabajo.

#### 3.3.3.8 Etapa 8: clases y contenido extra sobre el curso base (26–27 de octubre)

La octava etapa reemplazó el modelo anterior de grupos y cursos activos por un modelo de clases que agrega contenido al curso base. El esquema evolucionó a la versión 17 mediante una migración que añadió `accounts.external_key`, las tablas `class_cache`, `class_extras_cache` y `account_classes`, y los índices correspondientes. El catálogo `base` sigue siendo el único catálogo de lecciones; las clases no lo sustituyen, sino que publican extras asociados a sus lecciones.

La decisión técnica más importante fue separar la membresía del contenido cacheado. `account_classes` registra las clases a las que pertenece cada cuenta; `class_cache` conserva el release y sus metadatos; `class_extras_cache` almacena bloques de lección, ejemplos y ejercicios. Así, una clase puede compartirse entre alumnos y el contenido descargado no necesita duplicarse por cuenta. Los extras con el mismo `extra_id` en varias clases se agrupan y se muestran una sola vez, acompañados por las etiquetas de las clases correspondientes.

La integración se extendió a los flujos existentes. `useLessonContent` y `useLessonHub` cargan bloques y ejemplos extra; `selectPracticeExercisesByLesson` incorpora ejercicios de clase al sorteo de práctica; `selectExamplesWithExtras` los integra al flujo guiado; y la pantalla de lección muestra el contenido adicional con el nombre de la clase. La práctica conserva el mismo motor, retroalimentación y registro de intentos del contenido base.

También se sustituyó la identidad implícita de la cuenta local por un UUID estable en `external_key`. La migración v17 genera esa identidad para cuentas existentes y los registros nuevos la crean al registrarse. El respaldo evolucionó a la versión 4 e incluye el alumno y sus clases; al importarlo, el sistema puede volver a asociar la identidad restaurada con las clases y retirar la identidad temporal del dispositivo cuando existe conexión. Los respaldos v1, v2 y v3 continúan siendo compatibles.

El contenido de clase se sincroniza con `/classes/{code}`, `/classes/{code}/join`, `/classes/{code}/members/{studentKey}` y `/classes/{code}/release`. `ContentSyncProvider` actualiza primero el curso base y después las clases inscritas. Si una clase no tiene release publicado o falla la red, conserva su caché anterior. La validación del release comprueba la versión del contrato, la identidad de la clase, los ids de extras, los bloques de lectura y los tipos de ejemplo y ejercicio antes de guardar la caché.

#### 3.3.3.9 Etapa 9: migración tecnológica y cierre del contrato de clases (27 de octubre)

La novena etapa actualizó el entorno de ejecución de Expo SDK 57 a SDK 58, con React Native 0.88, React 19.3, Expo Router 58, Jest 30 y `jest-expo` 58. Se ajustaron las APIs asíncronas de `expo-file-system`, la barra de pestañas, la protección de navegación en Expo Router, los tipos estrictos de React Native y la compatibilidad de Quick Crypto con Expo Go mediante un fallback a `@noble/hashes`. Se añadió `.npmrc` para resolver el peer opcional de React Native Testing Library sin reescribir la suite existente.

En paralelo se cerró la revisión 2.2 del contrato de clases. Los códigos se normalizan a mayúsculas, la respuesta distingue preview y release, y la caché se valida contra la clase, versión y hash publicados. La documentación del proyecto se actualizó con una guía para agregar contenido, un exportador del curso base y una guía para generar un APK que consuma contenido remoto. Las clases sustituyeron completamente la nomenclatura anterior de grupos en las rutas, ViewModels, repositorios y documentación operativa.

La validación del APK y del modo híbrido se completó en la etapa 10. La prueba automatizada de ida y vuelta del curso base, la generación automática del fixture y la prueba con SQLite real o en dispositivo permanecen pendientes.

Al cierre de esta etapa y de las correcciones de compatibilidad, el typecheck pasó sin errores, ESLint quedó sin errores ni advertencias y la suite alcanzó 57 archivos y 363 pruebas. La migración se verificó con `expo-doctor`, exports locales de Android y web, `expo prebuild` y el arranque de Metro. Parte de la etapa quedó incorporada en `8ea6df9`; los arreglos posteriores permanecen en el árbol de trabajo.

#### 3.3.3.10 Etapa 10: validación del APK y del modelo híbrido (31 de octubre)

La décima etapa verificó el producto instalable y la integración con el panel de clases. Se generó el APK correspondiente a SDK 58 y se instaló en un dispositivo Android. El build conserva la configuración de una sola arquitectura, Android 12 como mínimo y R8; el `versionCode` de la aplicación es 4. [PENDIENTE DE EVIDENCIA: identificador del build y tamaño del APK; registrar en 4.3.]

La prueba funcional recorrió el flujo híbrido contra el panel desplegado: inicio de sesión, consulta de una clase, unión mediante código, descarga del release de la clase, visualización del contenido base con los bloques extra y uso de los ejercicios adicionales en la práctica. La sincronización se ejecutó en segundo plano y el arranque no dependió de la red. La prueba confirmó que el contenido de clase se integra sin sustituir el catálogo base y que el progreso local se conserva.

La validación también permitió comprobar que el APK puede operar sin conexión después de la descarga, que la caché conserva el contenido de la clase y que la aplicación no requiere una actualización para recibir el release publicado. El modo local sigue siendo el comportamiento por defecto; la compilación de validación se realizó con el perfil `preview` configurado en modo híbrido.

Además del build, se consolidó el criterio de finalización de un tema. El avance dejó de basarse únicamente en haber abierto la lección: ahora exige lectura terminada, todos los ejemplos del sorteo vistos, al menos 80 % en la práctica y al menos 80 % en la evaluación cuando existe. La lógica vive en `completion.logic.ts`; `selectCompletionMap` combina progreso, estado de ejemplos, intentos, extras de clase y calificaciones. Módulos, hub temático y Perfil consumen ese mapa, y la evaluación dejó de marcar por sí sola la lección como completada.

También se unificó la confirmación de acciones destructivas o de salida en `ConfirmModal`, reutilizado por práctica, evaluación y Perfil. En los ejercicios de ordenar se ajustó la asignación de colores, se mantuvo visible el control de arrastre y se mostró retroalimentación también en los ejemplos. Los ejemplos independientes se integraron al flujo guiado mediante `syntheticExamples`, sin duplicar los que ya existen como ejercicio.

Con esta etapa se cierra la verificación funcional pendiente del capítulo. Permanecen como límites la ausencia de una prueba automatizada de ida y vuelta entre el panel y el cliente, el fixture manual y la falta de una prueba de integración con SQLite real. La suite completa quedó en 59 archivos y 383 pruebas; el typecheck y ESLint continuaron sin errores.   

## 3.4 Fase 4. Evaluación orientada al producto

### 3.4.1 Evaluación de aspectos tecnológicos y pedagógicos

El paso 12 de MOAM propone evaluar tanto el funcionamiento tecnológico como la pertinencia educativa del objeto. El plan de trabajo sitúa esta actividad entre el 16 y el 20 de noviembre de 2026 e incluye una matriz de calidad. Al corte del borrador técnico, no se dispone de instrumentos aplicados ni resultados de evaluación con estudiantes o especialistas.

Para documentar su ejecución se requiere identificar el instrumento y su fuente, los criterios evaluados, los participantes, las condiciones de aplicación y la forma de análisis. Las pruebas de software descritas en la fase 3 aportan evidencia técnica, pero no demuestran por sí mismas la pertinencia del contenido ni la mejora del aprendizaje.

[PENDIENTE: incorporar el procedimiento efectivamente aplicado cuando existan instrumentos y registros. Si la actividad no se realiza, conservar su estado pendiente y declarar la limitación en Resultados y Conclusiones.]

### 3.4.2 Evaluación de usabilidad

El paso 13 contempla la evaluación de la experiencia de uso. El cronograma prevé pruebas de usabilidad y un registro de incidencias priorizadas. Deben documentarse las tareas, el perfil de los participantes, el dispositivo, el instrumento, los criterios de valoración y las observaciones obtenidas. Una inspección por especialistas y una prueba con estudiantes requieren procedimientos y registros diferenciados.

El borrador técnico declara que no existe un estudio formal de usabilidad. Por ello, no se reportan puntuaciones, satisfacción ni beneficios educativos como resultados medidos. Cuando se realice la evaluación, su procedimiento se incorporará aquí y sus datos se presentarán en el capítulo 4.

## 3.5 Fase 5. Publicación

### 3.5.1 Preparación del paquete de distribución

El paso 14 de MOAM contempla el empaquetado del objeto para su distribución y recomienda SCORM para la interoperabilidad con sistemas de gestión del aprendizaje. En el proyecto, la distribución técnica se preparó mediante EAS Build: el perfil de demostración genera un APK y el de producción contempla un App Bundle. La exportación web se mantiene como soporte de demostración.

La generación de un APK es un entregable de distribución de la aplicación. No acredita la existencia de un paquete SCORM. El plan de trabajo contempla este último para el 23 al 27 de noviembre de 2026, mientras que el alcance técnico actual declara que no se implementa empaquetado SCORM/LOM en tiempo de ejecución. Debe comprobarse si se elaborará un paquete externo o si existe una modificación autorizada del alcance.

### 3.5.2 Almacenamiento y publicación del objeto

El paso 15 se refiere al almacenamiento y publicación del recurso. El borrador registra la generación e instalación de un APK, pero no acredita el depósito del OAM en un repositorio educativo o su integración en un LMS. El despliegue del panel de clases constituye un servicio de contenido y debe diferenciarse de la publicación institucional del objeto.

[INCORPORAR EVIDENCIA: identificador y fecha del build entregado, ubicación de distribución, versión, responsable de recepción, manual breve y, si corresponde, repositorio educativo o LMS. Registrar en el capítulo 4 el estado real de estos entregables.]

## 3.6 Correspondencia entre MOAM y las evidencias del proyecto

| Fase | Pasos | Evidencias identificadas | Evidencias por completar o confirmar |
|---|---|---|---|
| Análisis | 1 a 4 | Perfil destinatario descrito, objetivos y plantillas de contenido | Diagnóstico de audiencia, matriz de metas y competencias, revisión académica y ficha LOM |
| Diseño | 5 a 9 | Jerarquía de contenidos, navegación y documentación de arquitectura | Prototipo previo, catálogo validado y registro de verificación de requisitos |
| Desarrollo | 10 y 11 | Implementación, migraciones, pruebas y bitácora técnica | Reunir salidas y evidencias reproducibles del corte reportado |
| Evaluación | 12 y 13 | Actividades previstas en el cronograma | Instrumentos aplicados, participantes, datos y análisis |
| Publicación | 14 y 15 | Procedimiento de compilación y APK declarado en el borrador | Identificación del artefacto, entrega, manual, paquete SCORM y depósito si se mantienen como requisitos |

La organización por fases permite reconocer qué partes del procedimiento cuentan con documentación y cuáles necesitan evidencia. El capítulo siguiente presenta el producto obtenido y contrasta sus resultados con los objetivos del proyecto.

## Referencia metodológica

Saldaña Hernández, K. A., Hernández Velázquez, Y., López Domínguez, E., Excelente Toledo, C. B., & Medina Nieto, M. A. (2018). MOAM: A methodology for developing mobile learning objects (MLOs). *Computer Applications in Engineering Education, 26*(1), 17–28. https://doi.org/10.1002/cae.21857
