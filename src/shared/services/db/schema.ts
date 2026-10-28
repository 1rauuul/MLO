export const DATABASE_VERSION = 17;

export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  external_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_session (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  color TEXT NOT NULL,
  catalog_id TEXT NOT NULL DEFAULT 'base',
  archived_at TEXT
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
  content TEXT NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL DEFAULT 0,
  catalog_id TEXT NOT NULL DEFAULT 'base',
  archived_at TEXT
);

-- Contenido publicado de las clases. Es una caché global por clase; cada
-- cuenta decide qué clases ve mediante account_classes.
CREATE TABLE IF NOT EXISTS class_cache (
  class_id TEXT PRIMARY KEY NOT NULL,
  class_code TEXT NOT NULL,
  class_name TEXT NOT NULL,
  teacher_name TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  hash TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  fetched_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_cache_code ON class_cache(class_code);

CREATE TABLE IF NOT EXISTS class_extras_cache (
  class_id TEXT NOT NULL REFERENCES class_cache(class_id) ON DELETE CASCADE,
  extra_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (class_id, extra_id)
);
CREATE INDEX IF NOT EXISTS idx_class_extras_lesson ON class_extras_cache(lesson_id);
CREATE INDEX IF NOT EXISTS idx_class_extras_class ON class_extras_cache(class_id);

CREATE TABLE IF NOT EXISTS account_classes (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES class_cache(class_id) ON DELETE CASCADE,
  class_code TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (account_id, class_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_classes_code
  ON account_classes(account_id, class_code);

CREATE TABLE IF NOT EXISTS examples (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  steps TEXT NOT NULL DEFAULT '[]',
  hints TEXT NOT NULL DEFAULT '[]',
  explanation TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  instructions TEXT NOT NULL,
  correct_order TEXT NOT NULL DEFAULT '[]',
  config TEXT NOT NULL DEFAULT '{}',
  explanation TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 10,
  exercise_count INTEGER NOT NULL DEFAULT 5,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY NOT NULL,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'mcq',
  config TEXT NOT NULL DEFAULT '{}',
  prompt TEXT NOT NULL,
  options TEXT NOT NULL DEFAULT '[]',
  answer INTEGER NOT NULL,
  explanation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  correct INTEGER NOT NULL,
  score_correct INTEGER NOT NULL DEFAULT 0,
  score_total INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learner_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  learning_style TEXT NOT NULL,
  dark_mode INTEGER NOT NULL DEFAULT 1,
  large_text INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS module_progress (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS last_location (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  unit_id TEXT,
  lesson_id TEXT,
  lesson_code TEXT,
  section TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS example_state (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  payload TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS remote_catalogs (
  catalog_id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '',
  manifest_hash TEXT NOT NULL DEFAULT '',
  lesson_ids TEXT NOT NULL DEFAULT '[]',
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS remote_lessons (
  catalog_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  hash TEXT NOT NULL,
  payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  applied_hash TEXT,
  PRIMARY KEY (catalog_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_unit ON lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_examples_lesson ON examples(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_lesson ON evaluations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_evaluation ON questions(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_progress_account ON module_progress(account_id);
CREATE INDEX IF NOT EXISTS idx_eval_results_account ON evaluation_results(account_id);
CREATE INDEX IF NOT EXISTS idx_attempts_account_lesson ON attempts(account_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_attempts_account_type ON attempts(account_id, item_type);
CREATE INDEX IF NOT EXISTS idx_units_catalog ON units(catalog_id);
CREATE INDEX IF NOT EXISTS idx_lessons_catalog ON lessons(catalog_id);
CREATE INDEX IF NOT EXISTS idx_remote_lessons_catalog ON remote_lessons(catalog_id);
`;

export const DROP_ALL_DDL = `
DROP TABLE IF EXISTS attempts;
DROP TABLE IF EXISTS auth_session;
DROP TABLE IF EXISTS evaluation_results;
DROP TABLE IF EXISTS module_progress;
DROP TABLE IF EXISTS last_location;
DROP TABLE IF EXISTS example_state;
DROP TABLE IF EXISTS account_classes;
DROP TABLE IF EXISTS class_extras_cache;
DROP TABLE IF EXISTS class_cache;
DROP TABLE IF EXISTS remote_lessons;
DROP TABLE IF EXISTS remote_catalogs;
DROP TABLE IF EXISTS meta;
DROP TABLE IF EXISTS learner_profile;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS examples;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS accounts;
`;
