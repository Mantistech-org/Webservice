import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { scrapeEmailFromWebsite } from '@/lib/scrape-email'

async function guessEmailFromDomain(website: string): Promise<string | null> {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`)
    const domain = url.hostname.replace('www.', '')
    return `info@${domain}`
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { website, businessName } = body as {
    website?: string
    businessName?: string
    city?: string
  }

  if (!website) {
    return NextResponse.json({ email: null, found: false, method: 'not_found' })
  }

  const scraped = await scrapeEmailFromWebsite(website)
  if (scraped) {
    return NextResponse.json({ email: scraped, found: true, method: 'scrape' })
  }

  const guessed = await guessEmailFromDomain(website)
  if (guessed) {
    return NextResponse.json({ email: guessed, found: true, method: 'guess' })
  }

  return NextResponse.json({ email: null, found: false, method: 'not_found' })
}
