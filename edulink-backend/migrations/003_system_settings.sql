-- System settings table for global app configuration
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default: subscriptions are enabled
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('subscriptions_enabled', 'true');
