import { query, pgEnabled } from '@/lib/pg'

/**
 * Enroll a lead into all active campaigns matching the given audience tier.
 * Skips campaigns the lead is already enrolled in.
 * Safe to call fire-and-forget — all errors are thrown to the caller.
 */
export async function enrollLeadInCampaigns(
  email: string,
  businessName: string | null | undefined,
  audience: 'all' | 'engaged'
): Promise<string[]> {
  if (!pgEnabled) return []

  const campaigns = await query<{ id: string }>(
    `SELECT id FROM public.email_campaigns
     WHERE status = 'active' AND audience = $1`,
    [audience]
  )

  if (campaigns.length === 0) return []

  // Avoid duplicate enrollments
  const existing = await query<{ campaign_id: string }>(
    `SELECT campaign_id FROM public.campaign_enrollments WHERE lead_email = $1`,
    [email]
  )
  const enrolledIds = new Set(existing.map((r) => r.campaign_id))
  const toEnroll = campaigns.filter((c) => !enrolledIds.has(c.id))

  if (toEnroll.length === 0) return []

  await Promise.all(
    toEnroll.map((c) =>
      query(
        `INSERT INTO public.campaign_enrollments (campaign_id, lead_email, lead_name)
         VALUES ($1, $2, $3)`,
        [c.id, email, businessName ?? null]
      )
    )
  )

  return toEnroll.map((c) => c.id)
}
