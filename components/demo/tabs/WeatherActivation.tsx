'use client'

interface Props {
  sessionId: string
  businessName?: string
  darkMode?: boolean
}

const ACTIVATION_ITEMS = [
  {
    label: 'Google Ads',
    status: 'Active',
    desc: 'Campaign running — targeting your service area.',
  },
  {
    label: 'Customer SMS Blast',
    status: 'Sent to 1,247 contacts',
    desc: 'Sent to 1,247 contacts at 11:47 PM.',
  },
  {
    label: 'Google Business Profile',
    status: 'Updated',
    desc: 'Emergency availability post published.',
  },
  {
    label: 'Missed Call Auto-Reply',
    status: 'Active',
    desc: 'Active — responding to all missed calls instantly.',
  },
  {
    label: 'Website Banner',
    status: 'Live',
    desc: 'Live — showing emergency availability message.',
  },
]

const ACTIVATION_HISTORY = [
  { date: 'Jan 14, 2026', event: 'Cold Snap',  jobs: 9,  revenue: '$6,300' },
  { date: 'Aug 7, 2025',  event: 'Heat Wave',  jobs: 14, revenue: '$9,800' },
  { date: 'Jun 19, 2025', event: 'Heat Wave',  jobs: 11, revenue: '$7,700' },
]

function Check() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22, height: 22,
        borderRadius: '50%',
        backgroundColor: '#00b857',
        flexShrink: 0,
      }}
    >
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
        <path
          d="M1 4.5L4 7.5L10 1"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export default function WeatherActivation({ businessName }: Props) {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold mb-1" style={{ color: '#1a1a1a' }}>
          Weather Activation System
        </h1>
        <p className="font-mono text-sm" style={{ color: '#555555' }}>
          Automated campaign deployment triggered by real-time weather events.
        </p>
      </div>

      {/* Section 1 — Current activation status */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#f0fff8', border: '1px solid #b2f0d4' }}>
        <div className="px-7 pt-7 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <span
              style={{
                display: 'inline-block',
                width: 9, height: 9,
                borderRadius: '50%',
                backgroundColor: '#00aa55',
                flexShrink: 0,
              }}
            />
            <span
              className="font-mono text-xs tracking-widest uppercase"
              style={{ color: '#00aa55' }}
            >
              Active Weather Event
            </span>
          </div>
          <h2 className="font-heading text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
            Cold snap detected — 28F forecast tonight in your service area.
          </h2>
          <p className="font-mono text-sm" style={{ color: '#555555' }}>
            Activation triggered at 11:47 PM.
          </p>
        </div>

        <div className="px-7 pb-7 mt-6 space-y-0">
          {ACTIVATION_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 py-4"
              style={{
                borderBottom:
                  i < ACTIVATION_ITEMS.length - 1
                    ? '1px solid rgba(0,0,0,0.08)'
                    : 'none',
              }}
            >
              <Check />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <span
                    className="font-mono text-sm font-semibold"
                    style={{ color: '#1a1a1a' }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="font-mono text-xs font-bold shrink-0"
                    style={{ color: '#00aa55' }}
                  >
                    {item.status}
                  </span>
                </div>
                <p
                  className="font-mono text-xs mt-0.5"
                  style={{ color: '#555555' }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — Activation history */}
      <div
        className="rounded-xl"
        style={{ backgroundColor: '#e8e8e8', border: '1px solid #d0d0d0' }}
      >
        <div className="px-6 pt-6 pb-4">
          <div
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#888888' }}
          >
            Activation History
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #d0d0d0' }}>
                  {['Date', 'Event Type', 'Jobs Captured', 'Revenue Estimated'].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 font-mono text-xs uppercase tracking-widest"
                      style={{ color: '#888888', paddingRight: 24 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACTIVATION_HISTORY.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom:
                        i < ACTIVATION_HISTORY.length - 1 ? '1px solid #d0d0d0' : 'none',
                    }}
                  >
                    <td
                      className="py-4 font-mono text-sm"
                      style={{ color: '#444444', paddingRight: 24 }}
                    >
                      {row.date}
                    </td>
                    <td
                      className="py-4 font-mono text-sm"
                      style={{ color: '#444444', paddingRight: 24 }}
                    >
                      {row.event}
                    </td>
                    <td
                      className="py-4 font-heading text-lg font-bold"
                      style={{ color: '#1a1a1a', paddingRight: 24 }}
                    >
                      {row.jobs}
                    </td>
                    <td
                      className="py-4 font-mono text-sm font-semibold"
                      style={{ color: '#00aa55' }}
                    >
                      {row.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3 — Service area monitoring */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#e8e8e8', border: '1px solid #d0d0d0' }}
      >
        <div
          className="font-mono text-xs uppercase tracking-widest mb-5"
          style={{ color: '#888888' }}
        >
          Service Area Monitoring
        </div>
        <div className="space-y-4">
          <div>
            <div
              className="font-mono text-xs uppercase tracking-wide mb-1"
              style={{ color: '#888888' }}
            >
              Monitoring
            </div>
            <div className="font-mono text-sm" style={{ color: '#1a1a1a' }}>
              {businessName ? `${businessName} service area` : 'Your service area'}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #d0d0d0', paddingTop: 16 }}>
            <div
              className="font-mono text-xs uppercase tracking-wide mb-1"
              style={{ color: '#888888' }}
            >
              Next Forecast Check
            </div>
            <div className="font-mono text-sm" style={{ color: '#1a1a1a' }}>
              In 47 minutes
            </div>
          </div>
          <div style={{ borderTop: '1px solid #d0d0d0', paddingTop: 16 }}>
            <div
              className="font-mono text-xs uppercase tracking-wide mb-1"
              style={{ color: '#888888' }}
            >
              Weather Threshold
            </div>
            <div className="font-mono text-sm leading-relaxed" style={{ color: '#444444' }}>
              Sudden temperature events — hard freezes, heat waves, rapid drops of
              20F or more within 48 hours.
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
