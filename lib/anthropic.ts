import Anthropic from '@anthropic-ai/sdk'
import { Project } from '@/types'
import { getApiKey } from '@/lib/api-keys'

let _client: Anthropic | null = null
async function getClient(): Promise<Anthropic> {
  if (!_client) {
    const apiKey = await getApiKey('anthropic')
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export async function generateWebsite(project: Project, overrideNotes?: string): Promise<string> {
  const addonsList =
    project.addons.length > 0 ? project.addons.join(', ') : 'None selected'

  const prompt = `You are an elite web designer and developer. Create a complete, modern, responsive single-page HTML website for the following business. The website must be production-ready with all CSS and JavaScript embedded inline — no external stylesheets or scripts except Google Fonts.

BUSINESS PROFILE:
- Business Name: ${project.businessName}
- Business Type: ${project.businessType}
- Location: ${project.location}
- Owner: ${project.ownerName}
- Description: ${project.businessDescription}
- Specific Features Requested: ${project.specificFeatures}
- Active Add-ons: ${addonsList}
- Additional Notes: ${project.additionalNotes}

DESIGN REQUIREMENTS:
1. Use a color palette appropriate for the business type
3. Include a hero section with a compelling headline and CTA button
4. Include sections relevant to the business: About, Services/Products, Testimonials, Contact, etc.
5. Make the design mobile-first and fully responsive
6. Use smooth scroll, subtle animations, and modern layout patterns
7. Include a sticky navigation header
8. Include a footer with contact info and copyright

FEATURE REQUIREMENTS based on selected add-ons:
${project.addons.includes('ecommerce-automation') ? '- E-Commerce: Include a products/shop section with sample product cards' : ''}
${project.addons.includes('website-chatbot') ? '- AI Chatbot: Include a floating chat button in the corner' : ''}
${project.addons.includes('seo-optimization') ? '- SEO: Include proper meta tags, semantic HTML, and schema markup' : ''}
${project.addons.includes('email-marketing') ? '- Email Marketing: Include a newsletter signup section' : ''}

TECHNICAL REQUIREMENTS:
- Single HTML file with all CSS in a <style> tag and all JS in a <script> tag
- Use Google Fonts (import via @import in the style tag)
- Semantic HTML5 elements
- Accessible (proper aria labels, alt text placeholders)
- No placeholder Lorem Ipsum — use realistic content for "${project.businessName}"
- Include a contact form with fields: name, email, phone, message

BOOKING SECTION — REQUIRED FOR ALL SITES:
Every website MUST include a booking/appointment section with a form. This is a standard feature included free with every plan.

The booking form must collect: name, email, phone, preferred date, preferred time, message.
The form submits via fetch() to https://www.mantistech.org/api/bookings/${project.clientToken}

Use exactly this pattern in the booking form's submit handler:

  async function submitBooking(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      const res = await fetch('https://www.mantistech.org/api/bookings/${project.clientToken}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: event.target.name.value,
          email: event.target.email.value,
          phone: event.target.phone ? event.target.phone.value : '',
          date: event.target.date ? event.target.date.value : '',
          time: event.target.time ? event.target.time.value : '',
          message: event.target.message ? event.target.message.value : '',
        }),
      });
      if (res.ok) {
        event.target.style.display = 'none';
        document.getElementById('booking-success').style.display = 'block';
      } else {
        throw new Error('Request failed');
      }
    } catch {
      document.getElementById('booking-error').style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Request Appointment';
    }
  }

Add this hidden success message directly after the booking form:
  <div id="booking-success" style="display:none; padding: 1.5rem; text-align: center;">
    <p style="font-size: 1rem; font-weight: 600;">Your appointment request has been received.</p>
    <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">We will confirm your booking shortly.</p>
  </div>
  <p id="booking-error" style="display:none; color: #cc0000; font-size: 0.875rem; margin-top: 0.75rem;">
    Something went wrong. Please try again or call us directly.
  </p>

Attach the handler: <form onsubmit="submitBooking(event)">

CONTACT FORM SUBMISSION — CRITICAL:
Every contact form MUST submit via JavaScript fetch(), never via a plain HTML form action/method POST.
Use exactly this pattern in the form's submit handler:

  async function submitForm(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      const res = await fetch('https://www.mantistech.org/api/leads/${project.clientToken}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: event.target.name.value,
          email: event.target.email.value,
          phone: event.target.phone ? event.target.phone.value : '',
          message: event.target.message ? event.target.message.value : '',
        }),
      });
      if (res.ok) {
        event.target.style.display = 'none';
        document.getElementById('form-success').style.display = 'block';
      } else {
        throw new Error('Request failed');
      }
    } catch {
      document.getElementById('form-error').style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  }

Add this hidden success message directly after the form:
  <div id="form-success" style="display:none; padding: 1.5rem; text-align: center;">
    <p style="font-size: 1rem; font-weight: 600;">Thank you for reaching out.</p>
    <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">We will be in touch shortly.</p>
  </div>
  <p id="form-error" style="display:none; color: #cc0000; font-size: 0.875rem; margin-top: 0.75rem;">
    Something went wrong. Please try again or call us directly.
  </p>

Attach the handler: <form onsubmit="submitForm(event)">

OUTPUT: Respond with ONLY the complete HTML file starting with <!DOCTYPE html> and ending with </html>. No markdown, no explanation, no code blocks.${overrideNotes ? `\n\nADDITIONAL INSTRUCTIONS FROM ADMIN:\n${overrideNotes}` : ''}`

  console.log(`[anthropic] Starting website generation for project ${project.id} (${project.businessName})`)

  // 120-second timeout on the API call
  const client = await getClient()
  const message = await client.messages.create(
    {
      model: 'claude-sonnet-4-5',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    },
    { timeout: 120_000 }
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
