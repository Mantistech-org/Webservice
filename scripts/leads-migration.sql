-- Run this once against your Supabase database.
-- Safe to re-run (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS public.leads (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text        NOT NULL,
  name       text,
  email      text,
  phone      text,
  message    text,
  source     text        DEFAULT 'contact_form',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_project_id_idx ON public.leads(project_id);
