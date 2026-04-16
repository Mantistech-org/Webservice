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

type CustomerStatus = 'Up to Date' | 'Due for Service' | 'Overdue'

interface Customer {
  id: number
  name: string
  address: string
  phone: string
  email: string
  systemType: string
  installYear: number
  lastService: string
  status: CustomerStatus
  notes: string
}

const CUSTOMERS: Customer[] = [
  { id: 1,  name: 'James Perkins',   address: '4821 Kavanaugh Blvd, Little Rock AR',   phone: '(501) 442-8831', email: 'james.perkins@email.com', systemType: 'Central AC + Furnace', installYear: 2016, lastService: 'Mar 12, 2026', status: 'Due for Service', notes: 'Filter replacement overdue' },
  { id: 2,  name: 'Michelle Carter', address: '2204 N University Ave, Little Rock AR', phone: '(501) 881-2204', email: 'm.carter@gmail.com',        systemType: 'Heat Pump',            installYear: 2019, lastService: 'Jan 8, 2026',  status: 'Up to Date',     notes: '' },
  { id: 3,  name: 'Ray Dominguez',   address: '7713 Geyer Springs Rd, Little Rock AR', phone: '(501) 334-7713', email: 'ray.d@outlook.com',         systemType: 'Central AC + Furnace', installYear: 2013, lastService: 'Nov 3, 2025',  status: 'Overdue',        notes: 'Unit is 13 years old, recommend replacement consult' },
  { id: 4,  name: 'Donna Howell',    address: '1502 Rebsamen Park Rd, Little Rock AR', phone: '(501) 663-1502', email: 'donna.howell@yahoo.com',    systemType: 'Mini Split',           installYear: 2021, lastService: 'Feb 20, 2026', status: 'Up to Date',     notes: '' },
  { id: 5,  name: 'Brian Stokes',    address: '908 W Markham St, Little Rock AR',      phone: '(501) 221-9088', email: 'bstokes@business.net',      systemType: 'Central AC + Furnace', installYear: 2017, lastService: 'Dec 14, 2025', status: 'Due for Service', notes: 'Requested spring tune-up' },
  { id: 6,  name: 'Linda Park',      address: '3318 JFK Blvd, North Little Rock AR',   phone: '(501) 758-3318', email: 'linda.park@email.com',      systemType: 'Heat Pump',            installYear: 2020, lastService: 'Mar 1, 2026',  status: 'Up to Date',     notes: '' },
  { id: 7,  name: 'Frank Nguyen',    address: '5501 Baseline Rd, Little Rock AR',      phone: '(501) 562-5501', email: 'fnguyen@gmail.com',         systemType: 'Central AC + Furnace', installYear: 2011, lastService: 'Aug 22, 2025', status: 'Overdue',        notes: 'Unit is 15 years old, compressor showing wear' },
  { id: 8,  name: 'Sarah Mitchell',  address: '2109 S University Ave, Little Rock AR', phone: '(501) 664-2109', email: 's.mitchell@email.com',      systemType: 'Mini Split',           installYear: 2022, lastService: 'Jan 30, 2026', status: 'Up to Date',     notes: '' },
  { id: 9,  name: 'Carlos Rivera',   address: '6620 Colonel Glenn Rd, Little Rock AR', phone: '(501) 490-6620', email: 'carlos.r@outlook.com',      systemType: 'Central AC + Furnace', installYear: 2015, lastService: 'Oct 11, 2025', status: 'Due for Service', notes: 'Wants to discuss maintenance plan' },
  { id: 10, name: 'Amanda Foster',   address: '1844 Cantrell Rd, Little Rock AR',      phone: '(501) 372-1844', email: 'afoster@yahoo.com',         systemType: 'Heat Pump',            installYear: 2018, lastService: 'Feb 5, 2026',  status: 'Up to Date',     notes: '' },
]

// Sort by last name then first name
const SORTED_CUSTOMERS = [...CUSTOMERS].sort((a, b) => {
  const lastA = a.name.split(' ').pop()!.toLowerCase()
  const lastB = b.name.split(' ').pop()!.toLowerCase()
  if (lastA !== lastB) return lastA.localeCompare(lastB)
  return a.name.localeCompare(b.name)
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

const STATUS_STYLE: Record<CustomerStatus, React.CSSProperties> = {
  'Up to Date': {
    backgroundColor: 'rgba(0,194,124,0.1)',
    color: '#00C27C',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 5,
    padding: '2px 9px',
    whiteSpace: 'nowrap',
  },
  'Due for Service': {
    backgroundColor: 'rgba(245,158,11,0.1)',
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 5,
    padding: '2px 9px',
    whiteSpace: 'nowrap',
  },
  'Overdue': {
    backgroundColor: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 5,
    padding: '2px 9px',
    whiteSpace: 'nowrap',
  },
}

const STATS = [
  { label: 'Total Customers', value: 10, color: '#111827' },
  { label: 'Due for Service', value: 3,  color: '#F59E0B' },
  { label: 'Overdue',         value: 2,  color: '#ef4444' },
]

const SERVICE_HISTORY = [
  { date: 'Mar 2025', type: 'Annual Tune-Up', tech: 'T. Harris',  note: 'System checked, filters replaced, coils cleaned. Refrigerant levels verified.' },
  { date: 'Sep 2024', type: 'Service Call',   tech: 'M. Torres',  note: 'Capacitor replaced, refrigerant topped off. System restored to full operation.' },
  { date: 'Mar 2024', type: 'Annual Tune-Up', tech: 'T. Harris',  note: 'System in good working order. Minor belt wear noted, no action required.' },
]

function CustomerRow({
  customer,
  expanded,
  onToggle,
  note,
  onNoteChange,
}: {
  customer: Customer
  expanded: boolean
  onToggle: () => void
  note: string
  onNoteChange: (val: string) => void
}) {
  const age = 2026 - customer.installYear
  const ageOld = age >= 10

  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      {/* Row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 1fr auto',
          gap: 12,
          alignItems: 'center',
          padding: '13px 20px',
          background: expanded ? '#f9fafb' : 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Name + contact */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{customer.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 1 }}>{customer.address}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{customer.phone}</div>
        </div>

        {/* System info */}
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 1 }}>{customer.systemType} &middot; {customer.installYear}</div>
          <div style={{
            fontSize: 12,
            color: ageOld ? '#F59E0B' : '#6b7280',
            fontWeight: ageOld ? 600 : 400,
            marginBottom: 1,
          }}>
            {age} years old{ageOld ? ' — aging unit' : ''}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Last service: {customer.lastService}</div>
        </div>

        {/* Status badge */}
        <div>
          <span style={STATUS_STYLE[customer.status]}>{customer.status}</span>
        </div>

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Detail panel */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          {/* Contact + Equipment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 16, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Contact</p>
              <div style={{ fontSize: 13, color: '#111827', marginBottom: 3 }}>{customer.name}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 3 }}>{customer.address}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 3 }}>{customer.phone}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{customer.email}</div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Equipment</p>
              <div style={{ fontSize: 13, color: '#111827', marginBottom: 3 }}>{customer.systemType}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 3 }}>Installed {customer.installYear} &middot; {age} years old</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 3 }}>Last service: {customer.lastService}</div>
              <div style={{ marginTop: 4 }}>
                <span style={STATUS_STYLE[customer.status]}>{customer.status}</span>
              </div>
            </div>
          </div>

          {/* Service history */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Service History</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SERVICE_HISTORY.map((e, i) => (
                <div key={i} style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                }}>
                  <div style={{ minWidth: 68, flexShrink: 0 }}>
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

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Notes</p>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add notes about this customer..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                color: '#111827',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 8,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={{
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: '#00C27C',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Schedule Service
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CRM({ sessionId: _sessionId, businessName }: CRMProps) {
  const [search, setSearch] = useState('')
  const [openLetters, setOpenLetters] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<number | null>(null)
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

  const toggleCustomer = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <p style={LABEL_STYLE}>Customer Relationship Management</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Customers</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{businessName}</p>
      </div>

      {/* Stats — 3 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {STATS.map((s) => (
          <div key={s.label} style={CARD}>
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
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        {isSearching ? (
          /* Flat search results */
          filteredFlat.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 14, color: '#9ca3af' }}>
              No customers match your search.
            </div>
          ) : (
            filteredFlat.map((c) => (
              <CustomerRow
                key={c.id}
                customer={c}
                expanded={expandedId === c.id}
                onToggle={() => toggleCustomer(c.id)}
                note={notes[c.id]}
                onNoteChange={(val) => setNotes((prev) => ({ ...prev, [c.id]: val }))}
              />
            ))
          )
        ) : (
          /* Grouped alphabetical view */
          letters.map((letter) => {
            const isOpen = openLetters.has(letter)
            const group = grouped[letter]
            return (
              <div key={letter}>
                {/* Letter header */}
                <button
                  onClick={() => toggleLetter(letter)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 20px',
                    background: '#f9fafb',
                    border: 'none',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', minWidth: 16 }}>
                    {letter}
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{group.length}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Customers in this group */}
                {isOpen && group.map((c) => (
                  <CustomerRow
                    key={c.id}
                    customer={c}
                    expanded={expandedId === c.id}
                    onToggle={() => toggleCustomer(c.id)}
                    note={notes[c.id]}
                    onNoteChange={(val) => setNotes((prev) => ({ ...prev, [c.id]: val }))}
                  />
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
