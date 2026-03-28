'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

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

type CustomAddon = {
  id: string
  name: string
  client_name: string | null
  description: string
  one_time_fee: number | null
  monthly_fee: number | null
  active: boolean
  created_at: string
  updated_at: string
}

type PlanEdits = { monthly: number; upfront: number; stripe_product_id: string }

type CouponForm = {
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

type AddonForm = {
  name: string
  client_name: string
  description: string
  one_time_fee: string
  monthly_fee: string
  active: boolean
}

// ── Blank form defaults ───────────────────────────────────────────────────────

const BLANK_COUPON: CouponForm = {
  code: '', label: '', discount_type: 'percent', discount_value: '',
  applies_to: 'all', duration_months: '', max_redemptions: '', expires_at: '',
  display_on_pricing: false,
}

const BLANK_ADDON: AddonForm = {
  name: '', client_name: '', description: '', one_time_fee: '', monthly_fee: '', active: true,
}

const DESCRIPTION_PREVIEW_LENGTH = 180

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [tab, setTab] = useState<'plans' | 'addons' | 'discounts'>('plans')

  // Plans
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planEdits, setPlanEdits] = useState<PlanEdits>({ monthly: 0, upfront: 0, stripe_product_id: '' })
  const [savingPlan, setSavingPlan] = useState(false)
  const [planMsg, setPlanMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Custom Add-ons
  const [customAddons, setCustomAddons] = useState<CustomAddon[]>([])
  const [addonsLoading, setAddonsLoading] = useState(false)
  const [showAddonForm, setShowAddonForm] = useState(false)
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null)
  const [addonForm, setAddonForm] = useState<AddonForm>(BLANK_ADDON)
  const [savingAddon, setSavingAddon] = useState(false)
  const [addonFormMsg, setAddonFormMsg] = useState('')
  const [deletingAddonId, setDeletingAddonId] = useState<string | null>(null)
  const [expandedAddonIds, setExpandedAddonIds] = useState<Set<string>>(new Set())

  // Discounts
  const [coupons, setCoupons] = useState<PricingCoupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(false)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [couponForm, setCouponForm] = useState<CouponForm>(BLANK_COUPON)

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true)
    try {
      const res = await fetch('/api/admin/pricing/plans')
      if (res.ok) setPlans((await res.json()).plans ?? [])
    } finally {
      setPlansLoading(false)
    }
  }, [])

  const fetchAddons = useCallback(async () => {
    setAddonsLoading(true)
    try {
      const res = await fetch('/api/admin/pricing/custom-addons')
      if (res.ok) setCustomAddons((await res.json()).addons ?? [])
    } finally {
      setAddonsLoading(false)
    }
  }, [])

  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true)
    try {
      const res = await fetch('/api/admin/pricing/coupons')
      if (res.ok) setCoupons((await res.json()).coupons ?? [])
    } finally {
      setCouponsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])
  useEffect(() => { if (tab === 'addons') fetchAddons() }, [tab, fetchAddons])
  useEffect(() => { if (tab === 'discounts') fetchCoupons() }, [tab, fetchCoupons])

  // ── Plans handlers ──────────────────────────────────────────────────────────

  function startEditPlan(plan: PricingPlan) {
    setEditingPlanId(plan.id)
    setPlanEdits({ monthly: plan.monthly, upfront: plan.upfront, stripe_product_id: plan.stripe_product_id ?? '' })
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

  async function handleSyncFromStripe() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/admin/pricing/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const { synced, results, message } = data as {
          synced: number
          results: { plan_key: string; name: string; action: string }[]
          message?: string
        }
        if (synced === 0) {
          setSyncMsg({ text: message ?? 'No products found in Stripe.', ok: false })
        } else {
          const inserted = results.filter((r) => r.action === 'inserted').length
          const updated = results.filter((r) => r.action === 'updated').length
          const parts: string[] = []
          if (inserted > 0) parts.push(`${inserted} added`)
          if (updated > 0) parts.push(`${updated} updated`)
          setSyncMsg({ text: `Sync complete — ${parts.join(', ')}.`, ok: true })
          await fetchPlans()
        }
      } else {
        setSyncMsg({ text: data.error ?? 'Sync failed.', ok: false })
      }
    } catch {
      setSyncMsg({ text: 'Network error.', ok: false })
    } finally {
      setSyncing(false)
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

  // ── Custom Add-ons handlers ─────────────────────────────────────────────────

  function startCreateAddon() {
    setEditingAddonId(null)
    setAddonForm(BLANK_ADDON)
    setAddonFormMsg('')
    setShowAddonForm(true)
  }

  function startEditAddon(addon: CustomAddon) {
    setShowAddonForm(false)
    setEditingAddonId(addon.id)
    setAddonForm({
      name: addon.name,
      client_name: addon.client_name ?? '',
      description: addon.description,
      one_time_fee: addon.one_time_fee != null ? String(addon.one_time_fee) : '',
      monthly_fee: addon.monthly_fee != null ? String(addon.monthly_fee) : '',
      active: addon.active,
    })
    setAddonFormMsg('')
  }

  function cancelAddonEdit() {
    setShowAddonForm(false)
    setEditingAddonId(null)
    setAddonForm(BLANK_ADDON)
    setAddonFormMsg('')
  }

  async function handleSaveAddon(e: React.FormEvent, addonId?: string) {
    e.preventDefault()
    if (!addonForm.name.trim()) {
      setAddonFormMsg('Name is required.')
      return
    }
    setSavingAddon(true)
    setAddonFormMsg('')
    const payload = {
      name: addonForm.name.trim(),
      client_name: addonForm.client_name.trim() || null,
      description: addonForm.description.trim(),
      one_time_fee: addonForm.one_time_fee ? parseFloat(addonForm.one_time_fee) : null,
      monthly_fee: addonForm.monthly_fee ? parseFloat(addonForm.monthly_fee) : null,
      active: addonForm.active,
    }
    try {
      const url = addonId
        ? `/api/admin/pricing/custom-addons/${addonId}`
        : '/api/admin/pricing/custom-addons'
      const res = await fetch(url, {
        method: addonId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        if (addonId) {
          setCustomAddons((prev) => prev.map((a) => (a.id === addonId ? data.addon : a)))
          setEditingAddonId(null)
        } else {
          setCustomAddons((prev) => [data.addon, ...prev])
          setShowAddonForm(false)
        }
        setAddonForm(BLANK_ADDON)
      } else {
        setAddonFormMsg(data.error ?? 'Save failed.')
      }
    } catch {
      setAddonFormMsg('Network error.')
    } finally {
      setSavingAddon(false)
    }
  }

  async function handleToggleAddonActive(addon: CustomAddon) {
    const res = await fetch(`/api/admin/pricing/custom-addons/${addon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !addon.active }),
    })
    if (res.ok) {
      const data = await res.json()
      setCustomAddons((prev) => prev.map((a) => (a.id === addon.id ? data.addon : a)))
    }
  }

  async function handleDeleteAddon(addonId: string) {
    setDeletingAddonId(addonId)
    try {
      const res = await fetch(`/api/admin/pricing/custom-addons/${addonId}`, { method: 'DELETE' })
      if (res.ok) {
        setCustomAddons((prev) => prev.filter((a) => a.id !== addonId))
        if (editingAddonId === addonId) cancelAddonEdit()
      }
    } finally {
      setDeletingAddonId(null)
    }
  }

  function toggleExpandDescription(addonId: string) {
    setExpandedAddonIds((prev) => {
      const next = new Set(prev)
      if (next.has(addonId)) next.delete(addonId)
      else next.add(addonId)
      return next
    })
  }

  // ── Coupons handlers ────────────────────────────────────────────────────────

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(couponForm.discount_value)
    if (isNaN(val) || val <= 0) { setCreateMsg('Discount value must be a positive number.'); return }
    setCreating(true)
    setCreateMsg('')
    try {
      const body = {
        code: couponForm.code,
        label: couponForm.label || undefined,
        discount_type: couponForm.discount_type,
        discount_value: val,
        applies_to: couponForm.applies_to,
        duration_months: couponForm.duration_months ? parseInt(couponForm.duration_months, 10) : undefined,
        max_redemptions: couponForm.max_redemptions ? parseInt(couponForm.max_redemptions, 10) : undefined,
        expires_at: couponForm.expires_at || undefined,
        display_on_pricing: couponForm.display_on_pricing,
      }
      const res = await fetch('/api/admin/pricing/coupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setCoupons((prev) => [data.coupon, ...prev])
        setShowCouponForm(false)
        setCouponForm(BLANK_COUPON)
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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !coupon[field] }),
    })
    if (res.ok) {
      const data = await res.json()
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data.coupon : c)))
    }
  }

  // ── Shared form field label ─────────────────────────────────────────────────

  const L = ({ children }: { children: React.ReactNode }) => (
    <span className="font-mono text-xs text-muted tracking-widest uppercase block mb-1.5">
      {children}
    </span>
  )

  // ── Addon form (shared between create and inline edit) ──────────────────────

  function AddonFormFields({
    form,
    setForm,
    onSubmit,
    onCancel,
    saving,
    msg,
    isEdit,
  }: {
    form: AddonForm
    setForm: React.Dispatch<React.SetStateAction<AddonForm>>
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
    saving: boolean
    msg: string
    isEdit: boolean
  }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <L>Add-on Name *</L>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="form-input w-full"
              placeholder="Custom Inventory System"
            />
          </div>
          <div>
            <L>Client / Business Name (optional)</L>
            <input
              type="text"
              value={form.client_name}
              onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
              className="form-input w-full"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <L>One-Time Fee ($, optional)</L>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.one_time_fee}
              onChange={(e) => setForm((f) => ({ ...f, one_time_fee: e.target.value }))}
              className="form-input w-full"
              placeholder="500"
            />
          </div>
          <div>
            <L>Monthly Fee ($, optional)</L>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_fee}
              onChange={(e) => setForm((f) => ({ ...f, monthly_fee: e.target.value }))}
              className="form-input w-full"
              placeholder="75"
            />
          </div>
        </div>

        <div>
          <L>Description</L>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="form-input w-full resize-y text-sm"
            placeholder="Describe exactly what this add-on includes, how it works, and any relevant details..."
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={form.active}
            onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
            className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${form.active ? 'bg-accent' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
          <span className="font-mono text-xs text-teal">Active</span>
        </label>

        {msg && <p className="font-mono text-xs text-red-400">{msg}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="font-mono text-xs bg-accent text-black px-5 py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Add-on'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="font-mono text-xs border border-border text-muted px-4 py-2.5 rounded hover:border-border-light transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-heading text-3xl text-primary mb-1">Pricing Manager</h1>
      <p className="font-mono text-xs text-muted mb-8">
        Manage plan prices, Stripe product links, custom add-ons, and discount codes.
      </p>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {([
          { key: 'plans', label: 'Plans' },
          { key: 'addons', label: 'Add-ons' },
          { key: 'discounts', label: 'Discounts' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`font-mono text-xs tracking-widest uppercase px-5 py-2.5 border-b-2 transition-colors ${
              tab === key
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Plans Tab ─────────────────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSyncFromStripe}
              disabled={syncing || plansLoading}
              className="font-mono text-xs border border-border px-4 py-2 rounded text-muted hover:border-accent hover:text-accent transition-all disabled:opacity-60 flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={syncing ? 'animate-spin' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              {syncing ? 'Syncing from Stripe...' : 'Sync from Stripe'}
            </button>
            {syncMsg && (
              <span className={`font-mono text-xs ${syncMsg.ok ? 'text-emerald-700 dark:text-accent' : 'text-red-400'}`}>
                {syncMsg.text}
              </span>
            )}
          </div>

          {plansLoading ? (
            <p className="font-mono text-xs text-muted animate-pulse">Loading plans...</p>
          ) : plans.length === 0 ? (
            <div className="bg-card border border-border rounded p-8 text-center">
              <p className="font-mono text-xs text-muted mb-2">No plans found.</p>
              <p className="font-mono text-xs text-dim">
                Click &ldquo;Sync from Stripe&rdquo; to import all active products and their prices automatically.
              </p>
            </div>
          ) : (
            plans.map((plan) => {
              const isEditing = editingPlanId === plan.id
              return (
                <div key={plan.id} className="bg-card border border-border rounded p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-heading text-xl text-primary">{plan.name}</span>
                      <span className="font-mono text-xs text-muted uppercase tracking-widest">{plan.plan_key}</span>
                      <span className="font-mono text-xs text-muted">{plan.pages} pages</span>
                      <span className={`font-mono text-xs px-2 py-0.5 rounded border ${
                        plan.visible
                          ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5'
                          : 'text-muted border-border'
                      }`}>
                        {plan.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggleVisibility(plan)}
                        className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:border-accent hover:text-accent transition-all">
                        {plan.visible ? 'Hide' : 'Show'}
                      </button>
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSavePlan(plan.id)} disabled={savingPlan}
                            className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60">
                            {savingPlan ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => { setEditingPlanId(null); setPlanMsg(null) }}
                            className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:border-border-light transition-all">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startEditPlan(plan)}
                          className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:border-accent hover:text-accent transition-all">
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <L>Upfront Fee ($)</L>
                        <input type="number" min="0" value={planEdits.upfront}
                          onChange={(e) => setPlanEdits((p) => ({ ...p, upfront: parseInt(e.target.value, 10) || 0 }))}
                          className="form-input text-sm w-full" />
                      </div>
                      <div>
                        <L>Monthly Price ($)</L>
                        <input type="number" min="0" value={planEdits.monthly}
                          onChange={(e) => setPlanEdits((p) => ({ ...p, monthly: parseInt(e.target.value, 10) || 0 }))}
                          className="form-input text-sm w-full" />
                      </div>
                      <div>
                        <L>Stripe Product ID</L>
                        <input type="text" value={planEdits.stripe_product_id}
                          onChange={(e) => setPlanEdits((p) => ({ ...p, stripe_product_id: e.target.value }))}
                          className="form-input text-sm w-full font-mono" placeholder="prod_..." />
                      </div>
                      {planMsg?.id === plan.id && (
                        <p className={`sm:col-span-3 font-mono text-xs ${planMsg.ok ? 'text-emerald-700 dark:text-accent' : 'text-red-400'}`}>
                          {planMsg.text}
                        </p>
                      )}
                      <p className="sm:col-span-3 font-mono text-xs text-muted">
                        {plan.stripe_product_id || planEdits.stripe_product_id
                          ? 'Price changes will create a new Stripe Price object and archive the previous one automatically.'
                          : 'No Stripe Product ID linked — price changes update the display only.'}
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
                          <div className="font-mono text-xs text-dim mt-0.5">Monthly: {plan.stripe_monthly_price_id}</div>
                        )}
                        {plan.stripe_upfront_price_id && (
                          <div className="font-mono text-xs text-dim mt-0.5">Upfront: {plan.stripe_upfront_price_id}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditing && planMsg?.id === plan.id && (
                    <p className={`mt-3 font-mono text-xs ${planMsg.ok ? 'text-emerald-700 dark:text-accent' : 'text-red-400'}`}>
                      {planMsg.text}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Add-ons Tab ───────────────────────────────────────────────────────── */}
      {tab === 'addons' && (
        <div className="space-y-6">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl text-primary">Custom Add-ons</h2>
              <p className="font-mono text-xs text-muted mt-0.5">
                Bespoke services created manually, optionally tied to a specific client.
              </p>
            </div>
            {!showAddonForm && editingAddonId === null && (
              <button
                onClick={startCreateAddon}
                className="font-mono text-xs bg-accent text-black px-5 py-2.5 rounded hover:opacity-90 transition-opacity shrink-0"
              >
                + New Add-on
              </button>
            )}
          </div>

          {/* Create form */}
          {showAddonForm && (
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-heading text-lg text-primary mb-5">New Custom Add-on</h3>
              <AddonFormFields
                form={addonForm}
                setForm={setAddonForm}
                onSubmit={(e) => handleSaveAddon(e)}
                onCancel={cancelAddonEdit}
                saving={savingAddon}
                msg={addonFormMsg}
                isEdit={false}
              />
            </div>
          )}

          {/* Add-ons list */}
          {addonsLoading ? (
            <p className="font-mono text-xs text-muted animate-pulse">Loading add-ons...</p>
          ) : customAddons.length === 0 && !showAddonForm ? (
            <div className="bg-card border border-border rounded p-8 text-center">
              <p className="font-mono text-xs text-muted mb-2">No custom add-ons yet.</p>
              <p className="font-mono text-xs text-dim">
                Create add-ons for bespoke services offered to specific clients or as generic upgrades.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customAddons.map((addon) => {
                const isEditing = editingAddonId === addon.id
                const isExpanded = expandedAddonIds.has(addon.id)
                const needsTruncation = addon.description.length > DESCRIPTION_PREVIEW_LENGTH
                const displayDescription = needsTruncation && !isExpanded
                  ? addon.description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd() + '...'
                  : addon.description

                return (
                  <div
                    key={addon.id}
                    className={`bg-card border border-border rounded p-6 transition-opacity ${!addon.active ? 'opacity-60' : ''}`}
                  >
                    {isEditing ? (
                      <>
                        <h3 className="font-heading text-lg text-primary mb-5">Edit Add-on</h3>
                        <AddonFormFields
                          form={addonForm}
                          setForm={setAddonForm}
                          onSubmit={(e) => handleSaveAddon(e, addon.id)}
                          onCancel={cancelAddonEdit}
                          saving={savingAddon}
                          msg={addonFormMsg}
                          isEdit
                        />
                      </>
                    ) : (
                      <>
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0">
                            <div className="font-heading text-lg text-primary leading-snug">
                              {addon.name}
                              {addon.client_name && (
                                <span className="text-muted font-mono text-sm font-normal">
                                  {' '}&mdash; {addon.client_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Active toggle */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={addon.active}
                              onClick={() => handleToggleAddonActive(addon)}
                              className={`font-mono text-xs px-2.5 py-1 rounded border transition-all ${
                                addon.active
                                  ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 hover:text-red-400 hover:border-red-400/40'
                                  : 'text-muted border-border hover:border-border-light'
                              }`}
                            >
                              {addon.active ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => startEditAddon(addon)}
                              className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:border-accent hover:text-accent transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddon(addon.id)}
                              disabled={deletingAddonId === addon.id}
                              className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:border-red-400 hover:text-red-400 transition-all disabled:opacity-60"
                            >
                              {deletingAddonId === addon.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>

                        {/* Fees */}
                        {(addon.one_time_fee != null || addon.monthly_fee != null) && (
                          <div className="flex gap-6 mb-3">
                            {addon.one_time_fee != null && (
                              <div>
                                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-0.5">One-Time</div>
                                <div className="font-heading text-lg text-primary">${addon.one_time_fee}</div>
                              </div>
                            )}
                            {addon.monthly_fee != null && (
                              <div>
                                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-0.5">Monthly</div>
                                <div className="font-heading text-lg text-primary">${addon.monthly_fee}/mo</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Description */}
                        {addon.description && (
                          <div>
                            <p className="text-sm text-teal leading-relaxed whitespace-pre-wrap">
                              {displayDescription}
                            </p>
                            {needsTruncation && (
                              <button
                                onClick={() => toggleExpandDescription(addon.id)}
                                className="font-mono text-xs text-accent hover:underline mt-1"
                              >
                                {isExpanded ? 'View less' : 'View more'}
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Discounts Tab ─────────────────────────────────────────────────────── */}
      {tab === 'discounts' && (
        <div className="space-y-6">
          {!showCouponForm ? (
            <button
              onClick={() => { setShowCouponForm(true); setCreateMsg('') }}
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
                    <L>Code *</L>
                    <input required type="text" value={couponForm.code}
                      onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      className="form-input w-full font-mono" placeholder="LAUNCH50" />
                  </div>
                  <div>
                    <L>Label (shown on pricing page)</L>
                    <input type="text" value={couponForm.label}
                      onChange={(e) => setCouponForm((f) => ({ ...f, label: e.target.value }))}
                      className="form-input w-full" placeholder="Launch Pricing" />
                  </div>
                  <div>
                    <L>Discount Type *</L>
                    <select value={couponForm.discount_type}
                      onChange={(e) => setCouponForm((f) => ({ ...f, discount_type: e.target.value as 'percent' | 'amount' }))}
                      className="form-input w-full">
                      <option value="percent">Percentage off</option>
                      <option value="amount">Fixed amount off ($)</option>
                    </select>
                  </div>
                  <div>
                    <L>{couponForm.discount_type === 'percent' ? 'Percent Off (1-100) *' : 'Amount Off in $ *'}</L>
                    <input required type="number" min="0.01" step="0.01"
                      max={couponForm.discount_type === 'percent' ? '100' : undefined}
                      value={couponForm.discount_value}
                      onChange={(e) => setCouponForm((f) => ({ ...f, discount_value: e.target.value }))}
                      className="form-input w-full"
                      placeholder={couponForm.discount_type === 'percent' ? '30' : '25'} />
                  </div>
                  <div>
                    <L>Applies To</L>
                    <select value={couponForm.applies_to}
                      onChange={(e) => setCouponForm((f) => ({ ...f, applies_to: e.target.value }))}
                      className="form-input w-full">
                      <option value="all">All Plans</option>
                      <option value="starter">Starter Only</option>
                      <option value="mid">Growth Only</option>
                      <option value="pro">Pro Only</option>
                    </select>
                  </div>
                  <div>
                    <L>Duration in Months (blank = forever)</L>
                    <input type="number" min="1" value={couponForm.duration_months}
                      onChange={(e) => setCouponForm((f) => ({ ...f, duration_months: e.target.value }))}
                      className="form-input w-full" placeholder="3" />
                  </div>
                  <div>
                    <L>Max Redemptions (blank = unlimited)</L>
                    <input type="number" min="1" value={couponForm.max_redemptions}
                      onChange={(e) => setCouponForm((f) => ({ ...f, max_redemptions: e.target.value }))}
                      className="form-input w-full" />
                  </div>
                  <div>
                    <L>Expiry Date (optional)</L>
                    <input type="date" value={couponForm.expires_at}
                      onChange={(e) => setCouponForm((f) => ({ ...f, expires_at: e.target.value }))}
                      className="form-input w-full" />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <button type="button" role="switch" aria-checked={couponForm.display_on_pricing}
                    onClick={() => setCouponForm((f) => ({ ...f, display_on_pricing: !f.display_on_pricing }))}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${couponForm.display_on_pricing ? 'bg-accent' : 'bg-border'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${couponForm.display_on_pricing ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="font-mono text-xs text-teal">Show discounted price and label on the public pricing page</span>
                </label>

                {createMsg && <p className="font-mono text-xs text-red-400">{createMsg}</p>}

                <div className="flex gap-3">
                  <button type="submit" disabled={creating}
                    className="font-mono text-xs bg-accent text-black px-5 py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60">
                    {creating ? 'Creating...' : 'Create Discount'}
                  </button>
                  <button type="button" onClick={() => { setShowCouponForm(false); setCreateMsg('') }}
                    className="font-mono text-xs border border-border text-muted px-4 py-2.5 rounded hover:border-border-light transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

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
                      {['Code', 'Discount', 'Applies To', 'Duration', 'Used', 'Show on Page', 'Status'].map((h) => (
                        <th key={h} className="text-left font-mono text-xs text-muted tracking-widest uppercase px-4 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className={`bg-card transition-opacity ${!coupon.active ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-primary font-medium">{coupon.code}</div>
                          {coupon.label && <div className="font-mono text-xs text-muted mt-0.5">{coupon.label}</div>}
                          {coupon.expires_at && (
                            <div className="font-mono text-xs text-dim mt-0.5">
                              Expires {new Date(coupon.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-teal whitespace-nowrap">
                          {coupon.discount_type === 'percent' ? `${coupon.discount_value}% off` : `$${coupon.discount_value} off`}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted capitalize">{coupon.applies_to}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
                          {coupon.duration_months ? `${coupon.duration_months} mo` : 'Forever'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          {coupon.times_redeemed}{coupon.max_redemptions ? `/${coupon.max_redemptions}` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" role="switch" aria-checked={coupon.display_on_pricing}
                            onClick={() => handleToggleCoupon(coupon, 'display_on_pricing')}
                            className={`relative w-8 h-4 rounded-full transition-colors ${coupon.display_on_pricing ? 'bg-accent' : 'bg-border'}`}>
                            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${coupon.display_on_pricing ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleCoupon(coupon, 'active')}
                            className={`font-mono text-xs px-2.5 py-1 rounded border transition-all whitespace-nowrap ${
                              coupon.active
                                ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 hover:text-red-400 hover:border-red-400/40'
                                : 'text-muted border-border hover:border-border-light'
                            }`}>
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
