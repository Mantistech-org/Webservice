'use client'

import { useState } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

type ReferralStatus = 'pending' | 'converted' | 'expired'

interface Referral {
  id: number
  name: string
  email: string
  referredBy: string
  date: string
  status: ReferralStatus
  reward: string
}

const FAKE_REFERRALS: Referral[] = [
  { id: 1,  name: 'Sandra M.',   email: 'sandra.m@email.com',  referredBy: 'James T.',    date: 'Mar 25', status: 'converted', reward: '$20 credit'   },
  { id: 2,  name: 'Kevin R.',    email: 'kevin.r@email.com',   referredBy: 'Rachel K.',   date: 'Mar 23', status: 'converted', reward: '$20 credit'   },
  { id: 3,  name: 'Olivia P.',   email: 'olivia.p@email.com',  referredBy: 'Tom W.',      date: 'Mar 21', status: 'pending',   reward: 'Pending'      },
  { id: 4,  name: 'Derek S.',    email: 'derek.s@email.com',   referredBy: 'Lisa H.',     date: 'Mar 19', status: 'converted', reward: '$20 credit'   },
  { id: 5,  name: 'Monica L.',   email: 'monica.l@email.com',  referredBy: 'Carlos V.',   date: 'Mar 18', status: 'pending',   reward: 'Pending'      },
  { id: 6,  name: 'Brian Y.',    email: 'brian.y@email.com',   referredBy: 'Tom W.',      date: 'Mar 16', status: 'converted', reward: '$20 credit'   },
  { id: 7,  name: 'Heather C.',  email: 'heather.c@email.com', referredBy: 'James T.',    date: 'Mar 14', status: 'pending',   reward: 'Pending'      },
  { id: 8,  name: 'Paul N.',     email: 'paul.n@email.com',    referredBy: 'Amy F.',      date: 'Mar 12', status: 'converted', reward: '$20 credit'   },
  { id: 9,  name: 'Christine B.',email: 'christine.b@email.com',referredBy: 'Mike R.',    date: 'Mar 10', status: 'expired',   reward: 'Expired'      },
  { id: 10, name: 'Wayne H.',    email: 'wayne.h@email.com',   referredBy: 'Rachel K.',   date: 'Mar 8',  status: 'converted', reward: '$20 credit'   },
]

const STATUS_STYLE: Record<ReferralStatus, { color: string; label: string }> = {
  converted: { color: '#00aa55', label: 'Converted'  },
  pending:   { color: '#f59e0b', label: 'Pending'    },
  expired:   { color: '#888888', label: 'Expired'    },
}

const REWARD_OPTIONS = [
  '$10 account credit',
  '$20 account credit',
  '$25 account credit',
  '10% off next service',
  '15% off next service',
  'Free add-on service',
]

const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

export default function CustomReferralSystem({ sessionId, darkMode }: Props) {
  const [filter, setFilter] = useState<'all' | ReferralStatus>('all')
  const [reward, setReward] = useState('$20 account credit')
  const [rewardSaved, setRewardSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [programName, setProgramName] = useState('Refer a Friend')
  const [programDesc, setProgramDesc] = useState('Share your referral link and earn a reward every time a friend makes their first purchase.')

  const referralLink = 'mantistech.io/ref/demo-business'

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setRewardSaved(true)
    setTimeout(() => setRewardSaved(false), 3000)
  }

  const converted    = FAKE_REFERRALS.filter((r) => r.status === 'converted')
  const pending      = FAKE_REFERRALS.filter((r) => r.status === 'pending')
  const rewardsEarned = converted.length * 20

  const filtered = filter === 'all' ? FAKE_REFERRALS : FAKE_REFERRALS.filter((r) => r.status === filter)

  const topReferrers = Array.from(
    FAKE_REFERRALS.reduce((acc, r) => {
      acc.set(r.referredBy, (acc.get(r.referredBy) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals',  value: FAKE_REFERRALS.length.toString() },
          { label: 'Conversions',      value: converted.length.toString()       },
          { label: 'Pending',          value: pending.length.toString()         },
          { label: 'Rewards Earned',   value: `$${rewardsEarned}`               },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded px-5 py-4">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{s.label}</div>
            <div className="font-heading text-2xl text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Your Referral Link</p>
          <h2 className="font-heading text-2xl text-primary">Share This Link</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#efefef] border border-[#d0d0d0] rounded px-4 py-3 font-mono text-sm text-[#1a1a1a] select-all overflow-hidden truncate">
              {referralLink}
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="font-mono text-sm px-5 py-3 rounded tracking-wider transition-opacity hover:opacity-80 shrink-0"
              style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
            >
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
          <p className="font-mono text-xs text-muted mt-3">
            Customers who click this link and complete a purchase are automatically tracked and credited to the referring customer.
          </p>
        </div>
      </div>

      {/* Top referrers */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Leaderboard</p>
          <h2 className="font-heading text-2xl text-primary">Top Referrers</h2>
        </div>
        <div className="p-6 space-y-3">
          {topReferrers.map(([name, count], i) => (
            <div key={name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-muted w-4">{i + 1}.</span>
                <span className="font-mono text-sm text-primary">{name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 rounded-full bg-[#efefef] overflow-hidden" style={{ width: 120 }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(count / topReferrers[0][1]) * 100}%`, backgroundColor: '#00aa55' }}
                  />
                </div>
                <span className="font-mono text-sm text-muted w-20 text-right">{count} referral{count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral list */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Referred Customers</p>
            <h2 className="font-heading text-2xl text-primary">All Referrals</h2>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'converted', 'pending', 'expired'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="font-mono text-xs px-3 py-1.5 rounded border transition-colors capitalize"
                style={filter === f
                  ? { borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5512' }
                  : { borderColor: '#d0d0d0', color: '#888888', backgroundColor: 'transparent' }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Name</th>
                  <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Referred By</th>
                  <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Date</th>
                  <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Status</th>
                  <th className="text-left py-2 font-mono text-xs text-muted tracking-widest uppercase">Reward</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-mono text-sm text-primary">{r.name}</div>
                      <div className="font-mono text-xs text-muted">{r.email}</div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm text-muted">{r.referredBy}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-muted">{r.date}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded border"
                        style={{ color: STATUS_STYLE[r.status].color, borderColor: `${STATUS_STYLE[r.status].color}30`, backgroundColor: `${STATUS_STYLE[r.status].color}08` }}
                      >
                        {STATUS_STYLE[r.status].label}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-sm" style={{ color: r.status === 'converted' ? '#00aa55' : '#888888' }}>
                      {r.status === 'converted' ? reward.replace('account ', '') : r.reward}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Program Settings</p>
          <h2 className="font-heading text-2xl text-primary">Customize Your Program</h2>
        </div>
        <div className="p-6">
          {rewardSaved && (
            <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
              Settings saved successfully.
            </div>
          )}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Program Name</label>
              <input
                type="text"
                className={inputClass}
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g. Refer a Friend"
              />
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Reward for Referrer</label>
              <select
                className={inputClass}
                value={reward}
                onChange={(e) => setReward(e.target.value)}
              >
                {REWARD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Program Description</label>
              <textarea
                className={inputClass + ' resize-none'}
                rows={3}
                value={programDesc}
                onChange={(e) => setProgramDesc(e.target.value)}
                placeholder="Describe your referral program to customers..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="font-mono text-xs text-dim text-center">
        The full version generates unique links per customer, tracks conversions automatically, and issues rewards without any manual work.
      </p>
    </div>
  )
}
