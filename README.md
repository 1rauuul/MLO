# MLO — Introducción a la Ingeniería de Software

App móvil offline-first (Expo SDK 57 + React Native) para el curso de Introducción a la
Ingeniería de Software. Sin red, sin RA, sin sensores nativos.

## Ejecutar

```bash
npm install
npm run start        # Expo Go / Android
npm run android      # emulador Android
npm run web          # web
npm test             # Jest
npx tsc --noEmit     # typecheck estricto
```

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
