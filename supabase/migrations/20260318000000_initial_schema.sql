-- Navigating Radiology: Supabase Schema
-- Run this in Supabase SQL Editor to create all tables

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE course_type AS ENUM ('on-call-preparation', 'mri-based');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('Bread & Butter', 'Moderate', 'Challenging');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS courses (
  course_slug TEXT PRIMARY KEY,
  course_type course_type NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sections JSONB DEFAULT '[]',
  intro_url TEXT,
  intro_videos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cases (
  case_id TEXT NOT NULL,
  course_slug TEXT NOT NULL REFERENCES courses(course_slug) ON DELETE CASCADE,
  case_number INTEGER NOT NULL,
  clinical_history TEXT DEFAULT '',
  diagnosis_title TEXT DEFAULT '',
  difficulty difficulty_level,
  section_index INTEGER DEFAULT 0,
  study_uid TEXT NOT NULL,
  study_description TEXT DEFAULT '',
  teaching_sections JSONB DEFAULT '[]',
  diagnosis_video_url TEXT,
  history_video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (course_slug, case_id)
);

CREATE TABLE IF NOT EXISTS series (
  course_slug TEXT NOT NULL,
  case_id TEXT NOT NULL,
  series_index INTEGER NOT NULL,
  label TEXT DEFAULT '',
  modality TEXT DEFAULT 'CT',
  series_uid TEXT NOT NULL,
  window_wc INTEGER,
  window_ww INTEGER,
  slice_count INTEGER NOT NULL,
  instance_urls JSONB NOT NULL,
  annotations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (course_slug, case_id, series_index),
  FOREIGN KEY (course_slug, case_id) REFERENCES cases(course_slug, case_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  case_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  bookmarked BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, course_slug, case_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cases_course ON cases(course_slug);
CREATE INDEX IF NOT EXISTS idx_cases_course_section ON cases(course_slug, section_index);
CREATE INDEX IF NOT EXISTS idx_series_case ON series(course_slug, case_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_course ON user_progress(user_id, course_slug);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Courses: readable by authenticated users
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_courses" ON courses;
CREATE POLICY "auth_read_courses" ON courses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Cases: readable by authenticated users
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_cases" ON cases;
CREATE POLICY "auth_read_cases" ON cases
  FOR SELECT USING (auth.role() = 'authenticated');

-- Series: readable by authenticated users
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_series" ON series;
CREATE POLICY "auth_read_series" ON series
  FOR SELECT USING (auth.role() = 'authenticated');

-- User progress: scoped to own user
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_select" ON user_progress;
CREATE POLICY "own_select" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_insert" ON user_progress;
CREATE POLICY "own_insert" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_update" ON user_progress;
CREATE POLICY "own_update" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);
