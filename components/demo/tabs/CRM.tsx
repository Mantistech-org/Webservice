'use client'

import { useState } from 'react'

interface CRMProps {
  sessionId: string
  businessName: string
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CustomerStatus = 'Up to Date' | 'Due for Service' | 'Overdue'

interface Customer {
  id: number
  name: string
  address: string
  phone: string
  email: string
  systemType: string
  installYear: number
  serialNumber: string
  lastService: string
  status: CustomerStatus
  maintenancePlan: boolean
  notes: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const CUSTOMERS: Customer[] = [
  { id: 1,  name: 'James Perkins',   address: '4821 Kavanaugh Blvd, Little Rock AR',   phone: '(501) 442-8831', email: 'james.perkins@email.com', systemType: 'Central AC + Furnace', installYear: 2016, serialNumber: 'TRN-2016-44821', lastService: 'Mar 12, 2026', status: 'Due for Service', maintenancePlan: false, notes: 'Filter replacement overdue' },
  { id: 2,  name: 'Michelle Carter', address: '2204 N University Ave, Little Rock AR', phone: '(501) 881-2204', email: 'm.carter@gmail.com',        systemType: 'Heat Pump',            installYear: 2019, serialNumber: 'CAR-2019-22041', lastService: 'Jan 8, 2026',  status: 'Up to Date',     maintenancePlan: true,  notes: '' },
  { id: 3,  name: 'Ray Dominguez',   address: '7713 Geyer Springs Rd, Little Rock AR', phone: '(501) 334-7713', email: 'ray.d@outlook.com',         systemType: 'Central AC + Furnace', installYear: 2013, serialNumber: 'TRN-2013-77131', lastService: 'Nov 3, 2025',  status: 'Overdue',        maintenancePlan: false, notes: 'Unit is 13 years old, recommend replacement consult' },
  { id: 4,  name: 'Donna Howell',    address: '1502 Rebsamen Park Rd, Little Rock AR', phone: '(501) 663-1502', email: 'donna.howell@yahoo.com',    systemType: 'Mini Split',           installYear: 2021, serialNumber: 'MTS-2021-15021', lastService: 'Feb 20, 2026', status: 'Up to Date',     maintenancePlan: true,  notes: '' },
  { id: 5,  name: 'Brian Stokes',    address: '908 W Markham St, Little Rock AR',      phone: '(501) 221-9088', email: 'bstokes@business.net',      systemType: 'Central AC + Furnace', installYear: 2017, serialNumber: 'TRN-2017-90882', lastService: 'Dec 14, 2025', status: 'Due for Service', maintenancePlan: true,  notes: 'Requested spring tune-up' },
  { id: 6,  name: 'Linda Park',      address: '3318 JFK Blvd, North Little Rock AR',   phone: '(501) 758-3318', email: 'linda.park@email.com',      systemType: 'Heat Pump',            installYear: 2020, serialNumber: 'CAR-2020-33182', lastService: 'Mar 1, 2026',  status: 'Up to Date',     maintenancePlan: true,  notes: '' },
  { id: 7,  name: 'Frank Nguyen',    address: '5501 Baseline Rd, Little Rock AR',      phone: '(501) 562-5501', email: 'fnguyen@gmail.com',         systemType: 'Central AC + Furnace', installYear: 2011, serialNumber: 'TRN-2011-55015', lastService: 'Aug 22, 2025', status: 'Overdue',        maintenancePlan: false, notes: 'Unit is 15 years old, compressor showing wear' },
  { id: 8,  name: 'Sarah Mitchell',  address: '2109 S University Ave, Little Rock AR', phone: '(501) 664-2109', email: 's.mitchell@email.com',      systemType: 'Mini Split',           installYear: 2022, serialNumber: 'MTS-2022-21092', lastService: 'Jan 30, 2026', status: 'Up to Date',     maintenancePlan: false, notes: '' },
  { id: 9,  name: 'Carlos Rivera',   address: '6620 Colonel Glenn Rd, Little Rock AR', phone: '(501) 490-6620', email: 'carlos.r@outlook.com',      systemType: 'Central AC + Furnace', installYear: 2015, serialNumber: 'TRN-2015-66206', lastService: 'Oct 11, 2025', status: 'Due for Service', maintenancePlan: false, notes: 'Wants to discuss maintenance plan' },
  { id: 10, name: 'Amanda Foster',   address: '1844 Cantrell Rd, Little Rock AR',      phone: '(501) 372-1844', email: 'afoster@yahoo.com',         systemType: 'Heat Pump',            installYear: 2018, serialNumber: 'CAR-2018-18441', lastService: 'Feb 5, 2026',  status: 'Up to Date',     maintenancePlan: false, notes: '' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const SORTED_CUSTOMERS = [...CUSTOMERS].sort((a, b) => {
  const lastA = a.name.split(' ').pop()!.toLowerCase()
  const lastB = b.name.split(' ').pop()!.toLowerCase()
  return lastA !== lastB ? lastA.localeCompare(lastB) : a.name.localeCompare(b.name)
})

function getLastInitial(name: string): string {
  return (name.split(' ').pop() ?? name)[0].toUpperCase()
}

function groupByLetter(list: Customer[]): Record<string, Customer[]> {
  const groups: Record<string, Customer[]> = {}
  for (const c of list) {
    const letter = getLastInitial(c.name)
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(c)
  }
  return groups
}

function shiftMonths(dateStr: string, monthsAgo: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ── Style constants ───────────────────────────────────────────────────────────

const OUTER_CARD: React.CSSProperties = {
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

const COL_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 8,
}

const STATUS_STYLE: Record<CustomerStatus, React.CSSProperties> = {
  'Up to Date':     { backgroundColor: 'rgba(0,194,124,0.1)',   color: '#00C27C', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
  'Due for Service':{ backgroundColor: 'rgba(245,158,11,0.1)',  color: '#F59E0B', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
  'Overdue':        { backgroundColor: 'rgba(239,68,68,0.1)',   color: '#ef4444', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
}

const STATS = [
  { label: 'Total Customers',      value: 10, color: '#111827' },
  { label: 'On Maintenance Plan',  value: 4,  color: '#00C27C' },
  { label: 'Due for Service',      value: 3,  color: '#F59E0B' },
  { label: 'Overdue',              value: 2,  color: '#ef4444' },
]

// ── Customer card (always fully expanded) ─────────────────────────────────────

function CustomerCard({
  customer,
  note,
  onNoteChange,
}: {
  customer: Customer
  note: string
  onNoteChange: (val: string) => void
}) {
  const age = 2026 - customer.installYear
  const ageWarning = age >= 10
  const warrantyExpired = age > 10
  const underWarranty = age < 5

  const history = [
    { date: customer.lastService,              type: 'Annual Tune-Up',       tech: 'Marcus R.', cost: '$89'  },
    { date: shiftMonths(customer.lastService, 12), type: 'Filter Replacement',   tech: 'Marcus R.', cost: '$45'  },
    { date: shiftMonths(customer.lastService, 30), type: 'Refrigerant Recharge', tech: 'James K.',  cost: '$185' },
  ]

  return (
    <div style={{
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 12,
      padding: 20,
      backgroundColor: '#ffffff',
      margin: '8px 0',
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{customer.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {customer.maintenancePlan && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.1)', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
              On Maintenance Plan
            </span>
          )}
          <span style={STATUS_STYLE[customer.status]}>{customer.status}</span>
        </div>
      </div>

      {/* Card body — three columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>

        {/* Left: Contact */}
        <div>
          <p style={COL_LABEL}>Contact</p>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{customer.phone}</div>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{customer.email}</div>
          <div style={{ fontSize: 13, color: '#374151' }}>{customer.address}</div>
        </div>

        {/* Center: Equipment */}
        <div>
          <p style={COL_LABEL}>Equipment</p>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{customer.systemType}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: ageWarning ? '#F59E0B' : '#374151', fontWeight: ageWarning ? 600 : 400 }}>
              {customer.installYear} &middot; {age} years old
            </span>
            {ageWarning && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>
          {ageWarning && (
            <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 4 }}>Recommend replacement consult</div>
          )}
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>SN: {customer.serialNumber}</div>
          {warrantyExpired && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 4, padding: '2px 8px' }}>
              Warranty Expired
            </span>
          )}
          {underWarranty && !warrantyExpired && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.08)', borderRadius: 4, padding: '2px 8px' }}>
              Under Warranty
            </span>
          )}
        </div>

        {/* Right: Service history */}
        <div>
          <p style={COL_LABEL}>Service History</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: i === 0 ? '#00C27C' : '#d1d5db',
                  marginTop: 4, flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>{h.date}</div>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{h.type}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Tech: {h.tech} &middot; {h.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
        <p style={COL_LABEL}>Notes</p>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add notes..."
          rows={2}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            color: '#111827',
            backgroundColor: '#f9fafb',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 7,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            marginBottom: 12,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {customer.status === 'Overdue' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#00C27C', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#00C27C' }}>Auto follow-up scheduled</span>
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              border: '1.5px solid #00C27C', borderRadius: 7,
              backgroundColor: 'transparent', color: '#00C27C', cursor: 'pointer',
            }}>
              Send Follow-up
            </button>
            <button style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              border: 'none', borderRadius: 7,
              backgroundColor: '#00C27C', color: '#ffffff', cursor: 'pointer',
            }}>
              Schedule Service
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CRM({ sessionId: _sessionId, businessName }: CRMProps) {
  const [search, setSearch] = useState('')
  const [openLetters, setOpenLetters] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<Record<number, string>>(
    Object.fromEntries(CUSTOMERS.map((c) => [c.id, c.notes]))
  )

  const isSearching = search.trim().length > 0

  const filteredFlat = isSearching
    ? SORTED_CUSTOMERS.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.phone.includes(search)
        )
      })
    : []

  const grouped = groupByLetter(SORTED_CUSTOMERS)
  const letters = Object.keys(grouped).sort()

  const toggleLetter = (letter: string) => {
    setOpenLetters((prev) => {
      const next = new Set(prev)
      if (next.has(letter)) next.delete(letter)
      else next.add(letter)
      return next
    })
  }

  const updateNote = (id: number, val: string) =>
    setNotes((prev) => ({ ...prev, [id]: val }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <p style={LABEL_STYLE}>Customer Relationship Management</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Customers</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{businessName}</p>
      </div>

      {/* Stats — 4 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATS.map((s) => (
          <div key={s.label} style={OUTER_CARD}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, address, or phone..."
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 14,
          color: '#111827',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 8,
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />

      {/* Customer list */}
      {isSearching ? (
        /* Flat search results — full cards */
        <div>
          {filteredFlat.length === 0 ? (
            <div style={{ ...OUTER_CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>
              No customers match your search.
            </div>
          ) : (
            filteredFlat.map((c) => (
              <CustomerCard
                key={c.id}
                customer={c}
                note={notes[c.id]}
                onNoteChange={(val) => updateNote(c.id, val)}
              />
            ))
          )}
        </div>
      ) : (
        /* Grouped alphabetical accordion */
        <div style={{ ...OUTER_CARD, padding: 0, overflow: 'hidden' }}>
          {letters.map((letter, idx) => {
            const isOpen = openLetters.has(letter)
            const group = grouped[letter]
            const isLast = idx === letters.length - 1

            return (
              <div key={letter}>
                {/* Accordion header */}
                <button
                  onClick={() => toggleLetter(letter)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 14,
                    paddingBottom: 14,
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderBottom: isOpen || !isLast ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 14 }}>{letter}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>({group.length})</span>
                  <div style={{ flex: 1 }} />
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanding customer cards */}
                <div style={{
                  maxHeight: isOpen ? 10000 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 250ms ease',
                }}>
                  <div style={{ padding: '0 16px 16px' }}>
                    {group.map((c) => (
                      <CustomerCard
                        key={c.id}
                        customer={c}
                        note={notes[c.id]}
                        onNoteChange={(val) => updateNote(c.id, val)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
