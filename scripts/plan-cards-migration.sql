-- plan-cards-migration.sql
-- Creates the plan_cards table and seeds it with the 6 organisational plan rows.
-- All price fields start as NULL — amounts are only stored after being confirmed
-- via a read-only Stripe Price retrieval. Never seed with hardcoded amounts.

CREATE TABLE IF NOT EXISTS public.plan_cards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name    text    NOT NULL,
  is_discount  boolean NOT NULL DEFAULT false,
  -- Setup fee fields — both null until a Price ID is confirmed via Stripe
  setup_price_id   text    DEFAULT NULL,
  setup_amount     numeric(10,2) DEFAULT NULL,   -- null = not linked, never 0
  -- Monthly fee fields — both null until a Price ID is confirmed via Stripe
  monthly_price_id text    DEFAULT NULL,
  monthly_amount   numeric(10,2) DEFAULT NULL,   -- null = not linked, never 0
  visible      boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.plan_cards ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by the server-side pg pool)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_cards'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON public.plan_cards
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed the 6 organisational plan cards.
-- ON CONFLICT DO NOTHING makes this idempotent.
INSERT INTO public.plan_cards (plan_name, is_discount, sort_order)
VALUES
  ('Mantis Tech Starter',          false, 1),
  ('Mantis Tech Starter (Discount)', true,  2),
  ('Mantis Tech Growth',           false, 3),
  ('Mantis Tech Growth (Discount)',  true,  4),
  ('Mantis Tech Pro',              false, 5),
  ('Mantis Tech Pro (Discount)',     true,  6)
ON CONFLICT DO NOTHING;
