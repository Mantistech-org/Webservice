import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabase, supabaseEnabled } from '@/lib/supabase'
import { query } from '@/lib/pg'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseEnabled) {
    return NextResponse.json({ leads: [] })
  }

  const { data, error } = await supabase
    .from('demo_leads')
    .select('id, email, business_name, business_type, engaged, events, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/demo-leads] query error:', error.message)
    return NextResponse.json({ leads: [] })
  }

  return NextResponse.json({ leads: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await query(`DELETE FROM public.demo_leads WHERE id = $1`, [id])
  return NextResponse.json({ success: true })
}
