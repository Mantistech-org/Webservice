'use client'

import { useState, useEffect, useCallback } from 'react'

type PricingPlan = {
  id: string
  plan_key: string
  name: string
  upfront: number
  monthly: number
  pages: number
  features: string[]
  stripe_product_id: string | null
  stripe_monthly_price_id: string | null
  stripe_upfront_price_id: string | null
  visible: boolean
  sort_order: number
}

type PricingCoupon = {
  id: string
  stripe_coupon_id: string
  code: string
  label: string | null
  discount_type: 'percent' | 'amount'
  discount_value: number
  applies_to: string
  duration_months: number | null
  max_redemptions: number | null
  times_redeemed: number
  expires_at: string | null
  active: boolean
  display_on_pricing: boolean
  created_at: string
}

type PlanEdits = {
  monthly: number
  upfront: number
  stripe_product_id: string
}

type CreateForm = {
  code: string
  label: string
  discount_type: 'percent' | 'amount'
  discount_value: string
  applies_to: string
  duration_months: string
  max_redemptions: string
  expires_at: string
  display_on_pricing: boolean
}

const BLANK_FORM: CreateForm = {
  code: '',
  label: '',
  discount_type: 'percent',
  discount_value: '',
  applies_to: 'all',
  duration_months: '',
  max_redemptions: '',
  expires_at: '',
  display_on_pricing: false,
}

export default function PricingPage() {
  const [tab, setTab] = useState<'plans' | 'discounts'>('plans')

  // Plans state
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planEdits, setPlanEdits] = useState<PlanEdits>({ monthly: 0, upfront: 0, stripe_product_id: '' })
  const [savingPlan, setSavingPlan] = useState(false)
  const [planMsg, setPlanMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

  // Discounts state
  const [coupons, setCoupons] = useState<PricingCoupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [createForm, setCreateForm] = useState<CreateForm>(BLANK_FORM)

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true)
    try {
      const res = await fetch('/api/admin/pricing/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans ?? [])
      }
    } finally {
      setPlansLoading(false)
    }
  }, [])

  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true)
    try {
      const res = await fetch('/api/admin/pricing/coupons')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data.coupons ?? [])
      }
    } finally {
      setCouponsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  useEffect(() => {
    if (tab === 'discounts') fetchCoupons()
  }, [tab, fetchCoupons])

  function startEditPlan(plan: PricingPlan) {
    setEditingPlanId(plan.id)
    setPlanEdits({
      monthly: plan.monthly,
      upfront: plan.upfront,
      stripe_product_id: plan.stripe_product_id ?? '',
    })
    setPlanMsg(null)
  }

  async function handleSavePlan(planId: string) {
    setSavingPlan(true)
    setPlanMsg(null)
    try {
      const res = await fetch(`/api/admin/pricing/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planEdits),
      })
      const data = await res.json()
      if (res.ok) {
        setPlans((prev) => prev.map((p) => (p.id === planId ? data.plan : p)))
        setEditingPlanId(null)
        setPlanMsg({ id: planId, text: 'Saved successfully.', ok: true })
      } else {
        setPlanMsg({ id: planId, text: data.error ?? 'Save failed.', ok: false })
      }
    } catch {
      setPlanMsg({ id: planId, text: 'Network error.', ok: false })
    } finally {
      setSavingPlan(false)
    }
  }

  async function handleToggleVisibility(plan: PricingPlan) {
    const res = await fetch(`/api/admin/pricing/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !plan.visible }),
    })
    if (res.ok) {
      const data = await res.json()
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? data.plan : p)))
    }
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(createForm.discount_value)
    if (isNaN(val) || val <= 0) {
      setCreateMsg('Discount value must be a positive number.')
      return
    }
    setCreating(true)
    setCreateMsg('')
    try {
      const body = {
        code: createForm.code,
        label: createForm.label || undefined,
        discount_type: createForm.discount_type,
        discount_value: val,
        applies_to: createForm.applies_to,
        duration_months: createForm.duration_months ? parseInt(createForm.duration_months, 10) : undefined,
        max_redemptions: createForm.max_redemptions ? parseInt(createForm.max_redemptions, 10) : undefined,
        expires_at: createForm.expires_at || undefined,
        display_on_pricing: createForm.display_on_pricing,
      }
      const res = await fetch('/api/admin/pricing/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setCoupons((prev) => [data.coupon, ...prev])
        setShowCreateForm(false)
        setCreateForm(BLANK_FORM)
      } else {
        setCreateMsg(data.error ?? 'Failed to create discount code.')
      }
    } catch {
      setCreateMsg('Network error.')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleCoupon(coupon: PricingCoupon, field: 'active' | 'display_on_pricing') {
    const res = await fetch(`/api/admin/pricing/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !coupon[field] }),
    })
    if (res.ok) {
      const data = await res.json()
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data.coupon : c)))
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-heading text-3xl text-primary mb-1">Pricing Manager</h1>
      <p className="font-mono text-xs text-muted mb-8">
        Manage plan display prices, Stripe product links, visibility, and discount codes.
      </p>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {(['plans', 'discounts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono text-xs tracking-widest uppercase px-5 py-2.5 border-b-2 transition-colors ${
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {t === 'plans' ? 'Plans' : 'Discounts'}
          </button>
        ))}
      </div>

      {/* ── Plans Tab ─────────────────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div className="space-y-4">
          {plansLoading ? (
            <p className="font-mono text-xs text-muted animate-pulse">Loading plans...</p>
          ) : plans.length === 0 ? (
            <p className="font-mono text-xs text-muted">No plans found. Run the pricing migration SQL first.</p>
          ) : (
            plans.map((plan) => {
              const isEditing = editingPlanId === plan.id
              return (
                <div key={plan.id} className="bg-card border border-border rounded p-6">
                  {/* Plan header row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-heading text-xl text-primary">{plan.name}</span>
                      <span className="font-mono text-xs text-muted uppercase tracking-widest">{plan.plan_key}</span>
                      <span className="font-mono text-xs text-muted">{plan.pages} pages</span>
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded border ${
                          plan.visible
                            ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5'
                            : 'text-muted border-border'
                        }`}
                      >
                        {plan.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleVisibility(plan)}
                        className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:border-accent hover:text-accent transition-all"
                      >
                        {plan.visible ? 'Hide' : 'Show'}
                      </button>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSavePlan(plan.id)}
                            disabled={savingPlan}
                            className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60"
                          >
                            {savingPlan ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setEditingPlanId(null); setPlanMsg(null) }}
                            className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:border-border-light transition-all"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEditPlan(plan)}
                          className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:border-accent hover:text-accent transition-all"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Display or edit prices */}
                  {isEditing ? (
                    <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                          Upfront Fee ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={planEdits.upfront}
                          onChange={(e) =>
                            setPlanEdits((p) => ({ ...p, upfront: parseInt(e.target.value, 10) || 0 }))
                          }
                          className="form-input text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                          Monthly Price ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={planEdits.monthly}
                          onChange={(e) =>
                            setPlanEdits((p) => ({ ...p, monthly: parseInt(e.target.value, 10) || 0 }))
                          }
                          className="form-input text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                          Stripe Product ID
                        </label>
                        <input
                          type="text"
                          value={planEdits.stripe_product_id}
                          onChange={(e) =>
                            setPlanEdits((p) => ({ ...p, stripe_product_id: e.target.value }))
                          }
                          className="form-input text-sm w-full font-mono"
                          placeholder="prod_..."
                        />
                      </div>

                      {planMsg?.id === plan.id && (
                        <p
                          className={`sm:col-span-3 font-mono text-xs ${
                            planMsg.ok ? 'text-emerald-700 dark:text-accent' : 'text-red-400'
                          }`}
                        >
                          {planMsg.text}
                        </p>
                      )}

                      <p className="sm:col-span-3 font-mono text-xs text-muted">
                        {plan.stripe_product_id || planEdits.stripe_product_id
                          ? 'Price changes will create a new Stripe Price object and archive the previous one automatically.'
                          : 'No Stripe Product ID linked — price changes update the display only. Enter a Product ID (prod_...) to enable automatic Stripe price sync.'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-8">
                      <div>
                        <div className="font-mono text-xs text-muted tracking-widest uppercase mb-0.5">Upfront</div>
                        <div className="font-heading text-2xl text-primary">${plan.upfront}</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-muted tracking-widest uppercase mb-0.5">Monthly</div>
                        <div className="font-heading text-2xl text-primary">${plan.monthly}/mo</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-muted tracking-widest uppercase mb-0.5">Stripe Product</div>
                        <div className="font-mono text-xs text-teal break-all">
                          {plan.stripe_product_id ?? <span className="text-dim">Not linked</span>}
                        </div>
                        {plan.stripe_monthly_price_id && (
                          <div className="font-mono text-xs text-dim mt-0.5">
                            Monthly: {plan.stripe_monthly_price_id}
                          </div>
                        )}
                        {plan.stripe_upfront_price_id && (
                          <div className="font-mono text-xs text-dim mt-0.5">
                            Upfront: {plan.stripe_upfront_price_id}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditing && planMsg?.id === plan.id && (
                    <p
                      className={`mt-3 font-mono text-xs ${
                        planMsg.ok ? 'text-emerald-700 dark:text-accent' : 'text-red-400'
                      }`}
                    >
                      {planMsg.text}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Discounts Tab ─────────────────────────────────────────────────────── */}
      {tab === 'discounts' && (
        <div className="space-y-6">
          {!showCreateForm ? (
            <button
              onClick={() => { setShowCreateForm(true); setCreateMsg('') }}
              className="font-mono text-xs bg-accent text-black px-5 py-2.5 rounded hover:opacity-90 transition-opacity"
            >
              + New Discount Code
            </button>
          ) : (
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-heading text-xl text-primary mb-5">Create Discount Code</h2>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                      Code *
                    </label>
                    <input
                      required
                      type="text"
                      value={createForm.code}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                      }
                      className="form-input w-full font-mono"
                      placeholder="LAUNCH50"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                      Label (shown on pricing page)
                    </label>
                    <input
                      type="text"
                      value={createForm.label}
                      onChange={(e) => setCreateForm((f) => ({ ...f, label: e.target.value }))}
                      className="form-input w-full"
                      placeholder="Launch Pricing"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                      Discount Type *
                    </label>
                    <select
                      value={createForm.discount_type}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          discount_type: e.target.value as 'percent' | 'amount',
                        }))
                      }
                      className="form-input w-full"
                    >
                      <option value="percent">Percentage off</option>
                      <option value="amount">Fixed amount off ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                      {createForm.discount_type === 'percent' ? 'Percent Off (1-100) *' : 'Amount Off in $ *'}
                    </label>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={createForm.discount_type === 'percent' ? '100' : undefined}
                      value={createForm.discount_value}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, discount_value: e.target.value }))
                      }
                      className="form-input w-full"
                      placeholder={createForm.discount_type === 'percent' ? '30' : '25'}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                      Applies To
                    </label>
                    <select
                      value={createForm.applies_to}
                      onChange={(e) => setCreateForm((f) => ({ ...f, applies_to: e.target.value }))}
                      className="form-input w-full"
                    >
                      <option value="all">All Plans</option>
                      <option value="starter">Starter Only</option>
                      <option value="mid">Growth Only</option>
                      <option value="pro">Pro Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                      Duration in Months (blank = forever)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.duration_months}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, duration_months: e.target.value }))
                      }
                      className="form-input w-full"
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                      Max Redemptions (blank = unlimited)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.max_redemptions}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, max_redemptions: e.target.value }))
                      }
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
                      Expiry Date (optional)
                    </label>
                    <input
                      type="date"
                      value={createForm.expires_at}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, expires_at: e.target.value }))
                      }
                      className="form-input w-full"
                    />
                  </div>
                </div>

                {/* Display on pricing toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={createForm.display_on_pricing}
                    onClick={() =>
                      setCreateForm((f) => ({ ...f, display_on_pricing: !f.display_on_pricing }))
                    }
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                      createForm.display_on_pricing ? 'bg-accent' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        createForm.display_on_pricing ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="font-mono text-xs text-teal">
                    Show discounted price and label on the public pricing page
                  </span>
                </label>

                {createMsg && <p className="font-mono text-xs text-red-400">{createMsg}</p>}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="font-mono text-xs bg-accent text-black px-5 py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {creating ? 'Creating...' : 'Create Discount'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); setCreateMsg('') }}
                    className="font-mono text-xs border border-border text-muted px-4 py-2.5 rounded hover:border-border-light transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Coupons list */}
          {couponsLoading ? (
            <p className="font-mono text-xs text-muted animate-pulse">Loading discount codes...</p>
          ) : coupons.length === 0 ? (
            <p className="font-mono text-xs text-muted">No discount codes yet.</p>
          ) : (
            <div className="border border-border rounded overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg">
                      {['Code', 'Discount', 'Applies To', 'Duration', 'Used', 'Show on Page', 'Status'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left font-mono text-xs text-muted tracking-widest uppercase px-4 py-3 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {coupons.map((coupon) => (
                      <tr
                        key={coupon.id}
                        className={`bg-card transition-opacity ${!coupon.active ? 'opacity-40' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-primary font-medium">{coupon.code}</div>
                          {coupon.label && (
                            <div className="font-mono text-xs text-muted mt-0.5">{coupon.label}</div>
                          )}
                          {coupon.expires_at && (
                            <div className="font-mono text-xs text-dim mt-0.5">
                              Expires {new Date(coupon.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-teal whitespace-nowrap">
                          {coupon.discount_type === 'percent'
                            ? `${coupon.discount_value}% off`
                            : `$${coupon.discount_value} off`}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted capitalize">
                          {coupon.applies_to}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
                          {coupon.duration_months ? `${coupon.duration_months} mo` : 'Forever'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          {coupon.times_redeemed}
                          {coupon.max_redemptions ? `/${coupon.max_redemptions}` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={coupon.display_on_pricing}
                            onClick={() => handleToggleCoupon(coupon, 'display_on_pricing')}
                            className={`relative w-8 h-4 rounded-full transition-colors ${
                              coupon.display_on_pricing ? 'bg-accent' : 'bg-border'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                                coupon.display_on_pricing ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleCoupon(coupon, 'active')}
                            className={`font-mono text-xs px-2.5 py-1 rounded border transition-all whitespace-nowrap ${
                              coupon.active
                                ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 hover:text-red-400 hover:border-red-400/40'
                                : 'text-muted border-border hover:border-border-light'
                            }`}
                          >
                            {coupon.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
