import { MetadataRoute } from 'next'
import { query, pgEnabled } from '@/lib/pg'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mantistech.org').replace(/\/$/, '')

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`,        lastModified: new Date(), priority: 1.0,  changeFrequency: 'weekly' },
    { url: `${base}/intake`,  lastModified: new Date(), priority: 0.9,  changeFrequency: 'monthly' },
    { url: `${base}/contact`, lastModified: new Date(), priority: 0.7,  changeFrequency: 'monthly' },
    { url: `${base}/privacy`, lastModified: new Date(), priority: 0.3,  changeFrequency: 'yearly' },
    { url: `${base}/terms`,   lastModified: new Date(), priority: 0.3,  changeFrequency: 'yearly' },
  ]

  if (!pgEnabled) return staticPages

  try {
    const [blogRows, locationRows] = await Promise.all([
      query<{ slug: string; published_at: string | null }>(
        `SELECT slug, published_at FROM public.blog_posts WHERE status = 'published' ORDER BY published_at DESC`
      ),
      query<{ slug: string; published_at: string | null }>(
        `SELECT slug, published_at FROM public.seo_location_pages WHERE status = 'published' ORDER BY published_at DESC`
      ),
    ])

    const blogPages: MetadataRoute.Sitemap = blogRows.map((r) => ({
      url: `${base}/blog/${r.slug}`,
      lastModified: r.published_at ? new Date(r.published_at) : new Date(),
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    }))

    const locationPages: MetadataRoute.Sitemap = locationRows.map((r) => ({
      url: `${base}/locations/${r.slug}`,
      lastModified: r.published_at ? new Date(r.published_at) : new Date(),
      priority: 0.85,
      changeFrequency: 'monthly' as const,
    }))

    return [...staticPages, ...locationPages, ...blogPages]
  } catch (err) {
    console.error('[sitemap] Failed to load dynamic pages:', err)
    return staticPages
  }
}
