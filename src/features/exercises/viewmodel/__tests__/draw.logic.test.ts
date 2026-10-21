import { drawGroups } from '@/features/exercises/viewmodel/draw.logic';

describe('drawGroups', () => {
  it('no repite ids entre ejemplos y ejercicios', () => {
    const examples = ['a', 'b', 'c', 'd', 'e'];
    const exercises = ['c', 'd', 'e', 'f', 'g'];
    const { exampleIds, exerciseIds } = drawGroups(examples, exercises, 3, () => 0.5);
    const overlap = exampleIds.filter(id => exerciseIds.includes(id));
    expect(overlap).toEqual([]);
  });

  it('respeta el máximo solicitado por grupo', () => {
    const { exampleIds, exerciseIds } = drawGroups(
      ['a', 'b'],
      ['x', 'y', 'z'],
      10,
      () => 0.3,
    );
    expect(exampleIds.length).toBeLessThanOrEqual(2);
    expect(exerciseIds.length).toBeLessThanOrEqual(3);
  });

  it('excluye de ejemplos los ids elegidos como ejercicio', () => {
    const { exampleIds, exerciseIds } = drawGroups(['a', 'b'], ['a', 'b'], 1, () => 0);
    const overlap = exampleIds.filter(id => exerciseIds.includes(id));
    expect(overlap).toEqual([]);
  });
});
