# APK que consume contenido remoto

Todo lo que falta para que un APK de MLO descargue el contenido publicado desde el
sistema de maestros. La app ya trae el cliente completo; lo que no trae es la
configuración de compilación ni un servidor con contenido.

## Estado real hoy

| Pieza | Estado |
|---|---|
| Cliente del contrato v2 (`GET /groups/{code}`, manifest, lección) | Implementado |
| Pantalla "Unirme a un grupo" y curso activo por cuenta | Implementado |
| Descarga en segundo plano + área de espera + aplicación al arrancar | Implementado |
| `eas.json` con `EXPO_PUBLIC_DATA_MODE=hybrid` y `EXPO_PUBLIC_API_URL` | **Falta** |
| Servidor desplegado con un release publicado y un grupo con código | **Falta** (fuera de este repo) |

Sin los dos últimos puntos, el APK sale en `local`: no hace ninguna petición, oculta
la entrada de grupos y no descarga nada.

## Los cuatro pasos

1. Exportar el contenido incluido al panel de maestros.
2. Publicar un release y crear un grupo (obtener el código).
3. Compilar el APK con las dos variables de entorno.
4. Instalar, iniciar sesión y unirse con el código.

---

## 1. Exportar el curso base al panel

El repositorio incluye el exportador `scripts/export-base.ts`: lee el contenido
empaquetado (unidades, lecciones, bloques, ejercicios, ejemplos y preguntas) y escribe
el JSON que importa el panel.

```powershell
npx --yes tsx scripts/export-base.ts ..\mlo-teachers\scripts\fixtures\base-course.json
```

Salida esperada (verificada con el contenido actual):

```
Exportado: 5 unidades, 25 lecciones, 44 ejercicios, 3 ejemplos, 76 preguntas.
```

El JSON lleva `schemaVersion: 2` y campos `content_id`, `unit_content_id`,
`lesson_content_id`, `evaluation_content_id`, en la forma que documenta el script.
Si el panel espera otro nombre de archivo o ruta, solo cambia el destino: el formato
no. Cada vez que cambie `seed.ts`, `richContent.ts`, `unit1.content.ts` o un banco,
hay que volver a exportar e importar para que el servidor tenga la misma foto.

## 2. Publicar y crear el grupo

En el panel:

1. Importar el JSON al curso `base` (o duplicarlo a un curso propio del maestro).
2. Verificar que el release valide: ids únicos, referencias lección → unidad,
   evaluación con preguntas suficientes.
3. **Publicar el release.** Cada publicación debe subir `version` (entero) y cambiar
   los hashes; un manifest con la misma versión y otro hash se descarta.
4. Crear un **grupo** que apunte a ese curso y anotar su **código de 6 caracteres**.

Prueba de humo antes de tocar la app (los endpoints no llevan secretos):

```powershell
curl.exe -s "https://<host>/api/mlo/v2/catalogs/<catalogId>/manifest"
curl.exe -s "https://<host>/api/mlo/v2/catalogs/<catalogId>/lessons/<lessonId>"
curl.exe -s "https://<host>/api/mlo/v2/groups/<CODIGO>"
```

Deben responder JSON con `schemaVersion: 2`. El manifest no puede venir vacío ni con
`hash` vacío, y `lessons[].hash` debe coincidir con el `hash` de cada lección.

> **Cuidado con el curso `base`.** La app refresca siempre `base` además de los cursos
> de los grupos. Si publicas `base` con solo una parte de las lecciones, al siguiente
> arranque las lecciones que no estén en el manifest se **archivan** (se ocultan), y el
> contenido incluido no las recupera al actualizar la app. Publica `base` completo, o
> no lo publiques y reparte el contenido solo por grupos.

## 3. Compilar el APK con el modo híbrido

Las variables `EXPO_PUBLIC_*` se incrustan en el bundle **al compilar**; no se pueden
cambiar en un APK ya instalado.

En `eas.json`, dentro del perfil `preview` (el que usa `npm run demo:apk`):

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_DATA_MODE": "hybrid",
        "EXPO_PUBLIC_API_URL": "https://<host>/api/mlo/v2"
      }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

Notas:

- `.env` está en `.gitignore` y EAS no lo sube: en la nube manda el `env` de
  `eas.json` (o las variables del proyecto en EAS). El `.env` local sirve para
  `npm start`.
- La URL va sin barra final y **con** `/api/mlo/v2`; no lleva secretos.
- `production` puede quedarse en `local` hasta validar; el modo se decide por perfil.

Compilar:

```powershell
npm run demo:apk
```

Para probar antes, sin APK, con `.env`:

```
EXPO_PUBLIC_DATA_MODE=hybrid
EXPO_PUBLIC_API_URL=https://<host>/api/mlo/v2
```

y `npm start` (reinicia el servidor de Metro al cambiar el `.env`).

## 4. Instalar y unirse

1. Instalar el APK e iniciar sesión (crear cuenta si hace falta: el progreso es local).
2. **Perfil → Unirme a un grupo** (la sección "Grupo" solo aparece en `hybrid`).
3. Escribir el código de 6 caracteres y confirmar.
4. El indicador descarga el curso completo, lo valida y lo aplica **en el acto**.
5. El hub debe mostrar las unidades y lecciones del curso del maestro, y el Perfil el
   nombre del grupo y el curso.

Qué no debe pasar: si algo falla, la cuenta se queda en su curso anterior. Los errores
tienen mensaje propio (`not_found`, `closed`, `rate_limited`, `content_missing`,
`config`, `network`, `invalid`, `incomplete`).

## Cómo se comporta después (sin recompilar)

- Los cambios publicados se descargan en segundo plano al abrir la app y, como mucho,
  cada 15 minutos al volver a primer plano.
- Se aplican en el **siguiente arranque** (cierra y abre la app dos veces: la primera
  descarga, la segunda aplica). Unirse a un grupo es la excepción: aplica al momento.
- Lo que el maestro retira se archiva, no se borra: el progreso de `attempts`,
  `module_progress` y `evaluation_results` se conserva.
- No se recompila ni se sube `DATABASE_VERSION` por publicar contenido.

## Verificación

Antes de dar el APK por bueno:

- [ ] `curl.exe` de los tres endpoints devuelve `schemaVersion: 2`.
- [ ] El manifest trae todas las lecciones del curso y hashes no vacíos.
- [ ] En el APK, Perfil muestra "Unirme a un grupo".
- [ ] Al unirse, el hub muestra el curso del grupo y el Perfil el nombre del maestro.
- [ ] La lectura muestra los bloques; la práctica tiene ≥ 2 ejercicios; la evaluación corre.
- [ ] Con el modo avión, la app abre y muestra el contenido ya descargado.
- [ ] Publicar un cambio, reabrir dos veces y ver el cambio aplicado.
- [ ] Retirar una lección del release la oculta y el progreso anterior sigue contando.

En builds de desarrollo (`__DEV__`), los fallos de sincronización se registran como
`[content] ...`; en el APK de release no hay log, así que conviene validar antes con
`npm start` contra el mismo servidor.

## Problemas frecuentes

| Síntoma | Causa |
|---|---|
| No aparece "Unirme a un grupo" | El APK salió en `local`: falta `EXPO_PUBLIC_DATA_MODE=hybrid` en el perfil con el que se compiló |
| "La app no tiene configurado el servicio de contenido" | `EXPO_PUBLIC_API_URL` vacía o con `/api/mlo/v2` mal escrito |
| El código da "no existe" | Código mal copiado (`0/O/1/I/L` no se usan) o grupo de otro entorno |
| "El curso de este grupo todavía no está disponible" | El catálogo no tiene release publicado (404/410) |
| "El contenido del grupo no es válido" | El payload no cumple el contrato (ver la guía de contenido y `docs/api/contrato.md`) |
| Se descarga pero no se ve | Falta el segundo arranque para aplicar el área de espera |
| Cambié contenido y no llega | El release no subió `version`/`hash`, o el curso no es el del grupo activo |

## Volver a `local`

Quitar el bloque `env` del perfil `preview` y recompilar. Ojo: un dispositivo que ya se
unió a un grupo conserva `account_group` y el contenido descargado en SQLite, así que
seguirá viendo ese curso sin poder cambiar de grupo (la entrada está oculta). Para
volver al curso base hay que salir del grupo **antes** de instalar el APK local, o
borrar los datos de la app.

## Referencias

- Contrato: [`docs/api/contrato.md`](../api/contrato.md)
- Cómo se agrega contenido (incluido y remoto): [`como-agregar-contenido.md`](como-agregar-contenido.md)
- Plan del servidor: [`docs/planes/PLAN-sistema-maestro.md`](../planes/PLAN-sistema-maestro.md)
- Consumo en MLO: [`docs/planes/PLAN-mlo-contenido-remoto.md`](../planes/PLAN-mlo-contenido-remoto.md)
