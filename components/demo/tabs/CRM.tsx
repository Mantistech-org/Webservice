'use client'

import { useState } from 'react'

interface CRMProps {
  sessionId: string
  businessName: string
}

const CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: 12,
  padding: 20,
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#00C27C',
  fontWeight: 600,
  marginBottom: 4,
}

const CUSTOMERS = [
  { id: 1,  name: 'James Perkins',   address: '4821 Kavanaugh Blvd, Little Rock AR',    phone: '(501) 442-8831', email: 'james.perkins@email.com',  systemType: 'Central AC + Furnace', installYear: 2016, lastService: 'Mar 12, 2026', status: 'Due for Service', notes: 'Filter replacement overdue' },
  { id: 2,  name: 'Michelle Carter', address: '2204 N University Ave, Little Rock AR',  phone: '(501) 881-2204', email: 'm.carter@gmail.com',         systemType: 'Heat Pump',            installYear: 2019, lastService: 'Jan 8, 2026',  status: 'Active',          notes: '' },
  { id: 3,  name: 'Ray Dominguez',   address: '7713 Geyer Springs Rd, Little Rock AR',  phone: '(501) 334-7713', email: 'ray.d@outlook.com',          systemType: 'Central AC + Furnace', installYear: 2013, lastService: 'Nov 3, 2025',  status: 'Overdue',         notes: 'Unit is 11 years old, recommend replacement consult' },
  { id: 4,  name: 'Donna Howell',    address: '1502 Rebsamen Park Rd, Little Rock AR',  phone: '(501) 663-1502', email: 'donna.howell@yahoo.com',     systemType: 'Mini Split',           installYear: 2021, lastService: 'Feb 20, 2026', status: 'Active',          notes: '' },
  { id: 5,  name: 'Brian Stokes',    address: '908 W Markham St, Little Rock AR',       phone: '(501) 221-9088', email: 'bstokes@business.net',       systemType: 'Central AC + Furnace', installYear: 2017, lastService: 'Dec 14, 2025', status: 'Due for Service', notes: 'Requested spring tune-up' },
  { id: 6,  name: 'Linda Park',      address: '3318 JFK Blvd, North Little Rock AR',    phone: '(501) 758-3318', email: 'linda.park@email.com',       systemType: 'Heat Pump',            installYear: 2020, lastService: 'Mar 1, 2026',  status: 'Active',          notes: '' },
  { id: 7,  name: 'Frank Nguyen',    address: '5501 Baseline Rd, Little Rock AR',       phone: '(501) 562-5501', email: 'fnguyen@gmail.com',          systemType: 'Central AC + Furnace', installYear: 2011, lastService: 'Aug 22, 2025', status: 'Overdue',         notes: 'Unit is 13 years old, compressor showing wear' },
  { id: 8,  name: 'Sarah Mitchell',  address: '2109 S University Ave, Little Rock AR',  phone: '(501) 664-2109', email: 's.mitchell@email.com',       systemType: 'Mini Split',           installYear: 2022, lastService: 'Jan 30, 2026', status: 'Active',          notes: '' },
  { id: 9,  name: 'Carlos Rivera',   address: '6620 Colonel Glenn Rd, Little Rock AR',  phone: '(501) 490-6620', email: 'carlos.r@outlook.com',       systemType: 'Central AC + Furnace', installYear: 2015, lastService: 'Oct 11, 2025', status: 'Due for Service', notes: 'Wants to discuss maintenance plan' },
  { id: 10, name: 'Amanda Foster',   address: '1844 Cantrell Rd, Little Rock AR',       phone: '(501) 372-1844', email: 'afoster@yahoo.com',          systemType: 'Heat Pump',            installYear: 2018, lastService: 'Feb 5, 2026',  status: 'Active',          notes: '' },
]

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  'Active': {
    backgroundColor: 'rgba(0,194,124,0.1)',
    color: '#00C27C',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    padding: '3px 10px',
  },
  'Due for Service': {
    backgroundColor: 'rgba(245,158,11,0.1)',
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    padding: '3px 10px',
  },
  'Overdue': {
    backgroundColor: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    padding: '3px 10px',
  },
}

const STATS = [
  { label: 'Total Customers',   value: 10,  color: '#111827' },
  { label: 'Due for Service',   value: 3,   color: '#F59E0B' },
  { label: 'Overdue',           value: 2,   color: '#ef4444' },
  { label: 'Active',            value: 5,   color: '#00C27C' },
]

function WarningIcon({ title }: { title: string }) {
  return (
    <span title={title} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6, cursor: 'default' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  )
}

function ServiceHistoryPlaceholder({ name }: { name: string }) {
  const entries = [
    { date: 'Mar 2025', type: 'Annual Tune-Up',    tech: 'T. Harris',   note: 'System checked, filters replaced, coils cleaned.' },
    { date: 'Sep 2024', type: 'Service Call',       tech: 'M. Torres',   note: 'Capacitor replaced, refrigerant topped off.' },
    { date: 'Mar 2024', type: 'Annual Tune-Up',    tech: 'T. Harris',   note: 'System in good working order.' },
  ]
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Service History
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 64 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{e.date}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{e.type}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Tech: {e.tech}</div>
              <div style={{ fontSize: 13, color: '#374151' }}>{e.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CRM({ sessionId, businessName }: CRMProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [notes, setNotes] = useState<Record<number, string>>(
    Object.fromEntries(CUSTOMERS.map((c) => [c.id, c.notes]))
  )

  const filtered = CUSTOMERS.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <p style={LABEL_STYLE}>Customer Relationship Management</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Customers</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{businessName}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATS.map((s) => (
          <div key={s.label} style={CARD}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search and filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, address, or phone..."
          style={{
            flex: 1,
            minWidth: 220,
            padding: '10px 14px',
            fontSize: 14,
            color: '#111827',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 8,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            fontSize: 14,
            color: '#111827',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 8,
            outline: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {['All', 'Active', 'Due for Service', 'Overdue'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Customer list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
            No customers match your search.
          </div>
        )}
        {filtered.map((c) => {
          const age = 2026 - c.installYear
          const isOld = age > 10
          const isExpanded = expandedId === c.id

          return (
            <div key={c.id} style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
              {/* Main row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: 16,
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Left: identity */}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{c.address}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {c.phone} &middot; {c.email}
                  </div>
                </div>

                {/* Center: system info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{c.systemType}</span>
                    {isOld && (
                      <WarningIcon title={`System is ${age} years old. Consider recommending a replacement consultation.`} />
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>
                    Installed {c.installYear} &middot; {age} years old
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Last service: {c.lastService}</div>
                </div>

                {/* Right: status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={STATUS_STYLE[c.status] ?? {}}>{c.status}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div
                  style={{
                    padding: '0 20px 20px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ paddingTop: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Notes
                    </p>
                    <textarea
                      value={notes[c.id]}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="Add notes about this customer..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: 14,
                        color: '#111827',
                        backgroundColor: '#f9fafb',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: 8,
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <ServiceHistoryPlaceholder name={c.name} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
