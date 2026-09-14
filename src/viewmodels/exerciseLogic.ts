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
