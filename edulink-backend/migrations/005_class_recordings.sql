-- Class recordings for students
CREATE TABLE IF NOT EXISTS class_recordings (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES teacher_classes(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  duration TEXT,                -- e.g. "45 min"
  video_url TEXT,               -- path to uploaded recording file
  thumbnail_url TEXT,           -- thumbnail image
  notes TEXT,                   -- student's personal notes
  teacher_notes TEXT,           -- notes shared by teacher
  materials TEXT,               -- JSON array of { title, url, type }
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recordings_student ON class_recordings(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_class ON class_recordings(class_id);
