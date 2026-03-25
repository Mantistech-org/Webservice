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
            <div className="flex items-center gap-4 mt-4">
              <a
                href="tel:+15016690488"
                className="font-mono text-sm text-primary hover:text-accent transition-colors tracking-wider"
              >
                (501) 669-0488
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61578464746633"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent transition-colors"
                aria-label="Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>
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
                'Lead Generation',
                'SEO Optimization',
                'E-Commerce Automation',
                'Ad Creative Generation',
                'Website Chatbot',
                'Automated Email Marketing',
                'Booking Calendar',
                'Email with Domain',
              ].map((s) => (
                <li key={s}>
                  <a href="/#services" className="hover:text-primary transition-colors">
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
                <a href="/#how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/demo" className="hover:text-primary transition-colors">
                  Try the Demo
                </Link>
              </li>
              <li>
                <Link href="/intake" className="hover:text-primary transition-colors">
                  Start a Project
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
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
          <p className="font-mono text-xs text-muted tracking-wider">
            Built with care.
          </p>
        </div>
      </div>
    </footer>
  )
}
