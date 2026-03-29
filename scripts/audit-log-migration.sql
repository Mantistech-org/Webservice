-- audit_log table
-- Records every significant admin action: logins, pricing changes, and
-- client status transitions. Written by lib/audit-log.ts (fire-and-forget).
--
-- Run this migration once in the Supabase SQL editor or via psql.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action        text        NOT NULL,
  entity_type   text        NOT NULL,
  entity_id     text        NOT NULL,
  details       jsonb       NOT NULL DEFAULT '{}',
  performed_at  timestamptz NOT NULL DEFAULT now()
);

-- Index on performed_at for time-based queries (most recent first)
CREATE INDEX IF NOT EXISTS audit_log_performed_at_idx
  ON public.audit_log (performed_at DESC);

-- Index on action for filtering by event type
CREATE INDEX IF NOT EXISTS audit_log_action_idx
  ON public.audit_log (action);

-- Row Level Security: deny all public access; only the service role
-- (used by the Next.js backend via SUPABASE_SERVICE_ROLE_KEY) may write.
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon or authenticated roles.
-- The service role bypasses RLS by design in Supabase.
-- Uncomment the line below if you also want admins to read audit logs
-- directly through the Supabase dashboard with the anon key:
-- CREATE POLICY "service_only" ON public.audit_log USING (false);

COMMENT ON TABLE public.audit_log IS
  'Append-only audit trail of admin actions. Written by lib/audit-log.ts.';
COMMENT ON COLUMN public.audit_log.action IS
  'Event type: admin_login | price_updated | plan_card_price_updated | client_status_changed | client_activated | client_approved | changes_requested';
COMMENT ON COLUMN public.audit_log.entity_type IS
  'The type of object affected: admin | project | plan_card | pricing_plan';
COMMENT ON COLUMN public.audit_log.entity_id IS
  'The ID of the affected entity (UUID or "admin" for login events)';
COMMENT ON COLUMN public.audit_log.details IS
  'Structured JSON payload — shape varies by action type';
