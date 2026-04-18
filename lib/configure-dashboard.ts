import Anthropic from '@anthropic-ai/sdk'
import { Project } from '@/types'
import { getApiKey } from '@/lib/api-keys'
import { supabase, supabaseEnabled } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardConfig {
  missedCallReply: string        // Auto-reply SMS message personalized to their business
  reviewRequestSms: string       // SMS sent to customers after job completion requesting a review
  reviewRequestEmail: string     // Email version of the review request
  gbpPostTemplates: string[]     // 3 Google Business Profile post templates for weather events
  smsTemplates: string[]         // 3 SMS blast templates for cold snap and heat wave events
  emailTemplates: string[]       // 3 email campaign templates for weather events
  serviceAreaDescription: string // Human readable description of their service area
  welcomeMessage: string         // Welcome message shown on their dashboard on first login
}

// ── Claude client ─────────────────────────────────────────────────────────────

let _client: Anthropic | null = null
async function getClient(): Promise<Anthropic> {
  if (!_client) {
    const apiKey = await getApiKey('anthropic')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function configureClientDashboard(project: Project): Promise<DashboardConfig> {
  console.log(`[configure-dashboard] Generating config for project ${project.id} (${project.businessName})`)

  const client = await getClient()

  const prompt = `You are setting up an HVAC business automation platform for a contractor. Based on the business details below, generate personalized marketing and automation content that will be pre-loaded into their dashboard.

BUSINESS DETAILS:
- Business Name: ${project.businessName}
- Owner: ${project.ownerName}
- Location: ${project.location}
- HVAC Type / Business Type: ${project.businessType}
- Business Description: ${project.businessDescription}
- Plan: ${project.plan === 'platform-plus' ? 'Platform Plus (includes custom website)' : 'Platform Only'}

Generate a JSON object with exactly these fields. All content must be specific to this business — never use generic placeholders. Write as if you are the business owner communicating with their customers.

{
  "missedCallReply": "A single SMS message (max 160 characters) sent automatically when a customer calls and no one answers. Should reference the business name and promise a quick callback.",

  "reviewRequestSms": "A single SMS message (max 160 characters) sent to customers after a completed HVAC job asking them to leave a Google review. Warm, friendly, mentions the business name.",

  "reviewRequestEmail": "A complete email body (2-3 short paragraphs, plain prose — no HTML) sent after a completed job requesting a Google review. Include a subject line as the first line formatted as 'Subject: ...' then a blank line then the email body. Personable and professional.",

  "gbpPostTemplates": [
    "A Google Business Profile post (max 300 characters) for a cold snap weather alert — urgency, offers quick response, mentions service area",
    "A Google Business Profile post (max 300 characters) for a heat wave weather alert — AC tune-up or emergency service angle",
    "A Google Business Profile post (max 300 characters) for a seasonal transition (fall/winter) — furnace check or heating system prep"
  ],

  "smsTemplates": [
    "SMS blast (max 160 characters) for a cold snap — limited-time heating service offer with a sense of urgency",
    "SMS blast (max 160 characters) for a heat wave — AC service offer or emergency availability",
    "SMS blast (max 160 characters) for a seasonal promotion — fall/winter tune-up discount or bundle offer"
  ],

  "emailTemplates": [
    "A complete weather-triggered email for a cold snap event. First line is 'Subject: ...' then blank line then 3-4 short paragraphs of plain prose. Urgency, heating focus, clear CTA.",
    "A complete weather-triggered email for a heat wave event. First line is 'Subject: ...' then blank line then 3-4 short paragraphs of plain prose. AC focus, emergency availability angle.",
    "A complete seasonal email campaign for fall maintenance. First line is 'Subject: ...' then blank line then 3-4 short paragraphs of plain prose. Furnace tune-up, preventative angle, clear CTA."
  ],

  "serviceAreaDescription": "A 1-2 sentence human-readable description of their service area based on their location. Reference nearby cities or counties if the location implies them. Professional tone.",

  "welcomeMessage": "A 2-3 sentence welcome message displayed on their dashboard when they first log in. Mention the business name, congratulate them on getting started, and tell them what to expect from the platform. Warm and encouraging."
}

IMPORTANT: Respond with ONLY the raw JSON object. No markdown, no code fences, no explanation. The response must be valid JSON that can be parsed directly with JSON.parse().`

  const message = await client.messages.create(
    {
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    },
    { timeout: 60_000 }
  )

  console.log(`[configure-dashboard] Claude response received, stop_reason=${message.stop_reason}`)

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  let raw = content.text.trim()

  // Strip markdown code fences if model wraps anyway
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim()
  }

  let config: DashboardConfig
  try {
    config = JSON.parse(raw) as DashboardConfig
  } catch {
    console.error('[configure-dashboard] Failed to parse Claude response as JSON:', raw.slice(0, 200))
    throw new Error('Claude returned invalid JSON for dashboard config')
  }

  // ── Save to Supabase ──────────────────────────────────────────────────────

  if (supabaseEnabled) {
    const { error } = await supabase.from('client_configs').upsert(
      {
        project_id: project.id,
        missed_call_reply: config.missedCallReply,
        review_request_sms: config.reviewRequestSms,
        review_request_email: config.reviewRequestEmail,
        gbp_post_templates: config.gbpPostTemplates,
        sms_templates: config.smsTemplates,
        email_templates: config.emailTemplates,
        service_area_description: config.serviceAreaDescription,
        welcome_message: config.welcomeMessage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id' }
    )

    if (error) {
      // Non-fatal — log but don't throw. Config is still returned to caller.
      console.error('[configure-dashboard] Failed to save config to Supabase:', error.message)
    } else {
      console.log(`[configure-dashboard] Config saved to client_configs for project ${project.id}`)
    }
  } else {
    console.warn('[configure-dashboard] Supabase disabled — config not persisted')
  }

  return config
}
