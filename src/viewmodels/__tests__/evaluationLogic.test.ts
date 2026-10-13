import type { Question } from '@/models/entities';

import { isAnswerComplete, isAnswerCorrect } from '../evaluationLogic';

const base = { evaluationId: 'ev', orderIndex: 0, prompt: '', explanation: '' };

const mcqQuestion: Question = {
  ...base,
  id: 'mcq',
  type: 'mcq',
  config: {},
  options: ['a', 'b'],
  answer: 1,
};
const orderQuestion: Question = {
  ...base,
  id: 'order',
  type: 'order',
  config: {},
  options: ['a', 'b', 'c'],
  answer: 0,
};
const fillQuestion: Question = {
  ...base,
  id: 'fill',
  type: 'fill',
  config: { sentences: ['El {{uno}} y {{dos}}.'] },
  options: [],
  answer: 0,
};
const matchQuestion: Question = {
  ...base,
  id: 'match',
  type: 'match',
  config: {
    pairs: [
      { left: 'a', right: '1' },
      { left: 'b', right: '2' },
    ],
  },
  options: [],
  answer: 0,
};
const crosswordQuestion: Question = {
  ...base,
  id: 'cross',
  type: 'crossword',
  config: {
    crossword: {
      rows: 1,
      cols: 2,
      entries: [{ row: 0, col: 0, direction: 'across', word: 'AB', clue: 'x' }],
    },
  },
  options: [],
  answer: 0,
};

describe('isAnswerComplete', () => {
  it('rechaza una respuesta nula o de otro tipo', () => {
    expect(isAnswerComplete(mcqQuestion, null)).toBe(false);
    expect(isAnswerComplete(mcqQuestion, { type: 'order', steps: ['a'] })).toBe(false);
  });

  it('acepta mcq y order en cuanto hay respuesta', () => {
    expect(isAnswerComplete(mcqQuestion, { type: 'mcq', chosen: 0 })).toBe(true);
    expect(isAnswerComplete(orderQuestion, { type: 'order', steps: ['a'] })).toBe(true);
  });

  it('exige todos los espacios en fill y enlazar', () => {
    expect(
      isAnswerComplete(fillQuestion, { type: 'fill', ordered: [], assignment: ['uno', null] }),
    ).toBe(false);
    expect(
      isAnswerComplete(fillQuestion, { type: 'fill', ordered: [], assignment: ['uno', 'dos'] }),
    ).toBe(true);
    expect(
      isAnswerComplete(matchQuestion, { type: 'match', rights: ['1', '2'], assignment: [0, null] }),
    ).toBe(false);
    expect(
      isAnswerComplete(matchQuestion, { type: 'match', rights: ['1', '2'], assignment: [0, 1] }),
    ).toBe(true);
  });

  it('exige todas las celdas del crucigrama', () => {
    expect(isAnswerComplete(crosswordQuestion, { type: 'crossword', letters: { '0-0': 'A' } })).toBe(
      false,
    );
    expect(
      isAnswerComplete(crosswordQuestion, { type: 'crossword', letters: { '0-0': 'A', '0-1': 'B' } }),
    ).toBe(true);
  });
});

describe('isAnswerCorrect', () => {
  it('mcq compara la opción elegida', () => {
    expect(isAnswerCorrect(mcqQuestion, { type: 'mcq', chosen: 1 })).toBe(true);
    expect(isAnswerCorrect(mcqQuestion, { type: 'mcq', chosen: 0 })).toBe(false);
  });

  it('order compara la secuencia', () => {
    expect(isAnswerCorrect(orderQuestion, { type: 'order', steps: ['a', 'b', 'c'] })).toBe(true);
    expect(isAnswerCorrect(orderQuestion, { type: 'order', steps: ['b', 'a', 'c'] })).toBe(false);
  });

  it('fill compara la asignación con las respuestas', () => {
    expect(
      isAnswerCorrect(fillQuestion, {
        type: 'fill',
        ordered: ['El {{uno}} y {{dos}}.'],
        assignment: ['uno', 'dos'],
      }),
    ).toBe(true);
    expect(
      isAnswerCorrect(fillQuestion, {
        type: 'fill',
        ordered: ['El {{uno}} y {{dos}}.'],
        assignment: ['dos', 'uno'],
      }),
    ).toBe(false);
  });

  it('match compara los pares con el orden barajado', () => {
    expect(
      isAnswerCorrect(matchQuestion, { type: 'match', rights: ['1', '2'], assignment: [0, 1] }),
    ).toBe(true);
    expect(
      isAnswerCorrect(matchQuestion, { type: 'match', rights: ['1', '2'], assignment: [1, 0] }),
    ).toBe(false);
  });

  it('crossword compara las letras', () => {
    expect(
      isAnswerCorrect(crosswordQuestion, {
        type: 'crossword',
        letters: { '0-0': 'A', '0-1': 'B' },
      }),
    ).toBe(true);
    expect(
      isAnswerCorrect(crosswordQuestion, {
        type: 'crossword',
        letters: { '0-0': 'A', '0-1': 'X' },
      }),
    ).toBe(false);
  });
});
