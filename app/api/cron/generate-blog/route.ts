// POST /api/cron/generate-blog
//
// Weekly cron — generates a random-topic blog post draft and saves it with status='draft'.
// The post requires manual review and publishing in the admin SEO > Blog panel.
//
// ── Scheduling with cron-job.org ──────────────────────────────────────────────
// Since this project does not use railway.toml or Vercel cron, schedule via https://cron-job.org:
//
//   1. Create a free account at https://cron-job.org
//   2. Click "Create Cronjob"
//   3. Title:     Generate weekly blog post
//      URL:       https://<your-domain>/api/cron/generate-blog
//      Method:    POST
//      Schedule:  Custom — every Monday at 08:00 UTC
//                 Cron expression: 0 8 * * 1
//   4. Under "Headers", add:
//        Authorization: Bearer <value of CRON_SECRET from Supabase api_keys or Railway env>
//   5. Save and enable.
//
// To test: click "Run now" in the cron-job.org dashboard and check the execution log.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'
import { isGscEnabled } from '@/lib/google-search-console'
import Anthropic from '@anthropic-ai/sdk'
import { buildBlogPrompt } from '@/app/api/admin/seo/blog/route'
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

export async function POST(req: NextRequest) {
  const secret = await getApiKey('cron_secret')
  const authHeader = req.headers.get('authorization')
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ message: 'Database not configured.' })
  }

  const prompt = buildBlogPrompt() // no keyword — picks a random topic

  try {
    const client = await getClient()
    const message = await client.messages.create({
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
    isGscEnabled().then((enabled) => console.log(`[cron/generate-blog] GSC enabled: ${enabled}`))

    return NextResponse.json({ created: true, post })
  } catch (err) {
    console.error('[cron/generate-blog] failed:', err)
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })
  }
}
