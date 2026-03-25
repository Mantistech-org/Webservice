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
            Your Business, On Autopilot.
          </h1>
          <p className="text-base text-teal leading-relaxed mb-10 max-w-lg mx-auto">
            We don&apos;t just build websites. We build systems into your website that automatically
            handle your client outreach, appointments, reviews, social media posts, and more. Let
            your business run on autopilot.
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
            width="120"
            height="280"
            viewBox="0 0 120 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Vertical connector lines */}
            <line x1="60" y1="0" x2="60" y2="50" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="60" y1="230" x2="60" y2="280" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.3" />

            {/* Center hub circle */}
            <circle cx="60" cy="140" r="18" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1.5" />
            <circle cx="60" cy="140" r="10" fill="#00ff88" fillOpacity="0.12" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.7" />
            <circle cx="60" cy="140" r="4" fill="#00ff88" />

            {/* Node top */}
            <circle cx="60" cy="70" r="6" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1.2" strokeOpacity="0.8" />
            <circle cx="60" cy="70" r="2.5" fill="#00ff88" fillOpacity="0.6" />

            {/* Node bottom */}
            <circle cx="60" cy="210" r="6" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1.2" strokeOpacity="0.8" />
            <circle cx="60" cy="210" r="2.5" fill="#00ff88" fillOpacity="0.6" />

            {/* Left node */}
            <circle cx="18" cy="140" r="5" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.6" />
            <circle cx="18" cy="140" r="2" fill="#00ff88" fillOpacity="0.5" />

            {/* Right node */}
            <circle cx="102" cy="140" r="5" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.6" />
            <circle cx="102" cy="140" r="2" fill="#00ff88" fillOpacity="0.5" />

            {/* Upper-left node */}
            <circle cx="22" cy="95" r="4" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.5" />

            {/* Upper-right node */}
            <circle cx="98" cy="95" r="4" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.5" />

            {/* Lower-left node */}
            <circle cx="22" cy="185" r="4" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.5" />

            {/* Lower-right node */}
            <circle cx="98" cy="185" r="4" fill="#0a0a0a" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.5" />

            {/* Connection lines from center hub to satellite nodes */}
            <line x1="60" y1="122" x2="60" y2="76" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="60" y1="158" x2="60" y2="204" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="42" y1="140" x2="23" y2="140" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="78" y1="140" x2="97" y2="140" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="47" y1="128" x2="25" y2="98" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="73" y1="128" x2="95" y2="98" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="47" y1="152" x2="25" y2="182" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="73" y1="152" x2="95" y2="182" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.3" />

            {/* Subtle orbit ring around center */}
            <circle cx="60" cy="140" r="32" fill="none" stroke="#00ff88" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="4 4" />
          </svg>
        </div>
      </div>
    </section>
  )
}
