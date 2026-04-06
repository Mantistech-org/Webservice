'use client'

import { useState, useRef, useEffect } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

type ActiveTab = 'overview' | 'link' | 'sharing' | 'settings'
type ReferralStatus = 'pending' | 'clicked' | 'signed_up' | 'reward_sent'

interface Referral {
  id: number
  name: string
  email: string
  referredBy: string
  date: string
  status: ReferralStatus
}

const FAKE_REFERRALS: Referral[] = [
  { id: 1,  name: 'Sandra M.',    email: 'sandra.m@email.com',   referredBy: 'James T.',   date: 'Mar 25', status: 'reward_sent' },
  { id: 2,  name: 'Kevin R.',     email: 'kevin.r@email.com',    referredBy: 'Rachel K.',  date: 'Mar 23', status: 'reward_sent' },
  { id: 3,  name: 'Olivia P.',    email: 'olivia.p@email.com',   referredBy: 'Tom W.',     date: 'Mar 21', status: 'signed_up'   },
  { id: 4,  name: 'Derek S.',     email: 'derek.s@email.com',    referredBy: 'Lisa H.',    date: 'Mar 19', status: 'reward_sent' },
  { id: 5,  name: 'Monica L.',    email: 'monica.l@email.com',   referredBy: 'Carlos V.',  date: 'Mar 18', status: 'clicked'     },
  { id: 6,  name: 'Brian Y.',     email: 'brian.y@email.com',    referredBy: 'Tom W.',     date: 'Mar 16', status: 'reward_sent' },
  { id: 7,  name: 'Heather C.',   email: 'heather.c@email.com',  referredBy: 'James T.',   date: 'Mar 14', status: 'pending'     },
  { id: 8,  name: 'Paul N.',      email: 'paul.n@email.com',     referredBy: 'Amy F.',     date: 'Mar 12', status: 'reward_sent' },
  { id: 9,  name: 'Christine B.', email: 'christine.b@email.com',referredBy: 'Mike R.',    date: 'Mar 10', status: 'clicked'     },
  { id: 10, name: 'Wayne H.',     email: 'wayne.h@email.com',    referredBy: 'Rachel K.',  date: 'Mar 8',  status: 'reward_sent' },
  { id: 11, name: 'Diane F.',     email: 'diane.f@email.com',    referredBy: 'Tom W.',     date: 'Mar 6',  status: 'signed_up'   },
  { id: 12, name: 'Eric T.',      email: 'eric.t@email.com',     referredBy: 'Lisa H.',    date: 'Mar 4',  status: 'pending'     },
]

const STATUS_STYLE: Record<ReferralStatus, { color: string; label: string }> = {
  pending:     { color: '#888888', label: 'Pending'     },
  clicked:     { color: '#007bff', label: 'Clicked'     },
  signed_up:   { color: '#f59e0b', label: 'Signed Up'   },
  reward_sent: { color: '#00aa55', label: 'Reward Sent' },
}

const REWARD_TYPES = ['Percentage discount', 'Fixed dollar amount', 'Free service month', 'Custom text']

const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

// Deterministic QR-like grid from a string
function buildQRGrid(str: string): boolean[][] {
  const size = 25
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  // Finder pattern helper
  const finder = (rOff: number, cOff: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        grid[r + rOff][c + cOff] = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      }
    }
  }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0)
  // Timing strips
  for (let i = 8; i < size - 8; i++) { grid[6][i] = i % 2 === 0; grid[i][6] = i % 2 === 0 }
  // Hash-seeded data
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0 }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r < 9 && c < 9) || (r < 9 && c >= size - 8) || (r >= size - 8 && c < 9)) continue
      if (r === 6 || c === 6) continue
      const seed = ((r * size + c) ^ h) * 2654435761
      grid[r][c] = ((seed >>> 0) % 3) !== 0
    }
  }
  return grid
}

function QRCode({ value, size = 180 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grid = buildQRGrid(value)
  const cell = size / grid.length

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#1a1a1a'
    grid.forEach((row, r) => row.forEach((on, c) => { if (on) ctx.fillRect(c * cell, r * cell, cell, cell) }))
  }, [value, size]) // eslint-disable-line react-hooks/exhaustive-deps

  const downloadPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'referral-qr-code.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={size} height={size} className="border border-[#d0d0d0] rounded" style={{ imageRendering: 'pixelated' }} />
      <button type="button" onClick={downloadPNG} className="font-mono text-sm px-5 py-2 rounded tracking-wider border transition-colors" style={{ borderColor: '#d0d0d0', color: '#333333' }}>
        Download PNG
      </button>
    </div>
  )
}

export default function CustomReferralSystem({ sessionId, darkMode }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  // Link
  const referralLink = 'mantistech.io/ref/demo-business'
  const [copied, setCopied] = useState(false)

  // Settings
  const [rewardType, setRewardType]         = useState('Fixed dollar amount')
  const [rewardAmount, setRewardAmount]     = useState('20')
  const [customRewardText, setCustomRewardText] = useState('')
  const [referredMessage, setReferredMessage] = useState("Hi [Name], a friend referred you to us and we want to make sure your first experience is great. As a welcome, you'll receive [Reward] on your first visit.")
  const [settingsSaved, setSettingsSaved]   = useState(false)

  // Sharing
  const [copiedShare, setCopiedShare] = useState<string | null>(null)

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyShare = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedShare(key)
    setTimeout(() => setCopiedShare(null), 2000)
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 3000)
  }

  const rewardLabel = rewardType === 'Percentage discount'
    ? `${rewardAmount}% off`
    : rewardType === 'Fixed dollar amount'
    ? `$${rewardAmount} credit`
    : rewardType === 'Free service month'
    ? 'a free service month'
    : customRewardText || 'a reward'

  const shareTemplates = [
    {
      key: 'facebook',
      platform: 'Facebook',
      body: `We want to say thank you to our customers. If you have been happy with our service, share this link with a friend and both of you will receive ${rewardLabel} when they sign up. We appreciate every referral. It means more than you know.\n\n${referralLink}`,
    },
    {
      key: 'instagram',
      platform: 'Instagram',
      body: `Grateful for every customer who has trusted us. If you know someone who could use our services, send them this link. They get ${rewardLabel} on their first visit, and so do you. That is our way of saying thank you for spreading the word.\n\n${referralLink}`,
    },
    {
      key: 'sms',
      platform: 'SMS',
      body: `Hey, thought you might be interested in the service I use. Use my referral link and get ${rewardLabel} when you sign up: ${referralLink}`,
    },
  ]

  const totalReferrals  = FAKE_REFERRALS.length
  const totalConverted  = FAKE_REFERRALS.filter((r) => r.status === 'reward_sent').length
  const totalSignedUp   = FAKE_REFERRALS.filter((r) => r.status === 'signed_up').length
  const rewardsSent     = totalConverted

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: 'Overview'   },
    { id: 'link',     label: 'Referral Link' },
    { id: 'sharing',  label: 'Share'      },
    { id: 'settings', label: 'Settings'   },
  ]

  return (
    <div className="space-y-8">
      {/* Main panel */}
      <div className="bg-card border border-border rounded">
        {/* Tab nav */}
        <div className="border-b border-border flex flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-5 py-3 font-mono text-sm tracking-wide transition-colors"
              style={activeTab === t.id
                ? { borderBottom: '2px solid #00aa55', color: '#00aa55' }
                : { borderBottom: '2px solid transparent', color: '#888888' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Referrals Sent',  value: totalReferrals.toString()  },
                { label: 'Signed Up',       value: (totalSignedUp + totalConverted).toString() },
                { label: 'Converted',       value: totalConverted.toString()  },
                { label: 'Rewards Issued',  value: rewardsSent.toString()     },
              ].map((s) => (
                <div key={s.label} className="bg-[#efefef] border border-[#d0d0d0] rounded px-4 py-4">
                  <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-1">{s.label}</div>
                  <div className="font-heading text-2xl text-[#1a1a1a]">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Recent referrals */}
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#00aa55' }}>Recent Referrals</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Name</th>
                      <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase hidden sm:table-cell">Referred By</th>
                      <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Date</th>
                      <th className="text-left py-2 font-mono text-xs text-muted tracking-widest uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FAKE_REFERRALS.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4">
                          <div className="font-mono text-sm text-primary">{r.name}</div>
                          <div className="font-mono text-xs text-muted">{r.email}</div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-sm text-muted hidden sm:table-cell">{r.referredBy}</td>
                        <td className="py-3 pr-4 font-mono text-sm text-muted">{r.date}</td>
                        <td className="py-3">
                          <span
                            className="font-mono text-xs px-2 py-0.5 rounded border"
                            style={{ color: STATUS_STYLE[r.status].color, borderColor: `${STATUS_STYLE[r.status].color}30`, backgroundColor: `${STATUS_STYLE[r.status].color}08` }}
                          >
                            {STATUS_STYLE[r.status].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Referral Link tab */}
        {activeTab === 'link' && (
          <div className="p-6 space-y-8">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Your Unique Link</p>
              <h2 className="font-heading text-2xl text-primary mb-4">Share This Link</h2>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#efefef] border border-[#d0d0d0] rounded px-4 py-3 font-mono text-sm text-[#1a1a1a] select-all overflow-hidden truncate">
                  {referralLink}
                </div>
                <button type="button" onClick={copyLink} className="font-mono text-sm px-5 py-3 rounded tracking-wider transition-opacity hover:opacity-80 shrink-0" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
              <p className="font-mono text-xs text-muted mt-3">
                Every customer who clicks this link and completes a sign-up is automatically tracked and credited to whoever shared the link.
              </p>
            </div>

            <div className="h-px bg-border" />

            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>QR Code</p>
              <h2 className="font-heading text-2xl text-primary mb-4">Print and Display</h2>
              <p className="font-mono text-xs text-muted mb-6">
                Print this QR code and post it at your business, on receipts, or in packaging. Customers scan it with their phone to get the referral link instantly.
              </p>
              <QRCode value={referralLink} size={200} />
            </div>
          </div>
        )}

        {/* Social Sharing tab */}
        {activeTab === 'sharing' && (
          <div className="p-6 space-y-4">
            <div className="mb-2">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Social Sharing</p>
              <h2 className="font-heading text-2xl text-primary">Post Templates</h2>
              <p className="font-mono text-xs text-muted mt-1">
                Ready-to-use posts written as if you are speaking directly to your customers. Copy, personalize lightly if needed, and post.
              </p>
            </div>
            {shareTemplates.map((t) => (
              <div key={t.key} className="bg-[#efefef] border border-[#d0d0d0] rounded p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="font-mono text-sm text-[#1a1a1a] font-medium">{t.platform}</div>
                  <button
                    type="button"
                    onClick={() => copyShare(t.key, t.body)}
                    className="font-mono text-xs tracking-wider transition-colors shrink-0"
                    style={{ color: copiedShare === t.key ? '#00aa55' : '#888888' }}
                  >
                    {copiedShare === t.key ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-sm text-[#444444] leading-relaxed whitespace-pre-line">{t.body}</p>
              </div>
            ))}
            <p className="font-mono text-xs text-muted pt-2">
              The reward shown in these templates reflects your current reward settings. Update the Settings tab to change what is offered.
            </p>
          </div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="mb-4">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Program Settings</p>
              <h2 className="font-heading text-2xl text-primary">Configure Your Program</h2>
            </div>
            {settingsSaved && (
              <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
                Settings saved.
              </div>
            )}
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div>
                <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Reward Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {REWARD_TYPES.map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setRewardType(rt)}
                      className="font-mono text-sm px-4 py-3 rounded border text-left transition-colors"
                      style={rewardType === rt
                        ? { borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5508' }
                        : { borderColor: '#d0d0d0', color: '#555555', backgroundColor: 'transparent' }
                      }
                    >
                      {rt}
                    </button>
                  ))}
                </div>
              </div>

              {(rewardType === 'Percentage discount' || rewardType === 'Fixed dollar amount') && (
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">
                    {rewardType === 'Percentage discount' ? 'Discount Percentage' : 'Dollar Amount'}
                  </label>
                  <div className="flex items-center gap-2">
                    {rewardType === 'Fixed dollar amount' && <span className="font-mono text-sm text-muted">$</span>}
                    <input
                      type="number"
                      min="1"
                      className="w-32 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                    />
                    {rewardType === 'Percentage discount' && <span className="font-mono text-sm text-muted">%</span>}
                  </div>
                </div>
              )}

              {rewardType === 'Custom text' && (
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Custom Reward Description</label>
                  <input type="text" className={inputClass} placeholder="e.g. a complimentary consultation" value={customRewardText} onChange={(e) => setCustomRewardText(e.target.value)} />
                </div>
              )}

              <div>
                <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Message to Referred Customer</label>
                <textarea
                  className={inputClass + ' resize-none'}
                  rows={4}
                  value={referredMessage}
                  onChange={(e) => setReferredMessage(e.target.value)}
                />
                <p className="font-mono text-xs text-muted mt-1">Use [Name] and [Reward] as placeholders.</p>
              </div>

              <div className="pt-2">
                <div className="bg-[#efefef] border border-[#d0d0d0] rounded px-4 py-3 mb-4">
                  <div className="font-mono text-xs text-[#888888] mb-1">Preview message</div>
                  <p className="font-mono text-sm text-[#333333] leading-relaxed">
                    {referredMessage
                      .replace('[Name]', 'Jordan')
                      .replace('[Reward]', rewardLabel)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="font-mono text-sm px-6 py-2.5 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <p className="font-mono text-xs text-dim text-center">
        The full version generates unique tracking links per customer, automates reward delivery, and syncs with your billing system.
      </p>
    </div>
  )
}
