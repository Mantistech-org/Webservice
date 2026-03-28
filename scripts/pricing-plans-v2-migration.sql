-- Pricing Plans v2: replace single stripe_product_id with separate
-- stripe_setup_product_id (one-time fee product) and stripe_monthly_product_id (recurring product).
-- Run this in Supabase SQL editor after the original pricing-migration.sql.

ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS stripe_setup_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_monthly_product_id text;

-- Plan had an upfront fee → the linked product was the setup product
UPDATE public.pricing_plans
SET stripe_setup_product_id = stripe_product_id
WHERE stripe_product_id IS NOT NULL
  AND upfront > 0
  AND stripe_setup_product_id IS NULL;

-- Plan had only a monthly fee → the linked product was the monthly product
UPDATE public.pricing_plans
SET stripe_monthly_product_id = stripe_product_id
WHERE stripe_product_id IS NOT NULL
  AND monthly > 0
  AND upfront = 0
  AND stripe_monthly_product_id IS NULL;

-- Plan had both → treat as monthly product (setup can be linked manually via Pricing Manager)
UPDATE public.pricing_plans
SET stripe_monthly_product_id = stripe_product_id
WHERE stripe_product_id IS NOT NULL
  AND monthly > 0
  AND upfront > 0
  AND stripe_monthly_product_id IS NULL;

-- Drop the old single-product column
ALTER TABLE public.pricing_plans DROP COLUMN IF EXISTS stripe_product_id;
