-- Migration 010: Missing Indexes for Query Performance
-- These indexes prevent full table scans on common queries

-- Conversations: lookup by either participant
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);

-- Messages: sender/receiver lookups for read receipts and history
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- Lessons: user history ordered by date
CREATE INDEX IF NOT EXISTS idx_lessons_user ON lessons(user_id);

-- Appointments: status filter for conflict checks
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_tutor ON appointments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_student ON appointments(student_id);

-- Reviews: lookup by student and teacher
CREATE INDEX IF NOT EXISTS idx_reviews_student ON reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON reviews(teacher_id);

-- Refresh tokens: lookup by token (auth)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Password resets: lookup by token
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

-- Notifications: user's unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Payments: user payment history
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- Class recordings: student/teacher lookup
CREATE INDEX IF NOT EXISTS idx_class_recordings_student ON class_recordings(student_id);
CREATE INDEX IF NOT EXISTS idx_class_recordings_teacher ON class_recordings(teacher_id);

-- Saved tutors: student's saved list
CREATE INDEX IF NOT EXISTS idx_saved_tutors_student ON saved_tutors(student_id);

-- Teacher classes: lookup by participants
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_student ON teacher_classes(student_id);

-- User subscriptions: user's active subs
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
