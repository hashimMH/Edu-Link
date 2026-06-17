-- Add new columns to tutors
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

-- Certificates table
CREATE TABLE IF NOT EXISTS teacher_certificates (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
