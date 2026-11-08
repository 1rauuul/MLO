# Migración a Expo SDK 58

**Fecha:** 27 de octubre de 2026  
**Objetivo:** migrar de Expo SDK 57 a SDK 58, alinear todos los paquetes y mantener el APK de demo funcionando.

## Versiones principales

| Paquete | Versión |
|---|---|
| Expo | 58.0.19 |
| React Native | 0.88.0 |
| React / React DOM | 19.3.0 |
| React Native Web | 0.21.4 |
| Expo Router | 58.0.26 |
| expo-sqlite | 58.0.14 |
| expo-file-system | 58.0.11 |
| expo-build-properties | 58.0.11 |
| expo-system-ui | 58.0.6 |
| jest-expo | 58.0.12 |
| Jest | 30.5.2 |
| TypeScript | 6.0.3 |

También se actualizaron `react-native-reanimated` 4.7.1, `react-native-worklets` 0.13.0, `react-native-gesture-handler` 3.3.0, `react-native-screens` 4.30.0, `react-native-safe-area-context` 5.10.1 y `react-native-svg` 15.16.0.

## Cambios de código necesarios

- **`expo-file-system`:** `File.write()` ahora es asíncrono. El respaldo de progreso usa `await file.write(...)`.
- **Expo Router / pestañas:** `BottomTabBarProps` ya no expone `navigation`. La barra ahora usa `navigateToTab(routeKey)`.
- **Protección de salida:** `beforeRemove` fue retirado. `useExitGuard` usa `usePreventRemove`, `repeat` y `disablePrevention`.
- **React Native 0.88 Strict TypeScript API:** los refs de `TextInput` usan `TextInputInstance`; `TextField` se tipó con esa instancia.
- **Testing:** se mantiene `@testing-library/react-native` 13.3.3 porque el proyecto no usa `expo-router/testing-library`. Así se evita reescribir los tests a la API asíncrona de RNTL 14. Jest y `jest-expo` sí subieron a 30/58.
- **Instalación:** se añadió `.npmrc` con `legacy-peer-deps=true` porque `expo-router@58` declara RNTL 14 como peer opcional y `npm ci` de EAS rechazaba la instalación con RNTL 13. El runtime de la app no usa RNTL.
- **R8:** SDK 58 activa R8 por defecto. Se conserva la regla `-keep class com.margelo.nitro.** { *; }` para Quick Crypto.
- **Expo Go:** Quick Crypto no está incluido. `passwordKdf` comprueba `TurboModuleRegistry.get('QuickBase64')` y, si no existe, usa `@noble/hashes`. Así Expo Go no falla; el login nativo rápido requiere el APK o un development build.
- **Configuración Android:** se mantienen `arm64-v8a`, `minSdkVersion 31`, `useLegacyPackaging` y `versionCode 4`.

## Verificación

- `npx expo-doctor`: **20/20 comprobaciones**.
- `npx tsc --noEmit`: sin errores.
- `npm test -- --runInBand`: **54 suites, 345 tests pasando**.
- `npx expo export --platform android`: bundle generado.
- `npx expo export --platform web`: bundle generado con rutas asíncronas de SDK 58.
- `npx expo prebuild --platform android`: configuración nativa generada sin errores.
- `npx expo start --clear`: Metro arranca correctamente en local.
- `npx expo export --platform web`: export local correcto.

## Build

Build `preview` de Android completado con `versionCode 5`.

- ID: `200f1e6d-4b58-423c-b1fd-ff9a56a4fd2a`
- Estado: `FINISHED`
- APK: https://expo.dev/artifacts/eas/YrgMB5lVRkY8S0pQLmB4bPtAHpiwYMudcJpH7k7QGBQ.apk
- Página del build: https://expo.dev/accounts/1raul/projects/MLO-Ingenieria-software/builds/200f1e6d-4b58-423c-b1fd-ff9a56a4fd2a
- **Tamaño final: 23,832,944 bytes (~23.8 MB)**
- Contenido verificado: solo `arm64-v8a`, `libQuickCrypto.so`, `libNitroModules.so` y el icono nuevo dentro del APK.

Antes de este build también se validó en local:

- `npx expo start --clear --offline --port 8082`: Metro arrancó.
- `npx expo export --platform web`: export correcto.

## Vulnerabilidades restantes

`npm audit` reporta **3 vulnerabilidades altas** en `zod`, dentro de `@expo/cli` (herramienta de build). No se empaqueta en el APK ni se ejecuta en la app. `npm audit fix --force` intenta bajar Expo a SDK 54, por lo que no se aplica; debe resolverse con una actualización upstream de Expo CLI.
