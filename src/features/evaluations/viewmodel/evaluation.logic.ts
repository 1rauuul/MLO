import type { Question } from '@/shared/model/entities';

import {
  crosswordCells,
  isCrosswordCorrect,
  isFillCorrect,
  isMatchCorrect,
  isOrderCorrect,
  shuffleItems,
} from '@/features/exercises/viewmodel/exercise.logic';

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

// Baraja las opciones de una pregunta mcq y reajusta el índice correcto,
// para que el alumno no memorice la posición de la respuesta.
export function shuffleQuestionOptions(
  question: Question,
  random: () => number = Math.random,
): Question {
  if (question.type !== 'mcq' || question.options.length < 2) {
    return question;
  }
  const indexed = question.options.map((option, index) => ({ option, index }));
  const shuffled = shuffleItems(indexed, random);
  return {
    ...question,
    options: shuffled.map(item => item.option),
    answer: shuffled.findIndex(item => item.index === question.answer),
  };
}

export const EVALUATION_QUESTIONS_COUNT = 10;
export const EVALUATION_EXERCISES_COUNT = 5;

export interface EvaluationPool {
  questions: Question[];
  exercises: Question[];
  mixed: Question[];
}

function dedupeByPrompt(pool: Question[], seen: Set<string>): Question[] {
  return pool.filter(question => {
    if (question.prompt.length === 0) {
      return true;
    }
    if (seen.has(question.prompt)) {
      return false;
    }
    seen.add(question.prompt);
    return true;
  });
}

// Arma el pool de la evaluación: 10 preguntas + 5 ejercicios, mezclados y
// con las opciones de cada mcq barajadas. Descarta prompts repetidos.
export function buildEvaluationPool(
  questionPool: Question[],
  exercisePool: Question[],
  random: () => number = Math.random,
  questionCount: number = EVALUATION_QUESTIONS_COUNT,
  exerciseCount: number = EVALUATION_EXERCISES_COUNT,
): EvaluationPool {
  const questions = dedupeByPrompt(shuffleItems(questionPool, random), new Set()).slice(
    0,
    questionCount,
  );
  const exercises = dedupeByPrompt(
    shuffleItems(exercisePool, random),
    new Set(questions.map(question => question.prompt)),
  ).slice(0, exerciseCount);
  const mixed = shuffleItems([...questions, ...exercises], random).map(question =>
    shuffleQuestionOptions(question, random),
  );
  return { questions, exercises, mixed };
}
