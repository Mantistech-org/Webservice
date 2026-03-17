'use client'

import { useState } from 'react'

type SocialTab = 'accounts' | 'schedule' | 'queue' | 'creative'

const TAB_LABELS: Record<SocialTab, string> = {
  accounts: 'Connected Accounts',
  schedule: 'Schedule Post',
  queue: 'Scheduled Queue',
  creative: 'Ad Creative Generator',
}

// ── Placeholder scheduled posts ────────────────────────────────────────────
const PLACEHOLDER_QUEUE = [
  {
    id: '1',
    platform: 'Instagram',
    text: 'Discover our latest services. Quality you can trust, results you can see. 🌿 #MantisClients #SmallBusiness',
    scheduledFor: 'Tomorrow at 10:00 AM',
    status: 'scheduled',
  },
  {
    id: '2',
    platform: 'Facebook',
    text: "We're proud to announce the launch of a brand-new website for one of our clients. Built in 48 hours. Ready for customers on day one.",
    scheduledFor: 'Friday at 2:00 PM',
    status: 'scheduled',
  },
  {
    id: '3',
    platform: 'Google Business',
    text: 'New hours this week: Monday through Saturday 8am–6pm. Stop by or book online.',
    scheduledFor: 'Last Tuesday',
    status: 'posted',
  },
]

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  'Google Ads': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  'Google Business': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
}

function ComingSoonBadge() {
  return (
    <span className="font-mono text-xs border border-yellow-700/30 dark:border-yellow-400/30 text-yellow-700 dark:text-yellow-400 bg-yellow-700/5 dark:bg-yellow-400/5 px-2 py-0.5 rounded-full">
      Coming Soon
    </span>
  )
}

// ── Accounts Tab ───────────────────────────────────────────────────────────
function AccountsTab() {
  const [fbConnecting, setFbConnecting] = useState(false)
  const [googleConnecting, setGoogleConnecting] = useState(false)

  const handleConnect = (platform: string, setter: (v: boolean) => void) => {
    setter(true)
    setTimeout(() => {
      setter(false)
      alert(`${platform} OAuth flow will be implemented when the Meta Business API and Google Ads API keys are configured.`)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-primary mb-1">Connected Accounts</h2>
        <p className="font-mono text-xs text-muted">
          Connect social media accounts to enable scheduling and publishing across platforms.
        </p>
      </div>

      {/* Facebook / Instagram */}
      <div className="bg-card border border-border rounded p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-primary">
              {PLATFORM_ICONS['Facebook']}
            </div>
            <div>
              <div className="font-mono text-sm text-primary font-medium">Facebook & Instagram</div>
              <div className="font-mono text-xs text-muted">Meta Business API</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ComingSoonBadge />
            <span className="font-mono text-xs text-muted border border-border px-2 py-0.5 rounded">Not Connected</span>
          </div>
        </div>
        <p className="font-mono text-xs text-muted mb-4 leading-relaxed">
          Connect your Meta Business account to schedule posts to Facebook Pages and Instagram Business profiles.
          Requires a verified Meta Business account and app review for publishing permissions.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleConnect('Facebook & Instagram', setFbConnecting)}
            disabled={fbConnecting}
            className="font-mono text-xs bg-primary text-bg px-4 py-2 rounded hover:opacity-80 transition-opacity disabled:opacity-60"
          >
            {fbConnecting ? 'Redirecting...' : 'Connect Facebook / Instagram'}
          </button>
          <span className="font-mono text-xs text-muted">OAuth via Meta Business SDK</span>
        </div>

        <div className="mt-5 pt-5 border-t border-border">
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">Required Permissions</div>
          <div className="flex flex-wrap gap-2">
            {['pages_manage_posts', 'instagram_basic', 'instagram_content_publish', 'pages_read_engagement'].map((p) => (
              <span key={p} className="font-mono text-xs bg-bg border border-border text-muted px-2 py-1 rounded">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Google Ads */}
      <div className="bg-card border border-border rounded p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-primary">
              {PLATFORM_ICONS['Google Ads']}
            </div>
            <div>
              <div className="font-mono text-sm text-primary font-medium">Google Ads</div>
              <div className="font-mono text-xs text-muted">Google Ads API</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ComingSoonBadge />
            <span className="font-mono text-xs text-muted border border-border px-2 py-0.5 rounded">Not Connected</span>
          </div>
        </div>
        <p className="font-mono text-xs text-muted mb-4 leading-relaxed">
          Connect Google Ads to create and manage ad campaigns directly from this dashboard.
          Upload creatives, set budgets, and track performance across Search and Display networks.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleConnect('Google Ads', setGoogleConnecting)}
            disabled={googleConnecting}
            className="font-mono text-xs bg-primary text-bg px-4 py-2 rounded hover:opacity-80 transition-opacity disabled:opacity-60"
          >
            {googleConnecting ? 'Redirecting...' : 'Connect Google Ads'}
          </button>
          <span className="font-mono text-xs text-muted">OAuth 2.0 via Google</span>
        </div>
      </div>

      {/* Google Business Profile */}
      <div className="bg-card border border-border rounded p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-primary">
              {PLATFORM_ICONS['Google Business']}
            </div>
            <div>
              <div className="font-mono text-sm text-primary font-medium">Google Business Profile</div>
              <div className="font-mono text-xs text-muted">Google My Business API</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ComingSoonBadge />
            <span className="font-mono text-xs text-muted border border-border px-2 py-0.5 rounded">Not Connected</span>
          </div>
        </div>
        <p className="font-mono text-xs text-muted mb-4 leading-relaxed">
          Connect Google Business Profile to post updates, offers, and announcements directly to Google Search and Maps.
        </p>
        <button
          onClick={() => handleConnect('Google Business Profile', () => {})}
          className="font-mono text-xs bg-primary text-bg px-4 py-2 rounded hover:opacity-80 transition-opacity"
        >
          Connect Google Business
        </button>
      </div>
    </div>
  )
}

// ── Schedule Tab ───────────────────────────────────────────────────────────
function ScheduleTab() {
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('10:00')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setContent('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-primary mb-1">Schedule a Post</h2>
        <p className="font-mono text-xs text-muted">
          Write a post and schedule it to go out at a specific date and time.
          Requires a connected account.
        </p>
      </div>

      <div className="bg-card border border-border rounded p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="form-input"
            >
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Google Business</option>
              <option>All Platforms</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Post Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              placeholder="Write your post copy here..."
              className="form-input resize-none w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="font-mono text-xs text-muted">{content.length} characters</span>
              {platform === 'Instagram' && content.length > 2200 && (
                <span className="font-mono text-xs text-red-700 dark:text-red-400">Over Instagram limit</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">
              Media (optional)
            </label>
            <div className="border border-dashed border-border rounded p-8 text-center cursor-pointer hover:border-border-light transition-colors bg-bg">
              <div className="font-mono text-xs text-muted">Click to upload an image or video</div>
              <div className="font-mono text-xs text-dim mt-1">JPG, PNG, MP4 · Max 50MB</div>
            </div>
          </div>

          {submitted ? (
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-700 dark:text-accent">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Post scheduled successfully (demo — connect an account to publish for real)
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:opacity-90 transition-opacity"
            >
              Schedule Post
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Queue Tab ──────────────────────────────────────────────────────────────
function QueueTab() {
  const [posts, setPosts] = useState(PLACEHOLDER_QUEUE)

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl text-primary mb-1">Scheduled Queue</h2>
          <p className="font-mono text-xs text-muted">Upcoming and recently published posts.</p>
        </div>
        <span className="font-mono text-xs text-muted border border-border px-3 py-1 rounded">
          {posts.filter((p) => p.status === 'scheduled').length} pending
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 font-mono text-sm text-muted">
          No posts in the queue. Schedule a post to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-card border border-border rounded p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-bg border border-border flex items-center justify-center text-muted shrink-0 mt-0.5">
                    {PLATFORM_ICONS[post.platform] ?? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-primary font-medium">{post.platform}</span>
                      <span className={`font-mono text-xs border px-2 py-0.5 rounded-full ${
                        post.status === 'posted'
                          ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30'
                          : 'text-blue-700 dark:text-blue-400 border-blue-700/30 dark:border-blue-400/30'
                      }`}>
                        {post.status === 'posted' ? 'Posted' : 'Scheduled'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted leading-relaxed line-clamp-2">{post.text}</p>
                    <div className="font-mono text-xs text-muted mt-1.5">{post.scheduledFor}</div>
                  </div>
                </div>
                {post.status === 'scheduled' && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="font-mono text-xs text-muted hover:text-red-700 dark:hover:text-red-400 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <p className="font-mono text-xs text-muted">
          Posts shown above are example data. Connect a platform account to see and manage real scheduled posts.
        </p>
      </div>
    </div>
  )
}

// ── Ad Creative Tab ────────────────────────────────────────────────────────
function CreativeTab() {
  const [businessDesc, setBusinessDesc] = useState('')
  const [adGoal, setAdGoal] = useState('Generate Leads')
  const [adFormat, setAdFormat] = useState('Image Ad')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-primary mb-1">Ad Creative Generator</h2>
        <p className="font-mono text-xs text-muted">
          Generate ad copy and creative briefs for Facebook, Instagram, and Google campaigns.
          Requires connected ad accounts to publish.
        </p>
      </div>

      <div className="bg-card border border-border rounded p-6">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Description</label>
            <textarea
              value={businessDesc}
              onChange={(e) => setBusinessDesc(e.target.value)}
              rows={3}
              required
              placeholder="Describe the business and what makes it unique..."
              className="form-input resize-none w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Ad Goal</label>
              <select value={adGoal} onChange={(e) => setAdGoal(e.target.value)} className="form-input">
                <option>Generate Leads</option>
                <option>Drive Website Traffic</option>
                <option>Increase Brand Awareness</option>
                <option>Promote a Sale</option>
                <option>Get Bookings</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Format</label>
              <select value={adFormat} onChange={(e) => setAdFormat(e.target.value)} className="form-input">
                <option>Image Ad</option>
                <option>Carousel Ad</option>
                <option>Video Ad (script)</option>
                <option>Story / Reel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">
              Upload Brand Assets (optional)
            </label>
            <div className="border border-dashed border-border rounded p-6 text-center bg-bg cursor-pointer hover:border-border-light transition-colors">
              <div className="font-mono text-xs text-muted">Upload logo, product photos, or brand images</div>
              <div className="font-mono text-xs text-dim mt-1">PNG, JPG · Max 10MB each</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {generating ? 'Generating creative...' : 'Generate Ad Creative'}
          </button>
        </form>
      </div>

      {generated && (
        <div className="space-y-4">
          <div className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase">Generated Output</div>

          {/* Headline variations */}
          {[
            { label: 'Primary Headline', text: 'Grow Your Business Faster With Mantis Tech' },
            { label: 'Headline Variation 2', text: 'Professional Websites. Real Results. 48-Hour Delivery.' },
            { label: 'Headline Variation 3', text: 'Your Competitors Are Online. Are You?' },
          ].map((h) => (
            <div key={h.label} className="bg-card border border-border rounded p-4">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">{h.label}</div>
              <div className="text-sm text-primary font-medium">{h.text}</div>
              <button className="font-mono text-xs text-muted hover:text-primary transition-colors mt-2">Copy</button>
            </div>
          ))}

          {/* Body copy */}
          <div className="bg-card border border-border rounded p-4">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">Ad Body Copy</div>
            <p className="text-sm text-primary leading-relaxed">
              Ready to get more customers? Mantis Tech builds custom websites for local businesses in 48 hours — complete with booking, reviews, and social automation. No contracts. No hidden fees. Just results.
            </p>
            <button className="font-mono text-xs text-muted hover:text-primary transition-colors mt-2">Copy</button>
          </div>

          {/* CTA options */}
          <div className="bg-card border border-border rounded p-4">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">Call to Action Options</div>
            <div className="flex flex-wrap gap-2">
              {['Get Started', 'Learn More', 'Book a Demo', 'Contact Us', 'See Pricing'].map((cta) => (
                <button
                  key={cta}
                  className="font-mono text-xs border border-border text-muted px-3 py-1.5 rounded hover:border-accent hover:text-primary transition-all"
                >
                  {cta}
                </button>
              ))}
            </div>
          </div>

          {/* Publish buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => alert('Connect Facebook/Instagram account first to publish ads.')}
              className="flex-1 font-mono text-xs border border-border text-muted py-2.5 rounded tracking-wider hover:border-border-light hover:text-primary transition-all"
            >
              Publish to Facebook Ads
            </button>
            <button
              onClick={() => alert('Connect Google Ads account first to publish campaigns.')}
              className="flex-1 font-mono text-xs border border-border text-muted py-2.5 rounded tracking-wider hover:border-border-light hover:text-primary transition-all"
            >
              Publish to Google Ads
            </button>
          </div>
          <p className="font-mono text-xs text-muted text-center">
            Connect ad accounts in the Accounts tab to enable publishing.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminSocialMediaPage() {
  const [activeTab, setActiveTab] = useState<SocialTab>('accounts')

  return (
    <div className="flex flex-1 items-start min-h-0">
      {/* Social sub-sidebar */}
      <aside className="w-56 shrink-0 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto border-r border-border bg-card flex flex-col">
        {/* Social sub-navigation */}
        <div className="p-3 border-b border-border">
          <div className="font-mono text-xs text-primary/50 tracking-widest uppercase px-2 py-1.5 mb-1">Social Media</div>
          <nav className="space-y-0.5">
            {(Object.keys(TAB_LABELS) as SocialTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded font-mono text-xs tracking-wider transition-all ${
                  activeTab === tab
                    ? 'bg-bg text-primary font-medium border border-border'
                    : 'text-primary/65 hover:text-primary hover:bg-bg'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </nav>
        </div>

        {/* Connection status */}
        <div className="p-4">
          <div className="font-mono text-xs text-primary/50 tracking-widest uppercase mb-3">Connection Status</div>
          {['Facebook / Instagram', 'Google Ads', 'Google Business'].map((platform) => (
            <div key={platform} className="flex items-center justify-between py-1.5">
              <span className="font-mono text-xs text-primary/65">{platform}</span>
              <span className="font-mono text-xs text-primary/40">Not connected</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-8 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-1">Admin Only</div>
            <h1 className="font-heading text-5xl text-primary mb-2">Social Media</h1>
            <p className="font-mono text-sm text-muted">
              Manage social media accounts and ad campaigns for all clients.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs border border-yellow-700/30 dark:border-yellow-400/30 text-yellow-700 dark:text-yellow-400 bg-yellow-700/5 dark:bg-yellow-400/5 px-3 py-1 rounded-full">
              API connections coming soon
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-bg border border-border rounded p-1 mb-8 w-fit">
          {(Object.keys(TAB_LABELS) as SocialTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono text-xs px-4 py-1.5 rounded transition-all ${
                activeTab === tab
                  ? 'bg-card border border-border text-primary shadow-sm'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'accounts' && <AccountsTab />}
        {activeTab === 'schedule' && <ScheduleTab />}
        {activeTab === 'queue' && <QueueTab />}
        {activeTab === 'creative' && <CreativeTab />}
      </main>
    </div>
  )
}
