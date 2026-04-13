import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabase, supabaseEnabled } from '@/lib/supabase'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseEnabled) {
    return NextResponse.json({ leads: [] })
  }

  const { data, error } = await supabase
    .from('demo_leads')
    .select('id, email, business_name, business_type, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/demo-leads] query error:', error.message)
    return NextResponse.json({ leads: [] })
  }

  return NextResponse.json({ leads: data ?? [] })
}
