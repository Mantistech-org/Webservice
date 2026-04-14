import { NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'
import { enrollLeadInCampaigns } from '@/lib/campaigns'

// Run once to add the new columns:
//
// ALTER TABLE public.demo_leads ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]';
// ALTER TABLE public.demo_leads ADD COLUMN IF NOT EXISTS engaged boolean NOT NULL DEFAULT false;

export async function POST(req: Request) {
  try {
    const { sessionId, email, event, detail } = await req.json()

    if (!sessionId || !event) {
      return NextResponse.json({ success: true })
    }

    if (!pgEnabled) {
      return NextResponse.json({ success: true })
    }

    const newEvent = { event, detail: detail ?? null, at: new Date().toISOString() }
    const isEngaging = event === 'activate_now_click'

    // Look up existing row by session_id
    const rows = await query<{ id: string; events: unknown[]; engaged: boolean; email: string; business_name: string | null }>(
      `SELECT id, events, engaged, email, business_name FROM public.demo_leads WHERE session_id = $1 LIMIT 1`,
      [sessionId]
    )

    if (rows.length > 0) {
      const existing = rows[0]
      const currentEvents = Array.isArray(existing.events) ? existing.events : []
      const becomingEngaged = !existing.engaged && isEngaging
      await query(
        `UPDATE public.demo_leads
         SET events = $1::jsonb, engaged = $2
         WHERE id = $3`,
        [JSON.stringify([...currentEvents, newEvent]), existing.engaged || isEngaging, existing.id]
      ).catch(err => console.error('[demo/engagement] DB update failed:', err))

      if (becomingEngaged) {
        enrollLeadInCampaigns(existing.email, existing.business_name, 'engaged')
          .catch(err => console.error('[demo/engagement] enrollLeadInCampaigns failed:', err))
      }
    } else if (email) {
      // Gate form not yet persisted (e.g. race condition) — insert minimal row
      await query(
        `INSERT INTO public.demo_leads (email, session_id, events, engaged)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT DO NOTHING`,
        [email, sessionId, JSON.stringify([newEvent]), isEngaging]
      ).catch(err => console.error('[demo/engagement] DB insert failed:', err))

      if (isEngaging) {
        enrollLeadInCampaigns(email, null, 'engaged')
          .catch(err => console.error('[demo/engagement] enrollLeadInCampaigns (new row) failed:', err))
      }
    }
  } catch (err) {
    console.error('[demo/engagement] unexpected error:', err)
  }

  return NextResponse.json({ success: true })
}
