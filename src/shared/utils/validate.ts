import { ACTIVITY_TYPES, EXERCISE_TYPES } from '@/shared/model/entities';
import type {
  ActivityType,
  ExerciseConfig,
  ExerciseType,
  LocationSection,
} from '@/shared/model/entities';
import type { ExerciseSeed } from '@/shared/services/content/banks/types';
import type { ExampleSeed, QuestionSeed } from '@/shared/services/content/unit1.content';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

export function isExerciseType(value: unknown): value is ExerciseType {
  return isString(value) && EXERCISE_TYPES.includes(value as ExerciseType);
}

export function isActivityType(value: unknown): value is ActivityType {
  return isString(value) && ACTIVITY_TYPES.includes(value as ActivityType);
}

export function isLocationSection(value: unknown): value is LocationSection | null {
  return (
    value === null ||
    value === 'hub' ||
    value === 'lesson' ||
    value === 'example' ||
    value === 'exercise' ||
    value === 'quiz'
  );
}

function parseConfig(value: unknown): ExerciseConfig {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    throw new Error('La configuración del contenido no es válida.');
  }
  return value as ExerciseConfig;
}

function parseSteps(value: unknown): ExampleSeed['steps'] {
  if (
    !Array.isArray(value) ||
    !value.every(item => isRecord(item) && isString(item.text) && isString(item.why))
  ) {
    throw new Error('Los pasos del ejemplo no son válidos.');
  }
  return value.map(item => ({ text: String(item.text), why: String(item.why) }));
}

export function parseExampleSeed(value: unknown): ExampleSeed {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.lessonId) ||
    !isExerciseType(value.type) ||
    !isString(value.title) ||
    !isString(value.prompt) ||
    !isString(value.explanation) ||
    !isStringArray(value.hints)
  ) {
    throw new Error('El ejemplo no es válido.');
  }
  return {
    id: value.id,
    lessonId: value.lessonId,
    type: value.type,
    title: value.title,
    prompt: value.prompt,
    config: parseConfig(value.config),
    steps: parseSteps(value.steps),
    hints: value.hints,
    explanation: value.explanation,
  };
}

export function parseQuestionSeed(value: unknown): QuestionSeed {
  if (
    !isRecord(value) ||
    !isActivityType(value.type) ||
    !isString(value.prompt) ||
    !isStringArray(value.options) ||
    !isNumber(value.answer) ||
    !Number.isInteger(value.answer) ||
    !isString(value.explanation) ||
    (value.id !== undefined && !isString(value.id))
  ) {
    throw new Error('La pregunta no es válida.');
  }
  return {
    id: value.id as string | undefined,
    type: value.type,
    config: parseConfig(value.config),
    prompt: value.prompt,
    options: value.options,
    answer: value.answer,
    explanation: value.explanation,
  };
}

export function parseExerciseSeed(value: unknown): ExerciseSeed {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.lessonId) ||
    !isExerciseType(value.type) ||
    !isString(value.prompt) ||
    !isString(value.instructions) ||
    !isStringArray(value.correctOrder) ||
    (value.explanation !== undefined && !isString(value.explanation))
  ) {
    throw new Error('El ejercicio no es válido.');
  }
  let example: ExerciseSeed['example'];
  if (value.example !== undefined) {
    if (
      !isRecord(value.example) ||
      !isString(value.example.title) ||
      !isStringArray(value.example.hints)
    ) {
      throw new Error('El ejemplo del ejercicio no es válido.');
    }
    example = {
      title: value.example.title,
      steps: parseSteps(value.example.steps),
      hints: value.example.hints,
    };
  }
  return {
    id: value.id,
    lessonId: value.lessonId,
    type: value.type,
    prompt: value.prompt,
    instructions: value.instructions,
    correctOrder: value.correctOrder,
    config: parseConfig(value.config),
    explanation: value.explanation as string | undefined,
    example,
  };
}
