-- api_keys table migration
-- Run this in the Supabase SQL editor once to create the table.
-- Stores API keys for global admin use (scope = 'admin') and eventually per-client use.

CREATE TABLE IF NOT EXISTS public.api_keys (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       text        NOT NULL DEFAULT 'admin',
  service     text        NOT NULL,
  key_value   text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, service)
);

-- Enable Row Level Security.
-- The app connects with the service role key which bypasses RLS.
-- No public or anon policies are created, so the table is inaccessible to end users.
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS api_keys_updated_at ON public.api_keys;
CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_api_keys_updated_at();

-- Seed admin keys.
-- Replace placeholder values with your actual keys before running,
-- or use the Integrations page in the admin dashboard and click "Seed from Environment"
-- to populate the table automatically from your current Railway environment variables.
--
-- INSERT INTO public.api_keys (scope, service, key_value)
-- VALUES
--   ('admin', 'anthropic',                  'sk-ant-...'),
--   ('admin', 'resend',                     're_...'),
--   ('admin', 'supabase_url',               'https://...supabase.co'),
--   ('admin', 'supabase_anon_key',          'eyJ...'),
--   ('admin', 'supabase_service_role_key',  'eyJ...'),
--   ('admin', 'supabase_db_url',            'postgresql://...'),
--   ('admin', 'stripe_secret',              'sk_live_...'),
--   ('admin', 'stripe_webhook_secret',      'whsec_...'),
--   ('admin', 'stripe_price',               'price_...'),
--   ('admin', 'google_places',              'AIza...'),
--   ('admin', 'google_search_console',      '{"type":"service_account",...}'),
--   ('admin', 'cron_secret',               'your-cron-secret')
-- ON CONFLICT (scope, service) DO NOTHING;
