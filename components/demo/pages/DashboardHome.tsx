'use client'

interface DashboardProps {
  businessName?: string
  onNavigateToWeather?: () => void
}

// ── Static data ────────────────────────────────────────────────────────────────

const ACTIVATION_ITEMS = [
  { label: 'Google Ads',              status: 'Active'                  },
  { label: 'Customer SMS Blast',      status: 'Sent to 1,247 contacts'  },
  { label: 'Google Business Profile', status: 'Updated'                 },
  { label: 'Missed Call Auto-Reply',  status: 'Active'                  },
  { label: 'Website Banner',          status: 'Live'                    },
]

const ACTIVITY_FEED = [
  { text: 'Cold snap activation fired automatically',   time: '11:47 PM' },
  { text: 'SMS blast sent to 1,247 contacts',           time: '11:47 PM' },
  { text: 'Google Ads campaign activated',              time: '11:48 PM' },
  { text: 'Missed call auto-reply enabled',             time: '11:48 PM' },
  { text: '3 new Google reviews received',              time: '8:22 AM'  },
  { text: 'Booking confirmed — Ray Dominguez, 10:00 AM', time: '7:45 AM' },
]

const SCHEDULE = [
  { time: '7:00 AM',  name: 'James Perkins'   },
  { time: '8:30 AM',  name: 'Michelle Carter' },
  { time: '10:00 AM', name: 'Ray Dominguez'   },
  { time: '11:30 AM', name: 'Donna Howell'    },
  { time: '1:00 PM',  name: 'Brian Stokes'    },
]

// 30-day jobs per day — day 24 (index 23) is the cold snap spike
const JOB_BARS = [
  2, 1, 3, 2, 1, 3, 2, 2, 1, 3,
  2, 3, 1, 2, 2, 3, 1, 2, 3, 2,
  1, 2, 3, 11, 2, 3, 1, 2, 3, 2,
]

// ── Bar chart ─────────────────────────────────────────────────────────────────

function BarChart() {
  const W = 800
  const H = 180
  const pL = 44, pR = 20, pT = 32, pB = 28
  const cW = W - pL - pR
  const cH = H - pT - pB
  const max = Math.max(...JOB_BARS)
  const slotW = cW / JOB_BARS.length
  const barW = Math.max(Math.floor(slotW * 0.72), 4)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      {/* Y-axis label */}
      <text
        fontSize="9"
        fill="#94a3b8"
        textAnchor="middle"
        transform={`translate(11,${pT + cH / 2}) rotate(-90)`}
      >
        Jobs
      </text>

      {/* Grid lines + Y tick labels */}
      {[0, 0.33, 0.66, 1].map((t) => {
        const y = pT + cH * (1 - t)
        return (
          <g key={t}>
            <line
              x1={pL} y1={y} x2={W - pR} y2={y}
              stroke="#f1f5f9" strokeWidth="1"
            />
            <text
              x={pL - 6} y={y + 3.5}
              textAnchor="end" fontSize="9" fill="#94a3b8"
            >
              {Math.round(t * max)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {JOB_BARS.map((val, i) => {
        const isSpike = i === 23
        const barH = Math.max((val / max) * cH, 2)
        const x = pL + i * slotW + (slotW - barW) / 2
        const y = pT + cH - barH
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barW} height={barH}
              fill={isSpike ? '#22c55e' : '#86efac'}
              rx="2"
            />
            {isSpike && (
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="8"
                fill="#16a34a"
                fontWeight="700"
              >
                Cold snap *
              </text>
            )}
          </g>
        )
      })}

      {/* X-axis label */}
      <text
        x={pL + cW / 2}
        y={H - 4}
        textAnchor="middle"
        fontSize="9"
        fill="#94a3b8"
      >
        Last 30 Days
      </text>
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardHome({ businessName, onNavigateToWeather }: DashboardProps) {
  return (
    <div className="space-y-5">

      {/* Weather activation banner */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#1e293b' }}
      >
        <div className="flex flex-col lg:flex-row items-start gap-8 p-7">

          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                style={{
                  display: 'inline-block',
                  width: 8, height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#00ff88',
                  flexShrink: 0,
                }}
              />
              <span
                className="font-mono text-xs tracking-widest uppercase"
                style={{ color: '#00ff88' }}
              >
                Weather Event Active
              </span>
            </div>
            <h2
              className="font-heading text-2xl font-bold mb-2"
              style={{ color: '#ffffff' }}
            >
              Cold Snap Detected
            </h2>
            <p
              className="font-mono text-sm leading-relaxed mb-5"
              style={{ color: '#94a3b8' }}
            >
              28F forecast tonight in your service area.
              <br />
              Your platform activated automatically at 11:47 PM.
            </p>
            <button
              onClick={onNavigateToWeather}
              className="font-mono text-sm tracking-wider px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#00ff88', color: '#111827' }}
            >
              View Activation Details
            </button>
          </div>

          {/* Right: activation checklist */}
          <div
            className="w-full lg:w-72 rounded-lg p-5"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            {ACTIVATION_ITEMS.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5"
                style={{
                  borderBottom:
                    i < ACTIVATION_ITEMS.length - 1
                      ? '1px solid rgba(255,255,255,0.07)'
                      : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18, height: 18,
                      borderRadius: '50%',
                      backgroundColor: '#00b857',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path
                        d="M1 3.5L3.5 6L8 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span
                    className="font-mono text-xs"
                    style={{ color: '#e2e8f0' }}
                  >
                    {item.label}
                  </span>
                </div>
                <span
                  className="font-mono text-xs font-semibold shrink-0 ml-2"
                  style={{ color: '#00ff88' }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Jobs Booked This Week',
            value: '11',
            sub: '3 booked during last night\'s activation',
            subGreen: true,
            star: false,
          },
          {
            label: 'Calls Auto-Replied',
            value: '24',
            sub: 'Last 30 days',
            subGreen: false,
            star: false,
          },
          {
            label: 'Google Rating',
            value: '4.9',
            sub: '47 reviews',
            subGreen: false,
            star: true,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-6"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
          >
            <div
              className="font-mono text-xs uppercase tracking-widest mb-3"
              style={{ color: '#94a3b8' }}
            >
              {card.label}
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="font-heading font-bold"
                style={{ fontSize: 42, lineHeight: 1, color: '#1a1a2e' }}
              >
                {card.value}
              </span>
              {card.star && (
                <svg
                  width="22" height="22" viewBox="0 0 24 24"
                  fill="#facc15" stroke="#facc15" strokeWidth="1"
                  style={{ marginBottom: 4 }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
            </div>
            <div
              className="font-mono text-xs"
              style={{ color: card.subGreen ? '#00aa55' : '#94a3b8' }}
            >
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
        >
          <div
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#94a3b8' }}
          >
            Recent Activity
          </div>
          {ACTIVITY_FEED.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{
                borderBottom:
                  i < ACTIVITY_FEED.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  style={{
                    width: 7, height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#00cc66',
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <span
                  className="font-mono text-xs truncate"
                  style={{ color: '#374151' }}
                >
                  {item.text}
                </span>
              </div>
              <span
                className="font-mono text-xs shrink-0 ml-4"
                style={{ color: '#9ca3af' }}
              >
                {item.time}
              </span>
            </div>
          ))}
        </div>

        {/* Today's Schedule */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
        >
          <div
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#94a3b8' }}
          >
            Today&apos;s Schedule
          </div>
          {SCHEDULE.map((slot, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="font-mono text-xs shrink-0"
                  style={{ color: '#9ca3af', width: 64 }}
                >
                  {slot.time}
                </span>
                <span
                  style={{
                    width: 3, height: 22,
                    backgroundColor: '#00cc66',
                    borderRadius: 2,
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <span
                  className="font-mono text-sm"
                  style={{ color: '#1a1a2e' }}
                >
                  {slot.name}
                </span>
              </div>
              <span
                className="font-mono text-xs font-semibold"
                style={{ color: '#00aa55' }}
              >
                Confirmed
              </span>
            </div>
          ))}
          <div
            className="pt-4"
            style={{ borderTop: '1px solid #f1f5f9', marginTop: 4 }}
          >
            <span className="font-mono text-xs" style={{ color: '#00aa55' }}>
              2 more slots available today
            </span>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
      >
        <div
          className="font-mono text-xs uppercase tracking-widest mb-5"
          style={{ color: '#94a3b8' }}
        >
          Jobs Booked — Last 30 Days
        </div>
        <BarChart />
      </div>

    </div>
  )
}
