import {
  buildFillBank,
  extractFillAnswers,
  isFillCorrect,
  isMatchCorrect,
  moveItem,
  scrambleOrder,
  shuffleItems,
  splitFillSentences,
  isOrderCorrect,
} from '../exerciseLogic';

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

describe('fill (completar conceptos)', () => {
  const sentences = [
    'El buen software debe ser {{confiable}} y utilizable.',
    'Los productos {{genéricos}} se venden en el mercado abierto.',
  ];

  it('extrae las respuestas en orden', () => {
    expect(extractFillAnswers(sentences)).toEqual(['confiable', 'genéricos']);
  });

  it('divide frases en segmentos con índices globales de espacio', () => {
    const segments = splitFillSentences(sentences);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual([
      { text: 'El buen software debe ser ', blank: null },
      { text: '', blank: 0 },
      { text: ' y utilizable.', blank: null },
    ]);
    expect(segments[1]?.some(segment => segment.blank === 1)).toBe(true);
  });

  it('valida una asignación correcta sin importar mayúsculas', () => {
    expect(isFillCorrect(sentences, ['Confiable', 'genéricos'])).toBe(true);
  });

  it('rechaza asignaciones incompletas o erróneas', () => {
    expect(isFillCorrect(sentences, ['confiable', null])).toBe(false);
    expect(isFillCorrect(sentences, ['confiable', 'personalizados'])).toBe(false);
  });

  it('construye un banco con las mismas palabras', () => {
    const bank = buildFillBank(sentences, () => 0.5);
    expect([...bank].sort()).toEqual(['confiable', 'genéricos']);
  });

  it('shuffleItems conserva los elementos', () => {
    const shuffled = shuffleItems(['a', 'b', 'c'], () => 0.9);
    expect([...shuffled].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('match (enlazar conceptos)', () => {
  const pairs = [
    { left: 'Mantenimiento', right: 'Evolucionar con el cambio' },
    { left: 'Eficiencia', right: 'No desperdiciar recursos' },
  ];
  const rights = ['No desperdiciar recursos', 'Evolucionar con el cambio'];

  it('valida un enlace correcto', () => {
    expect(isMatchCorrect(pairs, rights, [1, 0])).toBe(true);
  });

  it('rechaza enlaces incompletos o cruzados', () => {
    expect(isMatchCorrect(pairs, rights, [1, null])).toBe(false);
    expect(isMatchCorrect(pairs, rights, [0, 1])).toBe(false);
  });
});
