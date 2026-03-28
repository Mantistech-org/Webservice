-- Custom Add-ons: bespoke services created manually, optionally tied to a specific client
CREATE TABLE IF NOT EXISTS public.custom_addons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  client_name   text,                          -- optional — blank means generic / available to anyone
  description   text NOT NULL DEFAULT '',
  one_time_fee  numeric,                       -- optional upfront charge
  monthly_fee   numeric,                       -- optional recurring charge
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_custom_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER custom_addons_updated_at
  BEFORE UPDATE ON public.custom_addons
  FOR EACH ROW EXECUTE FUNCTION public.set_custom_addons_updated_at();

-- Row Level Security (service role key bypasses RLS)
ALTER TABLE public.custom_addons ENABLE ROW LEVEL SECURITY;
