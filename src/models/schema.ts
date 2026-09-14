export const DATABASE_VERSION = 1;

export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  duration TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY NOT NULL,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  eyebrow TEXT NOT NULL,
  body TEXT NOT NULL,
  code_sample TEXT NOT NULL DEFAULT '',
  context_title TEXT NOT NULL DEFAULT '',
  context_body TEXT NOT NULL DEFAULT '',
  synthesis TEXT NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS examples (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  complexity TEXT NOT NULL,
  title TEXT NOT NULL,
  scenario TEXT NOT NULL,
  before_state TEXT NOT NULL,
  after_state TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  instructions TEXT NOT NULL,
  correct_order TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY NOT NULL,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  options TEXT NOT NULL DEFAULT '[]',
  answer INTEGER NOT NULL,
  explanation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learner_profile (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  learner_name TEXT NOT NULL,
  learning_style TEXT NOT NULL,
  dark_mode INTEGER NOT NULL DEFAULT 1,
  large_text INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS module_progress (
  lesson_id TEXT PRIMARY KEY NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lessons_unit ON lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_examples_lesson ON examples(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_lesson ON evaluations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_evaluation ON questions(evaluation_id);
`;
