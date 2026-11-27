# MOAM visual guidelines

## Stance

**Campus nocturno.** Una superficie de estudio oscura y tranquila, con acentos eléctricos que señalan avance y acción. La densidad es deliberadamente baja: cada bloque de contenido debe sentirse como una tarjeta de estudio enfocada, no como un panel administrativo.

## Typography

- Display / body: Source Sans 3 — claro, humano y resistente a lectura prolongada.
- Code / metadata: Fira Code — reservado para código, duración y etiquetas pedagógicas.

## Tokens

- Background dark: `#10171E`; raised surface: `#243444`; card: `#1B2835`; border: `#304153`.
- Primary: `#5285FF`; success/progress: `#2DD4A0`; warning: `#FFC266`; error: `#FF7373`.
- Learning sections: lessons `#5285FF`, examples `#38BFA0`, exercises `#F0B454`, evaluation `#9483FF`. Light mode uses the darker variants from `learningAccents` for contrast.
- Light background: `#F5F7FB`; light card: `#FFFFFF`; foreground: `#172033`.
- Corners: 16 px for cards, 12 px for controls, fully rounded only for compact pills.
- Typography comes from `shared/theme/tokens.ts`: 28 px titles, 20 px headings, 16/25 px body, 14/20 px secondary text, before the existing enlarged-text scale. Monospace is reserved for code and measurements.

## Composition

- Treat the 393 px view as the primary canvas; keep the reading column single-purpose.
- Use full-width cards separated by generous 16–24 px rhythm.
- Preserve visible progression: a module has status, a lesson has location, a quiz has question count.
- The subtopic learning route is a vertical list; show progress only from recorded data. Lesson paragraphs remain justified, without an outer card. Wide tables scroll horizontally while preserving their headers and column relationships.
- In fill activities, answers remain inside the sentence with the same size, weight and baseline. Selection and checking are separate states in every activity.
- Evaluation solutions appear only after confirming completion. Results and review describe the current attempt, including multiple-choice questions and the learner's submitted answers.
- Do not use gradients. Use solid fields, hairline borders and a restrained glow only on the active continuation card.

## Interaction

- Controls are at least 44 px high and show a pressed transform.
- Correct and incorrect states pair color with explicit iconography and text.
- Honor reduced-motion by removing transforms and transitions.
