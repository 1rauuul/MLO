import { computeScore, countCorrect } from '../quizLogic';

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
