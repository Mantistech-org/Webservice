-- client-configs-migration.sql
-- Creates the client_configs table to store AI-generated dashboard configurations.
-- Each project gets one row, upserted on project_id.

CREATE TABLE IF NOT EXISTS public.client_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  missed_call_reply text,
  review_request_sms text,
  review_request_email text,
  gbp_post_templates jsonb,
  sms_templates jsonb,
  email_templates jsonb,
  service_area_description text,
  welcome_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_configs_project_id_idx
  ON public.client_configs (project_id);

ALTER TABLE public.client_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_configs'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON public.client_configs
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
