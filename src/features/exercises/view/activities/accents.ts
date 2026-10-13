export const ACCENTS = ['#4D7CFE', '#45D39A', '#F3BC61', '#EE6F7D', '#8B7CFE', '#4DD0E1'];

export function accentForIndex(index: number): string {
  return ACCENTS[((index % ACCENTS.length) + ACCENTS.length) % ACCENTS.length]!;
}

export function accentForText(text: string): string {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash + text.charCodeAt(index)) % 997;
  }
  return ACCENTS[hash % ACCENTS.length]!;
}
