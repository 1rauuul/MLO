import type { Example, ExampleStep, Exercise } from '@/shared/model/entities';

/** Ejemplos independientes (sin fila en `exercises`) que se muestran siempre. */
export function syntheticExamples(exercises: Exercise[], examples: Example[]): Exercise[] {
  const exerciseIds = new Set(exercises.map(exercise => exercise.id));
  return examples
    .filter(example => !exerciseIds.has(example.id) && example.type !== 'order')
    .map(example => ({
      id: example.id,
      lessonId: example.lessonId,
      type: example.type,
      prompt: example.prompt,
      instructions: '',
      correctOrder: [],
      config: example.config,
      explanation: example.explanation,
      className: example.className,
    }));
}

function fillSentence(sentence: string): string {
  return sentence.replace(/\{\{(.+?)\}\}/g, '$1');
}

export function demoSteps(exercise: Exercise): ExampleStep[] {
  const why = exercise.explanation || 'Así se resuelve aplicando lo visto en la lección.';
  switch (exercise.type) {
    case 'order':
      return exercise.correctOrder.map(item => ({ text: item, why }));
    case 'match':
      return (exercise.config.pairs ?? []).map(pair => ({
        text: `${pair.left} → ${pair.right}`,
        why,
      }));
    case 'fill':
      return (exercise.config.sentences ?? []).map(sentence => ({
        text: fillSentence(sentence),
        why,
      }));
    case 'crossword':
      return (exercise.config.crossword?.entries ?? []).map(entry => ({
        text: `${entry.word} — ${entry.clue}`,
        why,
      }));
    default:
      return [];
  }
}

export function hasDemo(exercise: Exercise): boolean {
  return demoSteps(exercise).length > 0;
}
