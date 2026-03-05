const INVOICES = [
  { date: 'Mar 1, 2026', desc: 'Monthly subscription', amount: '$149.00', status: 'Paid' },
  { date: 'Feb 1, 2026', desc: 'Monthly subscription', amount: '$149.00', status: 'Paid' },
  { date: 'Jan 1, 2026', desc: 'Monthly subscription', amount: '$149.00', status: 'Paid' },
  { date: 'Dec 1, 2025', desc: 'Setup fee + first month', amount: '$649.00', status: 'Paid' },
]

export default function BillingPage() {
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
            <div className="font-heading text-2xl text-[#1a1a1a] mb-1">Mid Plan</div>
            <div className="font-mono text-xs text-[#888888]">$149/month, renews April 1, 2026</div>
          </div>
          <button className="shrink-0 font-mono text-xs border border-[#1a1a1a] text-[#1a1a1a] px-4 py-2 rounded hover:bg-[#1a1a1a] hover:text-white transition-colors">
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
        <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">Payment Method</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-[#d8d8d8] rounded flex items-center justify-center">
              <svg width="20" height="14" viewBox="0 0 32 22" fill="none">
                <rect width="32" height="22" rx="3" fill="#e0e0e0" />
                <rect x="2" y="8" width="28" height="2" fill="#aaaaaa" />
              </svg>
            </div>
            <span className="font-mono text-xs text-[#1a1a1a]">Visa ending in 4242</span>
          </div>
          <button className="font-mono text-xs text-[#888888] hover:text-[#1a1a1a] transition-colors">
            Update
          </button>
        </div>
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
        <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-3">Danger Zone</div>
        <p className="font-mono text-xs text-[#aaaaaa] mb-4">
          Cancelling your subscription will deactivate your site at the end of the current billing period.
        </p>
        <button className="font-mono text-xs border border-red-400 text-red-400 px-4 py-2 rounded hover:bg-red-400 hover:text-white transition-colors">
          Cancel Subscription
        </button>
      </div>
    </div>
  )
}
