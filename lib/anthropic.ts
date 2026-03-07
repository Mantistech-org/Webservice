import Anthropic from '@anthropic-ai/sdk'
import { Project, PLAN_PAGE_LIMITS } from '@/types'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export async function generateWebsite(project: Project): Promise<string> {
  const addonsList =
    project.addons.length > 0 ? project.addons.join(', ') : 'None selected'
  const pageLimit = PLAN_PAGE_LIMITS[project.plan]

  const prompt = `You are an elite web designer and developer. Create a complete, modern, responsive single-page HTML website for the following business. The website must be production-ready with all CSS and JavaScript embedded inline — no external stylesheets or scripts except Google Fonts.

BUSINESS PROFILE:
- Business Name: ${project.businessName}
- Business Type: ${project.businessType}
- Location: ${project.location}
- Owner: ${project.ownerName}
- Description: ${project.businessDescription}
- Primary Goal: ${project.primaryGoal}
- Timeline: ${project.timeline}
- Style Preference: ${project.stylePreference}
- Specific Features Requested: ${project.specificFeatures}
- Active Add-ons: ${addonsList}
- Additional Notes: ${project.additionalNotes}

PAGE LIMIT: This is a ${project.plan} plan. Generate a maximum of ${pageLimit} pages. Keep the site focused within this limit.

DESIGN REQUIREMENTS:
1. Match the style preference exactly: "${project.stylePreference}"
2. Use a color palette appropriate for the business type and style
3. Include a hero section with a compelling headline and CTA button
4. Include sections relevant to the business: About, Services/Products, Testimonials, Contact, etc.
5. Make the design mobile-first and fully responsive
6. Use smooth scroll, subtle animations, and modern layout patterns
7. Include a sticky navigation header
8. Include a footer with contact info and copyright

FEATURE REQUIREMENTS based on selected add-ons:
${project.addons.includes('online-booking') ? '- Online Booking: Include a booking/appointment section with a simple form' : ''}
${project.addons.includes('ecommerce') ? '- E-Commerce: Include a products/shop section with sample product cards' : ''}
${project.addons.includes('ai-chatbot') ? '- AI Chatbot: Include a floating chat button in the corner' : ''}
${project.addons.includes('seo') ? '- SEO: Include proper meta tags, semantic HTML, and schema markup' : ''}
${project.addons.includes('email-marketing') ? '- Email Marketing: Include a newsletter signup section' : ''}
${project.addons.includes('loyalty-program') ? '- Loyalty Program: Include a loyalty rewards section' : ''}

TECHNICAL REQUIREMENTS:
- Single HTML file with all CSS in a <style> tag and all JS in a <script> tag
- Use Google Fonts (import via @import in the style tag)
- Semantic HTML5 elements
- Accessible (proper aria labels, alt text placeholders)
- No placeholder Lorem Ipsum — use realistic content for "${project.businessName}"
- Include a contact form with fields relevant to the business

OUTPUT: Respond with ONLY the complete HTML file starting with <!DOCTYPE html> and ending with </html>. No markdown, no explanation, no code blocks.`

  console.log(`[anthropic] Starting website generation for project ${project.id} (${project.businessName})`)

  // 30-second timeout on the API call
  const message = await getClient().messages.create(
    {
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    },
    { timeout: 30_000 }
  )

  console.log(`[anthropic] Generation complete for project ${project.id}, stop_reason=${message.stop_reason}`)

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  let html = content.text.trim()

  // Strip markdown code fences if model wraps anyway
  if (html.startsWith('```')) {
    html = html.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim()
  }

  return html
}
