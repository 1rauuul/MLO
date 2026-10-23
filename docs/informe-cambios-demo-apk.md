# Informe de cambios — Demo APK

**Fecha:** 22 de octubre de 2026  
**Objetivo:** corregir el fallo de carga del catálogo, acelerar login/registro, separar nombre y apellidos, mostrar indicadores de carga y reducir el tamaño del APK para Android 12+.

## Causa del fallo

El primer arranque fallaba al sembrar la base de datos porque `seedDatabase()` abría una transacción y, dentro, `applyL12QuestionBank()` abría otra. SQLite no permite transacciones anidadas, así que el seed se revertía. Como `PRAGMA user_version` ya se había guardado como 14, los siguientes arranques omitían el seed y dejaban `units`/`lessons` vacías. La pantalla de Módulos interpretaba ese catálogo vacío como “Cargando” de forma indefinida.

## Cambios realizados

### Base de datos

- El banco de preguntas de la lección 1.2 se inserta ahora dentro de la misma transacción del seed, sin anidar transacciones.
- `PRAGMA user_version` se escribe después de que el seed termina correctamente.
- Si la app detecta una base ya marcada como versión 14 pero sin unidades o lecciones, vuelve a sembrar automáticamente. Esto repara la instalación actual sin borrar cuenta ni progreso.
- Tests añadidos para detectar transacciones anidadas y para comprobar la auto-reparación.

### Login y registro

- El primer intento con `@noble/hashes` en JavaScript puro seguía tardando ~40 s en el teléfono. El cuello de botella era Hermes, no el bridge.
- La derivación ahora usa `react-native-quick-crypto` (`pbkdf2Sync` nativo, OpenSSL) en Android/iOS.
- En web, o si el módulo nativo no está disponible, se usa `@noble/hashes` como respaldo.
- Se añadió una regla ProGuard `-keep class com.margelo.nitro.** { *; }` para que R8 no elimine las clases que usa el módulo nativo.
- Se mantienen las 100,000 iteraciones y el formato `pbkdf2-sha256$iteraciones$hash`.
- Los hashes legacy SHA-256 se siguen verificando y actualizando al iniciar sesión.
- El APK de verificación sube a `versionCode: 2` para distinguirlo del anterior.

### Registro

- El formulario ahora usa dos campos: **Nombre** y **Apellidos**.
- Cada campo se valida por separado.
- En la base se sigue guardando `display_name` como `"Nombre Apellidos"`; no hubo migración de esquema.

### Carga y estados vacíos

- `EmptyState` admite un indicador `ActivityIndicator`.
- Módulos muestra spinner mientras carga.
- Si el catálogo termina vacío, muestra “Sin contenido” y un botón **Reintentar**.
- Los estados de carga de lecciones, temas, ejemplos, ejercicios y evaluaciones también muestran spinner.

### Catálogo

- La lista de módulos ya no carga el JSON completo de `content` de cada lección.
- Se hace una sola consulta de resumen y se agrupa por unidad.
- El contenido completo se sigue cargando al entrar a una lección con `selectLesson()`.

### Tamaño del APK

Configuración nueva en `app.json` con `expo-build-properties`:

| Ajuste | Valor |
|---|---|
| ABIs | `arm64-v8a` |
| Android mínimo | API 31 (Android 12) |
| R8 / minify | activado |
| Shrink resources | activado |
| Empaquetado nativo | `useLegacyPackaging` activado |
| GIF / WebP | desactivados |
| Compresión del bundle JS | desactivada para no frenar el arranque |

También se quitaron las dependencias directas sin uso: `@expo/ui`, `expo-device`, `expo-web-browser`, `expo-symbols`, `expo-glass-effect`, `expo-image` y `expo-font`. `expo-system-ui` se conserva porque `userInterfaceStyle: automatic` lo necesita. Algunas dependencias siguen instaladas como transitivas de `expo-router`/`expo`, así que el ahorro real viene sobre todo de la ABI única, R8 y la compresión de librerías.

Para el KDF nativo se añadieron `react-native-quick-crypto`, `react-native-nitro-modules` y `react-native-quick-base64`.

**Tamaño anterior:** 118.1 MB (APK universal).  
**Objetivo:** menos de 80 MB.  
**Estimación:** 25–35 MB con arm64 + R8 + compresión de librerías nativas.

## Verificación

- `npx tsc --noEmit`: sin errores.
- `npm test -- --runInBand`: 42 suites, 257 tests pasando.
- `npm run lint`: sin errores; quedan 2 advertencias previas no relacionadas.
- `npx expo config --type public`: configuración válida.
- `npx expo-doctor`: 20/21 comprobaciones; solo avisa de actualizaciones patch de paquetes Expo, sin relación con estos cambios.

## Build final

Build `preview` de Android completado con `npm run demo:apk`.

- ID: `12688b6f-e408-4207-8c01-ae0d7dc16c39`
- Estado: `FINISHED`
- `versionCode`: 3
- APK: https://expo.dev/artifacts/eas/xU3o14rVNRvdQiNz9YGymUkb7H0-R4x0HbnWGd8LbM4.apk
- Página del build: https://expo.dev/accounts/1raul/projects/MLO-Ingenieria-software/builds/12688b6f-e408-4207-8c01-ae0d7dc16c39
- **Tamaño final: 33,161,381 bytes (~33.2 MB)**
- Reducción frente al APK original: de 118.1 MB a 33.2 MB (~72% menos).

Contenido verificado dentro del APK:

- Solo librerías `lib/arm64-v8a`.
- `libQuickCrypto.so` y `libNitroModules.so` presentes.
- `QuickCryptoPackage` presente en `classes2.dex`; la regla ProGuard evitó que R8 lo eliminara.
- `pbkdf2Sync` y `react-native-quick-crypto` presentes en el bundle JS.

Historial: el primer build (29.0 MB) todavía usaba PBKDF2 en JavaScript; el segundo (33.15 MB) incluía Quick Crypto pero R8 eliminó su clase de registro. El tercer build (33.2 MB) es el que corrige el login.

## Riesgos y notas

- El APK es solo `arm64-v8a`; no instalará en dispositivos de 32 bits ni en emuladores x86_64. Para un emulador habría que añadir `x86_64` o un perfil aparte.
- R8 y `useLegacyPackaging` deben probarse en el teléfono. Si algo falla, se puede desactivar `enableMinifyInReleaseBuilds` sin tocar la base de datos.
- Los datos del usuario no aumentan el tamaño del APK: viven en SQLite dentro del almacenamiento de la app.
