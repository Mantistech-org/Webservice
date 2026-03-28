-- pricing-decimal-migration.sql
-- Changes upfront and monthly columns from integer to numeric(10,2)
-- to support Stripe prices that are not whole dollar amounts (e.g. $87.50).
-- Safe to run multiple times — ALTER COLUMN TYPE is idempotent when already the correct type.

ALTER TABLE public.pricing_plans
  ALTER COLUMN upfront TYPE numeric(10,2),
  ALTER COLUMN monthly TYPE numeric(10,2);
