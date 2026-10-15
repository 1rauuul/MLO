export type ExerciseType = 'order' | 'fill' | 'match' | 'crossword';

export interface MatchPair {
  left: string;
  right: string;
}

export interface CrosswordEntry {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface ExerciseConfig {
  sentences?: string[];
  bank?: string[];
  pairs?: MatchPair[];
  crossword?: { rows: number; cols: number; entries: CrosswordEntry[] };
}

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

export interface ExampleSeed {
  id: string;
  lessonId: string;
  type: ExerciseType;
  title: string;
  prompt: string;
  config: ExerciseConfig;
  steps: ExampleStep[];
  hints: string[];
  explanation: string;
}