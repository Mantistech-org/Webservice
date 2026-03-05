import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-bg" />

      {/* Subtle warm vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,220,200,0.04)_0%,transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1 className="font-heading text-[clamp(3rem,9vw,7rem)] leading-tight text-white mb-6">
          Your Business,
          <br />
          <span className="text-accent italic">Running at Its Best.</span>
        </h1>

        <p className="text-lg md:text-xl text-teal max-w-2xl mx-auto mb-12 leading-relaxed">
          We build and manage everything your business needs online. You focus on your customers.
          We handle the rest.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/intake"
            className="group font-mono text-base bg-accent text-bg px-8 py-4 rounded font-medium tracking-wider hover:bg-white transition-all duration-300"
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
            { value: '24/7', label: 'Ongoing Support' },
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
