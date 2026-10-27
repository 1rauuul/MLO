import type { ExerciseConfig } from '@/shared/model/entities';

export const BLANK_PATTERN = /\{\{(.+?)\}\}/g;

export function extractFillAnswers(sentences: string[]): string[] {
  const answers: string[] = [];
  for (const sentence of sentences) {
    for (const match of sentence.matchAll(BLANK_PATTERN)) {
      answers.push(match[1] ?? '');
    }
  }
  return answers;
}

export interface CrosswordCell {
  row: number;
  col: number;
  entryIndexes: number[];
  solution: string;
}

export function crosswordCells(config: ExerciseConfig): CrosswordCell[] {
  const crossword = config.crossword;
  if (!crossword) {
    return [];
  }
  const cells = new Map<string, CrosswordCell>();
  crossword.entries.forEach((entry, entryIndex) => {
    const stepRow = entry.direction === 'down' ? 1 : 0;
    const stepCol = entry.direction === 'across' ? 1 : 0;
    for (let offset = 0; offset < entry.word.length; offset += 1) {
      const row = entry.row + stepRow * offset;
      const col = entry.col + stepCol * offset;
      const key = `${row}-${col}`;
      const existing = cells.get(key);
      if (existing) {
        existing.entryIndexes.push(entryIndex);
      } else {
        cells.set(key, {
          row,
          col,
          entryIndexes: [entryIndex],
          solution: entry.word[offset]!.toUpperCase(),
        });
      }
    }
  });
  return [...cells.values()];
}
