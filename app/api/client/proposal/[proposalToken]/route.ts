import { NextRequest, NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ proposalToken: string }> }
) {
  const { proposalToken } = await params
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    const rows = await query(
      `SELECT * FROM public.client_proposals WHERE proposal_token = $1`,
      [proposalToken]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    return NextResponse.json({ proposal: rows[0] })
  } catch (err) {
    console.error('[proposal/token] GET failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ proposalToken: string }> }
) {
  const { proposalToken } = await params
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  const body = await req.json()
  const { status } = body

  if (!status || !['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'status must be accepted or declined' }, { status: 400 })
  }

  try {
    const rows = await query(
      `UPDATE public.client_proposals
       SET status = $1, updated_at = NOW()
       WHERE proposal_token = $2
       RETURNING *`,
      [status, proposalToken]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    return NextResponse.json({ proposal: rows[0] })
  } catch (err) {
    console.error('[proposal/token] PATCH failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
