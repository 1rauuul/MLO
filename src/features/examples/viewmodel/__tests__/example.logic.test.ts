import type { Exercise } from '@/shared/model/entities';

import { demoSteps } from '@/features/examples/viewmodel/example.logic';
import { hintsForType } from '@/features/exercises/viewmodel/exercise.hints';

const base: Exercise = {
  id: 'x',
  lessonId: 'l1.2',
  type: 'order',
  prompt: 'p',
  instructions: 'i',
  correctOrder: ['a', 'b'],
  config: {},
  explanation: 'porqué',
};

describe('demoSteps', () => {
  it('genera pasos para ordenar desde el orden correcto', () => {
    const steps = demoSteps(base);
    expect(steps.map(step => step.text)).toEqual(['a', 'b']);
    expect(steps[0]?.why).toBe('porqué');
  });

  it('genera pasos para enlazar desde los pares', () => {
    const steps = demoSteps({
      ...base,
      type: 'match',
      config: { pairs: [{ left: 'A', right: 'B' }] },
    });
    expect(steps[0]?.text).toBe('A → B');
  });

  it('muestra las respuestas en completar', () => {
    const steps = demoSteps({
      ...base,
      type: 'fill',
      config: { sentences: ['El software es {{confiable}}.'] },
    });
    expect(steps[0]?.text).toBe('El software es confiable.');
  });

  it('genera pasos para el crucigrama desde las entradas', () => {
    const steps = demoSteps({
      ...base,
      type: 'crossword',
      config: {
        crossword: {
          rows: 3,
          cols: 3,
          entries: [{ word: 'SOL', clue: 'astro', row: 0, col: 0, direction: 'across' }],
        },
      },
    });
    expect(steps[0]?.text).toBe('SOL — astro');
  });
});

describe('hintsForType', () => {
  it('ofrece pistas para los cuatro tipos', () => {
    (['order', 'fill', 'match', 'crossword'] as const).forEach(type => {
      expect(hintsForType(type).length).toBeGreaterThan(0);
    });
  });
});
