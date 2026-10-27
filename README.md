# MLO — Introducción a la Ingeniería de Software

App móvil offline-first (Expo SDK 58 + React Native 0.88) para el curso de Introducción a la
Ingeniería de Software. Sin red, sin RA, sin sensores nativos.

## Ejecutar

```bash
npm install
npm run start        # Expo Go / Android
npm run android      # emulador Android
npm run web          # web
npm run demo:web     # genera una demo web estática en dist/
npm run demo:web:serve # genera y sirve la demo sin expo start
npm run demo:apk     # genera un APK Android instalable con EAS
npm test             # Jest
npx tsc --noEmit     # typecheck estricto
```

Para presentar la demo web sin levantar el servidor de desarrollo, ejecuta:

```bash
npm run demo:web:serve
```

El comando exporta la aplicación a `dist/` y la sirve con un servidor HTTP estático.
La URL que muestre el comando se puede abrir en el navegador y compartir dentro de la
misma red local si el servidor lo permite.

Para generar un APK Android instalable sin levantar Expo Dev Server:

```bash
npx eas-cli login
npm run demo:apk
```

El perfil `preview` está configurado en [`eas.json`](eas.json) para producir un APK.
La compilación se realiza en EAS y al terminar muestra un enlace para descargarlo.

## Estructura

```
src/
  app/                 rutas Expo Router delgadas (re-export de una vista)
  features/<f>/        auth, profile, modules, examples, exercises, evaluations
                       (cada una con model/ viewmodel/ view/)
  shared/              components/, hooks/, services/(db, content), utils/, model/, theme/
```

Arquitectura MVVM por features: `View → ViewModel → Model → shared/services`.
Detalles, reglas de dependencias y convenciones en `AGENTS.md`.

## Documentación

- Índice completo: [`docs/README.md`](docs/README.md)
