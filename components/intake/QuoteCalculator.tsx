'use client'

import { ADDONS, PLANS, PLAN_INCLUDED_ADDONS, Plan } from '@/types'

interface QuoteCalculatorProps {
  selectedAddons: string[]
  selectedPlan: Plan
}

export default function QuoteCalculator({ selectedAddons, selectedPlan }: QuoteCalculatorProps) {
  const plan = PLANS[selectedPlan]
  const includedAddonIds = PLAN_INCLUDED_ADDONS[selectedPlan]

  // Only extra add-ons beyond what the plan includes cost extra
  const extraAddons = ADDONS.filter(
    (a) => selectedAddons.includes(a.id) && !includedAddonIds.includes(a.id)
  )
  const extraAddonTotal = extraAddons.reduce((sum, a) => sum + a.price, 0)
  const monthlyTotal = plan.monthly + extraAddonTotal

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
              <span className="text-teal">{plan.name} plan</span>
              <span className="font-mono text-white">${plan.monthly}/mo</span>
            </div>

            {extraAddons.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between text-sm">
                <span className="text-teal flex items-center gap-2">
                  <span className="text-accent text-xs">+</span>
                  {addon.label}
                </span>
                <span className="font-mono text-white">${addon.price}/mo</span>
              </div>
            ))}

            {extraAddons.length === 0 && (
              <p className="text-xs text-dim font-mono">No extra add-ons selected.</p>
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

        {extraAddons.length > 0 && (
          <div className="bg-bg rounded border border-border/50 p-3">
            <div className="font-mono text-xs text-dim">
              {extraAddons.length} extra add-on{extraAddons.length > 1 ? 's' : ''} selected on top of your plan.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
