export const ACCENTS = ['#4D7CFE', '#45D39A', '#F3BC61', '#EE6F7D', '#8B7CFE', '#4DD0E1'];

export function accentForIndex(index: number): string {
  return ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length]!;
}
