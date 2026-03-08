import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params

  const project = await getProjectByClientToken(clientToken)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({
      leadsThisMonth: 0,
      leadsLastMonth: 0,
      recentLeads: [],
      totalLeads: 0,
    })
  }

  const now = new Date()
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString()

  try {
    const [totalRow, thisMonthRow, lastMonthRow, recentRows] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.leads WHERE project_id = $1`,
        [project.id]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.leads WHERE project_id = $1 AND created_at >= $2`,
        [project.id, thisMonthStart]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.leads WHERE project_id = $1 AND created_at >= $2 AND created_at < $3`,
        [project.id, lastMonthStart, thisMonthStart]
      ),
      query<{ id: string; name: string | null; email: string | null; phone: string | null; created_at: string }>(
        `SELECT id, name, email, phone, created_at FROM public.leads WHERE project_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [project.id]
      ),
    ])

    return NextResponse.json({
      leadsThisMonth: parseInt(thisMonthRow[0]?.count ?? '0', 10),
      leadsLastMonth: parseInt(lastMonthRow[0]?.count ?? '0', 10),
      recentLeads: recentRows,
      totalLeads: parseInt(totalRow[0]?.count ?? '0', 10),
    })
  } catch (err) {
    console.error('[analytics] leads query failed:', err)
    return NextResponse.json({
      leadsThisMonth: 0,
      leadsLastMonth: 0,
      recentLeads: [],
      totalLeads: 0,
    })
  }
}
