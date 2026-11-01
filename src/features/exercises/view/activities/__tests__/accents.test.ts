import { ACCENTS, accentForIndex } from '@/features/exercises/view/activities/accents';

describe('accentForIndex', () => {
  it('asigna un color distinto a cada elemento del sorteo', () => {
    const colors = ACCENTS.map((_, index) => accentForIndex(index));

    expect(new Set(colors).size).toBe(ACCENTS.length);
  });

  it('cicla y tolera índices negativos', () => {
    expect(accentForIndex(ACCENTS.length)).toBe(ACCENTS[0]);
    expect(accentForIndex(-1)).toBe(ACCENTS[ACCENTS.length - 1]);
  });
});
