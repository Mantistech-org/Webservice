'use client'

import { useState } from 'react'

const PLANS = [
  { id: 'platform',      label: 'Platform Only',         price: 199 },
  { id: 'platform-plus', label: 'Platform Plus Website', price: 249 },
]

const INVOICES = [
  { date: 'Apr 1, 2026', desc: 'Monthly subscription',   amount: '$199.00', status: 'Paid' },
  { date: 'Mar 1, 2026', desc: 'Monthly subscription',   amount: '$199.00', status: 'Paid' },
  { date: 'Feb 1, 2026', desc: 'Monthly subscription',   amount: '$199.00', status: 'Paid' },
  { date: 'Jan 1, 2026', desc: 'Setup + first month',    amount: '$199.00', status: 'Paid' },
]

export default function BillingPage({ darkMode }: { darkMode?: boolean }) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('platform')
  const [upgraded, setUpgraded] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  const handleUpgrade = () => {
    setUpgraded(true)
    setShowUpgrade(false)
  }

  const handlePaymentSave = () => {
    setPaymentSaved(true)
    setShowPayment(false)
    setTimeout(() => setPaymentSaved(false), 3000)
  }

  const handleCancel = () => {
    setCancelled(true)
    setShowCancel(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-[#1a1a1a]">Billing</h1>
        <p className="font-mono text-xs text-[#888888] mt-0.5">Manage your subscription and invoices</p>
      </div>

      {/* Current Plan */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
        <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">Current Plan</div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-heading text-2xl text-[#1a1a1a] mb-1">
              {upgraded && selectedPlan !== 'platform'
                ? PLANS.find(p => p.id === selectedPlan)?.label ?? 'Platform Only'
                : 'Platform Only'} Plan
            </div>
            <div className="font-mono text-xs text-[#888888]">
              ${upgraded && selectedPlan !== 'platform'
                ? PLANS.find(p => p.id === selectedPlan)?.price ?? 199
                : 199}/month, renews May 1, 2026
            </div>
          </div>
          {!cancelled && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="shrink-0 font-mono text-xs px-4 py-2 rounded transition-colors"
              style={{
                border: `1px solid ${darkMode ? '#f0f0f0' : '#1a1a1a'}`,
                color: darkMode ? '#f0f0f0' : '#1a1a1a',
              }}
            >
              Upgrade Plan
            </button>
          )}
        </div>

        {cancelled && (
          <div className="mt-4 font-mono text-xs text-red-500 border border-red-300 rounded px-3 py-2">
            Subscription cancelled. Your site will remain active through May 1, 2026.
          </div>
        )}

        {/* Upgrade panel */}
        {showUpgrade && (
          <div className="mt-4 border-t border-[#d0d0d0] pt-4 space-y-3">
            <div className="font-mono text-xs text-[#888888] mb-3">Select a new plan:</div>
            {PLANS.map(p => (
              <label key={p.id} className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${selectedPlan === p.id ? 'border-[#1a1a1a] bg-[#e0e0e0]' : 'border-[#d0d0d0] hover:border-[#aaaaaa]'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="plan" value={p.id} checked={selectedPlan === p.id} onChange={() => setSelectedPlan(p.id)} className="accent-[#1a1a1a]" />
                  <span className="font-mono text-sm text-[#1a1a1a]">{p.label}</span>
                </div>
                <span className="font-mono text-sm text-[#888888]">${p.price}/mo</span>
              </label>
            ))}
            <div className="flex gap-3 pt-1">
              <button onClick={handleUpgrade} className="font-mono text-xs bg-[#1a1a1a] text-white px-4 py-2 rounded hover:bg-[#333333] transition-colors">Confirm Upgrade</button>
              <button onClick={() => setShowUpgrade(false)} className="font-mono text-xs border border-[#d0d0d0] text-[#888888] px-4 py-2 rounded hover:border-[#aaaaaa] transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
        <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">Payment Method</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-[#d8d8d8] rounded flex items-center justify-center">
              <svg width="20" height="14" viewBox="0 0 32 22" fill="none">
                <rect width="32" height="22" rx="3" fill={darkMode ? '#3a3a3a' : '#e0e0e0'} />
                <rect x="2" y="8" width="28" height="2" fill={darkMode ? '#555555' : '#aaaaaa'} />
              </svg>
            </div>
            <span className="font-mono text-xs text-[#1a1a1a]">Visa ending in 4242</span>
            {paymentSaved && <span className="font-mono text-xs text-[#00aa55]">Saved</span>}
          </div>
          <button onClick={() => setShowPayment(!showPayment)} className="font-mono text-xs text-[#888888] hover:text-[#1a1a1a] transition-colors">
            {showPayment ? 'Cancel' : 'Update'}
          </button>
        </div>

        {showPayment && (
          <div className="mt-4 border-t border-[#d0d0d0] pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs text-[#888888] block mb-1">Card Number</label>
                <input type="text" placeholder="4242 4242 4242 4242" className="w-full bg-[#f5f5f5] border border-[#d0d0d0] rounded px-3 py-2 font-mono text-xs text-[#1a1a1a] focus:outline-none focus:border-[#888888]" />
              </div>
              <div>
                <label className="font-mono text-xs text-[#888888] block mb-1">Cardholder Name</label>
                <input type="text" placeholder="Jane Smith" className="w-full bg-[#f5f5f5] border border-[#d0d0d0] rounded px-3 py-2 font-mono text-xs text-[#1a1a1a] focus:outline-none focus:border-[#888888]" />
              </div>
              <div>
                <label className="font-mono text-xs text-[#888888] block mb-1">Expiry</label>
                <input type="text" placeholder="MM / YY" className="w-full bg-[#f5f5f5] border border-[#d0d0d0] rounded px-3 py-2 font-mono text-xs text-[#1a1a1a] focus:outline-none focus:border-[#888888]" />
              </div>
              <div>
                <label className="font-mono text-xs text-[#888888] block mb-1">CVC</label>
                <input type="text" placeholder="123" className="w-full bg-[#f5f5f5] border border-[#d0d0d0] rounded px-3 py-2 font-mono text-xs text-[#1a1a1a] focus:outline-none focus:border-[#888888]" />
              </div>
            </div>
            <button onClick={handlePaymentSave} className="font-mono text-xs bg-[#1a1a1a] text-white px-4 py-2 rounded hover:bg-[#333333] transition-colors">Save Payment Method</button>
          </div>
        )}
      </div>

      {/* Invoice History */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
        <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">Invoice History</div>
        <div className="space-y-0">
          {INVOICES.map((inv, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-[#d0d0d0] last:border-0"
            >
              <div>
                <div className="font-mono text-xs text-[#1a1a1a]">{inv.desc}</div>
                <div className="font-mono text-xs text-[#aaaaaa] mt-0.5">{inv.date}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-[#1a1a1a]">{inv.amount}</span>
                <span className="font-mono text-xs text-[#00aa55]">{inv.status}</span>
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = '#'
                    a.download = `invoice-${inv.date.replace(/\s/g, '-')}.pdf`
                    a.click()
                  }}
                  className="font-mono text-xs text-[#888888] hover:text-[#1a1a1a] underline transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel */}
      {!cancelled && (
        <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
          <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-3">Danger Zone</div>
          <p className="font-mono text-xs text-[#aaaaaa] mb-4">
            Cancelling your subscription will deactivate your site at the end of the current billing period.
          </p>
          {showCancel ? (
            <div className="space-y-3">
              <p className="font-mono text-xs text-red-500">Are you sure? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={handleCancel} className="font-mono text-xs bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">Yes, Cancel Subscription</button>
                <button onClick={() => setShowCancel(false)} className="font-mono text-xs border border-[#d0d0d0] text-[#888888] px-4 py-2 rounded hover:border-[#aaaaaa] transition-colors">Keep Subscription</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCancel(true)} className="font-mono text-xs border border-red-400 text-red-400 px-4 py-2 rounded hover:bg-red-400 hover:text-white transition-colors">
              Cancel Subscription
            </button>
          )}
        </div>
      )}
    </div>
  )
}
