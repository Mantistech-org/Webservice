'use client'

interface LineChartProps { darkMode?: boolean }
interface DashboardProps { businessName?: string; darkMode?: boolean }

const STATS = [
  { label: 'Website Visitors', value: '2,847', change: '+12%', up: true },
  { label: 'Leads Captured', value: '134', change: '+8%', up: true },
  { label: 'Reviews This Month', value: '23', change: '+5', up: true },
  { label: 'Email Open Rate', value: '34.2%', change: '+2.1%', up: true },
  { label: 'Avg. SEO Position', value: '14.3', change: '-2.1', up: true },
  { label: 'Ad Impressions', value: '18,420', change: '+31%', up: true },
]

const CHART_DATA = [410, 620, 530, 780, 690, 920, 1040, 870, 1120, 980, 1310, 1480]
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

const TOP_PAGES = [
  { page: '/home', views: 1204, pct: 100 },
  { page: '/services', views: 618, pct: 51 },
  { page: '/contact', views: 392, pct: 33 },
  { page: '/about', views: 277, pct: 23 },
  { page: '/blog', views: 144, pct: 12 },
]

const ACTIVITY = [
  {
    title: 'Recent Leads',
    items: [
      { label: 'Sarah Mitchell', sub: 'sarah@example.com', time: '2h ago' },
      { label: 'James Okafor', sub: 'james@example.com', time: '5h ago' },
      { label: 'Priya Sharma', sub: 'priya@example.com', time: '1d ago' },
      { label: 'Tom Nguyen', sub: 'tom@example.com', time: '2d ago' },
    ],
  },
  {
    title: 'Recent Reviews',
    items: [
      { label: '5 stars — Maria G.', sub: '"Incredible service, highly recommend!"', time: '1h ago' },
      { label: '5 stars — Ben T.', sub: '"Fast and professional team."', time: '8h ago' },
      { label: '4 stars — Linda K.', sub: '"Great work overall."', time: '2d ago' },
      { label: '5 stars — Carlos M.', sub: '"Will definitely use again."', time: '3d ago' },
    ],
  },
  {
    title: 'Recent Campaigns',
    items: [
      { label: 'Spring Promo Email', sub: '62% open rate', time: '3h ago' },
      { label: 'New Services Blast', sub: '48% open rate', time: '2d ago' },
      { label: 'Follow-up Sequence', sub: '29% open rate', time: '5d ago' },
      { label: 'Welcome Series', sub: '71% open rate', time: '1wk ago' },
    ],
  },
]

function LineChart({ darkMode }: LineChartProps) {
  const w = 480
  const h = 140
  const pad = { top: 12, right: 12, bottom: 24, left: 36 }
  const iw = w - pad.left - pad.right
  const ih = h - pad.top - pad.bottom
  const max = Math.max(...CHART_DATA)
  const min = Math.min(...CHART_DATA)
  const range = max - min || 1

  const points = CHART_DATA.map((v, i) => ({
    x: pad.left + (i / (CHART_DATA.length - 1)) * iw,
    y: pad.top + ih - ((v - min) / range) * ih,
  }))

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const fill = `${d} L${points[points.length - 1].x},${(pad.top + ih).toFixed(1)} L${points[0].x},${(pad.top + ih).toFixed(1)} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 140 }}>
      {/* Y grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad.top + ih * (1 - t)
        return (
          <g key={t}>
            <line x1={pad.left} y1={y} x2={pad.left + iw} y2={y} stroke={darkMode ? '#333333' : '#d0d0d0'} strokeWidth="0.5" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="8" fill={darkMode ? '#aaaaaa' : '#666666'}>
              {Math.round(min + t * range)}
            </text>
          </g>
        )
      })}
      {/* Area fill */}
      <path d={fill} fill="#00ff88" fillOpacity="0.08" />
      {/* Line */}
      <path d={d} fill="none" stroke="#00cc66" strokeWidth="2" strokeLinejoin="round" />
      {/* X labels */}
      {MONTHS.map((m, i) => (
        <text
          key={m}
          x={pad.left + (i / (MONTHS.length - 1)) * iw}
          y={h - 4}
          textAnchor="middle"
          fontSize="8"
          fill={darkMode ? '#aaaaaa' : '#666666'}
        >
          {m}
        </text>
      ))}
      {/* Dot at last point */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="#00cc66" />
    </svg>
  )
}

export default function DashboardHome({ businessName, darkMode }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-[#1a1a1a]">{businessName ? `${businessName} — Dashboard` : 'Dashboard'}</h1>
        <p className="font-mono text-xs text-[#888888] mt-0.5">Last 30 days overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
            <div className="font-mono text-xs text-[#888888] tracking-wider uppercase mb-2">{s.label}</div>
            <div className="font-heading text-3xl text-[#1a1a1a] leading-none mb-1">{s.value}</div>
            <div className={`font-mono text-xs ${s.up ? 'text-[#00aa55]' : 'text-red-500'}`}>
              {s.change} vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
          <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">
            Website Traffic (12 months)
          </div>
          <LineChart darkMode={darkMode} />
        </div>

        <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
          <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">Top Pages</div>
          <div className="space-y-3">
            {TOP_PAGES.map((p) => (
              <div key={p.page}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-[#444444]">{p.page}</span>
                  <span className="font-mono text-xs text-[#888888]">{p.views.toLocaleString()}</span>
                </div>
                <div className="h-1 bg-[#d0d0d0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.pct}%`, backgroundColor: '#00cc66' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ACTIVITY.map((feed) => (
          <div key={feed.title} className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
            <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">
              {feed.title}
            </div>
            <div className="space-y-3">
              {feed.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-[#1a1a1a] truncate">{item.label}</div>
                    <div className="font-mono text-xs text-[#999999] truncate mt-0.5">{item.sub}</div>
                  </div>
                  <span className="font-mono text-xs text-[#bbbbbb] shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Website preview strip */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-[#d0d0d0] flex items-center justify-between">
          <div className="font-mono text-xs text-[#888888] tracking-widest uppercase">Live Site Preview</div>
          <span className="font-mono text-xs text-[#00aa55]">Active</span>
        </div>
        <div className="bg-[#f0f0f0] h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="font-mono text-xs text-[#aaaaaa] mb-2">
              Your website preview appears here once your site is live.
            </div>
            <div className="font-mono text-xs text-[#cccccc]">mantistech.io/your-business</div>
          </div>
        </div>
      </div>
    </div>
  )
}
