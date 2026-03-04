import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'no-reply@mantistech.io'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
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

  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Project Submitted: ${businessName}`,
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">New Project Ready for Review</h1>
        <p style="color: #8ab8b5; margin-bottom: 24px;">A new intake submission has been processed and a website has been generated.</p>
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

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your Website is Ready to Review: ${businessName}`,
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">Your Website is Ready</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 24px;">
          Great news. Your custom website for <strong>${businessName}</strong> has been reviewed and approved by our team.
          Click below to preview it and proceed to checkout.
        </p>
        <a href="${link}" style="display: inline-block; background: #00ff88; color: #080c10; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">Preview Your Website</a>
        <p style="color: #5a6a7a; margin-top: 24px; font-size: 12px;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendConfirmationEmail(params: {
  businessName: string
  ownerName: string
  email: string
  plan: string
}) {
  const { businessName, ownerName, email, plan } = params
  const resend = getResend()

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to Mantis Tech: ${businessName} is Live`,
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">Payment Confirmed</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 24px;">
          Your payment has been processed and your <strong style="color: #00ff88; text-transform: capitalize;">${plan}</strong> plan is now active.
          Our team will be in touch within 24 hours with your project details and next steps.
        </p>
        <p style="color: #5a6a7a; font-size: 14px;">Thank you for choosing Mantis Tech.</p>
      </div>
    `,
  })

  await resend.emails.send({
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

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Update on Your Website: ${businessName}`,
    html: `
      <div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h1 style="color: #00ff88; font-size: 24px; margin-bottom: 8px;">Changes in Progress</h1>
        <p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${ownerName},</p>
        <p style="color: #e0e0e0; margin-bottom: 16px;">
          Our team is making some refinements to your website for <strong>${businessName}</strong>.
        </p>
        ${
          adminNotes
            ? `<div style="background: #0d1117; border-left: 3px solid #00ff88; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="color: #8ab8b5; margin: 0; font-size: 14px;">${adminNotes}</p>
            </div>`
            : ''
        }
        <p style="color: #5a6a7a; font-size: 14px;">We will notify you once the updates are complete.</p>
      </div>
    `,
  })
}
