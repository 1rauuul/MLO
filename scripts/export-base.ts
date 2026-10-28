/// <reference types="node" />

/**
 * Exporta el contenido base que MLO trae empaquetado al formato que importa
 * el panel de maestros. Uso:
 *
 *   npx tsx scripts/export-base.ts ../mlo-teachers/scripts/fixtures/base-course.json
 *
 * El archivo resultante es la fuente del curso `base` del panel.
 */
import { writeFileSync } from "node:fs";

import { l12QuestionBank } from "@/shared/services/content/banks/lesson1.2.questions";
import type { ExerciseSeed } from "@/shared/services/content/banks/types";
import { richContent } from "@/shared/services/content/richContent";
import {
  unit1Evaluations,
  unit1Examples,
  unit1Exercises,
  type QuestionSeed,
} from "@/shared/services/content/unit1.content";
import { LESSONS, units } from "@/shared/services/db/seed";

function evaluationQuestionId(evaluationId: string, index: number, question: QuestionSeed): string {
  return question.id ?? `${evaluationId}-q${index + 1}`;
}

function bankQuestionId(index: number, question: QuestionSeed): string {
  return question.id ?? `ev1.2-bank-q${index + 1}`;
}

function isBankDuplicate(evaluationId: string, question: QuestionSeed): boolean {
  return (
    evaluationId === "ev1.2" &&
    l12QuestionBank.some((bankQuestion) => bankQuestion.prompt === question.prompt)
  );
}

function exerciseRow(exercise: ExerciseSeed, position: number) {
  return {
    content_id: exercise.id,
    lesson_content_id: exercise.lessonId,
    type: exercise.type,
    prompt: exercise.prompt,
    instructions: exercise.instructions,
    correct_order: exercise.correctOrder ?? [],
    config: exercise.config ?? {},
    explanation: exercise.explanation ?? "",
    example: exercise.example ?? null,
    position,
  };
}

const questions = [
  ...unit1Evaluations.flatMap((evaluation) =>
    evaluation.questions.flatMap((question, index) =>
      isBankDuplicate(evaluation.id, question)
        ? []
        : [
            {
              content_id: evaluationQuestionId(evaluation.id, index, question),
              evaluation_content_id: evaluation.id,
              type: question.type,
              prompt: question.prompt,
              options: question.options,
              answer: question.answer,
              config: question.config ?? {},
              explanation: question.explanation,
              position: index,
            },
          ],
    ),
  ),
  ...l12QuestionBank.map((question, index) => ({
    content_id: bankQuestionId(index, question),
    evaluation_content_id: "ev1.2",
    type: question.type,
    prompt: question.prompt,
    options: question.options,
    answer: question.answer,
    config: question.config ?? {},
    explanation: question.explanation,
    position: 1000 + index,
  })),
];

const output = {
  schemaVersion: 2 as const,
  title: "Ingeniería de Software",
  units: units.map((unit, index) => ({
    content_id: unit.id,
    number: unit.number,
    title: unit.title,
    description: unit.description,
    difficulty: unit.difficulty,
    color: unit.color,
    position: index,
  })),
  lessons: LESSONS.map((lesson) => ({
    content_id: lesson.id,
    unit_content_id: lesson.unitId,
    code: lesson.code,
    title: lesson.title,
    eyebrow: lesson.eyebrow,
    body: lesson.body,
    code_sample: lesson.codeSample ?? "",
    context_title: lesson.contextTitle ?? "",
    context_body: lesson.contextBody ?? "",
    synthesis: lesson.synthesis ?? [],
    content: richContent[lesson.id] ?? [],
    position: lesson.position,
  })),
  evaluations: unit1Evaluations.map((evaluation) => ({
    content_id: evaluation.id,
    lesson_content_id: evaluation.lessonId,
    title: evaluation.title,
    description: evaluation.description,
    question_count: 10,
    exercise_count: 5,
  })),
  exercises: unit1Exercises.map((exercise, position) => exerciseRow(exercise, position)),
  examples: unit1Examples.map((example, position) => ({
    content_id: example.id,
    lesson_content_id: example.lessonId,
    type: example.type,
    title: example.title,
    prompt: example.prompt,
    config: example.config ?? {},
    steps: example.steps,
    hints: example.hints,
    explanation: example.explanation,
    position,
  })),
  questions,
};

const target = process.argv[2];
if (!target) {
  console.error("Uso: npx tsx scripts/export-base.ts <ruta-de-salida.json>");
  process.exit(1);
}

writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(
  `Exportado: ${output.units.length} unidades, ${output.lessons.length} lecciones, ` +
    `${output.exercises.length} ejercicios, ${output.examples.length} ejemplos, ` +
    `${output.questions.length} preguntas.`,
);
