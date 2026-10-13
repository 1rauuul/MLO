# MOAM visual guidelines

## Stance

**Campus nocturno.** Una superficie de estudio oscura y tranquila, con acentos eléctricos que señalan avance y acción. La densidad es deliberadamente baja: cada bloque de contenido debe sentirse como una tarjeta de estudio enfocada, no como un panel administrativo.

## Typography

- Display / body: Source Sans 3 — claro, humano y resistente a lectura prolongada.
- Code / metadata: Fira Code — reservado para código, duración y etiquetas pedagógicas.

## Tokens

- Background dark: `#10151D`; raised surface: `#19212C`; card: `#1E2835`.
- Primary: `#4D7CFE`; success/progress: `#45D39A`; warm learning highlight: `#F3BC61`.
- Light background: `#F5F7FB`; light card: `#FFFFFF`; foreground: `#172033`.
- Corners: 16 px for cards, 14 px for controls, fully rounded only for compact pills.

## Composition

- Treat the 393 px view as the primary canvas; keep the reading column single-purpose.
- Use full-width cards separated by generous 16–24 px rhythm.
- Preserve visible progression: a module has status, a lesson has location, a quiz has question count.
- Do not use gradients. Use solid fields, hairline borders and a restrained glow only on the active continuation card.

## Interaction

- Controls are at least 44 px high and show a pressed transform.
- Correct and incorrect states pair color with explicit iconography and text.
- Honor reduced-motion by removing transforms and transitions.
