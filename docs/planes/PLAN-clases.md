# Plan — clases en MLO

Estado al **2026-10-27**. Reemplaza el modelo anterior de un solo grupo/catálogo por
cuenta.

## Modelo

| Tabla local | Contenido |
|---|---|
| `accounts.external_key` | UUID estable de la persona; viaja en el respaldo |
| `account_classes` | Membresías de cada cuenta local |
| `class_cache` | Último release y metadata de cada clase |
| `class_extras_cache` | Bloques, ejemplos y ejercicios publicados por clase |

Las clases no cambian el catálogo: todo el contenido base vive en `base`. El alumno
puede pertenecer a varias clases y ve la suma de sus extras.

## Sincronización

1. `ContentSyncProvider` refresca el curso base y, después, las clases de todas las
   cuentas locales.
2. Para cada membresía se consulta `GET /classes/{code}`. Si cambió `version`/`hash`,
   se descarga `GET /classes/{code}/release` y se reemplaza la caché de esa clase.
3. Si la red falla, se conserva la caché anterior. Nada bloquea el arranque.
4. Unirse descarga solo esa clase; salir borra la membresía local y deja la caché
   oculta por si el alumno vuelve.

## Contenido

- `lesson`: bloques debajo del contenido base, con el nombre de la clase.
- `exercise`: entra al mismo sorteo/práctica que los ejercicios existentes.
- `example`: entra al flujo de ejemplos guiados.
- El mismo `extra_id` en dos clases se muestra una vez y junta las etiquetas.

## Identidad y duplicados

- El UUID se genera al crear la cuenta y se guarda en `accounts.external_key`.
- El respaldo v4 lo incluye junto con las clases.
- Al importar un respaldo con otra identidad, el alumno vuelve a unirse a sus clases
  con la identidad restaurada y se retira del servidor la identidad temporal del
  dispositivo. Así el docente no ve dos alumnos por la misma persona.
- Sin respaldo no hay forma de reconocer a la persona: una reinstalación crea otra
  identidad y el progreso no se puede restaurar. Ese caso queda documentado como
  límite, no se intenta adivinar por nombre.

## Verificación

- `npx tsc --noEmit`, `npm run lint`, `npm test`: 57 suites / 363 tests.
- Fixture real del panel: `src/shared/services/content/remote/__fixtures__/panelClassRelease.json`
  validado con `parseClassRelease`.
- Pendiente: prueba manual en dispositivo con `EXPO_PUBLIC_DATA_MODE=hybrid` contra el
  panel desplegado.
