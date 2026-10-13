import type { Question } from '@/models/entities';

import {
  crosswordCells,
  isCrosswordCorrect,
  isFillCorrect,
  isMatchCorrect,
  isOrderCorrect,
} from './exerciseLogic';

export type EvaluationAnswer =
  | { type: 'mcq'; chosen: number }
  | { type: 'order'; steps: string[] }
  | { type: 'fill'; ordered: string[]; assignment: (string | null)[] }
  | { type: 'match'; rights: string[]; assignment: (number | null)[] }
  | { type: 'crossword'; letters: Record<string, string> };

export function isAnswerComplete(question: Question, answer: EvaluationAnswer | null): boolean {
  if (!answer || answer.type !== question.type) {
    return false;
  }
  switch (answer.type) {
    case 'mcq':
    case 'order':
      return true;
    case 'fill':
      return answer.assignment.length > 0 && answer.assignment.every(item => item !== null);
    case 'match':
      return answer.assignment.length > 0 && answer.assignment.every(item => item !== null);
    case 'crossword': {
      const cells = crosswordCells(question.config);
      return (
        cells.length > 0 &&
        cells.every(cell => (answer.letters[`${cell.row}-${cell.col}`] ?? '') !== '')
      );
    }
  }
}

export function isAnswerCorrect(question: Question, answer: EvaluationAnswer): boolean {
  switch (answer.type) {
    case 'mcq':
      return answer.chosen === question.answer;
    case 'order':
      return isOrderCorrect(answer.steps, question.options);
    case 'fill':
      return isFillCorrect(answer.ordered, answer.assignment);
    case 'match':
      return isMatchCorrect(question.config.pairs ?? [], answer.rights, answer.assignment);
    case 'crossword':
      return isCrosswordCorrect(question.config, answer.letters);
  }
}
