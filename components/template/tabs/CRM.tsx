'use client'

import { useState } from 'react'

interface CRMProps {
  sessionId: string
  businessName: string
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CustomerStatus = 'Up to Date' | 'Due for Service' | 'Overdue'

interface MaintenancePlan {
  active: boolean
  name: string
  includes: string
  renewalDate: string
  monthlyRate: number
}

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
  maintenancePlan: MaintenancePlan | null
  lifetimeValue: number
  notes: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const PLAN: MaintenancePlan = {
  active: true,
  name: 'Annual Comfort Plan',
  includes: 'Two tune-ups per year, priority scheduling, 15% parts discount',
  renewalDate: '',
  monthlyRate: 19,
}

void PLAN

const CUSTOMERS: Customer[] = []

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

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  'Up to Date':      { backgroundColor: 'rgba(0,194,124,0.1)',  color: '#00C27C', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
  'Due for Service': { backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
  'Overdue':         { backgroundColor: 'rgba(239,68,68,0.1)',  color: '#ef4444', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
}

const STATS = [
  { label: 'Total Customers',     value: 0, color: '#111827' },
  { label: 'On Maintenance Plan', value: 0, color: '#00C27C' },
  { label: 'Due for Service',     value: 0, color: '#F59E0B' },
  { label: 'Overdue',             value: 0, color: '#ef4444' },
]

const SERVICE_TYPES = ['Annual Tune-Up', 'Filter Replacement', 'Repair Visit', 'Replacement Consult', 'Other']
const TIME_OPTIONS  = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM']

// ── Customer card ─────────────────────────────────────────────────────────────

function CustomerCard({
  customer,
  note,
  onNoteChange,
  businessName,
}: {
  customer: Customer
  note: string
  onNoteChange: (val: string) => void
  businessName: string
}) {
  const age          = 2026 - customer.installYear
  const ageWarning   = age >= 10
  const warrantyExp  = age > 10
  const underWarranty = age < 5
  const firstName    = customer.name.split(' ')[0]

  const history = [
    { date: customer.lastService,                  type: 'Annual Tune-Up',       tech: 'Marcus R.', cost: '$89'  },
    { date: shiftMonths(customer.lastService, 12), type: 'Filter Replacement',   tech: 'Marcus R.', cost: '$45'  },
    { date: shiftMonths(customer.lastService, 30), type: 'Refrigerant Recharge', tech: 'James K.',  cost: '$185' },
  ]

  const [followUpOpen, setFollowUpOpen]   = useState(false)
  const [followUpTab,  setFollowUpTab]    = useState<'sms' | 'email'>('sms')
  const [smsText,      setSmsText]        = useState(
    `Hi ${firstName}, this is ${businessName}. We noticed it's been a while since your last HVAC service. We'd love to schedule a quick check-up to keep your system running smoothly. Reply here or call us to book.`
  )
  const [emailSubject, setEmailSubject]   = useState(`Time for your HVAC check-up, ${firstName}`)
  const [emailBody,    setEmailBody]      = useState(
    `Hi ${firstName},\n\nWe hope you're doing well. We're reaching out because it's been a while since your last HVAC service at ${customer.address}.\n\nRegular maintenance keeps your system running efficiently and prevents unexpected breakdowns. We'd love to schedule a check-up at your convenience.\n\nGive us a call or reply to this email to book your appointment.\n\nBest,\n${businessName}`
  )

  const [scheduleOpen,  setScheduleOpen]  = useState(false)
  const [serviceType,   setServiceType]   = useState(SERVICE_TYPES[0])
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState(TIME_OPTIONS[0])
  const [schedNotes,    setSchedNotes]    = useState('')

  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSendFollowUp = () => {
    setFollowUpOpen(false)
    showToast(`Follow-up sent to ${customer.name}`)
  }

  const handleBookAppointment = () => {
    if (!preferredDate) return
    setScheduleOpen(false)
    showToast(`Appointment scheduled for ${customer.name} on ${new Date(preferredDate + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${preferredTime}`)
    setPreferredDate('')
    setSchedNotes('')
  }

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          backgroundColor: '#111827', color: '#ffffff',
          padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      {followUpOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setFollowUpOpen(false) }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
              Send Follow-up to {customer.name}
            </h2>

            <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 16 }}>
              {(['sms', 'email'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFollowUpTab(tab)}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', backgroundColor: 'transparent',
                    color: followUpTab === tab ? '#111827' : '#6b7280',
                    borderBottom: followUpTab === tab ? '2px solid #00C27C' : '2px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  {tab === 'sms' ? 'SMS' : 'Email'}
                </button>
              ))}
            </div>

            {followUpTab === 'sms' ? (
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={5}
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, color: '#111827', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject"
                  style={{ padding: '9px 12px', fontSize: 13, color: '#111827', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }}
                />
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, color: '#111827', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => setFollowUpOpen(false)}
                style={{ padding: '9px 18px', fontSize: 13, backgroundColor: 'transparent', color: '#6b7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendFollowUp}
                style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {scheduleOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setScheduleOpen(false) }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>
              Schedule Service for {customer.name}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Customer</label>
                <input
                  value={customer.name}
                  readOnly
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#6b7280', backgroundColor: '#f9fafb', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Preferred Date</label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Preferred Time</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  placeholder="Any details for the technician..."
                  rows={3}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setScheduleOpen(false)}
                style={{ padding: '9px 18px', fontSize: 13, backgroundColor: 'transparent', color: '#6b7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                disabled={!preferredDate}
                style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, backgroundColor: preferredDate ? '#00C27C' : '#d1d5db', color: '#ffffff', border: 'none', borderRadius: 8, cursor: preferredDate ? 'pointer' : 'default' }}
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 20, backgroundColor: '#ffffff', margin: '8px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{customer.name}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>LTV: ${customer.lifetimeValue.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {customer.maintenancePlan && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.1)', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                On Maintenance Plan
              </span>
            )}
            <span style={STATUS_STYLE[customer.status]}>{customer.status}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>

          <div>
            <p style={COL_LABEL}>Contact</p>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{customer.phone}</div>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{customer.email}</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{customer.address}</div>
          </div>

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
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
            {ageWarning && <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 4 }}>Recommend replacement consult</div>}
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>SN: {customer.serialNumber}</div>
            {warrantyExp && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 4, padding: '2px 8px' }}>Warranty Expired</span>
            )}
            {underWarranty && !warrantyExp && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.08)', borderRadius: 4, padding: '2px 8px' }}>Under Warranty</span>
            )}

            {customer.maintenancePlan && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={COL_LABEL}>Maintenance Plan</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{customer.maintenancePlan.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.1)', borderRadius: 4, padding: '1px 7px' }}>Active</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>{customer.maintenancePlan.includes}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>Renews: {customer.maintenancePlan.renewalDate}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>${customer.maintenancePlan.monthlyRate}/mo</div>
              </div>
            )}
          </div>

          <div>
            <p style={COL_LABEL}>Service History</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: i === 0 ? '#00C27C' : '#d1d5db', marginTop: 4, flexShrink: 0 }} />
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

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
          <p style={COL_LABEL}>Notes</p>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add notes..."
            rows={2}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 13, color: '#111827',
              backgroundColor: '#f9fafb', border: '1px solid rgba(0,0,0,0.09)',
              borderRadius: 7, resize: 'vertical', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 10,
            }}
          />

          {customer.status === 'Overdue' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#00C27C', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#00C27C' }}>
                Automated follow-up SMS scheduled for {addDays(customer.lastService, 3)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={() => setFollowUpOpen(true)}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, border: '1.5px solid #00C27C', borderRadius: 7, backgroundColor: 'transparent', color: '#00C27C', cursor: 'pointer' }}
            >
              Send Follow-up
            </button>
            <button
              onClick={() => setScheduleOpen(true)}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 7, backgroundColor: '#00C27C', color: '#ffffff', cursor: 'pointer' }}
            >
              Schedule Service
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CRM({ sessionId: _sessionId, businessName }: CRMProps) {
  const [search, setSearch]         = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [notes, setNotes]           = useState<Record<number, string>>(
    Object.fromEntries(CUSTOMERS.map((c) => [c.id, c.notes]))
  )

  const isSearching = search.trim().length > 0

  const filteredFlat = isSearching
    ? SORTED_CUSTOMERS.filter((c) => {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.phone.includes(search)
      })
    : []

  const grouped = groupByLetter(SORTED_CUSTOMERS)
  const letters = Object.keys(grouped).sort()

  const updateNote = (id: number, val: string) =>
    setNotes((prev) => ({ ...prev, [id]: val }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={LABEL_STYLE}>Customer Relationship Management</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Customers</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{businessName}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATS.map((s) => (
          <div key={s.label} style={OUTER_CARD}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, address, or phone..."
        style={{
          width: '100%', padding: '10px 14px', fontSize: 14, color: '#111827',
          backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />

      {isSearching ? (
        <div>
          {filteredFlat.length === 0 ? (
            <div style={{ ...OUTER_CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>
              No customers match your search.
            </div>
          ) : (
            filteredFlat.map((c) => (
              <CustomerCard key={c.id} customer={c} note={notes[c.id]} onNoteChange={(v) => updateNote(c.id, v)} businessName={businessName} />
            ))
          )}
        </div>
      ) : letters.length === 0 ? (
        <div style={{ ...OUTER_CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>
          No customers yet. Import your customer list to get started.
        </div>
      ) : (
        <div style={{ ...OUTER_CARD, padding: 0, overflow: 'hidden' }}>
          {letters.map((letter) => {
            const group = grouped[letter]
            return (
              <div key={letter}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{letter}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>({group.length})</span>
                </div>

                {group.map((c) => {
                  const isExpanded = expandedId === c.id
                  return (
                    <div key={c.id}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          paddingLeft: 24, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                          backgroundColor: isExpanded ? '#f9fafb' : '#ffffff',
                          border: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#111827' }}>{c.name}</span>
                        <span style={STATUS_STYLE[c.status]}>{c.status}</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s', flexShrink: 0, marginLeft: 8 }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <CustomerCard
                            customer={c}
                            note={notes[c.id]}
                            onNoteChange={(v) => updateNote(c.id, v)}
                            businessName={businessName}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
