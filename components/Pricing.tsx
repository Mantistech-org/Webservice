import Link from 'next/link'

const PLAN_ONLY_FEATURES = [
  'Weather Activation System',
  'Booking Calendar',
  'Review Management',
  'SMS and Text Marketing',
  'Automated Email Marketing',
  'Missed Call Auto-Reply',
  'Google Business Profile Management',
  'Monthly Performance Report',
  'AI Content Assistant',
]

const PLAN_PLUS_FEATURES = [
  'Everything in Platform Only',
  'CRM',
  'AI Voice Agent',
  'SEO Optimization',
  'Custom HVAC Website (48-hour build)',
  'Fast, mobile-optimized, built to rank',
  'Connected to every platform tool from day one',
  'Unlimited content updates',
]

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="text-accent mt-0.5 shrink-0"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-card border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="mb-14 text-center">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
            Pricing
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            Two plans. No surprises.
          </h2>
          <p className="mt-4 text-teal max-w-xl mx-auto text-base leading-relaxed">
            One monthly subscription. No contracts. Cancel any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan 1: Platform Only */}
          <div className="relative rounded border border-border bg-card flex flex-col">
            <div className="p-8 flex-1 flex flex-col">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">
                Platform Only
              </div>
              <div className="font-heading text-5xl text-primary leading-none mb-1">
                $199
                <span className="font-mono text-sm text-muted ml-2 font-normal">/month</span>
              </div>
              <p className="font-mono text-xs text-muted mb-6">
                For contractors who already have a website.
              </p>
              <ul className="space-y-3 flex-1">
                {PLAN_ONLY_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <CheckIcon />
                    <span className="text-teal">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/consultation"
                className="mt-8 block text-center font-mono text-sm py-3 px-6 rounded tracking-wider border border-border text-teal hover:border-accent hover:text-accent transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Plan 2: Platform Plus */}
          <div className="relative rounded border border-accent bg-card flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-black font-mono text-xs tracking-widest rounded-full whitespace-nowrap">
              MOST POPULAR
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">
                Platform Plus
              </div>
              <div className="font-heading text-5xl text-primary leading-none mb-1">
                $299
                <span className="font-mono text-sm text-muted ml-2 font-normal">/month</span>
              </div>
              <p className="font-mono text-xs text-muted mb-6">
                For contractors who need a custom HVAC website included.
              </p>
              <ul className="space-y-3 flex-1">
                {PLAN_PLUS_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <CheckIcon />
                    <span className="text-teal">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/consultation"
                className="mt-8 block text-center font-mono text-sm py-3 px-6 rounded tracking-wider bg-accent text-black hover:opacity-90 transition-opacity duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center font-mono text-xs text-muted mt-8 tracking-wider">
          Not sure which plan is right for you? Schedule a free 15-minute consultation and we will walk you through it.
        </p>
      </div>
    </section>
  )
}
