-- pricing-fix-migration.sql
-- Fixes upfront and monthly column types to support decimal prices (e.g. $87.50).
-- PostgreSQL integer cannot store 87.5 — numeric(10,2) can.
-- Safe to run multiple times.

ALTER TABLE public.pricing_plans
  ALTER COLUMN upfront TYPE numeric(10,2),
  ALTER COLUMN monthly TYPE numeric(10,2);
