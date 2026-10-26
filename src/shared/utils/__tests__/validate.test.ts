import { parseExampleSeed, parseExerciseSeed, parseQuestionSeed } from '@/shared/utils/validate';

describe('validadores de contenido', () => {
  it('acepta un ejercicio completo', () => {
    const parsed = parseExerciseSeed({
      id: 'ord1',
      lessonId: 'l1.2',
      type: 'order',
      prompt: 'Ordena',
      instructions: 'Usa flechas',
      correctOrder: ['a', 'b'],
      config: {},
      explanation: 'Explica',
      example: {
        title: 'Ejemplo',
        steps: [{ text: 'paso', why: 'razón' }],
        hints: ['pista'],
      },
    });

    expect(parsed.correctOrder).toEqual(['a', 'b']);
    expect(parsed.example?.steps[0]?.why).toBe('razón');
  });

  it('rechaza un ejercicio con tipo desconocido o pasos incompletos', () => {
    expect(() => parseExerciseSeed({ id: 'x', type: 'otro' })).toThrow('El ejercicio no es válido.');
    expect(() =>
      parseExerciseSeed({
        id: 'x',
        lessonId: 'l1.2',
        type: 'order',
        prompt: 'p',
        instructions: 'i',
        correctOrder: [],
        example: { title: 't', steps: [{ text: 's' }], hints: [] },
      }),
    ).toThrow('Los pasos del ejemplo no son válidos.');
  });

  it('valida preguntas y ejemplos', () => {
    const question = parseQuestionSeed({
      id: 'q1',
      type: 'mcq',
      prompt: '¿?',
      options: ['a', 'b'],
      answer: 1,
      explanation: 'porque',
    });
    expect(question.id).toBe('q1');

    const example = parseExampleSeed({
      id: 'e1',
      lessonId: 'l1.2',
      type: 'fill',
      title: 'Ejemplo',
      prompt: 'Completa',
      config: {},
      steps: [{ text: 's', why: 'w' }],
      hints: ['h'],
      explanation: 'ex',
    });
    expect(example.type).toBe('fill');

    expect(() => parseQuestionSeed({ type: 'mcq', answer: 1.5 })).toThrow(
      'La pregunta no es válida.',
    );
  });
});
