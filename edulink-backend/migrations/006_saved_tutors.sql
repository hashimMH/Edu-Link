-- Saved tutors (student bookmarks)
CREATE TABLE IF NOT EXISTS saved_tutors (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutor_id TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_tutors_student ON saved_tutors(student_id);
