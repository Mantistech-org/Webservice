import { notFound } from 'next/navigation'
import { query, pgEnabled } from '@/lib/pg'
import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const revalidate = 3600

type BlogPost = {
  id: string
  title: string
  slug: string
  meta_description: string | null
  content: string | null
  published_at: string | null
  created_at: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  if (!pgEnabled) return {}

  try {
    const rows = await query<BlogPost>(
      `SELECT title, slug, meta_description FROM public.blog_posts WHERE slug = $1 AND status = 'published'`,
      [slug]
    )
    if (!rows.length) return {}
    const post = rows[0]

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''

    return {
      title: post.title,
      description: post.meta_description ?? undefined,
      openGraph: {
        title: post.title,
        description: post.meta_description ?? undefined,
        url: `${base}/blog/${slug}`,
        type: 'article',
      },
      alternates: { canonical: `${base}/blog/${slug}` },
    }
  } catch {
    return {}
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!pgEnabled) notFound()

  let post: BlogPost | null = null

  try {
    const rows = await query<BlogPost>(
      `SELECT * FROM public.blog_posts WHERE slug = $1 AND status = 'published'`,
      [slug]
    )
    post = rows[0] ?? null
  } catch {
    notFound()
  }

  if (!post) notFound()

  const publishDate = new Date(post.published_at ?? post.created_at)

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-bg">
        <article className="max-w-2xl mx-auto px-6 py-20">
          {/* Back link */}
          <Link
            href="/blog"
            className="font-mono text-xs text-muted hover:text-primary transition-colors mb-10 block"
          >
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-12">
            <time className="font-mono text-xs text-muted block mb-4">
              {publishDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <h1 className="font-heading text-4xl text-primary leading-tight mb-6">
              {post.title}
            </h1>
            {post.meta_description && (
              <p className="text-lg text-teal leading-relaxed">
                {post.meta_description}
              </p>
            )}
            <div className="mt-8 h-px bg-border" />
          </header>

          {/* Body */}
          {post.content && (
            <div
              className="blog-content text-primary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Footer CTA */}
          <div className="mt-16 pt-10 border-t border-border">
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">Mantis Tech</p>
            <p className="text-base text-teal leading-relaxed mb-6">
              Ready to put your business on autopilot? We build professional websites with automation
              built in from day one.
            </p>
            <Link
              href="/intake"
              className="inline-block font-mono text-sm bg-accent text-black px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity"
            >
              Start Your Project
            </Link>
          </div>
        </article>
      </main>
      <Footer />

      <style>{`
        .blog-content h2 {
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          line-height: 1.3;
          color: rgb(var(--color-primary));
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
        .blog-content h3 {
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
          font-weight: 600;
          font-size: 1.125rem;
          line-height: 1.4;
          color: rgb(var(--color-primary));
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .blog-content p {
          font-size: 1rem;
          line-height: 1.8;
          color: rgb(var(--color-teal));
          margin-bottom: 1.25rem;
        }
        .blog-content ul,
        .blog-content ol {
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .blog-content li {
          font-size: 1rem;
          line-height: 1.8;
          color: rgb(var(--color-teal));
          margin-bottom: 0.4rem;
        }
        .blog-content strong {
          color: rgb(var(--color-primary));
          font-weight: 600;
        }
        .blog-content a {
          color: #00ff88;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
    </>
  )
}
