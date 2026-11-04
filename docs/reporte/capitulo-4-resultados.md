# Capítulo 4. Resultados

Este capítulo presenta el objeto de aprendizaje móvil obtenido, el estado de los objetivos y la verificación técnica descrita en el borrador del proyecto. Las cifras y las pruebas manuales que se conservan proceden de ese documento y deben acompañarse con sus registros antes de la entrega final. La reorganización del reporte no implica que se hayan vuelto a ejecutar las pruebas.

## 4.1 Producto desarrollado y recorrido funcional

El producto documentado es una aplicación para Introducción a la Ingeniería de Software con almacenamiento local y recepción opcional de contenido de clases. La Unidad 1 concentra el recorrido completo; las unidades 2 a 5 contienen material introductorio. Android cuenta con un APK declarado en el borrador; la validación en iOS permanece pendiente.

La aplicación se organiza en tres pestañas persistentes: Módulos, Evaluaciones y Perfil. La pestaña Módulos presenta las cinco unidades del curso con sus lecciones; cada unidad se expande y muestra el avance. Al elegir una lección distinta de la 1.1 se abre un *hub* temático con cuatro destinos —lección, ejemplos, ejercicios y evaluación—, mientras que la 1.1 abre directamente la lectura porque se definió como contenido de solo lectura. La portada incluye un bloque de continuación que recupera la última ubicación registrada por el estudiante. En modo híbrido, el Perfil permite consultar las clases inscritas, unirse a una clase mediante un código de seis caracteres y abandonar una clase; las clases agregan contenido sobre el curso base y no sustituyen su catálogo.

La lectura se presenta por bloques ricos: párrafos, listas, tablas y muestras de código. Cuando existen contenidos extra publicados por las clases del estudiante, la lección muestra bloques adicionales identificados con los nombres de las clases; si el mismo extra aparece en varias clases, se muestra una sola vez con sus etiquetas combinadas. Los ejemplos guiados se recorren en secuencia, sin un menú intermedio de selección, y ofrecen dos variantes: una resuelta paso a paso con la justificación de cada paso y otra en la que el estudiante intenta la actividad con pistas y puede revelar la solución. Cuando el ejemplo tiene guía curada —título, pasos y pistas—, el runner la usa; si no, cae en una guía derivada de la actividad. Los ejemplos independientes que no corresponden a un ejercicio del banco se integran al mismo flujo guiado. Al terminar la secuencia se puede solicitar un nuevo sorteo. La práctica plantea hasta diez ejercicios por sesión a partir de un sorteo único por cuenta y lección, integrando también los ejercicios extra de las clases y evitando duplicados. Admite cuatro tipos de actividad: ordenar pasos, completar espacios con un banco de palabras, relacionar pares y resolver un crucigrama. Cada respuesta recibe retroalimentación inmediata y, al finalizar, se muestra un resumen con aciertos por tipo y por tema.

Un tema se considera completado solo cuando el estudiante terminó la lectura, vio todos los ejemplos del sorteo —incluidos los independientes—, alcanzó al menos 80 % en la práctica y obtuvo al menos 80 % en la evaluación cuando esta existe. El cálculo se centraliza en `completion.logic.ts` y se refleja en el avance del catálogo, el hub temático y el Perfil; la evaluación por sí sola ya no marca la lección como completada.

La evaluación formal combina dos fuentes: preguntas del banco de evaluación y ejercicios interactivos. En el curso base se seleccionan diez preguntas y cinco ejercicios por sesión; el modelo permite configurar esos conteos por evaluación. Se descartan los reactivos con enunciados repetidos, se mezclan y se barajan las opciones de las preguntas de opción múltiple. Cada reactivo vale el mismo porcentaje y se califica como correcto o incorrecto; el resultado se expresa como porcentaje de aciertos. El puntaje se guarda y alimenta el historial de la pestaña Evaluaciones, que muestra la calificación y el desglose por tipo de actividad, además de una recomendación de repaso cuando el desempeño es bajo.

El Perfil permite consultar las clases inscritas, abandonar una clase, editar el estilo de aprendizaje, alternar el modo oscuro y el texto ampliado, reiniciar el progreso y exportar o importar un respaldo del avance en formato JSON. La personalización incluye un cuestionario CHAEA abreviado de ocho ítems, dos por cada estilo —activo, reflexivo, teórico y pragmático—, que calcula el estilo dominante y lo persiste. El respaldo v4 incluye la identidad externa estable del alumno, las clases inscritas, los intentos, el progreso, los resultados y la ubicación; los formatos v1, v2 y v3 siguen siendo aceptados. La navegación incorpora una guarda de salida: si el estudiante intenta abandonar una práctica o evaluación en curso mediante el botón físico de Android, el gesto de iOS, el retroceso del encabezado, la barra inferior o una navegación programática, el sistema intercepta la acción y pide confirmación.

Cuando la aplicación se configura en modo híbrido, el contenido publicado por un servicio externo puede actualizar el curso base y las clases sin modificar el flujo del estudiante. La descarga se valida antes de guardarse en cachés locales; el arranque no espera a la red y la actualización se ejecuta en segundo plano. Si falla la red o la validación, se conserva la caché anterior; el progreso y las credenciales permanecen en el dispositivo; las operaciones de clases utilizan la identidad externa del estudiante.

## 4.2 Cumplimiento de los objetivos del proyecto

La valoración siguiente utiliza los seis objetivos específicos del capítulo 1 de `reporte.docx`. Describe el estado declarado en el borrador técnico; no constituye una nueva ejecución de pruebas ni la aceptación institucional de los entregables.

| Objetivo específico | Estado al corte documentado | Evidencia y límite |
|---|---|---|
| Identificar el perfil, estilo de aprendizaje, objetivos y competencias del curso | Parcial; requiere evidencia | Población destinataria descrita y cuestionario abreviado implementado. Faltan registros del diagnóstico y matriz de competencias. |
| Seleccionar y estructurar contenido en lecciones, ejemplos, ejercicios y evaluación | Documentado para la Unidad 1 | Existen plantillas y bancos descritos; confirmar revisión académica y fuentes. Las unidades 2 a 5 conservan contenido introductorio. |
| Diseñar arquitectura de información, navegación e interfaz mediante un prototipo de alta fidelidad | Parcial; requiere evidencia del prototipo | Se documentan navegación, arquitectura e interfaz; falta acreditar el prototipo previo y su verificación. |
| Desarrollar el OAM para Android e iOS con almacenamiento local | Parcial | APK Android y SQLite declarados; no se acredita compilación y prueba en iOS. Reunir evidencia explícita de funcionamiento sin conexión. |
| Evaluar calidad tecnológica, pedagógica y usabilidad mediante instrumentos validados con estudiantes | Pendiente | Las pruebas técnicas no sustituyen instrumentos aplicados ni datos de participantes. |
| Empaquetar conforme a estándares y generar los entregables del plan | Parcial | APK declarado; faltan evidencia del paquete SCORM, ficha LOM, manual y entrega o modificación autorizada del alcance. |

## 4.3 Verificación técnica y artefacto de distribución

El borrador técnico registra la siguiente verificación del corte del 31 de octubre de 2026; sus salidas deben adjuntarse antes de la entrega. El typecheck estricto terminó sin errores. La suite completa pasó con 59 suites y 383 pruebas. ESLint reportó cero errores y cero advertencias. La cobertura no se ha vuelto a medir después de la migración a SDK 58; la última medición disponible sobre `src/**` fue de 69.70 % de sentencias, 63.86 % de ramas y 69.32 % de líneas. La migración se verificó con `expo-doctor` (20/20 comprobaciones), exports locales de Android y web, `expo prebuild` y Metro. El APK de SDK 58 (`versionCode` 4) se generó, se instaló en un dispositivo y se probó contra el panel desplegado; la prueba del modo híbrido funcionó. [INSERTAR DATO: tamaño final del APK y número de build de EAS.]

[INSERTAR CAPTURA: salida de `npx tsc --noEmit` sin errores.]
[INSERTAR CAPTURA: salida de `npm test -- --runInBand` con 59 suites y 383 pruebas.]
[INSERTAR CAPTURA: salida de `npm run lint` sin errores ni advertencias.]
[INSERTAR CAPTURA: página del build de EAS o del artefacto APK.]
[INSERTAR CAPTURA: APK instalado en el dispositivo, con la versión y el tamaño.]
[INSERTAR CAPTURA: Perfil con una clase inscrita y contenido extra visible en una lección.]

Para respaldar la afirmación de funcionamiento offline se recomienda una prueba explícita: activar el modo avión, reiniciar la aplicación y recorrer una lección, una práctica y una evaluación. La prueba debe ejecutarse con `DATA_MODE` sin configurar (valor local). Esa prueba no está registrada en el repositorio y debe realizarse antes de la entrega.

[INSERTAR CAPTURA: aplicación en modo avión, con una actividad completada y el progreso conservado tras reiniciar.]
[INSERTAR CAPTURA: ejecución con `DATA_MODE='hybrid'` y servidor simulado, mostrando que el contenido se actualiza en segundo plano; y el mismo arranque sin red, mostrando que se conserva el contenido local.]

## 4.4 Funciones completas, parciales y pendientes

Quedaron completas las funciones que sostienen el recorrido pedagógico: autenticación local, catálogo con avance, lectura por bloques ricos, ejemplos guiados en dos variantes con contenido curado, práctica con cuatro tipos de actividad y retroalimentación inmediata, evaluación con quince reactivos y puntaje, historial, analítica, perfil, respaldo de progreso, membresías de clase, contenido extra deduplicado, finalización de temas por criterios y guarda de salida en todos los caminos de navegación. También quedó completa la infraestructura técnica: esquema versionado hasta v17, migraciones atómicas, contenido re-sincronizable por hash, caché de clases, sorteo conjunto sin intersección, archivado de contenido retirado, identidad estable de cuentas, pruebas automatizadas, análisis estático y build local de Android/web. La base para servicios quedó preparada con puertos inyectables, cliente HTTP con errores tipados, validación en la frontera, cachés remotas y conservación del contenido local ante fallos.

Quedaron parciales la personalización por estilo, la accesibilidad, la cobertura de pruebas de algunas capas y la automatización de la integración. El cuestionario CHAEA calcula y guarda el estilo dominante, pero el contenido no se reordena ni se filtra según ese estilo; la adaptación efectiva es por desempeño. La accesibilidad cuenta con modo oscuro, texto ampliado y etiquetas, pero no con una auditoría formal. El modo híbrido, las clases, la validación y las cachés están implementados y se validaron manualmente con el APK de SDK 58 contra el panel desplegado; queda pendiente convertir esa prueba en un proceso automatizado y generar el fixture desde el esquema del panel. La cobertura actual no se ha vuelto a medir después de la migración a SDK 58; la última medición disponible es de 69.70 % de sentencias, 63.86 % de ramas y 69.32 % de líneas sobre `src/**`.

Quedaron pendientes el contenido completo de las unidades 2 a 5, los metadatos LOM, el empaquetado SCORM, la prueba automatizada de ida y vuelta con el panel, la validación en iOS, la prueba en dispositivos de 32 bits y la evaluación formal de usabilidad. Las unidades 2–5 existen en el catálogo con lecciones introductorias, pero no tienen ejercicios ni evaluaciones. El APK se restringió a `arm64-v8a`, por lo que no se instala en equipos de 32 bits ni en emuladores x86_64 sin una configuración adicional.

## 4.5 Limitaciones del producto y de su validación

La primera limitación es de alcance del contenido. El sistema demuestra el modelo completo en la Unidad 1, pero no cubre las cinco unidades con la misma profundidad. Cualquier afirmación sobre la eficacia del OAM en el curso completo debe formularse como expectativa, no como resultado medido.

La segunda es la personalización. El estilo de aprendizaje se identifica con una versión abreviada de ocho ítems y se almacena, pero no modifica la secuencia ni el tipo de contenido. La recomendación de repaso se basa en el desempeño registrado. Por tanto, el sistema personaliza por historial de respuestas, no por estilo.

La tercera es la evaluación empírica. El repositorio contiene pruebas automatizadas y verificaciones de compilación, pero no un estudio con estudiantes que mida aprendizaje, usabilidad o retención. Las métricas disponibles son técnicas: cobertura, número de pruebas, tamaño del APK y resultado de las compilaciones.

La cuarta es la seguridad. La autenticación es local y está pensada para separar perfiles en un dispositivo compartido, no para proteger información sensible en un escenario adversario. El hash usa PBKDF2 con sal e iteraciones y se rehashea al iniciar sesión. La identidad externa se comparte con el panel únicamente cuando se ejecutan operaciones de clases en modo híbrido; no hay recuperación de cuentas ni sincronización de progreso.

La quinta es la portabilidad. El destino principal es Android; la web se conserva como soporte de demostración y iOS no se validó en dispositivo. El APK está limitado a una arquitectura y a Android 12 o superior.

La sexta es la deuda residual. La cobertura de rutas, hooks de carga y adaptador de datos sigue siendo baja. No se acredita una migración completa desde un respaldo real de una instalación v14; los tests de persistencia usan un doble de SQLite y no verifican todas las restricciones de claves foráneas con el motor real. La desactivación del gesto de iOS tampoco se validó en un dispositivo físico. Los cambios posteriores a los commits de SDK 58 y servicios permanecen en el árbol de trabajo.

La séptima es la integración remota. El modo híbrido está implementado y se validó manualmente con el APK de SDK 58 contra el panel desplegado, no solo con fixtures. El contrato v2.2 documenta la forma acordada desde la perspectiva del cliente; el serializador y el esquema del panel no están en este repositorio, por lo que falta una prueba automatizada de ida y vuelta y la generación automática del fixture. El contrato de clases no admite imágenes y exige releases válidos; esas restricciones deben mantenerse en el panel. El arranque no espera a la red: la descarga se realiza en segundo plano y la aplicación queda en caché local. No existe sincronización de progreso, cuentas remotas ni consulta de resultados académicos por parte del docente. Estas ausencias son deliberadas y deben declararse como alcance, no como fallo.

## 4.6 Evaluación pedagógica y de usabilidad

No se dispone de instrumentos aplicados ni de datos de participantes en los materiales revisados. En consecuencia, no se reportan medidas de satisfacción, aprendizaje o usabilidad. Este apartado deberá completarse con los resultados de la fase 4 de MOAM si la evaluación se realiza; de lo contrario, se conservará la limitación y se ajustará la valoración del objetivo correspondiente.

## 4.7 Evidencia por reunir

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
21. Diagrama de componentes y diagrama entidad-relación actualizados, para el capítulo 3.
22. Diagrama de secuencia «responder un ejercicio», mapa de navegación y diagrama de modos de datos, para el capítulo 3.
23. Diagrama del área de espera: `ContentSyncProvider` → `remote_lessons` → `applyStagedContent` → tablas de contenido.
24. Evidencia de la migración v14 → v17: ejecutar la app con una base v14 con intentos y verificar que conserva el progreso, genera la identidad externa, actualiza el contenido base y crea las estructuras de clases.
25. Reunir las evidencias que sustentan la valoración de los seis objetivos específicos en 4.2.
26. [CONFIRMAR: si el reporte exige ficha LOM y empaquetado SCORM; el código actual no los implementa.]
27. [CONFIRMAR: si se realizó alguna prueba con usuarios o validación en iOS; no hay registro en el repositorio.]
28. [CONFIRMAR: autoría y derechos del contenido textual y de los bancos de ejercicios y preguntas.]
29. Contrato de API (`docs/api/contrato.md`) y evidencia de la prueba híbrida realizada: APK de SDK 58, unión a una clase, contenido extra visible y conservación del contenido local sin red.
30. Evidencia de que `DATA_MODE='local'` no genera peticiones HTTP (registro de red vacío durante un recorrido completo).
31. Captura de un tema marcado como completado solo después de lectura, ejemplos, práctica y evaluación con los umbrales definidos.
32. Captura del modal unificado de confirmación en una salida de práctica y en una acción destructiva del Perfil.

## 4.8 Capturas y procedencia de la evidencia

Las capturas del recorrido funcional deben obtenerse de una ejecución real e identificar versión, fecha y plataforma. Una captura de la exportación web, incluso con tamaño de pantalla de teléfono, acredita esa ejecución web; no demuestra instalación en Android ni funcionamiento en iOS.

Las pantallas de acceso, módulos, lecciones, ejemplos, ejercicios, evaluación, historial y perfil pueden documentarse desde una ejecución controlada si se dispone del entorno. Las pruebas de modo avión, botón físico, instalación del APK y comportamiento nativo requieren el dispositivo o emulador correspondiente. La unión a clases requiere además un código válido y un servicio accesible. Las capturas del build requieren el registro real de EAS.

Las salidas de pruebas deben corresponder al corte reportado. Si se ejecutan nuevamente y cambian los conteos, se actualizarán el texto y la evidencia en conjunto. Los diagramas son figuras de elaboración técnica y deben distinguirse de las capturas de funcionamiento. Los diagramas de diseño se ubican en el capítulo 3; el recorrido del producto se presenta aquí.
