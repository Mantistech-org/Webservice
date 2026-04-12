import { NextRequest, NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'
import { sendConsultationRequestEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { name, businessName, phone, email, preferredDate, preferredTime, message } = body

  if (!name?.trim() || !email?.trim() || !preferredDate || !preferredTime) {
    return NextResponse.json(
      { error: 'Name, email, preferred date, and preferred time are required.' },
      { status: 400 }
    )
  }

  if (pgEnabled) {
    try {
      await query(
        `INSERT INTO public.consultations
           (name, business_name, phone, email, preferred_date, preferred_time, message, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
        [
          name.trim(),
          businessName?.trim() || null,
          phone?.trim() || null,
          email.trim(),
          preferredDate,
          preferredTime,
          message?.trim() || null,
        ]
      )
    } catch (err) {
      console.error('[consultation] DB insert failed:', err)
    }
  }

  try {
    await sendConsultationRequestEmail({
      name: name.trim(),
      businessName: businessName?.trim() || '',
      email: email.trim(),
      phone: phone?.trim() || '',
      preferredDate,
      preferredTime,
      message: message?.trim() || undefined,
    })
  } catch (err) {
    console.error('[consultation] Email send failed:', err)
    return NextResponse.json(
      { error: 'Failed to send confirmation email. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
