import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="font-heading text-2xl tracking-widest text-white">MANTIS TECH</span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              High-end web agency delivering intelligent websites powered by AI. Built for businesses
              that refuse to settle.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
              Services
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              {[
                'AI Ad Generation',
                'Social Media Automation',
                'Online Booking',
                'E-Commerce',
                'SEO Optimization',
                'AI Chatbot',
              ].map((s) => (
                <li key={s}>
                  <a href="#services" className="hover:text-accent transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href="#how-it-works" className="hover:text-accent transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-accent transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/intake" className="hover:text-accent transition-colors">
                  Start a Project
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-muted tracking-wider">
            &copy; {year} Mantis Tech. All rights reserved.
          </p>
          <p className="font-mono text-xs text-dim tracking-wider">
            Built with intelligence.
          </p>
        </div>
      </div>
    </footer>
  )
}
