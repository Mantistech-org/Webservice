import { NextResponse } from 'next/server'
import { supabase, supabaseEnabled } from '@/lib/supabase'

// Run this once in your Supabase SQL editor to create the table:
//
// CREATE TABLE IF NOT EXISTS public.demo_leads (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   email text NOT NULL,
//   business_name text,
//   business_type text,
//   session_id text,
//   created_at timestamptz NOT NULL DEFAULT now()
// );

export async function POST(req: Request) {
  try {
    const { email, businessName, businessType, sessionId } = await req.json()

    if (!email) {
      return NextResponse.json({ success: true })
    }

    if (supabaseEnabled) {
      const { error } = await supabase.from('demo_leads').insert({
        email,
        business_name: businessName ?? null,
        business_type: businessType ?? null,
        session_id: sessionId ?? null,
      })

      if (error) {
        console.error('[demo/lead] insert error:', error.message)
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.error('[demo/lead] Run the CREATE TABLE migration in your Supabase SQL editor.')
        }
      }
    }
  } catch (err) {
    console.error('[demo/lead] unexpected error:', err)
  }

  return NextResponse.json({ success: true })
}
