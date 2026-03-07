import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.error('[resend] FATAL: RESEND_API_KEY is not set — all email sends will fail')
  }
  return new Resend(key ?? 'missing-key')
}

// ── Wrapper that turns Resend's { data, error } return into a real throw ──────
// The Resend SDK v2 NEVER rejects its promise — it always resolves with
// { data, error }. Without this wrapper, .catch() handlers never fire and
// errors disappear silently.
async function send(payload: Parameters<Resend['emails']['send']>[0]): Promise<string> {
  console.log(`[resend] send() from="${payload.from}" to="${Array.isArray(payload.to) ? payload.to.join(',') : payload.to}" subject="${payload.subject}"`)
  const { data, error } = await getResend().emails.send(payload)
  if (error) {
    // Log the full Resend error object so Railway logs capture it
    console.error('[resend] Resend API error:', JSON.stringify(error))
    throw new Error(`[resend] ${error.name}: ${error.message}`)
  }
  console.log('[resend] Send success — message id:', data?.id)
  return data?.id ?? ''
}

export async function sendAdminNewProjectEmail(params: {
  projectId: string
  adminToken: string
  businessName: string
  ownerName: string
  plan: string
}) {
  const { projectId, businessName, ownerName, plan } = params
  const link = `${BASE_URL}/admin/projects/${projectId}`

  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Project Submitted: ${businessName}`,
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">New Project Ready for Review</h1>
        <p style="color: #8ab8b5; margin-bottom: 24px;">A new intake submission has been received and saved.</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 8px 0; color: #5a6a7a; width: 140px;">Business</td><td style="color: #e0e0e0;">${businessName}</td></tr>
          <tr><td style="padding: 8px 0; color: #5a6a7a;">Owner</td><td style="color: #e0e0e0;">${ownerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #5a6a7a;">Plan</td><td style="color: #00ff88; text-transform: capitalize;">${plan}</td></tr>
        </table>
        <a href="${link}" style="display: inline-block; background: #00ff88; color: #080c10; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">Review Project</a>
      </div>
    `,
  })
}

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
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">Your Website is Ready</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 24px;">
          Your custom website for <strong>${businessName}</strong> has been reviewed and approved by our team.
          Click below to preview it and proceed to checkout.
        </p>
        <a href="${link}" style="display: inline-block; background: #00ff88; color: #080c10; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">Preview Your Website</a>
        <p style="color: #5a6a7a; margin-top: 24px; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  })
}

export async function sendConfirmationEmail(params: {
  businessName: string
  ownerName: string
  email: string
  plan: string
  clientToken?: string
}) {
  const { businessName, ownerName, email, plan, clientToken } = params
  const dashboardLink = clientToken ? `${BASE_URL}/client/dashboard/${clientToken}` : BASE_URL

  await send({
    from: FROM,
    to: email,
    subject: `Welcome to Mantis Tech: ${businessName} is Live`,
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">Payment Confirmed</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 24px;">
          Your payment has been processed and your <strong style="color: #00ff88; text-transform: capitalize;">${plan}</strong> plan is now active.
          Access your client dashboard to view your site and manage your account.
        </p>
        <a href="${dashboardLink}" style="display: inline-block; background: #00ff88; color: #080c10; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">Go to Dashboard</a>
        <p style="color: #5a6a7a; font-size: 14px; margin-top: 24px;">Thank you for choosing Mantis Tech.</p>
      </div>
    `,
  })

  await send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Payment Received: ${businessName} (${plan} plan)`,
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">New Payment Received</h1>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 8px 0; color: #5a6a7a; width: 140px;">Business</td><td style="color: #e0e0e0;">${businessName}</td></tr>
          <tr><td style="padding: 8px 0; color: #5a6a7a;">Owner</td><td style="color: #e0e0e0;">${ownerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #5a6a7a;">Plan</td><td style="color: #00ff88; text-transform: capitalize;">${plan}</td></tr>
          <tr><td style="padding: 8px 0; color: #5a6a7a;">Client Email</td><td style="color: #e0e0e0;">${email}</td></tr>
        </table>
        <p style="color: #8ab8b5;">Project status has been updated to <strong>active</strong>.</p>
      </div>
    `,
  })
}

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
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">Changes in Progress</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 16px;">Our team is making some refinements to your website for <strong>${businessName}</strong>.</p>
        ${adminNotes ? `<div style="background: #0d1117; border-left: 3px solid #00ff88; padding: 16px; margin-bottom: 24px; border-radius: 4px;"><p style="color: #8ab8b5; margin: 0; font-size: 14px;">${adminNotes}</p></div>` : ''}
        <p style="color: #5a6a7a; font-size: 14px;">We will notify you once the updates are complete.</p>
      </div>
    `,
  })
}

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
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">New Change Request</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">${ownerName} from ${businessName} has submitted a change request.</p>
        <div style="background: #0d1117; border-left: 3px solid #00ff88; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="color: #e0e0e0; margin: 0; font-size: 14px;">${message}</p>
        </div>
        <a href="${link}" style="display: inline-block; background: #00ff88; color: #080c10; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">View Project</a>
      </div>
    `,
  })
}

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
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">Change Request Resolved</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 16px;">Your change request for <strong>${businessName}</strong> has been resolved.</p>
        <div style="background: #0d1117; border-left: 3px solid #00ff88; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="color: #5a6a7a; font-size: 12px; margin-bottom: 8px;">Team Response</p>
          <p style="color: #e0e0e0; margin: 0; font-size: 14px;">${adminResponse}</p>
        </div>
        <a href="${link}" style="display: inline-block; background: #00ff88; color: #080c10; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">View Your Dashboard</a>
      </div>
    `,
  })
}

export async function sendIntakeConfirmationEmail(params: {
  businessName: string
  ownerName: string
  email: string
  plan: string
}) {
  const { businessName, ownerName, email, plan } = params

  await send({
    from: FROM,
    to: email,
    subject: `We Received Your Request: ${businessName}`,
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">Request Received</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 16px;">
          Thank you for submitting your project request for <strong>${businessName}</strong>.
          Our team is reviewing your submission and will be in touch shortly with next steps.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #0d1117; border-radius: 4px; padding: 16px;">
          <tr><td style="padding: 8px 16px; color: #5a6a7a; width: 100px;">Business</td><td style="padding: 8px 16px; color: #e0e0e0;">${businessName}</td></tr>
          <tr><td style="padding: 8px 16px; color: #5a6a7a;">Plan</td><td style="padding: 8px 16px; color: #00ff88; text-transform: capitalize;">${plan}</td></tr>
        </table>
        <p style="color: #8ab8b5; margin-bottom: 8px;">
          If you have any questions in the meantime, call us at
          <a href="tel:+15016690488" style="color: #00ff88; text-decoration: none;">(501) 669-0488</a>.
        </p>
        <p style="color: #5a6a7a; font-size: 12px; margin-top: 24px;">Mantis Tech &mdash; mantistech.io</p>
      </div>
    `,
  })
}

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
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">New Message</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 16px;">You have a new message regarding <strong>${businessName}</strong>.</p>
        <div style="background: #0d1117; border-left: 3px solid #00ff88; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="color: #e0e0e0; margin: 0; font-size: 14px;">${message}</p>
        </div>
        <a href="${link}" style="display: inline-block; background: #00ff88; color: #080c10; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">View Dashboard</a>
      </div>
    `,
  })
}
