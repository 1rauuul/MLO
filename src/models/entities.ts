export type LearningStyle = 'Activo' | 'Reflexivo' | 'Teórico' | 'Pragmático';

export type Complexity = 'Fundamental' | 'Intermedio' | 'Avanzado';

export type UnitColor = 'blue' | 'violet' | 'green';

export type ExerciseType = 'order' | 'fill' | 'match';

export interface MatchPair {
  left: string;
  right: string;
}

export interface ExerciseConfig {
  sentences?: string[];
  pairs?: MatchPair[];
}

export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'numbers'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] };

export interface Unit {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: Complexity;
  color: UnitColor;
}

export interface Lesson {
  id: string;
  unitId: string;
  code: string;
  title: string;
  eyebrow: string;
  body: string;
  codeSample: string;
  contextTitle: string;
  contextBody: string;
  synthesis: string[];
  content: ContentBlock[];
  position: number;
}

export interface Example {
  id: string;
  lessonId: string;
  complexity: Complexity;
  title: string;
  scenario: string;
  before: string;
  after: string;
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: ExerciseType;
  prompt: string;
  instructions: string;
  correctOrder: string[];
  config: ExerciseConfig;
}

export interface ExerciseResult {
  id: number;
  exerciseId: string;
  answer: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface Evaluation {
  id: string;
  lessonId: string;
  title: string;
  description: string;
}

export interface Question {
  id: string;
  evaluationId: string;
  orderIndex: number;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface EvaluationResult {
  id: number;
  evaluationId: string;
  score: number;
  correctCount: number;
  totalCount: number;
  createdAt: string;
}

export interface Account {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface LearnerProfile {
  id: number;
  accountId: number;
  learningStyle: LearningStyle;
  darkMode: boolean;
  largeText: boolean;
}

export interface ModuleProgress {
  lessonId: string;
  completed: boolean;
  updatedAt: string;
}
