# MLO — Introducción a la Ingeniería de Software

App móvil **offline-first** (Expo SDK 58 + React Native 0.88) para el curso de
Introducción a la Ingeniería de Software. SQLite es la fuente de verdad local; con
`EXPO_PUBLIC_DATA_MODE=hybrid` descarga el contenido publicado y sincroniza el progreso
contra la **API v3** del CMS. Sin RA ni sensores nativos.

## Estado

- Cliente único **v3**: `EXPO_PUBLIC_API_URL=https://<host>/api/mlo/v3` (sin barra final).
- Cuentas de alumno con token en **`expo-secure-store`** (con migración desde SQLite);
  en web no hay SecureStore y el token vive solo en memoria durante la sesión. Progreso
  en la nube.
- CI de GitHub Actions (`.github/workflows/ci.yml`): `tsc`, Jest y lint en cada push y PR.
- EAS configurado para `preview` (APK) y `production` (AAB) con modo `hybrid`; el build
  se lanza a mano y no se ha generado en esta entrega.

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
npm run lint         # Expo lint
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

El perfil `preview` está configurado en [`eas.json`](eas.json) para producir un APK y
`production` para un AAB; ambos usan la API v3. La compilación se realiza en EAS y al
terminar muestra un enlace para descargarlo. También existe el workflow manual
[`.github/workflows/eas-preview.yml`](.github/workflows/eas-preview.yml).

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
- Estado actual: [`docs/estado/linea-de-tiempo.md`](docs/estado/linea-de-tiempo.md) y
  [`docs/estado/historial-cms.md`](docs/estado/historial-cms.md)
- Contrato v3: `mlo-teachers/docs/contracts/mlo-v3.md` (repo del CMS)
