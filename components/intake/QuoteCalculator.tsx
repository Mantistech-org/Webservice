'use client'

import { ADDONS, PLANS, PLAN_INCLUDED_ADDONS, Plan } from '@/types'

interface QuoteCalculatorProps {
  selectedAddons: string[]
  selectedPlan: Plan
}

const LAUNCH_MONTHLY: Partial<Record<Plan, number>> = {
  mid: 87.50,
  pro: 175,
}

export default function QuoteCalculator({ selectedAddons, selectedPlan }: QuoteCalculatorProps) {
  const plan = PLANS[selectedPlan]
  const includedAddonIds = PLAN_INCLUDED_ADDONS[selectedPlan]

  // Only extra add-ons beyond what the plan includes cost extra
  const extraAddons = ADDONS.filter(
    (a) => selectedAddons.includes(a.id) && !includedAddonIds.includes(a.id)
  )
  const extraAddonTotal = extraAddons.reduce((sum, a) => sum + a.price, 0)
  const launchMonthly = LAUNCH_MONTHLY[selectedPlan]
  const baseMonthly = launchMonthly ?? plan.monthly
  const monthlyTotal = baseMonthly + extraAddonTotal

  // Upsell logic — suggest the next plan when the current total approaches its price
  const nextPlan: Plan | null =
    selectedPlan === 'starter' ? 'mid' :
    selectedPlan === 'mid' ? 'pro' :
    null
  const nextPlanData = nextPlan ? PLANS[nextPlan] : null
  // Starter: trigger whenever any paid extra is selected (max possible is $52, far below mid's $125,
  //   but any extra spend is a signal that Growth's bundled addons are a better deal).
  // Mid: trigger at 80% of Pro's price ($200) — reachable with 3+ extras like lead-gen+ecommerce+chatbot.
  const showUpsell = nextPlanData !== null && (
    selectedPlan === 'starter'
      ? extraAddons.length > 0
      : monthlyTotal >= PLANS.pro.monthly * 0.8
  )

  return (
    <div className="sticky top-20 bg-card border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="bg-bg border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-xs text-muted tracking-widest uppercase">
            Live Quote
          </div>
          <div className="font-heading text-xl text-primary mt-0.5">Your Estimate</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-accent" />
      </div>

      <div className="p-6 space-y-5">
        {/* Plan section */}
        <div>
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">
            Selected Plan
          </div>
          <div className="flex items-center justify-between">
            <span className="font-heading text-xl text-teal tracking-wide">{plan.name}</span>
            <span className="font-heading text-2xl text-primary">
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
              <span className="font-mono text-primary">
                {launchMonthly ? (
                  <>
                    <span className="line-through text-muted mr-1">${plan.monthly}</span>
                    ${launchMonthly}/mo
                  </>
                ) : (
                  <>${plan.monthly}/mo</>
                )}
              </span>
            </div>
            {launchMonthly && (
              <div className="font-mono text-xs text-accent">Launch Pricing, first 3 months</div>
            )}

            {extraAddons.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between text-sm">
                <span className="text-teal flex items-center gap-2">
                  <span className="text-muted text-xs">+</span>
                  {addon.label}
                </span>
                <span className="font-mono text-primary">${addon.price}/mo</span>
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
            <div className="font-heading text-5xl text-primary leading-none">
              ${monthlyTotal}
              <span className="font-mono text-base text-muted font-normal ml-1">/mo</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">
              Billed After Approval
            </div>
            <div className="font-heading text-3xl text-primary leading-none">
              ${plan.upfront}
            </div>
          </div>
        </div>

        {showUpsell && nextPlanData ? (
          <div className="border border-accent/40 bg-accent/5 rounded p-4 space-y-2">
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2.5">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className="font-mono text-xs text-accent tracking-widest uppercase">
                Better value available
              </span>
            </div>
            <p className="text-sm text-primary font-medium leading-snug">
              Upgrade to {nextPlanData.name} for ${nextPlanData.monthly}/mo
            </p>
            <p className="font-mono text-xs text-muted leading-relaxed">
              {selectedPlan === 'starter'
                ? `The Growth plan includes Review Management, Social Media Automation, SEO Optimization, and Missed Call Auto-Reply — all bundled. You get far more for $${nextPlanData.monthly}/mo than adding extras to Starter.`
                : `You're close to Pro pricing. For $${nextPlanData.monthly}/mo, Pro includes every add-on — Lead Generation, E-Commerce Automation, Website Chatbot, Email Marketing, and more. Nothing left to add.`}
            </p>
          </div>
        ) : extraAddons.length > 0 ? (
          <div className="bg-bg rounded border border-border/50 p-3">
            <div className="font-mono text-xs text-dim">
              {extraAddons.length} extra add-on{extraAddons.length > 1 ? 's' : ''} selected on top of your plan.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
