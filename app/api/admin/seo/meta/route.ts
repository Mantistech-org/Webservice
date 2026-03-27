import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
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

export type SeoMeta = {
  id: string
  page_path: string
  page_label: string
  meta_title: string | null
  meta_description: string | null
  og_title: string | null
  og_description: string | null
  og_image: string | null
  status: string
  created_at: string
  updated_at: string
}

// GET /api/admin/seo/meta — list all saved meta tag records
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ meta: [] })

  try {
    const meta = await query<SeoMeta>(
      `SELECT * FROM public.seo_meta ORDER BY page_path ASC`
    )
    return NextResponse.json({ meta })
  } catch (err) {
    console.error('[seo/meta] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load meta tags.' }, { status: 500 })
  }
}

// POST /api/admin/seo/meta — generate and upsert meta tags for a page
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { page_path, page_label } = (await req.json()) as {
    page_path: string
    page_label: string
  }

  if (!page_path || !page_label) {
    return NextResponse.json({ error: 'page_path and page_label are required.' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mantistech.org'

  const prompt = `Generate SEO meta tags for the following page of the Mantis Tech website.

Mantis Tech is a web design and business automation company. We build professional websites for small businesses and add automation features like review management, appointment booking, social media posting, and lead generation. Based in Little Rock, Arkansas, serving clients nationwide.

Page label: ${page_label}
Page path: ${page_path}
Full URL: ${baseUrl}${page_path}

Return ONLY a valid JSON object with exactly these fields:
{
  "meta_title": "",
  "meta_description": "",
  "og_title": "",
  "og_description": ""
}

Requirements:
- meta_title: 50 to 60 characters, include the brand name and a relevant keyword
- meta_description: 140 to 160 characters, descriptive and includes a soft call to action
- og_title: 55 to 70 characters, can match or slightly rephrase meta_title
- og_description: 100 to 150 characters, engaging for social sharing
- No emojis
- No em dashes
- Write naturally and professionally
- Return only the JSON object, no explanation or markdown`

  try {
    const client = await getClient()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonStr = raw.startsWith('```')
      ? raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim()
      : raw

    const generated = JSON.parse(jsonStr) as {
      meta_title: string
      meta_description: string
      og_title: string
      og_description: string
    }

    const rows = await query<SeoMeta>(
      `INSERT INTO public.seo_meta (page_path, page_label, meta_title, meta_description, og_title, og_description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       ON CONFLICT (page_path) DO UPDATE SET
         page_label       = EXCLUDED.page_label,
         meta_title       = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         og_title         = EXCLUDED.og_title,
         og_description   = EXCLUDED.og_description,
         status           = 'draft',
         updated_at       = now()
       RETURNING *`,
      [
        page_path,
        page_label,
        generated.meta_title,
        generated.meta_description,
        generated.og_title,
        generated.og_description,
      ]
    )

    return NextResponse.json({ meta: rows[0] })
  } catch (err) {
    console.error('[seo/meta] POST failed:', err)
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })
  }
}
