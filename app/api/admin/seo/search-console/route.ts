import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { isGscEnabled, getSearchAnalytics } from '@/lib/google-search-console'

// GET /api/admin/seo/search-console?days=28
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await isGscEnabled())) {
    return NextResponse.json(
      { error: 'Google Search Console is not configured. Add GOOGLE_SEARCH_CONSOLE_KEY to your environment.' },
      { status: 503 }
    )
  }

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '28', 10)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  try {
    const [keywords, pages] = await Promise.all([
      getSearchAnalytics({
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['query'],
        rowLimit: 25,
      }),
      getSearchAnalytics({
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['page'],
        rowLimit: 25,
      }),
    ])

    return NextResponse.json({ keywords, pages, startDate: fmt(startDate), endDate: fmt(endDate) })
  } catch (err) {
    console.error('[seo/search-console] GET failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch Search Console data.' },
      { status: 500 }
    )
  }
}
