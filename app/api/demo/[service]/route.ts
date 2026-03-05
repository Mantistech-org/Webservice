import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { logDemoActivity } from '@/lib/demo-db'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function parseClaudeJson(text: string): unknown {
  let cleaned = text.trim()

  // Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim()
  }

  // Find the outermost JSON structure
  const firstBrace = cleaned.indexOf('{')
  const firstBracket = cleaned.indexOf('[')
  let start = -1
  if (firstBrace >= 0 && (firstBracket < 0 || firstBrace <= firstBracket)) {
    start = firstBrace
  } else if (firstBracket >= 0) {
    start = firstBracket
  }
  if (start > 0) cleaned = cleaned.slice(start)

  const lastBrace = cleaned.lastIndexOf('}')
  const lastBracket = cleaned.lastIndexOf(']')
  const end = Math.max(lastBrace, lastBracket)
  if (end >= 0 && end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1)

  return JSON.parse(cleaned)
}

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}

function buildPrompt(service: string, body: Record<string, unknown>): { prompt: string; maxTokens: number } {
  switch (service) {
    case 'review-management':
      return {
        maxTokens: 500,
        prompt: `You are a professional reputation management expert. Write a thoughtful, professional public response to this negative review.

Business Name: ${body.businessName}
Review: "${body.review}"

Requirements:
- Acknowledge the experience without being defensive
- Apologize sincerely and briefly
- Mention a specific corrective action or invite private resolution
- Keep it under 150 words
- Warm but professional tone
- No emojis

Return ONLY a valid JSON object with no explanation:
{ "response": "..." }`,
      }

    case 'social-media':
      return {
        maxTokens: 1200,
        prompt: `You are a professional social media manager. Create platform-specific posts for this business.

Business Description: ${body.businessDescription}
Post Topic or Direction: ${body.topic || 'General business update'}
Photo uploaded: ${body.hasPhoto ? 'Yes' : 'No'}

Create posts for all five platforms:
1. Instagram: engaging caption with 5 to 8 relevant hashtags
2. Facebook: conversational post under 300 words
3. Google Business: professional business update under 200 words
4. Twitter/X: punchy post under 280 characters, no hashtags
5. LinkedIn: professional post with business insight, under 400 words

Return ONLY a valid JSON object with no explanation or markdown:
{
  "instagram": { "caption": "...", "hashtags": ["...", "..."] },
  "facebook": { "post": "..." },
  "google_business": { "post": "..." },
  "twitter": { "tweet": "..." },
  "linkedin": { "post": "..." }
}`,
      }

    case 'lead-generation':
      return {
        maxTokens: 3500,
        prompt: `You are a sales development expert. Generate 10 realistic potential business leads.

Target Industry: ${body.industry}
Location: ${body.location}
Ideal Client Description: ${body.clientDescription}

For each lead, provide a realistic local business name, specific city and state, industry subcategory, plausible professional email, a personalized outreach email subject line, and a personalized outreach email body (3 to 4 paragraphs, professional, specific to their business type).

Return ONLY a valid JSON object with no explanation or markdown:
{
  "leads": [
    {
      "businessName": "...",
      "location": "...",
      "industry": "...",
      "email": "...",
      "outreachSubject": "...",
      "outreachBody": "..."
    }
  ]
}`,
      }

    case 'seo-optimization':
      return {
        maxTokens: 2000,
        prompt: `You are an SEO specialist. Create a comprehensive SEO report for this business.

Business Name: ${body.businessName}
Business Type: ${body.businessType}
Location: ${body.location}

Generate:
- 8 target keywords with realistic monthly search volume (numbers between 50 and 22000), difficulty (Low/Medium/High), and opportunity score (Low/Medium/High)
- 4 optimized page title suggestions (under 60 characters each)
- 4 meta description suggestions (under 155 characters each)
- 8 local search terms people nearby are using
- 6 ranking tracker entries with current position (10 to 80) and position change (positive or negative integer)

Return ONLY a valid JSON object with no explanation or markdown:
{
  "keywords": [
    { "term": "...", "monthlyVolume": 1200, "difficulty": "Medium", "opportunity": "High" }
  ],
  "pageTitles": ["...", "..."],
  "metaDescriptions": ["...", "..."],
  "localTerms": ["...", "..."],
  "rankings": [
    { "term": "...", "position": 24, "change": 3 }
  ]
}`,
      }

    case 'ecommerce-automation':
      return {
        maxTokens: 4500,
        prompt: `You are an e-commerce email marketing expert. Create three automated email sequences.

Store Name: ${body.storeName}
Product Types: ${body.productTypes}

Create:
1. Abandoned Cart Recovery: 3 emails (delays: 1 hour, 24 hours, 72 hours)
2. Post-Purchase Follow-up: 3 emails (delays: immediately, 7 days, 30 days)
3. Restock Alert: 2 emails (delays: immediately, 48 hours)

Each email needs a compelling subject line, preview text (50 characters), and full body copy (150 to 250 words).

Return ONLY a valid JSON object with no explanation or markdown:
{
  "abandonedCart": {
    "emails": [
      { "subject": "...", "preview": "...", "body": "...", "delayLabel": "1 hour after abandonment" }
    ]
  },
  "postPurchase": {
    "emails": [
      { "subject": "...", "preview": "...", "body": "...", "delayLabel": "Immediately after purchase" }
    ]
  },
  "restockAlert": {
    "emails": [
      { "subject": "...", "preview": "...", "body": "...", "delayLabel": "When item restocks" }
    ]
  }
}`,
      }

    case 'ad-creative':
      return {
        maxTokens: 1400,
        prompt: `You are a digital advertising expert. Create compelling ad copy for multiple platforms.

Business Name: ${body.businessName}
Promotion: ${body.promotion}
Target Audience: ${body.targetAudience}
Direction: ${body.description || 'General brand awareness'}

Create platform-specific ad copy optimized for each format.

Return ONLY a valid JSON object with no explanation or markdown:
{
  "facebook": {
    "headline": "...",
    "primaryText": "...",
    "description": "...",
    "cta": "Learn More"
  },
  "instagram": {
    "headline": "...",
    "caption": "...",
    "cta": "Shop Now"
  },
  "google": {
    "headline1": "...",
    "headline2": "...",
    "headline3": "...",
    "description1": "...",
    "description2": "..."
  },
  "linkedin": {
    "headline": "...",
    "post": "...",
    "cta": "Learn More"
  }
}

Constraints: Facebook headline under 40 chars, primaryText under 125 chars. Instagram caption under 150 chars. Google headlines under 30 chars each, descriptions under 90 chars each. LinkedIn headline under 50 chars.`,
      }

    case 'chatbot': {
      const messages = body.messages as Array<{ role: string; content: string }>
      const ctx = body.businessContext as Record<string, string>
      const systemContext = `You are a friendly, helpful customer service assistant for ${ctx.businessName}. Business hours: ${ctx.hours}. Services: ${ctx.services}. FAQs: ${ctx.faqs}. Answer questions about this business accurately. Be concise (2 to 4 sentences). If you do not have specific information, suggest they call or visit.`
      return {
        maxTokens: 400,
        prompt: `${systemContext}

Conversation so far:
${messages.slice(0, -1).map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`).join('\n')}

Customer: ${messages[messages.length - 1]?.content ?? ''}

Reply as the business assistant:`,
      }
    }

    case 'email-marketing':
      return {
        maxTokens: 6000,
        prompt: `You are a professional email marketing specialist. Create a complete email marketing package.

Business Name: ${body.businessName}
Industry: ${body.industry}
Customer Description: ${body.customerDescription}

Create:
1. Welcome Email Sequence: 6 emails sent on days 0, 1, 3, 7, 14, and 30
2. Monthly Newsletter: 1 template
3. Re-Engagement Campaign: 3 emails

Each email needs a compelling subject line, preview text (50 characters), and full body copy (150 to 300 words).

Return ONLY a valid JSON object with no explanation or markdown:
{
  "welcomeSequence": [
    { "day": 0, "subject": "...", "preview": "...", "body": "..." }
  ],
  "newsletter": { "subject": "...", "preview": "...", "body": "..." },
  "reEngagement": [
    { "dayLabel": "Week 1", "subject": "...", "preview": "...", "body": "..." }
  ]
}`,
      }

    default:
      throw new Error(`Unknown service: ${service}`)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params
    const body = (await req.json()) as Record<string, unknown>
    const sessionId = (body.sessionId as string) || 'anonymous'

    logDemoActivity(sessionId, service)

    const { prompt, maxTokens } = buildPrompt(service, body)
    const rawText = await callClaude(prompt, maxTokens)

    if (service === 'chatbot') {
      return NextResponse.json({ result: { reply: rawText.trim() } })
    }

    const result = parseClaudeJson(rawText)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Demo API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    )
  }
}
