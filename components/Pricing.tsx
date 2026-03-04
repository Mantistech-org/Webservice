import Link from 'next/link'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    upfront: 100,
    monthly: 50,
    description: 'Perfect for new businesses establishing their online presence.',
    features: [
      'Custom AI-generated website',
      'Mobile responsive design',
      'SSL and hosting included',
      'Basic contact form',
      'Up to 5 pages',
      'Monthly performance report',
    ],
    highlight: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    upfront: 200,
    monthly: 100,
    description: 'Built for businesses ready to attract more customers and automate growth.',
    features: [
      'Everything in Starter',
      'SEO optimization',
      'AI chatbot integration',
      'Online booking system',
      'Social media automation',
      'Priority support',
    ],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    upfront: 300,
    monthly: 150,
    description: 'The full suite for businesses that demand peak performance.',
    features: [
      'Everything in Growth',
      'E-commerce storefront',
      'AI ad generation',
      'Email marketing automation',
      'Customer loyalty program',
      'Dedicated account manager',
    ],
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
            // Transparent Pricing
          </div>
          <h2 className="font-heading text-[clamp(3rem,7vw,5.5rem)] leading-none text-white">
            PLANS THAT
            <br />
            <span className="text-teal">SCALE WITH YOU</span>
          </h2>
          <p className="mt-6 text-teal max-w-xl mx-auto text-base leading-relaxed">
            One upfront build fee. One monthly subscription. No hidden costs. Cancel any time.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded border flex flex-col ${
                plan.highlight
                  ? 'border-accent bg-card glow-accent'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-px left-8 right-8 h-px bg-accent" />
              )}
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-bg font-mono text-xs tracking-widest rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8 flex-1 flex flex-col">
                {/* Plan name */}
                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">
                  {plan.name} Plan
                </div>

                {/* Upfront price */}
                <div className="font-heading text-6xl text-white leading-none mb-1">
                  ${plan.upfront}
                  <span className="font-mono text-base text-muted ml-2 font-normal">upfront</span>
                </div>

                {/* Monthly price */}
                <div className="font-heading text-3xl text-teal leading-none mb-6">
                  ${plan.monthly}
                  <span className="font-mono text-sm text-muted ml-2 font-normal">/month</span>
                </div>

                <p className="text-sm text-muted mb-8 leading-relaxed">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <span className="text-accent mt-0.5 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className="text-teal">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/intake?plan=${plan.id}`}
                  className={`mt-8 block text-center font-mono text-sm py-3 px-6 rounded tracking-wider transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-accent text-bg hover:bg-white glow-accent-hover'
                      : 'border border-border text-teal hover:border-accent hover:text-accent'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center font-mono text-xs text-muted mt-8 tracking-wider">
          All plans include a custom AI-generated website, SSL, and managed hosting. Add-ons available separately.
        </p>
      </div>
    </section>
  )
}
