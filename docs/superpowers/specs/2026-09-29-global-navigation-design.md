# Diseño — Navegación global y cierre de actividades

> Fecha: 29 de septiembre de 2026  
> Estado: aprobado en conversación y revisión del spec escrito.  
> Alcance: navegación autenticada de MLO; sin cambios de contenido ni datos.

## 1. Objetivo

Mantener disponibles las secciones principales durante el recorrido de aprendizaje y
hacer explícito el destino al terminar una actividad. El alumno debe poder cambiar de
sección sin perder la posición que tenía en la anterior, volver al hub de un tema desde
los cierres de lección, ejemplo y ejercicios, y regresar a Módulos al cerrar una
evaluación.

## 2. Contexto actual

- `src/app/(app)/index.tsx` renderiza Módulos, Evaluaciones y Perfil mediante estado
  local. `BottomTabBar` solamente aparece en esta pantalla.
- Las pantallas de tema, lección, ejemplo, ejercicios y evaluación se presentan sobre
  una pila común sin barra principal.
- Varios botones de retorno usan `router.back()`, por lo que su destino depende de la
  ruta desde la que se abrió la pantalla.
- El tema 1.1 es una excepción existente: se abre directamente como lección y no tiene
  un hub propio. Se conservará esta excepción.

## 3. Enfoque elegido

Usar navegación de pestañas de Expo Router para las tres secciones autenticadas, con
una pila independiente por pestaña. Es preferible a dibujar la barra en cada pantalla
o superponer una barra personalizada a la pila común porque deja el historial y la
pestaña activa bajo el control del enrutador.

La estructura concreta de rutas se definirá durante la implementación después de
consultar la documentación versionada de Expo SDK 57, según `AGENTS.md`. Las pantallas
de contenido deben vivir bajo una pila que mantenga visibles las pestañas. La
implementación puede extraer las vistas actuales de Home a rutas para Módulos,
Evaluaciones y Perfil, evitando duplicar la interfaz o la lógica de ViewModels.

## 4. Comportamiento de navegación

### 4.1 Navegación principal

- Módulos, Evaluaciones y Perfil están disponibles en todas las pantallas autenticadas,
  incluidas las de contenido y resultados.
- Cada pestaña conserva su pila y posición al cambiar a otra y regresar.
- El botón «Volver» de una pantalla secundaria vuelve a la pantalla anterior dentro de
  su recorrido, sin sustituir el destino explícito de los botones de cierre indicados
  abajo.
- Seleccionar una pestaña no cierra ni reinicia las pilas de las demás.

### 4.2 Cierre de actividades

- **Lección:** al llegar a la síntesis final, mostrar «Regresar al tema», además de la
  acción de continuación que corresponda. El botón abre el hub del tema actual.
- **Ejemplo:** una vez respondida la actividad de acompañamiento, mostrar «Regresar al
  tema» junto a la opción de continuar a ejercicios. El botón abre el hub del tema del
  ejemplo.
- **Ejercicios:** en el resumen final, «Regresar al tema» abre el hub del tema asociado,
  en vez de depender de `router.back()`.
- **Evaluación:** en el resultado final, ofrecer «Volver a Módulos» como acción
  principal y llevar a la raíz de la sección Módulos. Se pueden conservar las acciones
  secundarias actuales para repasar contenido, si existen recomendaciones.
- **Tema 1.1:** conservar la apertura directa de la lección. Como no tiene hub, su
  acción de salida vuelve a la raíz de Módulos y se etiqueta «Volver a módulos».

Las navegaciones de cierre deben tener destino explícito y evitar apilar copias
innecesarias de la misma pantalla. El retorno contextual ordinario continúa usando la
pila correspondiente.

## 5. Alcance

**Incluye:**

- Reorganizar rutas autenticadas para que las pestañas principales sean persistentes.
- Conservar las pantallas y datos de Módulos, Evaluaciones y Perfil existentes.
- Añadir las acciones de cierre y destinos descritos en la sección 4.2.
- Mantener accesibilidad de etiquetas, roles y estado seleccionado de las pestañas.

**No incluye:**

- Crear un hub para el tema 1.1.
- Rediseñar visualmente las pestañas ni cambiar la paleta.
- Alterar el flujo de autenticación, modelos, esquema SQLite, progreso o resultados.
- Añadir funcionalidad en línea; la aplicación sigue siendo offline-first.

## 6. Pruebas y verificación

- Verificar que la barra y la pestaña seleccionada permanezcan presentes en Home,
  tema, lección, ejemplo, ejercicios y evaluación.
- Verificar que cambiar de pestaña y volver conserve la posición de navegación previa.
- Verificar que «Regresar al tema» desde lección, ejemplo y resumen de ejercicios abra
  el hub correcto incluso si la actividad se abrió desde otra ruta.
- Verificar que el resultado final de evaluación vuelva a la raíz de Módulos y que las
  opciones de repaso existentes sigan funcionando.
- Verificar que el tema 1.1 siga abriendo directamente la lección y que su salida
  vuelva a Módulos.
- Ejecutar `npx tsc --noEmit`, `npm test` y `npm run lint` después de la implementación.
- Revisar la documentación exacta de Expo SDK 57 antes de implementar las rutas y
  opciones del navegador.

## 7. Criterios de aceptación

1. Las pestañas Módulos, Evaluaciones y Perfil están disponibles en todas las rutas
   autenticadas.
2. Cambiar entre pestañas conserva el estado de navegación de las otras pestañas.
3. Los cierres de lección, ejemplo y ejercicios llevan explícitamente al hub del tema
   correspondiente.
4. El resultado final de una evaluación tiene una acción principal «Volver a Módulos»
   que lleva a la raíz de Módulos.
5. El tema 1.1 conserva su flujo directo y su salida regresa a Módulos, sin crear un
   hub nuevo.
6. La navegación atrás ordinaria continúa respetando la pila del recorrido activo.
7. TypeScript, las pruebas y lint pasan; no se modifica la arquitectura offline-first.
