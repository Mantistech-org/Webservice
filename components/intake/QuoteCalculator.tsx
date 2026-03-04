'use client'

import { ADDONS, PLANS, Plan, BASE_MONTHLY } from '@/types'

interface QuoteCalculatorProps {
  selectedAddons: string[]
  selectedPlan: Plan
}

export default function QuoteCalculator({ selectedAddons, selectedPlan }: QuoteCalculatorProps) {
  const addonTotal = ADDONS.filter((a) => selectedAddons.includes(a.id)).reduce(
    (sum, a) => sum + a.price,
    0
  )
  const monthlyTotal = BASE_MONTHLY + addonTotal
  const plan = PLANS[selectedPlan]

  const activeAddons = ADDONS.filter((a) => selectedAddons.includes(a.id))

  return (
    <div className="sticky top-20 bg-card border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="bg-bg border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-xs text-accent tracking-widest uppercase">
            Live Quote
          </div>
          <div className="font-heading text-xl text-white mt-0.5">Your Estimate</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-accent animate-[glowPulse_2s_ease-in-out_infinite]" />
      </div>

      <div className="p-6 space-y-5">
        {/* Plan section */}
        <div>
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">
            Selected Plan
          </div>
          <div className="flex items-center justify-between">
            <span className="font-heading text-xl text-teal tracking-wide">{plan.name}</span>
            <span className="font-heading text-2xl text-white">
              ${plan.upfront}
              <span className="font-mono text-sm text-muted font-normal ml-1">upfront</span>
            </span>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Monthly breakdown */}
        <div>
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">
            Monthly Breakdown
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-teal">Base website</span>
              <span className="font-mono text-white">${BASE_MONTHLY}/mo</span>
            </div>

            {activeAddons.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between text-sm">
                <span className="text-teal flex items-center gap-2">
                  <span className="text-accent text-xs">+</span>
                  {addon.label}
                </span>
                <span className="font-mono text-white">${addon.price}/mo</span>
              </div>
            ))}

            {activeAddons.length === 0 && (
              <p className="text-xs text-dim font-mono">No add-ons selected yet.</p>
            )}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Total */}
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">
              Monthly Total
            </div>
            <div className="font-heading text-5xl text-accent leading-none">
              ${monthlyTotal}
              <span className="font-mono text-base text-muted font-normal ml-1">/mo</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">
              Due Today
            </div>
            <div className="font-heading text-3xl text-white leading-none">
              ${plan.upfront}
            </div>
          </div>
        </div>

        {activeAddons.length > 0 && (
          <div className="bg-bg rounded border border-border/50 p-3">
            <div className="font-mono text-xs text-dim">
              {activeAddons.length} add-on{activeAddons.length > 1 ? 's' : ''} selected
              &mdash; saving you time and resources from day one.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
