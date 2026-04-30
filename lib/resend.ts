import { Resend } from 'resend'
import { Project, ADDONS, PLANS } from '@/types'
import { getApiKey } from '@/lib/api-keys'

const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

let _resend: Resend | null = null
async function getResend(): Promise<Resend> {
  if (!_resend) {
    const key = await getApiKey('resend')
    if (!key) {
      console.error('[resend] FATAL: RESEND_API_KEY is not set — all email sends will fail')
    }
    _resend = new Resend(key ?? 'missing-key')
  }
  return _resend
}

// ── Wrapper that turns Resend's { data, error } return into a real throw ──────
async function send(payload: Parameters<Resend['emails']['send']>[0]): Promise<string> {
  console.log(`[resend] send() from="${payload.from}" to="${Array.isArray(payload.to) ? payload.to.join(',') : payload.to}" subject="${payload.subject}"`)
  const { data, error } = await (await getResend()).emails.send({
    ...payload,
    ...(ADMIN_EMAIL ? { reply_to: ADMIN_EMAIL } : {}),
  })
  if (error) {
    console.error('[resend] Resend API error:', JSON.stringify(error))
    throw new Error(`[resend] ${error.name}: ${error.message}`)
  }
  console.log('[resend] Send success — message id:', data?.id)
  return data?.id ?? ''
}

// ── Shared HTML layout ─────────────────────────────────────────────────────────
function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #fafaf8; font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
    .wrapper { background-color: #fafaf8; padding: 48px 20px; }
    .container { max-width: 560px; margin: 0 auto; }
    .header { text-align: center; padding-bottom: 28px; }
    .logo { font-size: 18px; font-weight: 600; color: #1a1a1a; }
    .logo-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background-color: #00ff88; margin-right: 5px; vertical-align: middle; position: relative; top: -1px; }
    .card { background-color: #f0f0ee; border: 1px solid #e8e8e8; border-radius: 10px; padding: 40px; }
    h1 { font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; line-height: 1.3; }
    h2 { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; margin-top: 28px; }
    p { font-size: 15px; color: #1a1a1a; line-height: 1.65; margin-bottom: 14px; }
    p.muted { color: #666666; font-size: 14px; }
    .divider { height: 1px; background-color: #e8e8e8; margin: 28px 0; }
    table.data { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    table.data tr td { font-size: 14px; padding: 10px 0; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
    table.data tr:last-child td { border-bottom: none; }
    table.data td.key { color: #888888; width: 150px; padding-right: 16px; }
    table.data td.val { color: #1a1a1a; font-weight: 500; }
    .btn-wrap { margin-top: 28px; }
    a.btn { display: inline-block; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 500; padding: 13px 28px; border-radius: 6px; }
    .code-block { background-color: #1a1a1a; color: #ffffff; border-radius: 8px; padding: 28px 24px; text-align: center; margin: 24px 0; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 12px; }
    .note-block { background-color: #ffffff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 16px 20px; margin: 16px 0 24px; }
    .note-block .note-label { font-size: 11px; font-weight: 600; color: #888888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .note-block p { font-size: 14px; margin: 0; color: #1a1a1a; line-height: 1.6; }
    .footer { text-align: center; padding-top: 24px; }
    .footer p { font-size: 12px; color: #aaaaaa; line-height: 1.8; }
    .footer a { color: #aaaaaa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo"><span class="logo-dot"></span>Mantis Tech</span>
      </div>
      <div class="card">
        ${content}
      </div>
      <div class="footer">
        <p><a href="tel:+15016690488">(501) 669-0488</a> &nbsp;&middot;&nbsp; <a href="https://mantistech.org">mantistech.org</a></p>
      </div>
    </div>
  </div>
</body>
</html>`
}

// ── Helper: resolve addon IDs to human-readable labels ────────────────────────
function addonLabel(id: string): string {
  return ADDONS.find((a) => a.id === id)?.label ?? id
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT-FACING EMAILS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Intake confirmation (sent on form submit) ──────────────────────────────
export async function sendIntakeConfirmationEmail(params: {
  businessName: string
  ownerName: string
  email: string
  plan: string
}) {
  const { businessName, ownerName, email } = params

  await send({
    from: FROM,
    to: email,
    subject: 'We Received Your Request',
    html: emailLayout(`
      <h1>We Received Your Request</h1>
      <p>Hi ${ownerName},</p>
      <p>Thank you for reaching out to Mantis Tech. Our team has received your request for <strong>${businessName}</strong> and we are already reviewing your submission.</p>
      <p>We will be in touch shortly with next steps. If you have any questions in the meantime, call us at (501) 669-0488 or reply to this email.</p>
      <div class="divider"></div>
      <p class="muted">The Mantis Tech Team</p>
    `),
  })
}

// ── 2. Website ready for client review ───────────────────────────────────────
export async function sendClientReviewEmail(params: {
  clientToken: string
  businessName: string
  ownerName: string
  email: string
}) {
  const { clientToken, businessName, ownerName, email } = params
  const link = `${BASE_URL}/client/review/${clientToken}`

  await send({
    from: FROM,
    to: email,
    subject: `Your Website is Ready to Review: ${businessName}`,
    html: emailLayout(`
      <h1>Your Website is Ready</h1>
      <p>Hi ${ownerName},</p>
      <p>Your custom website for <strong>${businessName}</strong> has been completed and is ready for your review. Click the button below to preview it and share your feedback before it goes live.</p>
      <div class="btn-wrap">
        <a href="${link}" class="btn">Preview Your Website</a>
      </div>
      <div class="divider"></div>
      <p class="muted">If you have any questions, call us at (501) 669-0488 or reply to this email.</p>
    `),
  })
}

// ── 3. Payment confirmed (client + admin) ────────────────────────────────────
export async function sendConfirmationEmail(params: {
  businessName: string
  ownerName: string
  email: string
  plan: string
  clientToken?: string
}) {
  const { businessName, ownerName, email, plan, clientToken } = params
  const dashboardLink = clientToken ? `${BASE_URL}/client/dashboard/${clientToken}` : BASE_URL
  const planName = PLANS[plan as keyof typeof PLANS]?.name ?? plan

  // Client confirmation
  await send({
    from: FROM,
    to: email,
    subject: `Payment Confirmed: ${businessName}`,
    html: emailLayout(`
      <h1>Payment Confirmed</h1>
      <p>Hi ${ownerName},</p>
      <p>Your payment has been processed and your <strong>${planName}</strong> plan is now active for <strong>${businessName}</strong>. You can access your client dashboard below to view your site and manage your account.</p>
      <div class="btn-wrap">
        <a href="${dashboardLink}" class="btn">Go to Dashboard</a>
      </div>
      <div class="divider"></div>
      <p class="muted">Thank you for choosing Mantis Tech. If you have any questions, call us at (501) 669-0488 or reply to this email.</p>
    `),
  })

  // Admin notification
  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Payment Received: ${businessName} (${planName} Plan)`,
    html: emailLayout(`
      <h1>Payment Received</h1>
      <p>A payment has been processed and the project is now active.</p>
      <div class="divider"></div>
      <table class="data">
        <tr><td class="key">Business</td><td class="val">${businessName}</td></tr>
        <tr><td class="key">Owner</td><td class="val">${ownerName}</td></tr>
        <tr><td class="key">Email</td><td class="val">${email}</td></tr>
        <tr><td class="key">Plan</td><td class="val">${planName}</td></tr>
      </table>
      <div class="btn-wrap">
        <a href="${dashboardLink}" class="btn">View Project</a>
      </div>
    `),
  })
}

// ── 4. Changes requested notification to client ──────────────────────────────
export async function sendChangesRequestedEmail(params: {
  businessName: string
  ownerName: string
  email: string
  adminNotes: string
}) {
  const { businessName, ownerName, email, adminNotes } = params

  await send({
    from: FROM,
    to: email,
    subject: `Update on Your Website: ${businessName}`,
    html: emailLayout(`
      <h1>Updates in Progress</h1>
      <p>Hi ${ownerName},</p>
      <p>Our team is making some refinements to your website for <strong>${businessName}</strong>. We will notify you as soon as the updates are complete.</p>
      ${adminNotes ? `
      <div class="note-block">
        <div class="note-label">Note from Our Team</div>
        <p>${adminNotes}</p>
      </div>` : ''}
      <div class="divider"></div>
      <p class="muted">If you have any questions, call us at (501) 669-0488 or reply to this email.</p>
    `),
  })
}

// ── 5. Client change request confirmation ────────────────────────────────────
export async function sendChangeRequestConfirmationEmail(params: {
  businessName: string
  ownerName: string
  email: string
  message: string
}) {
  const { businessName, ownerName, email, message } = params

  await send({
    from: FROM,
    to: email,
    subject: `We Received Your Request: ${businessName}`,
    html: emailLayout(`
      <h1>Request Received</h1>
      <p>Hi ${ownerName},</p>
      <p>We have received your change request for <strong>${businessName}</strong>. Our team is reviewing it and will be in touch shortly.</p>
      <div class="note-block">
        <div class="note-label">Your Request</div>
        <p>${message}</p>
      </div>
      <p class="muted">If you have any questions, call us at (501) 669-0488 or reply to this email.</p>
    `),
  })
}

// ── 6. Client change request response ────────────────────────────────────────
export async function sendClientChangeResponseEmail(params: {
  businessName: string
  ownerName: string
  email: string
  adminResponse: string
  clientToken: string
}) {
  const { businessName, ownerName, email, adminResponse, clientToken } = params
  const link = `${BASE_URL}/client/dashboard/${clientToken}`

  await send({
    from: FROM,
    to: email,
    subject: `Your Change Request Has Been Resolved: ${businessName}`,
    html: emailLayout(`
      <h1>Change Request Resolved</h1>
      <p>Hi ${ownerName},</p>
      <p>Your change request for <strong>${businessName}</strong> has been resolved. You can view the update in your dashboard.</p>
      <div class="note-block">
        <div class="note-label">Response from Our Team</div>
        <p>${adminResponse}</p>
      </div>
      <div class="btn-wrap">
        <a href="${link}" class="btn">View Dashboard</a>
      </div>
    `),
  })
}

// ── 7. Custom addon priced notification ──────────────────────────────────────
export async function sendCustomAddonPricedEmail(params: {
  businessName: string
  ownerName: string
  email: string
  clientToken: string
  addonName: string
  monthlyPrice: number
}) {
  const { businessName, ownerName, email, clientToken, addonName, monthlyPrice } = params
  const link = `${BASE_URL}/client/dashboard/${clientToken}`

  await send({
    from: FROM,
    to: email,
    subject: `Add-On Pricing Ready: ${addonName}`,
    html: emailLayout(`
      <h1>Your Add-On Has Been Priced</h1>
      <p>Hi ${ownerName},</p>
      <p>We have reviewed your request for <strong>${addonName}</strong> for <strong>${businessName}</strong> and have prepared a price for your review.</p>
      <div class="divider"></div>
      <table class="data">
        <tr><td class="key">Add-On</td><td class="val">${addonName}</td></tr>
        <tr><td class="key">Monthly Price</td><td class="val">$${monthlyPrice}/mo</td></tr>
      </table>
      <p style="margin-top: 20px;">Log in to your dashboard to accept or decline this add-on.</p>
      <div class="btn-wrap">
        <a href="${link}" class="btn">Review in Dashboard</a>
      </div>
    `),
  })
}

// ── 8. Dashboard link (client password-free login) ───────────────────────────
export async function sendClientDashboardLinkEmail(params: {
  businessName: string
  ownerName: string
  email: string
  clientToken: string
}) {
  const { businessName, ownerName, email, clientToken } = params
  const link = `${BASE_URL}/client/dashboard/${clientToken}`

  await send({
    from: FROM,
    to: email,
    subject: 'Your Mantis Tech Dashboard Link',
    html: emailLayout(`
      <h1>Your Dashboard Link</h1>
      <p>Hi ${ownerName},</p>
      <p>Here is your access link for the Mantis Tech dashboard for <strong>${businessName}</strong>. Bookmark it for easy access.</p>
      <div class="btn-wrap">
        <a href="${link}" class="btn">Access Dashboard</a>
      </div>
      <div class="divider"></div>
      <p class="muted">If you did not request this, please disregard this email.</p>
    `),
  })
}

// ── 9. Dashboard ready (admin creates client manually) ───────────────────────
export async function sendDashboardReadyEmail(params: {
  businessName: string
  ownerName: string
  email: string
  clientToken: string
}) {
  const { businessName, ownerName, email, clientToken } = params
  const link = `${BASE_URL}/client/dashboard/${clientToken}`

  await send({
    from: FROM,
    to: email,
    subject: 'Your Mantis Tech Dashboard is Ready',
    html: emailLayout(`
      <h1>Your Dashboard is Ready</h1>
      <p>Hi ${ownerName},</p>
      <p>Your Mantis Tech client dashboard for <strong>${businessName}</strong> has been created. Use the button below to access it. Keep this link safe as it is your personal access link.</p>
      <div class="btn-wrap">
        <a href="${link}" class="btn">Access Dashboard</a>
      </div>
      <div class="divider"></div>
      <p class="muted">If you have any questions, call us at (501) 669-0488 or reply to this email.</p>
    `),
  })
}

// ── 10. Referral reward applied ───────────────────────────────────────────────
export async function sendReferralRewardEmail(params: {
  ownerName: string
  email: string
  clientToken: string
}) {
  const { ownerName, email, clientToken } = params
  const link = `${BASE_URL}/client/dashboard/${clientToken}`

  await send({
    from: FROM,
    to: email,
    subject: 'Your Referral Reward Has Been Applied',
    html: emailLayout(`
      <h1>Referral Reward Applied</h1>
      <p>Hi ${ownerName},</p>
      <p>Someone you referred has signed up with Mantis Tech. As a thank you, we have applied a free month to your next billing cycle.</p>
      <div class="btn-wrap">
        <a href="${link}" class="btn">View Dashboard</a>
      </div>
      <div class="divider"></div>
      <p class="muted">Thank you for spreading the word about Mantis Tech.</p>
    `),
  })
}

// ── 11. General client notification (admin-sent message) ─────────────────────
export async function sendClientNotificationEmail(params: {
  businessName: string
  ownerName: string
  email: string
  message: string
  clientToken: string
}) {
  const { businessName, ownerName, email, message, clientToken } = params
  const link = `${BASE_URL}/client/dashboard/${clientToken}`

  await send({
    from: FROM,
    to: email,
    subject: `Message from Mantis Tech: ${businessName}`,
    html: emailLayout(`
      <h1>New Message</h1>
      <p>Hi ${ownerName},</p>
      <p>You have a new message regarding <strong>${businessName}</strong>.</p>
      <div class="note-block">
        <div class="note-label">Message</div>
        <p>${message}</p>
      </div>
      <div class="btn-wrap">
        <a href="${link}" class="btn">View Dashboard</a>
      </div>
    `),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN-FACING EMAILS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 12. New lead captured from client website ─────────────────────────────────
export async function sendNewLeadEmail(params: {
  projectId: string
  businessName: string
  leadName: string
  leadEmail: string
  leadPhone?: string
  leadMessage?: string
  source: string
}) {
  if (!ADMIN_EMAIL) return
  const { projectId, businessName, leadName, leadEmail, leadPhone, leadMessage, source } = params
  const link = `${BASE_URL}/admin/projects/${projectId}`

  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Lead: ${businessName}`,
    html: emailLayout(`
      <h1>New Lead Captured</h1>
      <p>A new lead has been submitted through the website for <strong>${businessName}</strong>.</p>
      <div class="divider"></div>
      <table class="data">
        <tr><td class="key">Name</td><td class="val">${leadName || 'Not provided'}</td></tr>
        <tr><td class="key">Email</td><td class="val">${leadEmail || 'Not provided'}</td></tr>
        ${leadPhone ? `<tr><td class="key">Phone</td><td class="val">${leadPhone}</td></tr>` : ''}
        <tr><td class="key">Source</td><td class="val">${source}</td></tr>
      </table>
      ${leadMessage ? `
      <h2>Message</h2>
      <div class="note-block">
        <p>${leadMessage}</p>
      </div>` : ''}
      <div class="btn-wrap">
        <a href="${link}" class="btn">View Project</a>
      </div>
    `),
  })
}

// ── 13. New project submitted (admin notification) ──────────────────────────
export async function sendAdminNewProjectEmail(project: Project) {
  const link = `${BASE_URL}/admin/projects/${project.id}`
  const planName = PLANS[project.plan]?.name ?? project.plan

  const addonList = project.addons.length > 0
    ? project.addons.map(addonLabel).join(', ')
    : 'None'

  const customAddonList = project.customAddons && project.customAddons.length > 0
    ? project.customAddons.map((a) => `${a.name} (budget: ${a.budget})`).join(', ')
    : ''

  const domainDisplay = project.domainStatus === 'existing'
    ? `Existing domain: ${project.existingDomain ?? 'not specified'}`
    : project.domainStatus === 'new'
    ? `New domain needed: ${project.preferredDomain ?? 'not specified'}`
    : 'Not provided'

  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Project: ${project.businessName}`,
    html: emailLayout(`
      <h1>New Project Submitted</h1>
      <p>A new intake form has been submitted. All project details are below.</p>
      <div class="divider"></div>

      <h2>Contact</h2>
      <table class="data">
        <tr><td class="key">Business</td><td class="val">${project.businessName}</td></tr>
        <tr><td class="key">Owner</td><td class="val">${project.ownerName}</td></tr>
        <tr><td class="key">Email</td><td class="val">${project.email}</td></tr>
        <tr><td class="key">Phone</td><td class="val">${project.phone || 'Not provided'}</td></tr>
        <tr><td class="key">Business Type</td><td class="val">${project.businessType}</td></tr>
        <tr><td class="key">Location</td><td class="val">${project.location}</td></tr>
        ${project.currentWebsite ? `<tr><td class="key">Current Website</td><td class="val">${project.currentWebsite}</td></tr>` : ''}
      </table>

      <h2>Project Details</h2>
      <table class="data">
        <tr><td class="key">Plan</td><td class="val">${planName}</td></tr>
        <tr><td class="key">Add-Ons</td><td class="val">${addonList}</td></tr>
        ${customAddonList ? `<tr><td class="key">Custom Add-Ons</td><td class="val">${customAddonList}</td></tr>` : ''}
      </table>

      <h2>Domain</h2>
      <table class="data">
        <tr><td class="key">Domain Status</td><td class="val">${domainDisplay}</td></tr>
        ${project.wantsProfessionalEmail ? `<tr><td class="key">Professional Email</td><td class="val">Requested</td></tr>` : ''}
      </table>

      <h2>Business Description</h2>
      <div class="note-block">
        <p>${project.businessDescription}</p>
      </div>

      ${project.specificFeatures ? `
      <h2>Specific Features</h2>
      <div class="note-block">
        <p>${project.specificFeatures}</p>
      </div>` : ''}

      ${project.additionalNotes ? `
      <h2>Additional Notes</h2>
      <div class="note-block">
        <p>${project.additionalNotes}</p>
      </div>` : ''}

      <div class="btn-wrap">
        <a href="${link}" class="btn">Review Project</a>
      </div>
    `),
  })
}

// ── 13. Admin change request notification ────────────────────────────────────
export async function sendAdminChangeRequestEmail(params: {
  projectId: string
  businessName: string
  ownerName: string
  message: string
}) {
  const { projectId, businessName, ownerName, message } = params
  const link = `${BASE_URL}/admin/projects/${projectId}`

  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Change Request from ${businessName}`,
    html: emailLayout(`
      <h1>New Change Request</h1>
      <p>${ownerName} from <strong>${businessName}</strong> has submitted a change request.</p>
      <div class="note-block">
        <div class="note-label">Client Request</div>
        <p>${message}</p>
      </div>
      <div class="btn-wrap">
        <a href="${link}" class="btn">View Project</a>
      </div>
    `),
  })
}

// ── 14. Contact form submission (admin notification) ─────────────────────────
export async function sendContactFormEmail(params: {
  name: string
  email: string
  phone?: string
  message: string
}) {
  const { name, email, phone, message } = params

  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Contact Form: ${name}`,
    html: emailLayout(`
      <h1>New Contact Form Submission</h1>
      <div class="divider"></div>
      <table class="data">
        <tr><td class="key">Name</td><td class="val">${name}</td></tr>
        <tr><td class="key">Email</td><td class="val">${email}</td></tr>
        <tr><td class="key">Phone</td><td class="val">${phone || 'Not provided'}</td></tr>
      </table>
      <h2>Message</h2>
      <div class="note-block">
        <p>${message}</p>
      </div>
    `),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM / SECURITY EMAILS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 15. Admin MFA login code ──────────────────────────────────────────────────
export async function sendAdminMfaCodeEmail(code: string) {
  if (!ADMIN_EMAIL) throw new Error('[resend] ADMIN_EMAIL is not configured')
  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: 'Your Mantis Tech Login Code',
    html: emailLayout(`
      <h1>Your Login Code</h1>
      <p>Your login code is shown below. It expires in 10 minutes.</p>
      <div class="code-block">${code}</div>
      <p class="muted">If you did not request this code, contact us immediately at (501) 669-0488.</p>
    `),
  })
}

// ── 16. Booking notification (new website booking — to owner + support) ───────
export async function sendBookingNotificationEmail(params: {
  projectId: string
  businessName: string
  ownerEmail: string
  customerName: string
  customerEmail: string
  customerPhone: string
  preferredDate: string
  preferredTime: string
  message: string
}) {
  const { projectId, businessName, ownerEmail, customerName, customerEmail, customerPhone, preferredDate, preferredTime, message } = params
  const link = `${BASE_URL}/admin/projects/${projectId}`
  const subject = `New Booking Request: ${businessName}`
  const html = emailLayout(`
    <h1>New Booking Request</h1>
    <p>A new booking has been submitted through the website for <strong>${businessName}</strong>.</p>
    <div class="divider"></div>
    <table class="data">
      <tr><td class="key">Name</td><td class="val">${customerName || 'Not provided'}</td></tr>
      <tr><td class="key">Email</td><td class="val">${customerEmail || 'Not provided'}</td></tr>
      <tr><td class="key">Phone</td><td class="val">${customerPhone || 'Not provided'}</td></tr>
      <tr><td class="key">Preferred Date</td><td class="val">${preferredDate}</td></tr>
      <tr><td class="key">Preferred Time</td><td class="val">${preferredTime || 'Not specified'}</td></tr>
    </table>
    ${message ? `<h2>Message</h2><div class="note-block"><p>${message}</p></div>` : ''}
    <div class="btn-wrap"><a href="${link}" class="btn">View Project</a></div>
  `)

  const targets = [ownerEmail, 'support@mantistech.org'].filter(Boolean)
  await Promise.all(targets.map(to => send({ from: FROM, to, subject, html }).catch(err => console.error('[resend] Booking notification to', to, 'failed:', err))))
}

// ── 17. Automation email (confirm / cancel / reschedule — to customer) ─────────
export async function sendAutomationEmail(params: {
  to: string
  subject: string
  body: string
  customerName: string
  date: string
  time: string
  businessName: string
}) {
  const { to, subject, body, customerName, date, time, businessName } = params
  const replace = (text: string) =>
    text
      .replace(/\[customer_name\]/g, customerName)
      .replace(/\[date\]/g, date)
      .replace(/\[time\]/g, time)
      .replace(/\[business_name\]/g, businessName)

  await send({
    from: FROM,
    to,
    subject: replace(subject),
    html: emailLayout(`
      <h1>${replace(subject)}</h1>
      <p>${replace(body)}</p>
      <div class="divider"></div>
      <p class="muted">If you have any questions, call us at (501) 669-0488 or reply to this email.</p>
    `),
  })
}

// ── 18. Consultation request (customer confirmation + admin notification) ─────
export async function sendConsultationRequestEmail(params: {
  name: string
  businessName: string
  email: string
  phone: string
  preferredDate: string
  preferredTime: string
  message?: string
}) {
  const { name, businessName, email, phone, preferredDate, preferredTime, message } = params

  // Customer confirmation
  await send({
    from: FROM,
    to: email,
    subject: 'Your Consultation Request Has Been Received',
    html: emailLayout(`
      <h1>Consultation Request Received</h1>
      <p>Hi ${name},</p>
      <p>Your consultation has been requested for ${preferredDate} at ${preferredTime}. We will confirm your appointment within 24 hours.</p>
      <div class="divider"></div>
      <table class="data">
        <tr><td class="key">Name</td><td class="val">${name}</td></tr>
        <tr><td class="key">Business</td><td class="val">${businessName || 'Not provided'}</td></tr>
        <tr><td class="key">Date</td><td class="val">${preferredDate}</td></tr>
        <tr><td class="key">Time</td><td class="val">${preferredTime}</td></tr>
      </table>
      <div class="divider"></div>
      <p class="muted">If you need to cancel or have questions, call us at (501) 669-0488 or reply to this email.</p>
    `),
  })

  // Admin notification
  if (ADMIN_EMAIL) {
    await send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New Consultation Request: ${name}`,
      html: emailLayout(`
        <h1>New Consultation Request</h1>
        <p>A new consultation request has been submitted through the website.</p>
        <div class="divider"></div>
        <table class="data">
          <tr><td class="key">Name</td><td class="val">${name}</td></tr>
          <tr><td class="key">Business</td><td class="val">${businessName || 'Not provided'}</td></tr>
          <tr><td class="key">Email</td><td class="val">${email}</td></tr>
          <tr><td class="key">Phone</td><td class="val">${phone || 'Not provided'}</td></tr>
          <tr><td class="key">Date</td><td class="val">${preferredDate}</td></tr>
          <tr><td class="key">Time</td><td class="val">${preferredTime}</td></tr>
        </table>
        ${message ? `
        <h2>Message</h2>
        <div class="note-block">
          <p>${message}</p>
        </div>` : ''}
      `),
    })
  }
}

// ── 19. Demo lead campaign email ──────────────────────────────────────────────
export async function sendDemoLeadCampaignEmail(params: {
  to: string
  subject: string
  body: string
  businessName?: string | null
}) {
  const { to, subject, body, businessName } = params
  const greeting = businessName ? `Hi ${businessName},` : 'Hi there,'
  await send({
    from: FROM,
    to,
    subject,
    html: emailLayout(`
      <p>${greeting}</p>
      ${body.split('\n').filter(Boolean).map((line) => `<p>${line}</p>`).join('')}
      <div class="divider"></div>
      <p class="muted">Mantis Tech &mdash; (501) 669-0488 &mdash; mantistech.org</p>
    `),
  })
}

// ── 21. New booking created via client dashboard calendar ────────────────────
export async function sendNewBookingNotificationEmail(params: {
  businessName: string
  ownerEmail: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  title: string
  eventDate: string
  eventTime?: string | null
  notes?: string | null
}) {
  const { businessName, ownerEmail, customerName, customerEmail, customerPhone, title, eventDate, eventTime, notes } = params
  const subject = `New Booking: ${businessName}`
  const html = emailLayout(`
    <h1>New Booking Created</h1>
    <p>A new booking has been added to the calendar for <strong>${businessName}</strong>.</p>
    <div class="divider"></div>
    <table class="data">
      <tr><td class="key">Service</td><td class="val">${title}</td></tr>
      <tr><td class="key">Date</td><td class="val">${eventDate}</td></tr>
      <tr><td class="key">Time</td><td class="val">${eventTime || 'Not specified'}</td></tr>
      <tr><td class="key">Customer</td><td class="val">${customerName || 'Not provided'}</td></tr>
      <tr><td class="key">Email</td><td class="val">${customerEmail || 'Not provided'}</td></tr>
      <tr><td class="key">Phone</td><td class="val">${customerPhone || 'Not provided'}</td></tr>
    </table>
    ${notes ? `<h2>Notes</h2><div class="note-block"><p>${notes}</p></div>` : ''}
  `)

  const targets = [ownerEmail, 'support@mantistech.org'].filter(Boolean)
  await Promise.all(targets.map(to => send({ from: FROM, to, subject, html }).catch(err => console.error('[resend] Booking notification to', to, 'failed:', err))))
}

// ── 21. Campaign step email (automated email campaign to demo leads) ──────────
export async function sendCampaignStepEmail({
  to,
  subject,
  body,
  businessName,
}: {
  to: string
  subject: string
  body: string
  businessName: string
}) {
  const personalizedBody = body
    .replace(/\[Business Name\]/g, businessName || 'your business')
    .replace(/\[business name\]/g, businessName || 'your business')

  const htmlBody = personalizedBody
    .split('\n')
    .map(line => line.trim() === '' ? '<br>' : `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#222;font-family:Georgia,serif;">${line}</p>`)
    .join('')

  await send({
    from: 'Mantis Tech <support@mantistech.org>',
    to,
    subject,
    html: `
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;font-family:Georgia,serif;">
        ${htmlBody}
      </div>
    `,
  })
}

// ── 20. Admin password reset ─────────────────────────────────────────────────
export async function sendAdminPasswordResetEmail(params: {
  token: string
  resetUrl: string
}) {
  const { token, resetUrl } = params
  if (!ADMIN_EMAIL) return
  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: 'Mantis Tech Admin Password Reset',
    html: emailLayout(`
      <h1>Password Reset Request</h1>
      <p>A password reset was requested for the Mantis Tech admin account. Use the token below or click the button to complete the reset. This token expires in 30 minutes.</p>
      <div class="code-block" style="font-size: 14px; letter-spacing: 2px; word-break: break-all; padding: 20px 24px;">${token}</div>
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <div class="divider"></div>
      <p class="muted">If you did not request a password reset, please disregard this email.</p>
    `),
  })
}
