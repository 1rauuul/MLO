import type { LearningStyle } from '@/models/entities';

export interface ChaItem {
  id: string;
  statement: string;
  style: LearningStyle;
}

export const CHA_STYLES: LearningStyle[] = ['Activo', 'Reflexivo', 'Teórico', 'Pragmático'];

export const CHA_ITEMS: ChaItem[] = [
  { id: 'cha-a1', statement: 'Me implico activamente en las actividades del curso.', style: 'Activo' },
  { id: 'cha-a2', statement: 'Prefiero aprender haciendo y probando.', style: 'Activo' },
  { id: 'cha-r1', statement: 'Antes de actuar, analizo con calma las opciones.', style: 'Reflexivo' },
  { id: 'cha-r2', statement: 'Me tomo un tiempo para pensar mis respuestas.', style: 'Reflexivo' },
  { id: 'cha-t1', statement: 'Me gusta entender la teoría detrás de cada método.', style: 'Teórico' },
  { id: 'cha-t2', statement: 'Prefiero los modelos y marcos conceptuales.', style: 'Teórico' },
  { id: 'cha-p1', statement: 'Me interesa aplicar lo aprendido a casos reales.', style: 'Pragmático' },
  { id: 'cha-p2', statement: 'Valoro las técnicas que sirven en la práctica.', style: 'Pragmático' },
];

export type ChaAnswers = (boolean | null)[];

export function isChaComplete(answers: ChaAnswers): boolean {
  return answers.length === CHA_ITEMS.length && answers.every(answer => answer !== null);
}

export function scoreCha(answers: ChaAnswers): Record<LearningStyle, number> {
  const scores: Record<LearningStyle, number> = {
    Activo: 0,
    Reflexivo: 0,
    Teórico: 0,
    Pragmático: 0,
  };
  CHA_ITEMS.forEach((item, index) => {
    if (answers[index] === true) {
      scores[item.style] += 1;
    }
  });
  return scores;
}

export function dominantStyle(scores: Record<LearningStyle, number>): LearningStyle {
  return CHA_STYLES.reduce(
    (best, style) => (scores[style] > scores[best] ? style : best),
    CHA_STYLES[0]!,
  );
}

export function resolveChaStyle(answers: ChaAnswers): LearningStyle | null {
  if (!isChaComplete(answers)) {
    return null;
  }
  return dominantStyle(scoreCha(answers));
}
