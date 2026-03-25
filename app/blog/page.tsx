import { query, pgEnabled } from '@/lib/pg'
import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog - Mantis Tech',
  description:
    'Practical guides and insights for small business owners on web design, automation, local SEO, and growing your online presence.',
  openGraph: {
    title: 'Blog - Mantis Tech',
    description:
      'Practical guides and insights for small business owners on web design, automation, local SEO, and growing your online presence.',
  },
}

type PostRow = {
  id: string
  title: string
  slug: string
  meta_description: string | null
  published_at: string | null
  created_at: string
}

export default async function BlogIndexPage() {
  let posts: PostRow[] = []

  if (pgEnabled) {
    try {
      posts = await query<PostRow>(
        `SELECT id, title, slug, meta_description, published_at, created_at
         FROM public.blog_posts
         WHERE status = 'published'
         ORDER BY published_at DESC`
      )
    } catch {
      posts = []
    }
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-bg">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">Mantis Tech</p>
          <h1 className="font-heading text-5xl text-primary mb-4">Blog</h1>
          <p className="text-base text-teal leading-relaxed mb-16 max-w-xl">
            Guides and insights for small business owners on building a better web presence and
            automating the day-to-day.
          </p>

          {posts.length === 0 ? (
            <p className="font-mono text-sm text-muted">No posts published yet. Check back soon.</p>
          ) : (
            <div className="space-y-10">
              {posts.map((post) => (
                <article key={post.id} className="border-b border-border pb-10 last:border-0">
                  <time className="font-mono text-xs text-muted block mb-3">
                    {new Date(post.published_at ?? post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <h2 className="font-heading text-2xl text-primary mb-3 leading-snug">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-accent transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.meta_description && (
                    <p className="text-base text-teal leading-relaxed mb-4">
                      {post.meta_description}
                    </p>
                  )}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-mono text-xs text-accent tracking-wider hover:opacity-75 transition-opacity"
                  >
                    Read more
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
