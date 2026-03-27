import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { gscEnabled, submitSitemap } from '@/lib/google-search-console'
import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from '@/lib/api-keys'

let _client: Anthropic | null = null
async function getClient(): Promise<Anthropic> {
  if (!_client) {
    const apiKey = await getApiKey('anthropic')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export type LocationPage = {
  id: string
  city: string
  state: string
  slug: string
  meta_title: string | null
  meta_description: string | null
  headline: string | null
  content: string | null
  status: string
  created_at: string
  updated_at: string
  published_at: string | null
}

// GET /api/admin/seo/locations — list all location pages
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ pages: [] })

  try {
    const pages = await query<LocationPage>(
      `SELECT id, city, state, slug, meta_title, meta_description, headline, status, created_at, published_at
       FROM public.seo_location_pages ORDER BY created_at DESC`
    )
    return NextResponse.json({ pages })
  } catch (err) {
    console.error('[seo/locations] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load location pages.' }, { status: 500 })
  }
}

// POST /api/admin/seo/locations — generate a location page
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { city, state } = (await req.json()) as { city: string; state: string }

  if (!city?.trim() || !state?.trim()) {
    return NextResponse.json({ error: 'city and state are required.' }, { status: 400 })
  }

  const cityClean = city.trim()
  const stateClean = state.trim()
  const slug = `${cityClean.toLowerCase().replace(/\s+/g, '-')}-${stateClean.toLowerCase().replace(/\s+/g, '-')}`

  const prompt = `Write a complete, SEO-optimized landing page for Mantis Tech targeting small businesses in ${cityClean}, ${stateClean}.

Mantis Tech builds professional websites for small businesses and includes automation features like appointment booking, review management, social media automation, and lead generation tools. Clients get a custom website plus ongoing tools that help their business run more efficiently.

Target keywords: "web design ${cityClean} ${stateClean}", "small business website ${cityClean}", "website design ${cityClean} ${stateClean}"

Return ONLY a valid JSON object with exactly these fields:
{
  "meta_title": "",
  "meta_description": "",
  "headline": "",
  "content": ""
}

Requirements:
- meta_title: 50 to 60 characters, include the city and a keyword
- meta_description: 140 to 160 characters, include city and a soft CTA
- headline: The H1 for the page, under 70 characters, specific to ${cityClean}
- content: Full HTML body content using p, h2, h3, ul, li tags only (no H1 - the headline field is the H1). Structure: opening paragraph, services section (h2), why choose us section (h2), local relevance paragraph mentioning ${cityClean}, closing CTA paragraph. Total 600 to 900 words.

Rules:
- No emojis
- No em dashes (use commas or regular dashes instead)
- Write naturally and professionally, like a real local business service page
- Reference ${cityClean} several times throughout the content
- Return only the JSON object, no explanation or markdown`

  try {
    const client = await getClient()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonStr = raw.startsWith('```')
      ? raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim()
      : raw

    const generated = JSON.parse(jsonStr) as {
      meta_title: string
      meta_description: string
      headline: string
      content: string
    }

    const rows = await query<LocationPage>(
      `INSERT INTO public.seo_location_pages
         (city, state, slug, meta_title, meta_description, headline, content, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
       ON CONFLICT (slug) DO UPDATE SET
         meta_title       = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         headline         = EXCLUDED.headline,
         content          = EXCLUDED.content,
         status           = 'draft',
         updated_at       = now()
       RETURNING *`,
      [
        cityClean,
        stateClean,
        slug,
        generated.meta_title,
        generated.meta_description,
        generated.headline,
        generated.content,
      ]
    )

    const page = rows[0]

    // If already published, re-submit sitemap
    if (page.status === 'published' && gscEnabled) {
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''
      submitSitemap(`${base}/sitemap.xml`)
    }

    return NextResponse.json({ page })
  } catch (err) {
    console.error('[seo/locations] POST failed:', err)
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })
  }
}
