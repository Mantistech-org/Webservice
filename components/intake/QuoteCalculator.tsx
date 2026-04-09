'use client'

import { PLANS, Plan } from '@/types'

interface QuoteCalculatorProps {
  selectedPlan: Plan
}

export default function QuoteCalculator({ selectedPlan }: QuoteCalculatorProps) {
  const plan = PLANS[selectedPlan]

  return (
    <div className="sticky top-20 bg-card border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="bg-bg border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted tracking-widest uppercase mb-0.5">
            Selected Plan
          </div>
          <div className="font-heading text-xl text-primary mt-0.5">{plan.name}</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-accent" />
      </div>

      <div className="p-6 space-y-5">
        <div>
          <div className="text-xs text-muted tracking-widest uppercase mb-3">
            Monthly Total
          </div>
          <div className="font-heading text-5xl text-primary leading-none">
            ${plan.monthly}
            <span className="text-base text-muted font-normal ml-1">/mo</span>
          </div>
        </div>

        <div className="h-px bg-border" />

        <p className="text-sm text-muted">No contracts. Cancel anytime.</p>
      </div>
    </div>
  )
}
