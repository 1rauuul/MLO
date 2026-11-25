import {
  buildFillBank,
  crosswordCells,
  crosswordScore,
  extractFillAnswers,
  fillScore,
  isCrosswordCorrect,
  isFillCorrect,
  isMatchCorrect,
  matchScore,
  moveItem,
  orderScore,
  scrambleOrder,
  shuffleItems,
  splitFillSentences,
  isOrderCorrect,
  reorderItem,
} from '@/features/exercises/viewmodel/exercise.logic';

describe('exerciseLogic', () => {
  const correct = ['a', 'b', 'c', 'd'];

  it('valida una secuencia correcta', () => {
    expect(isOrderCorrect(['a', 'b', 'c', 'd'], correct)).toBe(true);
    expect(isOrderCorrect(['b', 'a', 'c', 'd'], correct)).toBe(false);
    expect(isOrderCorrect(['a', 'b', 'c'], correct)).toBe(false);
  });

  it('puntúa el orden por cada paso en su posición', () => {
    expect(orderScore(['a', 'b', 'c', 'd'], correct)).toEqual({ correct: 4, total: 4 });
    expect(orderScore(['a', 'c', 'b', 'd'], correct)).toEqual({ correct: 2, total: 4 });
  });

  it('intercambia elementos adyacentes', () => {
    expect(moveItem(correct, 0, 1)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveItem(correct, 3, -1)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('no mueve fuera de los límites', () => {
    expect(moveItem(correct, 0, -1)).toBe(correct);
    expect(moveItem(correct, 3, 1)).toBe(correct);
  });

  it('reordena moviendo un elemento a otra posición', () => {
    expect(reorderItem(correct, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(reorderItem(correct, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(reorderItem(correct, 1, 1)).toBe(correct);
    expect(reorderItem(correct, 0, 9)).toBe(correct);
  });

  it('genera un orden inicial distinto al correcto', () => {
    const scrambled = scrambleOrder(correct);
    expect(scrambled).toHaveLength(correct.length);
    expect(scrambled).not.toEqual(correct);
    expect([...scrambled].sort()).toEqual([...correct].sort());
  });

  it('nunca devuelve el orden correcto aunque el azar lo produzca', () => {
    const identityRandom = () => 0.999999;
    expect(scrambleOrder(['a', 'b', 'c'], identityRandom)).toEqual(['b', 'c', 'a']);
    expect(scrambleOrder(['a', 'b', 'c'], identityRandom)).not.toEqual(['a', 'b', 'c']);
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

  it('puntúa cada espacio correcto por separado', () => {
    expect(fillScore(sentences, ['Confiable', null])).toEqual({ correct: 1, total: 2 });
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

  it('puntúa cada par enlazado por separado', () => {
    expect(matchScore(pairs, rights, [1, 1])).toEqual({ correct: 1, total: 2 });
  });
});

describe('crossword', () => {
  const config = {
    crossword: {
      rows: 3,
      cols: 3,
      entries: [
        { word: 'SOL', clue: 'astro', row: 0, col: 0, direction: 'across' as const },
        { word: 'SAL', clue: 'condimento', row: 0, col: 0, direction: 'down' as const },
      ],
    },
  };

  it('genera celdas con su solución', () => {
    const cells = crosswordCells(config);
    expect(cells).toHaveLength(5);
    expect(cells.find(cell => cell.row === 0 && cell.col === 0)?.solution).toBe('S');
    expect(cells.find(cell => cell.row === 0 && cell.col === 2)?.solution).toBe('L');
    expect(cells.find(cell => cell.row === 2 && cell.col === 0)?.solution).toBe('L');
    expect(cells.find(cell => cell.row === 0 && cell.col === 0)?.entryIndexes).toEqual([0, 1]);
  });

  it('valida letras correctas', () => {
    const letters = { '0-0': 'S', '0-1': 'O', '0-2': 'L', '1-0': 'A', '2-0': 'L' };
    expect(isCrosswordCorrect(config, letters)).toBe(true);
    expect(isCrosswordCorrect(config, { '0-0': 'X' })).toBe(false);
  });

  it('puntúa cada celda correcta por separado', () => {
    expect(crosswordScore(crosswordCells(config), { '0-0': 'S' })).toEqual({ correct: 1, total: 5 });
  });
});
