import type { ContentBlock, ExerciseConfig, ExerciseType } from '@/shared/model/entities';
import type { ExampleSeed, QuestionSeed } from '@/shared/services/content/unit1.content';
import type { ExerciseSeed } from '@/shared/services/content/banks/types';
import { crosswordCells, extractFillAnswers } from '@/shared/utils/exerciseRules';
import {
  isRecord,
  isString,
  isStringArray,
  parseExampleSeed,
  parseExerciseSeed,
  parseQuestionSeed,
} from '@/shared/utils/validate';

export const REMOTE_SCHEMA_VERSION = 2;

export interface RemoteUnit {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: 'Fundamental' | 'Intermedio' | 'Avanzado';
  color: 'blue' | 'violet' | 'green';
}

export interface RemoteLesson {
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

export interface RemoteEvaluation {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questionCount: number;
  exerciseCount: number;
}

export interface RemoteQuestion {
  evaluationId: string;
  question: QuestionSeed;
}

export interface RemoteLessonPayload {
  schemaVersion: 2;
  catalogId: string;
  lessonId: string;
  hash: string;
  unit: RemoteUnit;
  lesson: RemoteLesson;
  evaluation: RemoteEvaluation | null;
  exercises: ExerciseSeed[];
  examples: ExampleSeed[];
  questions: RemoteQuestion[];
}

function fail(message: string): never {
  throw new Error(`Contenido remoto inválido: ${message}`);
}

function nonEmpty(value: unknown, label: string): string {
  if (!isString(value) || value.trim().length === 0) {
    fail(`${label} vacío`);
  }
  return value;
}

function withDefault<T>(value: unknown, fallback: T): unknown {
  return value === undefined ? fallback : value;
}

function defaultString(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (!isString(value)) {
    fail('texto inválido');
  }
  return value;
}

function defaultStringArray(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!isStringArray(value)) {
    fail('lista inválida');
  }
  return value;
}

function parseContentBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) {
    fail('content no es un arreglo');
  }
  return value.map(block => {
    if (!isRecord(block) || !isString(block.type)) {
      fail('bloque de contenido inválido');
    }
    switch (block.type) {
      case 'p':
      case 'h':
        if (!isString(block.text)) {
          fail('bloque de texto inválido');
        }
        return { type: block.type, text: block.text };
      case 'bullets':
      case 'numbers':
        if (!isStringArray(block.items)) {
          fail('lista de contenido inválida');
        }
        return { type: block.type, items: block.items };
      case 'table': {
        if (!isStringArray(block.header) || !Array.isArray(block.rows)) {
          fail('tabla de contenido inválida');
        }
        const header = block.header;
        if (!block.rows.every(row => isStringArray(row) && row.length === header.length)) {
          fail('tabla de contenido inválida');
        }
        return { type: 'table', header, rows: block.rows as string[][] };
      }
      default:
        fail(`tipo de bloque desconocido: ${String(block.type)}`);
    }
  });
}

function validateOrder(items: unknown, label: string): void {
  if (!isStringArray(items) || items.length < 2 || items.some(item => item.trim() === '')) {
    fail(`${label} necesita al menos 2 elementos no vacíos`);
  }
  if (new Set(items).size !== items.length) {
    fail(`${label} tiene elementos repetidos`);
  }
}

function validateFill(config: ExerciseConfig): void {
  const sentences = config.sentences;
  if (!isStringArray(sentences) || sentences.length === 0) {
    fail('completar sin oraciones');
  }
  for (const sentence of sentences) {
    if (!/\{\{(.+?)\}\}/.test(sentence)) {
      fail('oración de completar sin espacio');
    }
    if (extractFillAnswers([sentence]).some(answer => answer.trim() === '')) {
      fail('respuesta de completar vacía');
    }
  }
  if (!isStringArray(config.bank)) {
    fail('banco de completar inválido');
  }
}

function validateMatch(config: ExerciseConfig): void {
  const pairs = config.pairs;
  if (!Array.isArray(pairs) || pairs.length < 2) {
    fail('relacionar necesita al menos 2 pares');
  }
  const lefts = new Set<string>();
  const rights = new Set<string>();
  for (const pair of pairs) {
    nonEmpty(pair.left, 'left');
    nonEmpty(pair.right, 'right');
    if (lefts.has(pair.left) || rights.has(pair.right)) {
      fail('par repetido');
    }
    lefts.add(pair.left);
    rights.add(pair.right);
  }
}

function validateCrossword(config: ExerciseConfig): void {
  const crossword = config.crossword;
  if (!crossword || !Number.isInteger(crossword.rows) || !Number.isInteger(crossword.cols)) {
    fail('crucigrama sin dimensiones');
  }
  if (crossword.rows <= 0 || crossword.cols <= 0 || crossword.entries.length === 0) {
    fail('crucigrama vacío');
  }
  const letters = new Map<string, string>();
  for (const entry of crossword.entries) {
    if (!/^[A-ZÑ]+$/.test(entry.word)) {
      fail(`palabra de crucigrama inválida: ${entry.word}`);
    }
    nonEmpty(entry.clue, 'pista');
    if (entry.direction !== 'across' && entry.direction !== 'down') {
      fail('dirección de crucigrama inválida');
    }
    const stepRow = entry.direction === 'down' ? 1 : 0;
    const stepCol = entry.direction === 'across' ? 1 : 0;
    for (let offset = 0; offset < entry.word.length; offset += 1) {
      const row = entry.row + stepRow * offset;
      const col = entry.col + stepCol * offset;
      if (row < 0 || row >= crossword.rows || col < 0 || col >= crossword.cols) {
        fail('palabra de crucigrama fuera de la cuadrícula');
      }
      const key = `${row}-${col}`;
      const letter = entry.word[offset]!;
      const existing = letters.get(key);
      if (existing !== undefined && existing !== letter) {
        fail('cruce de crucigrama en conflicto');
      }
      letters.set(key, letter);
    }
  }
  if (crosswordCells(config).length === 0) {
    fail('crucigrama sin celdas');
  }
}

function validateMcq(question: QuestionSeed): void {
  if (!isStringArray(question.options) || question.options.length < 2) {
    fail('pregunta sin opciones');
  }
  if (new Set(question.options).size !== question.options.length) {
    fail('opciones repetidas');
  }
  if (
    !Number.isInteger(question.answer) ||
    question.answer < 0 ||
    question.answer >= question.options.length
  ) {
    fail('respuesta fuera de rango');
  }
}

function validateQuestionRules(question: QuestionSeed): void {
  if (question.type === 'mcq') {
    validateMcq(question);
    return;
  }
  if (question.type === 'order') {
    validateOrder(question.options, 'orden de evaluación');
    return;
  }
  validateConfigRules(question.type, question.config ?? {});
}

function validateConfigRules(type: ExerciseType, config: ExerciseConfig): void {
  if (type === 'fill') {
    validateFill(config);
    return;
  }
  if (type === 'match') {
    validateMatch(config);
    return;
  }
  validateCrossword(config);
}

function validateExercise(exercise: ExerciseSeed): void {
  if (exercise.type === 'order') {
    validateOrder(exercise.correctOrder, 'orden del ejercicio');
  } else {
    validateConfigRules(exercise.type, exercise.config ?? {});
  }
  if (exercise.example) {
    if (exercise.example.steps.length === 0 || exercise.example.steps.some(step => !step.text.trim() || !step.why.trim())) {
      fail('ejemplo del ejercicio sin pasos completos');
    }
    if (!isStringArray(exercise.example.hints)) {
      fail('pistas del ejemplo inválidas');
    }
  }
}

function validateExample(example: ExampleSeed): void {
  if (example.steps.length === 0 || example.steps.some(step => !step.text.trim() || !step.why.trim())) {
    fail('ejemplo sin pasos completos');
  }
  if (!isStringArray(example.hints)) {
    fail('pistas del ejemplo inválidas');
  }
}

function parseUnit(value: unknown): RemoteUnit {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.title) ||
    !isString(value.description) ||
    !Number.isInteger(value.number)
  ) {
    fail('unidad inválida');
  }
  if (!['Fundamental', 'Intermedio', 'Avanzado'].includes(String(value.difficulty))) {
    fail('dificultad inválida');
  }
  if (!['blue', 'violet', 'green'].includes(String(value.color))) {
    fail('color inválido');
  }
  return value as unknown as RemoteUnit;
}

function parseLesson(value: unknown): RemoteLesson {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.unitId) ||
    !isString(value.code) ||
    !isString(value.title) ||
    !isString(value.eyebrow) ||
    !isString(value.body) ||
    !Number.isInteger(value.position)
  ) {
    fail('lección inválida');
  }
  return {
    id: value.id,
    unitId: value.unitId,
    code: value.code,
    title: value.title,
    eyebrow: value.eyebrow,
    body: value.body,
    // El serializador puede omitir los campos vacíos; MLO los normaliza.
    codeSample: defaultString(value.codeSample),
    contextTitle: defaultString(value.contextTitle),
    contextBody: defaultString(value.contextBody),
    synthesis: defaultStringArray(value.synthesis),
    content: parseContentBlocks(value.content),
    position: Number(value.position),
  };
}

export function validateLessonPayload(
  value: unknown,
  expected: { catalogId: string; lessonId: string },
  foreignIds: Set<string> = new Set(),
): RemoteLessonPayload {
  if (!isRecord(value) || value.schemaVersion !== REMOTE_SCHEMA_VERSION) {
    fail('schemaVersion no soportada');
  }
  if (value.catalogId !== expected.catalogId) {
    fail('catalogId no coincide');
  }
  if (value.lessonId !== expected.lessonId) {
    fail('lessonId no coincide');
  }
  const hash = nonEmpty(value.hash, 'hash');

  const unit = parseUnit(value.unit);
  const lesson = parseLesson(value.lesson);
  if (lesson.id !== expected.lessonId || lesson.unitId !== unit.id) {
    fail('lección o unidad incoherentes');
  }


  // `examples` puede omitirse: los ejemplos de ejercicio viajan dentro de
  // `exercises[].example`; la lista solo contiene ejemplos independientes.
  const rawExamples = value.examples === undefined ? [] : value.examples;
  if (!Array.isArray(value.exercises) || !Array.isArray(rawExamples) || !Array.isArray(value.questions)) {
    fail('listas de contenido inválidas');
  }
  const exercises = value.exercises.map(item => {
    if (!isRecord(item)) {
      fail('ejercicio inválido');
    }
    const exercise = parseExerciseSeed({
      ...item,
      correctOrder: withDefault(item.correctOrder, []),
      example: isRecord(item.example)
        ? { ...item.example, hints: withDefault(item.example.hints, []) }
        : item.example,
    });
    if (exercise.lessonId !== lesson.id) {
      fail('ejercicio de otra lección');
    }
    validateExercise(exercise);
    return exercise;
  });
  const examples = rawExamples.map(item => {
    if (!isRecord(item)) {
      fail('ejemplo inválido');
    }
    const example = parseExampleSeed({
      ...item,
      hints: withDefault(item.hints, []),
      explanation: withDefault(item.explanation, ''),
      steps: withDefault(item.steps, []),
    });
    if (example.lessonId !== lesson.id) {
      fail('ejemplo de otra lección');
    }
    validateExample(example);
    return example;
  });

  let evaluation: RemoteEvaluation | null = null;
  if (value.evaluation !== null && value.evaluation !== undefined) {
    const rawEvaluation = value.evaluation;
    if (
      !isRecord(rawEvaluation) ||
      !isString(rawEvaluation.id) ||
      !isString(rawEvaluation.title) ||
      !isString(rawEvaluation.description) ||
      rawEvaluation.lessonId !== lesson.id
    ) {
      fail('evaluación inválida');
    }
    const questionCount = Number(rawEvaluation.questionCount);
    const exerciseCount = Number(rawEvaluation.exerciseCount);
    if (
      !Number.isInteger(questionCount) ||
      !Number.isInteger(exerciseCount) ||
      questionCount <= 0 ||
      exerciseCount <= 0
    ) {
      fail('evaluación inválida');
    }
    evaluation = {
      id: rawEvaluation.id,
      lessonId: lesson.id,
      title: rawEvaluation.title,
      description: rawEvaluation.description,
      questionCount,
      exerciseCount,
    };
  }

  const questions = value.questions.map(entry => {
    if (!isRecord(entry) || !isString(entry.evaluationId)) {
      fail('pregunta sin evaluación');
    }
    if (!evaluation || entry.evaluationId !== evaluation.id) {
      fail('pregunta de otra evaluación');
    }
    if (!isRecord(entry.question) || !isString(entry.question.id)) {
      fail('pregunta sin id');
    }
    const question = parseQuestionSeed({
      ...entry.question,
      options: withDefault(entry.question.options, []),
      answer: withDefault(entry.question.answer, 0),
      explanation: withDefault(entry.question.explanation, ''),
    });
    validateQuestionRules(question);
    return { evaluationId: entry.evaluationId, question };
  });

  // Una lección puede ser de solo lectura (por ejemplo 1.1): sin ejercicios y
  // sin evaluación. Si publica evaluación, sí debe traer preguntas.
  if (evaluation && questions.length === 0) {
    fail('la evaluación no tiene preguntas');
  }
  if (!evaluation && questions.length > 0) {
    fail('hay preguntas sin evaluación');
  }

  const ids = [
    unit.id,
    lesson.id,
    ...(evaluation ? [evaluation.id] : []),
    ...exercises.map(item => item.id),
    ...examples.map(item => item.id),
    ...questions.map(item => item.question.id!),
  ];
  if (new Set(ids).size !== ids.length) {
    fail('ids repetidos en la lección');
  }
  const collision = ids.find(id => foreignIds.has(id));
  if (collision) {
    fail(`id ya usado por otro curso: ${collision}`);
  }

  return {
    schemaVersion: REMOTE_SCHEMA_VERSION,
    catalogId: expected.catalogId,
    lessonId: expected.lessonId,
    hash,
    unit,
    lesson,
    evaluation,
    exercises,
    examples,
    questions,
  };
}
