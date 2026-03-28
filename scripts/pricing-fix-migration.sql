-- pricing-fix-migration.sql
-- 1. Fix upfront/monthly column types (integer → numeric(10,2)) for decimal prices like $87.50
-- 2. Add monthly_original column to store the regular price when a launch/discount price is active
-- Safe to run multiple times.

ALTER TABLE public.pricing_plans
  ALTER COLUMN upfront TYPE numeric(10,2),
  ALTER COLUMN monthly TYPE numeric(10,2);

ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS monthly_original numeric(10,2) DEFAULT NULL;
