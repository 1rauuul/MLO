import type { ExampleStep, Exercise } from '@/models/entities';

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
