export type OptionResult = 'correct' | 'wrong' | undefined;

export function optionResult(
  index: number,
  chosen: number | null,
  answer: number,
  answered: boolean,
): OptionResult {
  if (!answered || index !== chosen) {
    return undefined;
  }
  return chosen === answer ? 'correct' : 'wrong';
}
