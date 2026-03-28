-- Pricing Plans: stores plan metadata, Stripe references, and public visibility
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                text NOT NULL UNIQUE,             -- 'starter' | 'mid' | 'pro'
  name                    text NOT NULL,
  upfront                 integer NOT NULL,                 -- dollars
  monthly                 integer NOT NULL,                 -- dollars
  pages                   integer NOT NULL,
  features                jsonb NOT NULL DEFAULT '[]',
  stripe_product_id       text,                            -- prod_xxx (links to Stripe Product)
  stripe_monthly_price_id text,                            -- price_xxx for recurring monthly
  stripe_upfront_price_id text,                            -- price_xxx for one-time upfront
  visible                 boolean NOT NULL DEFAULT true,   -- show on public pricing page
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Pricing Promotions: discount codes backed by Stripe Coupons
CREATE TABLE IF NOT EXISTS public.pricing_promotions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id      text NOT NULL,                          -- Stripe Coupon ID
  stripe_promo_code_id  text,                                   -- Stripe PromotionCode ID
  code                  text NOT NULL UNIQUE,                   -- e.g. LAUNCH50
  label                 text,                                   -- e.g. "Launch Pricing"
  discount_type         text NOT NULL CHECK (discount_type IN ('percent', 'amount')),
  discount_value        numeric NOT NULL,                       -- percent: 0-100, amount: dollars
  applies_to            text NOT NULL DEFAULT 'all',            -- 'all' | 'starter' | 'mid' | 'pro'
  duration_months       integer,                               -- null = forever
  max_redemptions       integer,                               -- null = unlimited
  times_redeemed        integer NOT NULL DEFAULT 0,
  expires_at            timestamptz,
  active                boolean NOT NULL DEFAULT true,
  display_on_pricing    boolean NOT NULL DEFAULT false,        -- show label on public pricing card
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Seed initial plan data (safe to re-run — ON CONFLICT DO NOTHING)
INSERT INTO public.pricing_plans (plan_key, name, upfront, monthly, pages, features, sort_order)
VALUES
  ('starter', 'Starter', 100, 40,  4,
   '["Booking Calendar included free","Custom website","Hosting and domain","Monthly performance report"]', 1),
  ('mid',     'Growth',  150, 125, 6,
   '["Booking Calendar included free","Everything in Starter","Social Media Automation","Review Management","SEO Optimization","Ad Creative Generation"]', 2),
  ('pro',     'Pro',     200, 250, 9,
   '["Booking Calendar included free","Everything in Growth","E-Commerce Automation","Automated Lead Generation","Website Chatbot","Automated Email Marketing"]', 3)
ON CONFLICT (plan_key) DO NOTHING;

-- updated_at trigger function (shared)
CREATE OR REPLACE FUNCTION public.set_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_pricing_updated_at();

CREATE TRIGGER pricing_promotions_updated_at
  BEFORE UPDATE ON public.pricing_promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_pricing_updated_at();

-- Row Level Security (service role key bypasses RLS)
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_promotions ENABLE ROW LEVEL SECURITY;
