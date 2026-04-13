import { NextResponse } from 'next/server'
import { supabase, supabaseEnabled } from '@/lib/supabase'

// Run once in your Supabase SQL editor to add the new columns:
//
// ALTER TABLE public.demo_leads ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]';
// ALTER TABLE public.demo_leads ADD COLUMN IF NOT EXISTS engaged boolean NOT NULL DEFAULT false;

export async function POST(req: Request) {
  try {
    const { sessionId, email, event, detail } = await req.json()

    if (!sessionId || !event) {
      return NextResponse.json({ success: true })
    }

    if (!supabaseEnabled) {
      return NextResponse.json({ success: true })
    }

    const newEvent = { event, detail: detail ?? null, at: new Date().toISOString() }
    const isEngaging = event === 'activate_now_click'

    // Look up existing row by session_id
    const { data: existing } = await supabase
      .from('demo_leads')
      .select('id, events, engaged')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (existing) {
      const currentEvents = Array.isArray(existing.events) ? existing.events : []
      await supabase
        .from('demo_leads')
        .update({
          events: [...currentEvents, newEvent],
          engaged: existing.engaged || isEngaging,
        })
        .eq('id', existing.id)
    } else if (email) {
      // Gate form not yet persisted (e.g. race condition) — insert minimal row
      await supabase.from('demo_leads').insert({
        email,
        session_id: sessionId,
        events: [newEvent],
        engaged: isEngaging,
      })
    }
  } catch (err) {
    console.error('[demo/engagement] unexpected error:', err)
  }

  return NextResponse.json({ success: true })
}
