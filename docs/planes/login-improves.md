# Tarea: mejorar los formularios de Iniciar sesión y Crear cuenta

## Contexto
App móvil hecha con React + Expo, titulada "Ingeniería de Software" (subtítulo "Objeto de aprendizaje"). Tiene dos pantallas: Iniciar sesión (usuario + contraseña, botones "Entrar" y "Crear cuenta") y Crear cuenta. Tema oscuro. Los datos se guardan solo en el dispositivo.

## Reglas de trabajo
1. Antes de modificar nada, explora el repositorio: estructura de carpetas, pantallas de login/registro, cómo se guardan los usuarios y qué librerías hay en package.json. No asumas nombres de archivos.
2. Haz los cambios por fases, en el orden indicado. Al terminar cada fase, verifica que la app compila y haz un commit con un mensaje claro.
3. Respeta el estilo y la estructura existentes. No reescribas lo que no está en este plan.
4. Instala dependencias de Expo con `npx expo install`, no con npm directamente.
5. Si algo del plan choca con el código existente, detente y explícame la alternativa antes de continuar.

## Fase 1: Validación de contraseña (solo en Crear cuenta)
- Crear `utils/validarPassword` (ajustar la ruta a la estructura real) con dos requisitos:
  - Mínimo 8 caracteres.
  - Al menos 1 número o carácter especial (regex `/[\d\W_]/`).
- Exportar una lista de requisitos y una función `validarPassword(password)` que devuelva `{ valida, resultados }`, donde cada resultado tenga `id`, `texto` y `cumple`.
- En la pantalla de registro:
  - Mostrar la lista de requisitos en tiempo real debajo del campo (verde con ✓ si se cumple, gris con ○ si no).
  - Deshabilitar el botón "Crear cuenta" mientras `valida` sea false.
  - Volver a validar dentro del handler de registro antes de guardar.
- En el login NO aplicar esta regla; solo comprobar que usuario y contraseña no estén vacíos.
- Criterios de aceptación: "abcdefg" (sin número ni símbolo) no pasa; "abcdefg1" pasa; "abc1" no pasa por longitud; "abcdefg!" pasa.

## Fase 2: Campos y teclado
- Botón de ojo para mostrar/ocultar la contraseña en ambas pantallas (estado que controla `secureTextEntry`).
- Input de usuario: `autoCapitalize="none"`, `autoCorrect={false}`, `autoComplete="username"`, `textContentType="username"`, `returnKeyType="next"`.
- Input de contraseña: `autoComplete="current-password"` en login y `"new-password"` en registro, `returnKeyType="go"` y `onSubmitEditing` que dispare el envío.
- Encadenar los campos con `useRef`: al pulsar "next" en usuario, el foco pasa a contraseña.
- Envolver cada pantalla en `KeyboardAvoidingView` (`behavior="padding"` en iOS) y `ScrollView` con `keyboardShouldPersistTaps="handled"`, para que el teclado no tape los botones.

## Fase 3: Errores y retroalimentación
- Mostrar errores en línea bajo cada campo (texto en rojo accesible), no con `Alert`:
  - Login: "Usuario o contraseña incorrectos", campos vacíos.
  - Registro: "Ese usuario ya existe", formato de usuario inválido.
- Añadir `accessibilityLiveRegion="polite"` a los mensajes de error.
- Estado de carga: deshabilitar el botón y mostrar `ActivityIndicator` mientras se procesa, para evitar doble envío.
- Validar el usuario mientras se escribe en el registro (formato y disponibilidad).
- Mostrar una confirmación breve al crear la cuenta antes de entrar a la app.

## Fase 4: Jerarquía de botones y navegación
- En login: "Entrar" es el botón principal; "Crear cuenta" pasa a ser un enlace de texto debajo ("¿No tienes cuenta? Crear cuenta").
- En registro: añadir el enlace "¿Ya tienes cuenta? Inicia sesión".
- Quitar el estilo de botón secundario del enlace anterior si ya no se usa.

## Fase 5: Legibilidad y estilo
- Etiquetas pequeñas ("USUARIO", "CONTRASEÑA", "OBJETO DE APRENDIZAJE") a mínimo 12-13 px, con contraste de al menos 4.5:1 sobre el fondo oscuro.
- `placeholderTextColor` más tenue que el color del texto escrito, para que "tu.usuario" no parezca un valor ya llenado.
- Hacer más visible el aviso "Tus datos se guardan solo en este dispositivo", con un icono de información.
- Estado de foco: borde azul en el input enfocado (`onFocus` / `onBlur` con estilo condicional).
- Inputs y botones de al menos 48 px de alto.
- Centralizar colores y tamaños en un archivo de tema si ya existe uno; si no, no crearlo en esta tarea.

## Fase 6: Layout
- Usar `SafeAreaView` de `react-native-safe-area-context`.
- Centrar verticalmente el bloque del formulario (o dejarlo en el tercio superior) en vez de pegado arriba.
- Botón flotante del engranaje: añadir `accessibilityLabel`. Si es solo de desarrollo, mostrarlo únicamente con `__DEV__`. Si es de ajustes reales, dejarlo y solo etiquetarlo.

## Fase 7: Seguridad y datos locales
- Mover el almacenamiento de credenciales a `expo-secure-store` si hoy se usa `AsyncStorage` u otro almacenamiento en texto plano.
- No guardar la contraseña en texto plano: generar una sal aleatoria con `expo-crypto` y guardar el hash (usuario, sal, hash). Al iniciar sesión, calcular el hash con la sal guardada y comparar.
- Si ya existen usuarios guardados con el formato anterior, escribir una migración simple y avisarme de cómo afecta a esos usuarios.
- Añadir en el registro un aviso claro de que, si se borran los datos o se cambia de teléfono, no hay recuperación de cuenta ni de progreso.
- Añadir exportar/importar el progreso como archivo de respaldo (`expo-file-system` y `expo-sharing`), en una pantalla o sección de ajustes.
- No añadir "¿Olvidaste tu contraseña?" mientras no exista recuperación real.

## Verificación final
- La app arranca sin errores ni warnings nuevos (`npx expo start`).
- Probar en Android (y iOS si es posible): registro con contraseña inválida, registro válido, login correcto, login incorrecto, usuario duplicado, mostrar/ocultar contraseña, teclado sin tapar botones.
- Si el proyecto tiene tests, ejecutarlos y añadir pruebas unitarias para `validarPassword` con los casos de la Fase 1.
- Entregar un resumen con: archivos modificados, dependencias nuevas, decisiones que tomaste y cualquier punto que dejaste pendiente.