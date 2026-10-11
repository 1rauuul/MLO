import {
  CHA_ITEMS,
  dominantStyle,
  isChaComplete,
  resolveChaStyle,
  scoreCha,
} from '../chaLogic';

describe('chaLogic', () => {
  it('no está completo con respuestas pendientes', () => {
    expect(isChaComplete([true, null, ...Array(CHA_ITEMS.length - 2).fill(false)])).toBe(false);
    expect(resolveChaStyle([])).toBeNull();
  });

  it('suma un punto por respuesta afirmativa al estilo del ítem', () => {
    const answers = CHA_ITEMS.map(item => item.style === 'Teórico');
    const scores = scoreCha(answers);
    expect(scores.Teórico).toBe(2);
    expect(scores.Activo).toBe(0);
  });

  it('resuelve el estilo dominante', () => {
    const answers = CHA_ITEMS.map(item => item.style === 'Pragmático');
    expect(resolveChaStyle(answers)).toBe('Pragmático');
  });

  it('rompe empates por orden de estilos', () => {
    expect(dominantStyle({ Activo: 2, Reflexivo: 2, Teórico: 0, Pragmático: 0 })).toBe('Activo');
  });

  it('devuelve null si no está completo', () => {
    expect(resolveChaStyle(CHA_ITEMS.map(() => null))).toBeNull();
  });
});
