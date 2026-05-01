import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { pgEnabled } from '@/lib/pg'
import { getApiKey } from '@/lib/api-keys'
import Anthropic from '@anthropic-ai/sdk'

const TEMPLATE_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001'

async function resolveProjectId(clientToken: string): Promise<string | null> {
  const project = await getProjectByClientToken(clientToken)
  if (project) return project.id
  if (clientToken === 'template-preview') return TEMPLATE_PROJECT_ID
  return null
}

let _client: Anthropic | null = null
async function getClient(): Promise<Anthropic> {
  if (!_client) {
    const apiKey = await getApiKey('anthropic')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  const body = await req.json()
  const {
    customer_name,
    service_address,
    service_type,
    complaint,
    findings,
    recommended_work,
    parts_cost,
    labor_hours,
    labor_rate,
    notes,
  } = body

  if (!customer_name || !service_type) {
    return NextResponse.json({ error: 'customer_name and service_type are required' }, { status: 400 })
  }

  const laborTotal = (parseFloat(labor_hours) || 0) * (parseFloat(labor_rate) || 95)
  const partsTotal = parseFloat(parts_cost) || 0
  const grandTotal = laborTotal + partsTotal

  const prompt = `You are an HVAC service technician writing a professional proposal for a customer. Based on the job details below, generate a structured proposal.

JOB DETAILS:
- Customer: ${customer_name}
- Service Address: ${service_address || 'N/A'}
- Service Type: ${service_type}
- Customer Complaint: ${complaint || 'N/A'}
- Tech Findings: ${findings || 'N/A'}
- Recommended Work: ${recommended_work || 'N/A'}
- Parts Cost: $${partsTotal.toFixed(2)}
- Labor: ${labor_hours || 0} hours @ $${labor_rate || 95}/hr = $${laborTotal.toFixed(2)}
- Grand Total: $${grandTotal.toFixed(2)}
- Additional Notes: ${notes || 'N/A'}

Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation):
{
  "summary": "2-3 sentence professional summary of the work to be performed",
  "scope_of_work": "Detailed paragraph describing exactly what work will be done",
  "parts_list": "List of parts/materials needed (comma-separated or 'N/A' if labor only)",
  "labor_hours": ${parseFloat(labor_hours) || 0},
  "labor_rate": ${parseFloat(labor_rate) || 95},
  "labor_total": ${laborTotal},
  "parts_total": ${partsTotal},
  "grand_total": ${grandTotal},
  "timeline": "Estimated time to complete the work (e.g. '2-3 hours same day')",
  "warranty": "Warranty terms for parts and labor (e.g. '1 year parts, 90 days labor')",
  "closing": "1-2 sentence professional closing statement encouraging the customer to accept"
}`

  try {
    const client = await getClient()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const generated_content = JSON.parse(text)

    return NextResponse.json({ generated_content })
  } catch (err) {
    console.error('[proposals/generate] failed:', err)
    return NextResponse.json({ error: 'Failed to generate proposal' }, { status: 500 })
  }
}
