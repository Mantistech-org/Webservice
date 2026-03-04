import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-bg" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100" />
      <div className="absolute inset-0 bg-hero-glow" />

      {/* Accent lines */}
      <div className="absolute left-0 top-1/3 w-px h-64 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
      <div className="absolute right-0 top-1/2 w-px h-48 bg-gradient-to-b from-transparent via-accent/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 border border-border rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-[glowPulse_2s_ease-in-out_infinite]" />
          <span className="font-mono text-xs text-teal tracking-widest uppercase">
            AI-Powered Web Agency
          </span>
        </div>

        <h1 className="font-heading text-[clamp(4rem,12vw,9rem)] leading-none tracking-wide text-white mb-6">
          WEBSITES THAT
          <br />
          <span className="text-accent">WORK FOR YOU</span>
        </h1>

        <p className="text-lg md:text-xl text-teal max-w-2xl mx-auto mb-12 leading-relaxed">
          Intelligent websites built for modern businesses. AI-driven advertising, booking systems,
          social automation, and more — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/intake"
            className="group relative font-mono text-base bg-accent text-bg px-8 py-4 rounded font-medium tracking-wider glow-accent hover:bg-white transition-all duration-300"
          >
            Start Your Project
            <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </Link>
          <a
            href="#pricing"
            className="font-mono text-base border border-border text-teal px-8 py-4 rounded tracking-wider hover:border-accent hover:text-accent transition-all duration-300"
          >
            View Pricing
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-xl mx-auto">
          {[
            { value: '48H', label: 'Delivery Time' },
            { value: '100%', label: 'Custom Built' },
            { value: '24/7', label: 'AI Powered' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-4xl text-accent">{stat.value}</div>
              <div className="font-mono text-xs text-muted tracking-widest uppercase mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="font-mono text-xs text-muted tracking-widest">SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-muted to-transparent" />
      </div>
    </section>
  )
}
