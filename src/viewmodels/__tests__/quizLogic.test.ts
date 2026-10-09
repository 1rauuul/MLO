import { computeScore, countCorrect, optionResult } from '../quizLogic';

describe('quizLogic', () => {
  const questions = [{ answer: 1 }, { answer: 0 }, { answer: 2 }, { answer: 3 }];

  it('cuenta las respuestas correctas', () => {
    expect(countCorrect(questions, [1, 0, 1, 3])).toBe(3);
  });

  it('calcula el porcentaje redondeado', () => {
    expect(computeScore(questions, [1, 0, 0, 0])).toBe(50);
    expect(computeScore(questions, [1, 0, 2, 3])).toBe(100);
  });

  it('devuelve cero cuando no hay preguntas', () => {
    expect(computeScore([], [])).toBe(0);
  });
});

describe('optionResult', () => {
  it('no marca nada antes de responder', () => {
    expect(optionResult(0, 0, 1, false)).toBeUndefined();
  });

  it('marca la opción elegida como incorrecta sin revelar la correcta', () => {
    expect(optionResult(0, 0, 1, true)).toBe('wrong');
    expect(optionResult(1, 0, 1, true)).toBeUndefined();
  });

  it('marca la opción elegida como correcta', () => {
    expect(optionResult(1, 1, 1, true)).toBe('correct');
    expect(optionResult(0, 1, 1, true)).toBeUndefined();
  });
});
