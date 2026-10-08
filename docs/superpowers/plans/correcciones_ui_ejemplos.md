# Correcciones de UI para pantallas de ejemplos

## Objetivo
Implementar mejoras de distribución, navegación, textos, controles y retroalimentación en todas las pantallas de ejemplos del flujo guiado: ordenar, completar, enlazar y crucigrama. Conservar la identidad visual actual. Este documento es una especificación de implementación, no una solicitud de rediseño completo.

## Restricciones obligatorias
- No cambiar la paleta de colores de la app: fondos, textos, botones, tarjetas, navegación, estados existentes ni tema oscuro/claro.
- Reutilizar componentes, estilos y tokens existentes. No introducir colores decorativos nuevos, gradientes ni cambios globales de tema.
- Excepción explícita: marcar con borde rojo las respuestas incorrectas, según lo solicitado. Reutilizar el color de error existente; no recolorear el fondo, texto ni botón de respuesta.
- Los bordes de Pista y Solución deben usar colores/tokens ya existentes. No asignarles nuevos colores.
- Se permite cambiar textos, posición de botones, tamaños, espaciado, bordes, alineación y comportamiento especificado aquí.
- Conservar los contenidos educativos, respuestas correctas, reglas de evaluación y orden de los ejemplos.
- No incorporar dependencias nuevas ni migrar la arquitectura/navegación sin necesidad justificada.
- Alcance: lo compartido (§2) aplica a los cuatro tipos de ejemplo (ordenar, completar, enlazar y crucigrama); §3 y §4 detallan los ejemplos de ordenar y completar.

## 1. Inspección previa
Antes de modificar código:
1. Identificar las pantallas y componentes de cada tipo de ejemplo (ordenar, completar, enlazar, crucigrama).
2. Localizar la navegación entre ejemplos, el cierre del flujo (acción Ir a ejercicios), el banco de palabras, pista/solución y los estados de interacción.
3. Identificar los estilos y tokens existentes, especialmente el color de error.
4. Reutilizar componentes compartidos cuando corresponda. No modificar todas las pantallas de la aplicación mediante estilos globales.
5. Si el proyecto usa React Native/Expo, conservar la compatibilidad con su configuración actual, incluido Expo Go si aplica.

## 2. Cambios compartidos por todas las pantallas de ejemplos

### 2.1 Botón Siguiente
- Colocar el control Siguiente en la esquina superior derecha del encabezado, con aspecto de botón de icono con flecha, coherente con el botón Regresar (misma caja, borde y glifo; flecha hacia la derecha).
- Mantener Regresar en la esquina superior izquierda.
- Colocar el título debajo de la fila de navegación cuando sea necesario para evitar colisiones.
- Mostrar Siguiente desde el inicio, deshabilitado y sin responder a pulsaciones.
- Habilitarlo únicamente después de que se haya ejecutado al menos una comprobación del ejemplo actual (de cualquier tipo).
- No exigir que todas las respuestas sean correctas para habilitarlo.
- Usar el estilo deshabilitado existente, sin crear nuevos colores.
- La condición pertenece al ejemplo, no a toda la sesión. Al entrar en un ejemplo nuevo, comienza deshabilitado.
- Editar respuestas o usar Reintentar en el mismo ejemplo no borra el hecho de que ya se comprobó una vez.
- Ver pista o Ver solución no cuentan como una comprobación.
- Un intento de pulsación que no ejecuta la evaluación, por ejemplo si el formulario está bloqueado por estar incompleto, no cuenta como comprobación.
- En el último ejemplo, conservar el comportamiento de finalización existente (acción Ir a ejercicios); no navegar a una ruta inexistente.
- No modificar ni marcar automáticamente como correcto el progreso por permitir avanzar.

Regla conceptual:
```ts
const canGoNext = hasCheckedCurrentExample;
```
Adaptar el nombre y almacenamiento a la arquitectura existente. Evitar fugas de estado entre ejemplos.

### 2.2 Pista y Solución
- Colocar Ver pista y Ver solución en una misma fila, debajo del bloque de comprobación y retroalimentación.
- Ver pista debe mostrar su etiqueta de texto acompañada del icono de lupa existente (se conserva la lupa como parte del control, junto al texto).
- Darles el mismo alto y, cuando el espacio lo permita, el mismo ancho.
- Hacerlos visibles mediante un borde utilizando estilos y colores existentes.
- Mantener su jerarquía secundaria respecto a Comprobar.
- Usar etiquetas explícitas: Ver pista y Ver solución.
- Eliminar las instancias anteriores de estos controles para evitar duplicados (por ejemplo, la lupa suelta y el botón de solución previos).
- Conservar la lógica actual de pistas y soluciones; no introducir bloqueos o confirmaciones nuevos.

### 2.3 Distribución y legibilidad
- Mantener márgenes laterales consistentes y separación uniforme entre secciones.
- Aumentar la legibilidad de instrucciones y controles pequeños usando la escala tipográfica existente.
- Evitar que el título, acciones o contenido queden ocultos bajo barras del sistema o la navegación inferior.
- Permitir desplazamiento si el contenido no cabe; no usar alturas fijas que recorten texto.
- Mantener áreas táctiles de al menos 48 x 48 unidades lógicas en controles pequeños cuando sea viable, usando padding o hitSlop sin cambiar sus colores.
- Admitir escalado de texto y pantallas estrechas. La fila Pista/Solución debe conservar etiquetas legibles; si fuera necesario, permitir que el texto se ajuste dentro del botón.
- No llenar el espacio libre con decoración.
- Mantener la navegación inferior existente.
- Si el engrane pertenece a esta pantalla, integrarlo en un menú o encabezado sin solapamientos. Si es un control global/de desarrollo, no alterar su función ni eliminarlo sin verificar su origen.

## 3. Ejemplos de ordenar actividades
- Conservar colores y estilos actuales de cada tarjeta. No neutralizar bordes ni reemplazar los colores existentes.
- Mejorar la distribución entre posición, texto, agarradera y flechas para que no se aprieten.
- Situar la agarradera a la izquierda si resulta compatible con la implementación existente.
- Mantener tanto el arrastre como las flechas para reordenar.
- Asegurar que las flechas extremas tengan estados correctos: no subir la primera ni bajar la última.
- La etiqueta de posición debe reflejar la posición actual después de cada movimiento. Usar 1, 2, 3, 4 salvo que el formato de dos dígitos sea una convención compartida necesaria.
- Usar una instrucción clara, por ejemplo: “Ordena las actividades según la secuencia estudiada. Arrastra las tarjetas o usa las flechas”. Validar que describa la tarea existente; no inventar un criterio de orden nuevo.
- Mantener el título educativo actual. No mostrar identificadores técnicos internos como instrucciones para el estudiante.
- Mostrar el resultado de Comprobar dentro del flujo de contenido, con los componentes y colores actuales.
- No añadir bordes rojos por tarjeta a este tipo de ejemplo sin una regla existente de evaluación individual. El borde rojo requerido en este documento corresponde a completar conceptos.

## 4. Ejemplos de completar conceptos

### 4.1 Identificar exactamente las respuestas incorrectas
Después de Comprobar:
- Aplicar un borde rojo visible al espacio/control exacto donde se colocó cada respuesta incorrecta.
- No aplicar el borde a toda la oración ni a todo el banco de palabras.
- Usar aproximadamente 2 unidades lógicas de grosor, adaptado a los estilos actuales.
- Conservar el fondo y color del texto del control.
- Mantener el mismo espacio reservado para el borde antes y después de comprobar para evitar saltos de diseño.
- No revelar automáticamente la respuesta correcta.
- No añadir nuevos colores verdes o fondos de acierto. Conservar los estados correctos actuales.
- Complementar el borde con texto de error y una descripción accesible; no depender solamente del color.

### 4.2 Estados de respuesta
Distinguir mediante estructura, borde, texto o iconografía, sin cambiar la paleta:
1. Vacío: apariencia existente, con indicación comprensible de que se puede completar.
2. Ocupado sin evaluar: apariencia neutra existente.
3. Incorrecto tras comprobar: borde rojo y descripción del error.
4. Correcto tras comprobar: conservar la apariencia de acierto existente.

Al modificar una respuesta evaluada:
- Quitar el resultado anterior de ese espacio y dejarlo pendiente de comprobación.
- Mantener el resultado de los espacios que no se modificaron.
- No evaluar automáticamente la nueva respuesta.
- Actualizar u ocultar el resumen anterior para que no muestre un conteo obsoleto como si fuera vigente.
- No deshabilitar Siguiente si ya se realizó una comprobación en este ejemplo.

### 4.3 Espacios interactivos e instrucciones
- Hacer los espacios claramente identificables como controles, usando borde, padding y esquinas coherentes con los componentes existentes.
- Añadir separación suficiente entre la respuesta insertada y el texto de la oración.
- Permitir que las oraciones se ajusten en varias líneas sin recortar respuestas.
- Explicar el mecanismo real de interacción. Si el flujo actual consiste en seleccionar una palabra y después un espacio, usar: “Toca una palabra y después un espacio. Toca una respuesta para devolverla al banco”.
- Si el flujo es distinto, adaptar la instrucción; no implementar otro mecanismo únicamente para que coincida con el ejemplo.

### 4.4 Banco de palabras
- Añadir la etiqueta “Palabras disponibles”.
- Mejorar separación y área táctil de las fichas sin cambiar colores.
- Conservar el comportamiento actual de palabras utilizadas: no cambiar automáticamente entre ocultarlas y mantenerlas visibles.
- Si permanecen visibles, indicar que están utilizadas mediante el estado deshabilitado existente y/o iconografía o texto accesible.
- Las fichas utilizadas no deben parecer seleccionables si no lo son.
- Al devolver una palabra, restaurar su disponibilidad inmediatamente.
- Evitar duplicar palabras, perder opciones o permitir usar una misma instancia dos veces.
- Distinguir selección y error; no utilizar el borde rojo como indicador de selección.

### 4.5 Comprobar, Reintentar y resumen
- Mantener Comprobar como acción principal, con su color actual.
- Mantener Reintentar como secundaria, con su color actual.
- Mostrar retroalimentación inmediatamente debajo de esas acciones y antes de Pista/Solución.
- Sustituir mensajes vagos por un resumen consistente con las marcas visibles.
- Calcular el número de errores real; no usar cifras fijas.
- Ejemplo de mensaje: “Hay 2 respuestas por revisar. Los espacios incorrectos están marcados. Puedes cambiarlas y volver a comprobar”.
- Usar singular/plural correctamente y un mensaje distinto cuando todas sean correctas.
- Separar las instrucciones de interacción del resultado de evaluación.
- Conservar la lógica actual de Reintentar. Si borra todas las respuestas, cambiar la etiqueta a Reiniciar para hacer explícito su alcance. No cambiar la lógica de reinicio a corrección parcial sin aprobación.

## 5. Esquema de distribución
```text
Regresar                                Siguiente (flecha)

Título del ejemplo
Instrucción de interacción

Contenido del ejemplo
Banco de palabras, cuando corresponda

Comprobar                             Reintentar
Retroalimentación

Ver pista (lupa)                      Ver solución

Navegación inferior existente
```
En ordenar actividades, no añadir Reintentar si no existe ni es necesario para el flujo actual.

## 6. Accesibilidad e interacción
- Etiquetar los botones para lector de pantalla y exponer su estado deshabilitado.
- Identificar cada espacio por oración/posición y comunicar su estado de error.
- Comunicar el resultado de comprobación mediante el mecanismo accesible que ya use la plataforma.
- Mantener alternativas al arrastre en ordenar actividades.
- Evitar que una superposición invisible bloquee controles.
- No usar únicamente cambios de color para comunicar selección, disponibilidad o errores.

## 7. Criterios de aceptación
- [ ] La paleta, los fondos y los colores de botones y textos permanecen iguales.
- [ ] La única adición cromática autorizada es el borde rojo de error, reutilizando el token existente cuando esté disponible.
- [ ] Siguiente aparece arriba a la derecha como botón de flecha, con el estilo del botón Regresar.
- [ ] Antes de comprobar, Siguiente está deshabilitado.
- [ ] Después de una comprobación ejecutada, Siguiente se habilita incluso con errores.
- [ ] Pista/Solución no habilitan Siguiente.
- [ ] Editar respuestas o reintentar no revoca la habilitación obtenida en el ejemplo actual.
- [ ] Un ejemplo nuevo no hereda esa habilitación.
- [ ] Ver pista (texto + lupa) y Ver solución están alineados y tienen borde visible sin nuevos colores.
- [ ] No quedan botones duplicados en sus ubicaciones anteriores.
- [ ] Cada respuesta incorrecta de completar conceptos tiene borde rojo en su espacio exacto.
- [ ] El resumen coincide con los errores y no expone conteos obsoletos tras editar.
- [ ] Los errores también son identificables mediante texto/accesibilidad.
- [ ] Cambiar una respuesta elimina su evaluación anterior, sin afectar las demás.
- [ ] No se alteran las respuestas correctas ni las reglas pedagógicas.
- [ ] El banco de palabras no pierde ni duplica opciones.
- [ ] El contenido funciona en pantallas estrechas, con texto ampliado y desplazamiento.
- [ ] No hay solapamientos con el encabezado, áreas seguras o navegación inferior.
- [ ] Ordenar conserva arrastre y flechas.

## 8. Pruebas mínimas
1. Entrar en un ejemplo nuevo y comprobar que no permite avanzar.
2. Usar Ver pista o Ver solución y verificar que Siguiente sigue deshabilitado.
3. Ejecutar una comprobación incorrecta y verificar habilitación de Siguiente y marcas de error.
4. Cambiar una respuesta incorrecta y comprobar que desaparece su borde de error hasta la nueva evaluación.
5. Volver a comprobar y validar el resumen actualizado.
6. Reintentar/reiniciar y verificar su comportamiento actual y la habilitación de Siguiente.
7. Avanzar y verificar que el siguiente ejemplo comienza con su propia condición de comprobación.
8. Completar correctamente y verificar el estado de éxito existente.
9. Probar el último ejemplo y su cierre (Ir a ejercicios).
10. Reordenar con arrastre y con flechas (ordenar).
11. Probar enlazar y crucigrama con los cambios compartidos aplicados.
12. Probar pantalla estrecha, texto ampliado y lector de pantalla.
13. Si la aplicación es autocontenida/offline, comprobar que estas funciones siguen funcionando sin conexión.

## 9. Entrega del agente
Al finalizar, informar:
- Archivos y componentes modificados.
- Cómo se implementó la habilitación de Siguiente por ejemplo.
- Cómo se identifican y limpian los errores por espacio.
- Pruebas ejecutadas y resultados.
- Cualquier limitación pendiente o decisión que requiera aprobación.

No afirmar que una prueba pasó si no se ejecutó. No hacer cambios de color o de lógica educativa fuera del alcance descrito.
