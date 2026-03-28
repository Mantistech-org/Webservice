import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

export type PlanCard = {
  id: string
  plan_name: string
  is_discount: boolean
  setup_price_id: string | null
  setup_amount: number | null       // exact amount confirmed from Stripe, null = not linked
  monthly_price_id: string | null
  monthly_amount: number | null     // exact amount confirmed from Stripe, null = not linked
  visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// GET /api/admin/pricing/plan-cards
// Returns all plan cards ordered by sort_order.
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ cards: [] })
  }

  try {
    const cards = await query<PlanCard>(
      `SELECT * FROM public.plan_cards ORDER BY sort_order ASC`
    )
    return NextResponse.json({ cards })
  } catch (err) {
    console.error('[plan-cards] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load plan cards.' }, { status: 500 })
  }
}
