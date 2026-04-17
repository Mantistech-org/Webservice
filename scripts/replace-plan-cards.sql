-- replace-plan-cards.sql
-- One-time script: removes all old Starter/Growth/Pro plan cards and inserts
-- the two current plans (Platform Only, Platform Plus).
-- All price fields start NULL — link them via the admin pricing UI.

TRUNCATE TABLE public.plan_cards RESTART IDENTITY;

INSERT INTO public.plan_cards (plan_name, is_discount, setup_price_id, setup_amount, monthly_price_id, monthly_amount, visible, sort_order)
VALUES
  ('Mantis Tech Platform Only',  false, NULL, NULL, NULL, NULL, true, 1),
  ('Mantis Tech Platform Plus',  false, NULL, NULL, NULL, NULL, true, 2);
