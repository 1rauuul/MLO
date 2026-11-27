import type { ActivityType, Question } from '@/shared/model/entities';
import { BLANK_PATTERN } from '@/shared/utils/exerciseRules';
import type { AttemptSummary } from '@/features/evaluations/viewmodel/analytics.logic';

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

// Solución legible de cada tipo de reactivo, usando el contenido vigente.
export function describeCorrectAnswer(question: Question): string {
  switch (question.type) {
    case 'mcq':
      return question.options[question.answer] ?? '';
    case 'order':
      return question.options.join(' → ');
    case 'fill':
      return (question.config.sentences ?? [])
        .map(sentence => sentence.replace(BLANK_PATTERN, (_, answer: string) => answer))
        .join(' ');
    case 'match':
      return (question.config.pairs ?? []).map(pair => `${pair.left} → ${pair.right}`).join(' · ');
    case 'crossword':
      return (question.config.crossword?.entries ?? [])
        .map(entry => entry.word.toUpperCase())
        .join(' · ');
  }
}

export interface AnswerFeedback {
  questionId: string;
  prompt: string;
  type: ActivityType;
  correct: boolean;
  solution: string;
  explanation: string;
  response: string;
}

export function describeSubmittedAnswer(question: Question, answer: EvaluationAnswer | null): string {
  if (!answer || answer.type !== question.type) return 'Sin respuesta';
  switch (answer.type) {
    case 'mcq': return question.options[answer.chosen] ?? 'Sin respuesta';
    case 'order': return answer.steps.join(' → ');
    case 'fill': {
      let index = 0;
      return (question.config.sentences ?? []).map(sentence =>
        sentence.replace(BLANK_PATTERN, () => answer.assignment[index++] ?? '_____'),
      ).join(' ');
    }
    case 'match': return (question.config.pairs ?? []).map((pair, index) => {
      const assigned = answer.assignment[index];
      return `${pair.left} → ${assigned == null ? 'Sin respuesta' : answer.rights[assigned] ?? 'Sin respuesta'}`;
    }).join(' · ');
    case 'crossword': return (question.config.crossword?.entries ?? []).map(entry =>
      Array.from(entry.word).map((_, index) => answer.letters[
        `${entry.row + (entry.direction === 'down' ? index : 0)}-${entry.col + (entry.direction === 'across' ? index : 0)}`
      ] || '_').join(''),
    ).join(' · ');
  }
}

/** Resultados del intento actual, independientes del historial de práctica y evaluación. */
export function summarizeEvaluation(questions: Question[], answers: (EvaluationAnswer | null)[]): AttemptSummary {
  const byType: AttemptSummary['byType'] = {};
  let correct = 0;
  for (const item of summarizeAnswers(questions, answers)) {
    const bucket = byType[item.type] ?? { total: 0, correct: 0 };
    bucket.total += 1;
    if (item.correct) { bucket.correct += 1; correct += 1; }
    byType[item.type] = bucket;
  }
  return { total: questions.length, correct, accuracy: questions.length ? correct / questions.length : 0, byType };
}

// Retroalimentación por reactivo al terminar; no depende de resultados guardados
// porque DEC-08 conserva solo los agregados por intento.
export function summarizeAnswers(
  questions: Question[],
  answers: (EvaluationAnswer | null)[],
): AnswerFeedback[] {
  return questions.map((question, index) => {
    const answer = answers[index] ?? null;
    return {
      questionId: question.id,
      prompt: question.prompt,
      type: question.type,
      correct: answer ? isAnswerCorrect(question, answer) : false,
      solution: describeCorrectAnswer(question),
      explanation: question.explanation,
      response: describeSubmittedAnswer(question, answer),
    };
  });
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
  isComplete: boolean;
}

function normalizedText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-MX');
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return typeof value === 'string' ? normalizedText(value) : value;
}

function questionFingerprint(question: Question): string {
  return JSON.stringify({
    type: question.type,
    prompt: normalizedText(question.prompt),
    options: question.options.map(normalizedText),
    answer: question.answer,
    config: stableValue(question.config),
  });
}

function dedupeQuestions(
  pool: Question[],
  seenIds: Set<string>,
  seenFingerprints: Set<string>,
): Question[] {
  return pool.filter(question => {
    const id = normalizedText(question.id);
    const fingerprint = questionFingerprint(question);
    if ((id && seenIds.has(id)) || seenFingerprints.has(fingerprint)) {
      return false;
    }
    if (id) {
      seenIds.add(id);
    }
    seenFingerprints.add(fingerprint);
    return true;
  });
}

// Arma el pool de la evaluación: 10 preguntas + 5 ejercicios, mezclados y
// con las opciones de cada mcq barajadas. Descarta el mismo reactivo aunque
// llegue desde fuentes distintas, pero conserva consignas genéricas válidas.
export function buildEvaluationPool(
  questionPool: Question[],
  exercisePool: Question[],
  random: () => number = Math.random,
  questionCount: number = EVALUATION_QUESTIONS_COUNT,
  exerciseCount: number = EVALUATION_EXERCISES_COUNT,
): EvaluationPool {
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const questions = dedupeQuestions(
    shuffleItems(questionPool, random),
    seenIds,
    seenFingerprints,
  ).slice(
    0,
    questionCount,
  );
  const exercises = dedupeQuestions(
    shuffleItems(exercisePool, random),
    seenIds,
    seenFingerprints,
  ).slice(0, exerciseCount);
  const mixed = shuffleItems([...questions, ...exercises], random).map(question =>
    shuffleQuestionOptions(question, random),
  );
  return {
    questions,
    exercises,
    mixed,
    isComplete: questions.length === questionCount && exercises.length === exerciseCount,
  };
}
