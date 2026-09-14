import { isOrderCorrect, moveItem, scrambleOrder } from '../exerciseLogic';

describe('exerciseLogic', () => {
  const correct = ['a', 'b', 'c', 'd'];

  it('valida una secuencia correcta', () => {
    expect(isOrderCorrect(['a', 'b', 'c', 'd'], correct)).toBe(true);
    expect(isOrderCorrect(['b', 'a', 'c', 'd'], correct)).toBe(false);
    expect(isOrderCorrect(['a', 'b', 'c'], correct)).toBe(false);
  });

  it('intercambia elementos adyacentes', () => {
    expect(moveItem(correct, 0, 1)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveItem(correct, 3, -1)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('no mueve fuera de los límites', () => {
    expect(moveItem(correct, 0, -1)).toBe(correct);
    expect(moveItem(correct, 3, 1)).toBe(correct);
  });

  it('genera un orden inicial distinto al correcto', () => {
    const scrambled = scrambleOrder(correct);
    expect(scrambled).toHaveLength(correct.length);
    expect(scrambled).not.toEqual(correct);
    expect([...scrambled].sort()).toEqual([...correct].sort());
  });
});
