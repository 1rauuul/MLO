import { optionResult } from '../quizLogic';

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
