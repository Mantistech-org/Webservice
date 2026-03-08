-- Calendar events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  title text NOT NULL,
  event_date date NOT NULL,
  event_time time,
  notes text,
  customer_name text,
  customer_email text,
  customer_phone text,
  status text DEFAULT 'confirmed',
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_project_id_idx ON public.events(project_id);

-- Email automations table
CREATE TABLE IF NOT EXISTS public.email_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  trigger text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, trigger)
);
CREATE INDEX IF NOT EXISTS email_automations_project_id_idx ON public.email_automations(project_id);
