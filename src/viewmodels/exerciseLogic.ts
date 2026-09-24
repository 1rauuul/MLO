import type { MatchPair } from '@/models/entities';

export function isOrderCorrect(steps: string[], correctOrder: string[]): boolean {
  return (
    steps.length === correctOrder.length && steps.every((step, index) => step === correctOrder[index])
  );
}

export function moveItem(items: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) {
    return items;
  }
  const next = [...items];
  const current = next[index];
  next[index] = next[target];
  next[target] = current;
  return next;
}

export function scrambleOrder(correctOrder: string[]): string[] {
  if (correctOrder.length < 3) {
    return [...correctOrder].reverse();
  }
  const shift = 2;
  return [...correctOrder.slice(shift), ...correctOrder.slice(0, shift)];
}

export interface FillSegment {
  text: string;
  blank: number | null;
}

const BLANK_PATTERN = /\{\{(.+?)\}\}/g;

export function extractFillAnswers(sentences: string[]): string[] {
  const answers: string[] = [];
  for (const sentence of sentences) {
    for (const match of sentence.matchAll(BLANK_PATTERN)) {
      answers.push(match[1] ?? '');
    }
  }
  return answers;
}

export function splitFillSentences(sentences: string[]): FillSegment[][] {
  let blankIndex = 0;
  return sentences.map(sentence => {
    const segments: FillSegment[] = [];
    let cursor = 0;
    for (const match of sentence.matchAll(BLANK_PATTERN)) {
      const start = match.index ?? 0;
      if (start > cursor) {
        segments.push({ text: sentence.slice(cursor, start), blank: null });
      }
      segments.push({ text: '', blank: blankIndex });
      blankIndex += 1;
      cursor = start + match[0].length;
    }
    if (cursor < sentence.length) {
      segments.push({ text: sentence.slice(cursor), blank: null });
    }
    return segments;
  });
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function isFillCorrect(sentences: string[], assignment: (string | null)[]): boolean {
  const answers = extractFillAnswers(sentences);
  if (answers.length !== assignment.length) {
    return false;
  }
  return answers.every((answer, index) => {
    const chosen = assignment[index];
    return chosen !== null && normalizeAnswer(chosen) === normalizeAnswer(answer);
  });
}

export function shuffleItems<T>(items: T[], rand: () => number): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rand() * (index + 1));
    const current = next[index];
    next[index] = next[target];
    next[target] = current;
  }
  return next;
}

export function buildFillBank(sentences: string[], rand: () => number): string[] {
  return shuffleItems(extractFillAnswers(sentences), rand);
}

export function isMatchCorrect(
  pairs: MatchPair[],
  shuffledRights: string[],
  assignment: (number | null)[],
): boolean {
  if (pairs.length === 0 || assignment.length !== pairs.length) {
    return false;
  }
  return pairs.every((pair, index) => {
    const rightPosition = assignment[index];
    return rightPosition !== null && shuffledRights[rightPosition] === pair.right;
  });
}
