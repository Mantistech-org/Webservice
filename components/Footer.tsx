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
              <span className="font-heading text-xl text-primary">Mantis Tech</span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              Boutique web agency delivering premium websites and digital services for businesses
              that refuse to settle.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-mono text-xs text-muted tracking-widest uppercase mb-4">
              Services
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              {[
                'Review Management',
                'Social Media Automation',
                'SEO Optimization',
                'E-Commerce Automation',
                'Website Chatbot',
                'Automated Email Marketing',
              ].map((s) => (
                <li key={s}>
                  <a href="#services" className="hover:text-primary transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono text-xs text-muted tracking-widest uppercase mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/intake" className="hover:text-primary transition-colors">
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
            Built with care.
          </p>
        </div>
      </div>
    </footer>
  )
}
