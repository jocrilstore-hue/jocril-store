-- Admin settings table for storing configuration like API keys
-- Values are stored as text; sensitive values should be handled securely

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read settings (admin check done at API level)
CREATE POLICY "Authenticated users can read settings" ON admin_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert/update (admin check done at API level)
CREATE POLICY "Authenticated users can insert settings" ON admin_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings" ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings
INSERT INTO admin_settings (key, value, description) VALUES
  ('openrouter_api_key', NULL, 'OpenRouter API key for AI features'),
  ('openrouter_model', 'google/gemini-2.5-pro-preview-06-05', 'AI model to use for SEO generation')
ON CONFLICT (key) DO NOTHING;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER trigger_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_updated_at();
