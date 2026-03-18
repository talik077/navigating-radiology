-- Add proper enum types for course_type and difficulty

-- Create enum types
DO $$ BEGIN
  CREATE TYPE course_type AS ENUM ('on-call-preparation', 'mri-based');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('Bread & Butter', 'Moderate', 'Challenging');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Alter columns to use enums
ALTER TABLE courses
  ALTER COLUMN course_type TYPE course_type USING course_type::course_type;

ALTER TABLE cases
  ALTER COLUMN difficulty TYPE difficulty_level USING difficulty::difficulty_level;

-- Clean "Case X - " prefix from diagnosis_title
UPDATE cases
  SET diagnosis_title = regexp_replace(diagnosis_title, E'^Case\\s+\\d+\\s*[-\u2013\u2014]\\s*', '', 'i')
  WHERE diagnosis_title ~ E'^Case\\s+\\d+';
