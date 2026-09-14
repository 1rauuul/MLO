export interface Scorable {
  answer: number;
}

export function countCorrect(questions: Scorable[], answers: number[]): number {
  return questions.reduce((total, question, index) => {
    return answers[index] === question.answer ? total + 1 : total;
  }, 0);
}

export function computeScore(questions: Scorable[], answers: number[]): number {
  if (questions.length === 0) {
    return 0;
  }
  return Math.round((countCorrect(questions, answers) / questions.length) * 100);
}
