import Link from 'next/link'
import HeroSlideshow from './HeroSlideshow'

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col">
      {/* Text content area */}
      <div className="flex items-center justify-center px-6 py-24 bg-bg">
        <div className="text-center max-w-2xl">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-5">
            Mantis Tech
          </p>
          <h1 className="font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-tight text-primary mb-6">
            Your Business, On Autopilot.
          </h1>
          <p className="text-base text-teal leading-relaxed mb-10 max-w-lg mx-auto">
            We don&apos;t just build websites. We build systems into your website that automatically
            handle your client outreach, appointments, reviews, social media posts, and more. Let
            your business run on autopilot.
          </p>
          <div className="flex items-center justify-center">
            <Link
              href="/intake"
              className="inline-block font-mono text-sm bg-accent text-black px-8 py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
            >
              Start Your Project
            </Link>
          </div>
        </div>
      </div>

      {/* Business website slideshow */}
      <div className="relative flex-1 min-h-[480px] overflow-hidden">
        {/* Label */}
        <div
          style={{
            position: 'absolute',
            top: '1.1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            background: 'rgba(0,0,0,0.58)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.14)',
            padding: '0.4rem 1.25rem',
            borderRadius: 100,
            whiteSpace: 'nowrap',
          }}
        >
          <p
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              color: '#00ff88',
              textTransform: 'uppercase',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Example Sites We Build
          </p>
        </div>
        <HeroSlideshow />
      </div>
    </section>
  )
}
