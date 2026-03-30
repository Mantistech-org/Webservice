import Link from 'next/link'
import { getPublicPricing, type PublicPlan } from '@/lib/pricing'

// Format a price to exactly 2 decimal places: 87.5 → "87.50", 97 → "97.00"
function fmt(amount: number): string {
  return amount.toFixed(2)
}

function PlanCard({ plan, highlight }: { plan: PublicPlan; highlight: boolean }) {
  const { promotion } = plan

  return (
    <div
      className={`relative rounded border flex flex-col ${
        highlight ? 'border-accent bg-card' : 'border-border bg-card'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-black font-mono text-xs tracking-widest rounded-full">
          MOST POPULAR
        </div>
      )}

      <div className="p-8 flex-1 flex flex-col">
        <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">
          {plan.name}
        </div>

        {/* Monthly price — primary price, shown large */}
        {promotion ? (
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-base text-muted line-through">
                ${fmt(plan.monthly)}/mo
              </span>
            </div>
            <div className="font-heading text-5xl text-primary leading-none">
              ${fmt(promotion.discounted_monthly)}
              <span className="font-mono text-sm text-muted ml-1 font-normal">/mo</span>
            </div>
            <div className="font-mono text-xs text-accent tracking-wider mt-1">
              {promotion.label}
              {promotion.duration_months
                ? `, first ${promotion.duration_months} month${promotion.duration_months === 1 ? '' : 's'}`
                : ''}
            </div>
            {(plan.plan_key === 'mid' || plan.plan_key === 'pro') && (
              <div className="font-mono text-xs text-muted tracking-wider mb-1">
                Launch pricing ends June 30, 2026
              </div>
            )}
          </div>
        ) : (
          <div className="font-heading text-5xl text-primary leading-none mb-1">
            ${fmt(plan.monthly)}
            <span className="font-mono text-sm text-muted ml-2 font-normal">/month</span>
          </div>
        )}

        {/* Upfront fee — secondary, shown smaller below monthly */}
        {plan.upfront != null && (
          <div className="font-heading text-2xl text-teal leading-none mb-2">
            ${fmt(plan.upfront)}
            <span className="font-mono text-sm text-muted ml-2 font-normal">upfront</span>
          </div>
        )}

        <div className="font-mono text-xs text-muted mb-6">Up to {plan.pages} pages</div>

        <ul className="space-y-3 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <span className="text-accent mt-0.5 shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-teal">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href={`/intake?plan=${plan.plan_key}`}
          className={`mt-8 block text-center font-mono text-sm py-3 px-6 rounded tracking-wider transition-opacity duration-200 ${
            highlight
              ? 'bg-accent text-black hover:opacity-90'
              : 'border border-border text-teal hover:border-accent hover:text-accent'
          }`}
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}

export default async function Pricing() {
  const plans = await getPublicPricing()

  return (
    <section id="pricing" className="py-24 px-6 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 text-center">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
            Transparent Pricing
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            Plans That Scale With You
          </h2>
          <p className="mt-4 text-teal max-w-xl mx-auto text-base leading-relaxed">
            One upfront build fee. One monthly subscription. No hidden costs. Cancel any time.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-mono text-sm text-muted">Pricing plans are loading — check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <PlanCard key={plan.plan_key} plan={plan} highlight={idx === 1} />
            ))}
          </div>
        )}

        <p className="text-center font-mono text-xs text-muted mt-8 tracking-wider">
          All plans include a custom-built website, SSL, and managed hosting. Add-ons available
          separately.
        </p>
      </div>
    </section>
  )
}
