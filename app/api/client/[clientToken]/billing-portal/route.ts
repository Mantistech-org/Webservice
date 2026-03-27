import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { readProjects } from '@/lib/db'
import { getApiKey } from '@/lib/api-keys'

export async function POST(req: NextRequest, { params }: { params: Promise<{ clientToken: string }> }) {
  const { clientToken } = await params
  const projects = await readProjects()
  const project = projects.find((p) => p.clientToken === clientToken)

  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (!project.stripeCustomerId) return NextResponse.json({ error: 'No billing account found.' }, { status: 400 })

  const key = await getApiKey('stripe_secret')
  const stripeClient = new Stripe(key || '', { apiVersion: '2023-10-16' })

  const session = await stripeClient.billingPortal.sessions.create({
    customer: project.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/client/dashboard/${clientToken}`,
  })

  return NextResponse.json({ url: session.url })
}
