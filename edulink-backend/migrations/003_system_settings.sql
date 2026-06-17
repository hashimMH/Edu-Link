-- System settings table for global app configuration
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Default: subscriptions are enabled
INSERT INTO system_settings (key, value) VALUES ('subscriptions_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
