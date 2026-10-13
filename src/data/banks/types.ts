import type { ExerciseConfig, ExerciseType } from '@/models/entities';

export interface ExerciseSeed {
  id: string;
  lessonId: string;
  type: ExerciseType;
  prompt: string;
  instructions: string;
  correctOrder: string[];
  config?: ExerciseConfig;
  explanation?: string;
}