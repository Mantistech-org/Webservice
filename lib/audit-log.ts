// Audit logging — fire-and-forget writes to public.audit_log.
// All failures are logged to stderr but never bubble up to callers.

import { query, pgEnabled } from '@/lib/pg'

export type AuditAction =
  | 'admin_login'
  | 'price_updated'
  | 'plan_card_price_updated'
  | 'client_status_changed'
  | 'client_activated'
  | 'client_approved'
  | 'changes_requested'

/**
 * Write one audit log entry. Non-blocking — returns immediately.
 * Safe to call without awaiting.
 */
export function logAudit(
  action: AuditAction,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {}
): void {
  if (!pgEnabled) return

  query(
    `INSERT INTO public.audit_log (action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4)`,
    [action, entityType, entityId, JSON.stringify(details)]
  ).catch((err) => {
    console.error('[audit-log] Failed to write audit entry:', err)
  })
}
