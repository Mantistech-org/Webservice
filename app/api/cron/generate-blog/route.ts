import { NextRequest, NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'
import { gscEnabled } from '@/lib/google-search-console'
import Anthropic from '@anthropic-ai/sdk'
import { buildBlogPrompt } from '@/app/api/admin/seo/blog/route'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

// POST /api/cron/generate-blog
// Called weekly by a cron scheduler (e.g. Vercel Cron or Railway Cron).
// Protected by CRON_SECRET via Authorization: Bearer <secret> header.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ message: 'Database not configured.' })
  }

  const prompt = buildBlogPrompt() // no keyword — picks a random topic

  try {
    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonStr = raw.startsWith('```')
      ? raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim()
      : raw

    const generated = JSON.parse(jsonStr) as {
      title: string
      slug: string
      meta_description: string
      content: string
    }

    let slug = generated.slug
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const existing = await query<{ id: string }>(
      `SELECT id FROM public.blog_posts WHERE slug = $1`,
      [slug]
    )
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-6)}`
    }

    const rows = await query<{ id: string; title: string; slug: string }>(
      `INSERT INTO public.blog_posts (title, slug, meta_description, content, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING id, title, slug`,
      [generated.title, slug, generated.meta_description, generated.content]
    )

    const post = rows[0]
    console.log(`[cron/generate-blog] Draft created: "${post.title}" (${post.slug})`)

    // Sitemap submission is deferred to the publish step (PUT /api/admin/seo/blog/[id]).
    // gscEnabled is referenced here to keep the import live if tree-shaking is aggressive.
    console.log(`[cron/generate-blog] GSC enabled: ${gscEnabled}`)

    return NextResponse.json({ created: true, post })
  } catch (err) {
    console.error('[cron/generate-blog] failed:', err)
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })
  }
}
