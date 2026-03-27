import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from '@/lib/api-keys'

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = await getApiKey('anthropic')
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  const { context } = await req.json()
  if (!context?.trim()) {
    return NextResponse.json({ error: 'context is required.' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  const prompt = `You are writing a cold outreach email on behalf of Mantis Tech, a web design and digital marketing agency. The email is sent from support@mantistech.org.

Mantis Tech offers:
- Custom website design and development
- Hosting and domain management
- Monthly performance reports
- Optional add-ons: SEO optimization, social media automation, review management, lead generation, e-commerce automation, ad creative generation, website chatbot, and email marketing

Context about this campaign's target audience:
${context}

Write a professional, concise cold outreach email. Guidelines:
- Subject line on the very first line, then a blank line, then the email body
- No emojis anywhere in the email
- Tone: professional but human, not corporate-stiff
- Length: 150-250 words for the body
- Mention a specific pain point the recipient likely has, then connect it to what Mantis Tech offers
- End with a soft call to action (reply to learn more, visit site, or schedule a call)
- Sign off as the Mantis Tech team
- Use {{business_name}} as a placeholder for the recipient's business name
- Do not invent specific pricing — keep it general

Output only the subject line on line 1, a blank line, then the email body. No preamble, no explanation, no extra formatting.`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const lines = text.split('\n')
    const subjectLine = lines[0].replace(/^Subject:\s*/i, '').trim()
    const body = lines.slice(lines[1]?.trim() === '' ? 2 : 1).join('\n').trim()

    return NextResponse.json({ subject: subjectLine, body })
  } catch (err) {
    console.error('[generate-email] Claude error:', err)
    return NextResponse.json({ error: 'Failed to generate email.' }, { status: 500 })
  }
}
