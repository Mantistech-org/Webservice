import Link from 'next/link'

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
            Your Business, Online.
          </h1>
          <p className="text-base text-teal leading-relaxed mb-10 max-w-md mx-auto">
            We build and manage everything your business needs on the web. You focus on your
            customers. We handle the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/intake"
              className="inline-block font-mono text-sm bg-accent text-black px-8 py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
            >
              Start Your Project
            </Link>
            <Link
              href="/demo"
              className="inline-block font-mono text-sm border border-current text-primary px-8 py-4 rounded tracking-wider hover:border-accent hover:text-accent transition-all"
            >
              Try the Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Split image area with SVG centerpiece */}
      <div className="relative flex-1 min-h-[480px] flex overflow-hidden">
        {/* Left photo */}
        <div className="w-1/2 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1585076641399-5c06d1b3365f?q=80&w=2070&auto=format&fit=crop"
            alt="Professional working at a modern desk"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Right photo */}
        <div className="w-1/2 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1657812159055-7bae416f386d?q=80&w=2144&auto=format&fit=crop"
            alt="Modern web design on a laptop screen"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* SVG centerpiece — centered at the dividing line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center z-10 pointer-events-none">
          <svg
            width="72"
            height="260"
            viewBox="0 0 72 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Vertical spine */}
            <line x1="36" y1="0" x2="36" y2="90" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="36" y1="170" x2="36" y2="260" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.4" />

            {/* Outer diamond */}
            <polygon
              points="36,70 66,130 36,190 6,130"
              fill="#0a0a0a"
              stroke="#00ff88"
              strokeWidth="1.5"
            />

            {/* Inner diamond */}
            <polygon
              points="36,92 54,130 36,168 18,130"
              fill="#00ff88"
              fillOpacity="0.08"
              stroke="#00ff88"
              strokeWidth="1"
              strokeOpacity="0.6"
            />

            {/* Center accent dot */}
            <circle cx="36" cy="130" r="5" fill="#00ff88" />

            {/* Corner tick marks */}
            <line x1="36" y1="70" x2="36" y2="78" stroke="#00ff88" strokeWidth="2" />
            <line x1="36" y1="182" x2="36" y2="190" stroke="#00ff88" strokeWidth="2" />
            <line x1="6" y1="130" x2="14" y2="130" stroke="#00ff88" strokeWidth="2" />
            <line x1="58" y1="130" x2="66" y2="130" stroke="#00ff88" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </section>
  )
}
