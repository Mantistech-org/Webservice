-- Pricing Plans: stores plan metadata, Stripe references, and public visibility
-- Plans are populated by syncing from Stripe in the admin Pricing Manager,
-- not seeded from hardcoded values.
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                text NOT NULL UNIQUE,             -- slugified product name or metadata.plan_key
  name                    text NOT NULL,
  upfront                 integer NOT NULL DEFAULT 0,       -- dollars
  monthly                 integer NOT NULL DEFAULT 0,       -- dollars
  pages                   integer NOT NULL DEFAULT 1,       -- from product metadata.pages
  features                jsonb NOT NULL DEFAULT '[]',      -- from product metadata.features (JSON array)
  stripe_product_id       text,                            -- prod_xxx
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
  stripe_coupon_id      text NOT NULL,
  stripe_promo_code_id  text,
  code                  text NOT NULL UNIQUE,
  label                 text,
  discount_type         text NOT NULL CHECK (discount_type IN ('percent', 'amount')),
  discount_value        numeric NOT NULL,
  applies_to            text NOT NULL DEFAULT 'all',
  duration_months       integer,
  max_redemptions       integer,
  times_redeemed        integer NOT NULL DEFAULT 0,
  expires_at            timestamptz,
  active                boolean NOT NULL DEFAULT true,
  display_on_pricing    boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger function (shared by both tables)
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
