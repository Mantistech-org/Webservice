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

export type BlogPost = {
  id: string
  title: string
  slug: string
  meta_description: string | null
  content: string | null
  status: string
  created_at: string
  updated_at: string
  published_at: string | null
}

const FALLBACK_TOPICS = [
  'why every small business needs a professional website in 2025',
  'how to get more Google reviews for your local business',
  'the benefits of automated appointment booking for service businesses',
  'local SEO basics for small business owners',
  'how to turn your website into a lead generation tool',
  'why your business website should do more than look good',
  'automating social media posts for small businesses',
  'what to look for when hiring a web designer for your small business',
]

// Exported so the weekly cron route can reuse the same prompt builder.
export function buildBlogPrompt(keyword?: string): string {
  const topic = keyword?.trim()
    ? `Target keyword: "${keyword.trim()}"`
    : `Write about this topic: ${FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)]}`

  return `Write a complete SEO blog post for the Mantis Tech website blog.

Mantis Tech builds professional websites and automation tools for small businesses. Services include custom web design, appointment booking, review management, social media automation, and lead generation. Based in Little Rock, Arkansas.

${topic}

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "",
  "slug": "",
  "meta_description": "",
  "content": ""
}

Requirements:
- title: The H1 blog post title, SEO-optimized, 50 to 65 characters
- slug: URL-friendly version of the title, lowercase letters and hyphens only, no numbers at start, under 60 characters
- meta_description: 140 to 160 characters, includes the keyword and a reason to click
- content: Full HTML body content. Start with an engaging opening paragraph (no H1 - the title is the H1). Use h2 for main sections, h3 for sub-points. Include p, ul, li tags as appropriate. End with a closing section that includes a call to action pointing readers to Mantis Tech. Total 800 to 1200 words.

Rules:
- No emojis
- No em dashes (use commas or regular dashes)
- Write in a knowledgeable, direct, professional tone
- Content must provide genuine value to small business owners
- The CTA at the end should mention Mantis Tech naturally, not like an ad
- Return only the JSON object, no explanation or markdown`
}

// GET /api/admin/seo/blog — list all blog posts
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ posts: [] })

  try {
    const posts = await query<BlogPost>(
      `SELECT id, title, slug, meta_description, status, created_at, published_at
       FROM public.blog_posts ORDER BY created_at DESC`
    )
    return NextResponse.json({ posts })
  } catch (err) {
    console.error('[seo/blog] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load posts.' }, { status: 500 })
  }
}

// POST /api/admin/seo/blog — generate a new blog post draft
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { keyword } = (await req.json()) as { keyword?: string }

  const prompt = buildBlogPrompt(keyword)

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

    // Ensure slug uniqueness by appending timestamp if conflict
    let slug = generated.slug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const existing = await query<{ id: string }>(
      `SELECT id FROM public.blog_posts WHERE slug = $1`,
      [slug]
    )
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-6)}`
    }

    const rows = await query<BlogPost>(
      `INSERT INTO public.blog_posts (title, slug, meta_description, content, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [generated.title, slug, generated.meta_description, generated.content]
    )

    return NextResponse.json({ post: rows[0] })
  } catch (err) {
    console.error('[seo/blog] POST failed:', err)
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })
  }
}
