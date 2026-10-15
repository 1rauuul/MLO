import type { ExerciseConfig, ExerciseType } from '@/shared/model/entities';

export interface ExampleStep {
  text: string;
  why: string;
}

export interface ExampleMeta {
  title: string;
  steps: ExampleStep[];
  hints: string[];
}

export interface ExerciseSeed {
  id: string;
  lessonId: string;
  type: ExerciseType;
  prompt: string;
  instructions: string;
  correctOrder: string[];
  config?: ExerciseConfig;
  explanation?: string;
  example?: ExampleMeta;
}