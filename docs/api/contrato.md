# Contrato de API — contenido publicado (borrador)

Solo contenido. La sincronización de progreso, `sync/*` y `auth/*` quedan
fuera de alcance: SQLite sigue siendo la fuente de verdad local y la app
funciona sin red con `DATA_MODE=local` (valor por defecto).

- Base URL: `EXPO_PUBLIC_API_URL` (sin secretos en el cliente).
- Formato: JSON UTF-8. Fechas ISO-8601.
- Idempotencia: `GET` es de solo lectura; no hay escritura remota.
- Errores: `4xx` y `5xx` con cuerpo `{ "error": string, "message": string }`.

## GET /content/manifest

Devuelve la versión publicada y un hash por lección. El cliente compara el
hash global con el suyo y no descarga nada si coincide.

```json
{
  "version": "2026-10-23",
  "hash": "8f14e45f",
  "lessons": [{ "lessonId": "l1.2", "hash": "a1b2c3d4" }]
}
```

## GET /content/lessons/{lessonId}

Devuelve ejercicios, ejemplos y preguntas validadas con `parse*Seed`. Los
ejercicios conservan el formato `ExerciseSeed`; las preguntas van asociadas a
su evaluación.

```json
{
  "lessonId": "l1.2",
  "exercises": [
    {
      "id": "ord1.2",
      "lessonId": "l1.2",
      "type": "order",
      "prompt": "Actividades fundamentales del proceso",
      "instructions": "Usa las flechas para ordenar la secuencia correcta.",
      "correctOrder": ["Especificación", "Desarrollo", "Validación", "Evolución"],
      "config": {},
      "explanation": "…",
      "example": {
        "title": "Las cuatro actividades del proceso",
        "steps": [{ "text": "Especificar", "why": "Fija el problema." }],
        "hints": ["Piensa qué ocurre antes de escribir código."]
      }
    }
  ],
  "examples": [
    {
      "id": "exA1.2",
      "lessonId": "l1.2",
      "type": "match",
      "title": "Atributos del buen software",
      "prompt": "Enlaza cada atributo con su descripción",
      "config": { "pairs": [{ "left": "Mantenimiento", "right": "…" }] },
      "steps": [{ "text": "…", "why": "…" }],
      "hints": ["…"],
      "explanation": "…"
    }
  ],
  "questions": [
    {
      "evaluationId": "ev1.2",
      "question": {
        "id": "ev1.2-bank-q01",
        "type": "mcq",
        "prompt": "¿Cuál es un atributo esencial del buen software?",
        "options": ["…", "…"],
        "answer": 1,
        "explanation": "…"
      }
    }
  ]
}
```

## Reglas del cliente

1. Con `DATA_MODE=local` no se ejecuta ninguna petición.
2. Un manifiesto o contenido inválido se descarta (`ParseError`) y se conserva
   el contenido local.
3. Una respuesta `5xx` o un `NetworkError` se reintenta con backoff exponencial;
   un `4xx` no se reintenta.
4. El contenido remoto aplicado no borra huérfanos: el contenido empaquetado
   sigue decidiendo qué se elimina.
