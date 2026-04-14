import { NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'

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

    if (pgEnabled) {
      await query(
        `INSERT INTO public.demo_leads (email, business_name, business_type, session_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [email.trim(), businessName?.trim() || null, businessType?.trim() || null, sessionId?.trim() || null]
      ).catch(err => console.error('[demo/lead] DB insert failed:', err))
    }
  } catch (err) {
    console.error('[demo/lead] unexpected error:', err)
  }

  return NextResponse.json({ success: true })
}
