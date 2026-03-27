import Link from 'next/link'
import HeroSlideshow from './HeroSlideshow'

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col">
      {/* Text content area */}
      <div className="flex items-center justify-center px-6 pt-20 pb-8 bg-bg">
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

      {/* Slideshow section bar */}
      <div className="flex justify-center items-center py-4 bg-[#111111] dark:bg-[#3a3a3a]">
        <p className="font-mono text-xs text-white tracking-widest uppercase">
          Example Sites We Build
        </p>
      </div>

      {/* Business website slideshow */}
      <div className="relative flex-1 min-h-[480px] overflow-hidden">
        <HeroSlideshow />
      </div>
    </section>
  )
}
