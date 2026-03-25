import { notFound } from 'next/navigation'
import { query, pgEnabled } from '@/lib/pg'
import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const revalidate = 3600

type LocationPage = {
  id: string
  city: string
  state: string
  slug: string
  meta_title: string | null
  meta_description: string | null
  headline: string | null
  content: string | null
  published_at: string | null
  created_at: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'city-state': string }>
}): Promise<Metadata> {
  const slug = (await params)['city-state']

  if (!pgEnabled) return {}

  try {
    const rows = await query<LocationPage>(
      `SELECT meta_title, meta_description, city, state FROM public.seo_location_pages WHERE slug = $1 AND status = 'published'`,
      [slug]
    )
    if (!rows.length) return {}
    const page = rows[0]
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''

    return {
      title: page.meta_title ?? `Web Design in ${page.city}, ${page.state} - Mantis Tech`,
      description: page.meta_description ?? undefined,
      openGraph: {
        title: page.meta_title ?? `Web Design in ${page.city}, ${page.state} - Mantis Tech`,
        description: page.meta_description ?? undefined,
        url: `${base}/locations/${slug}`,
      },
      alternates: { canonical: `${base}/locations/${slug}` },
    }
  } catch {
    return {}
  }
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ 'city-state': string }>
}) {
  const slug = (await params)['city-state']

  if (!pgEnabled) notFound()

  let page: LocationPage | null = null

  try {
    const rows = await query<LocationPage>(
      `SELECT * FROM public.seo_location_pages WHERE slug = $1 AND status = 'published'`,
      [slug]
    )
    page = rows[0] ?? null
  } catch {
    notFound()
  }

  if (!page) notFound()

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-bg">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 py-20">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-6">
            Mantis Tech - {page.city}, {page.state}
          </p>
          {page.headline && (
            <h1 className="font-heading text-5xl text-primary leading-tight mb-8">
              {page.headline}
            </h1>
          )}
        </section>

        {/* Content */}
        {page.content && (
          <section className="max-w-3xl mx-auto px-6 pb-16">
            <div
              className="location-content"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </section>
        )}

        {/* CTA */}
        <section className="bg-card border-t border-border">
          <div className="max-w-3xl mx-auto px-6 py-16 text-center">
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
              Get Started
            </p>
            <h2 className="font-heading text-3xl text-primary mb-6">
              Ready to grow your business in {page.city}?
            </h2>
            <p className="text-base text-teal leading-relaxed mb-8 max-w-xl mx-auto">
              Tell us about your business and we will put together a custom website and automation
              plan tailored to your goals.
            </p>
            <Link
              href="/intake"
              className="inline-block font-mono text-sm bg-accent text-black px-8 py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
            >
              Start Your Project
            </Link>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        .location-content h2 {
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
          font-weight: 700;
          font-size: 1.75rem;
          line-height: 1.3;
          color: rgb(var(--color-primary));
          margin-top: 3rem;
          margin-bottom: 1rem;
        }
        .location-content h3 {
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
          font-weight: 600;
          font-size: 1.2rem;
          line-height: 1.4;
          color: rgb(var(--color-primary));
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .location-content p {
          font-size: 1rem;
          line-height: 1.8;
          color: rgb(var(--color-teal));
          margin-bottom: 1.25rem;
        }
        .location-content ul,
        .location-content ol {
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .location-content li {
          font-size: 1rem;
          line-height: 1.8;
          color: rgb(var(--color-teal));
          margin-bottom: 0.4rem;
        }
        .location-content strong {
          color: rgb(var(--color-primary));
          font-weight: 600;
        }
      `}</style>
    </>
  )
}
