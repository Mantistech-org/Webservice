'use client'

import { useState, useEffect, useCallback } from 'react'

interface CRMProps {
  clientToken: string
  businessName: string
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  project_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  equipment_type: string | null
  install_year: number | null
  serial_number: string | null
  last_service_date: string | null
  notes: string | null
  source: string | null
  service_status: string
  maintenance_plan?: boolean
  lifetime_value: number
  created_at: string
  updated_at: string
}

interface HistoryEntry {
  id: string
  customer_id: string
  service_date: string
  service_type: string
  technician: string | null
  cost: number | string
  notes: string | null
  created_at: string
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

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  'Up to Date':      { backgroundColor: 'rgba(0,194,124,0.1)',  color: '#00C27C', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
  'Due for Service': { backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
  'Overdue':         { backgroundColor: 'rgba(239,68,68,0.1)',  color: '#ef4444', fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap' },
}

const SERVICE_TYPES = [
  'Annual Tune-Up',
  'Filter Replacement',
  'Repair Visit',
  'Replacement Consult',
  'Emergency Service',
  'Other',
]

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  color: '#111827',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  backgroundColor: '#ffffff',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function fmtDate(d: string): string {
  try {
    return new Date(d + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Add Customer modal ────────────────────────────────────────────────────────

function AddCustomerModal({
  clientToken,
  onClose,
  onAdded,
}: {
  clientToken: string
  onClose: () => void
  onAdded: (customer: Customer) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [equipmentType, setEquipmentType] = useState('')
  const [installYear, setInstallYear] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [lastServiceDate, setLastServiceDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    setFormError('')
    try {
      const res = await fetch(`/api/client/${clientToken}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          equipment_type: equipmentType.trim() || undefined,
          install_year: installYear ? parseInt(installYear, 10) : undefined,
          serial_number: serialNumber.trim() || undefined,
          last_service_date: lastServiceDate || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError((data as { error?: string }).error ?? 'Failed to add customer')
        return
      }
      onAdded((data as { customer: Customer }).customer)
    } catch {
      setFormError('Failed to add customer')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = name.trim().length > 0 && !submitting

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Add Customer</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>
                Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                style={INPUT_STYLE}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" style={INPUT_STYLE} />
              </div>
            </div>

            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, OH" style={INPUT_STYLE} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Equipment Type</label>
                <input value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} placeholder="Central AC, Heat Pump..." style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Install Year</label>
                <input
                  type="number"
                  min="1970"
                  max={new Date().getFullYear()}
                  value={installYear}
                  onChange={(e) => setInstallYear(e.target.value)}
                  placeholder="2018"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Serial Number</label>
                <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN-XXXXXXXXX" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Last Service Date</label>
                <input type="date" value={lastServiceDate} onChange={(e) => setLastServiceDate(e.target.value)} style={INPUT_STYLE} />
              </div>
            </div>

            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this customer..."
                rows={3}
                style={{ ...INPUT_STYLE, resize: 'vertical' }}
              />
            </div>

            {formError && <div style={{ fontSize: 13, color: '#ef4444' }}>{formError}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 18px', fontSize: 13, backgroundColor: 'transparent', color: '#6b7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, backgroundColor: canSubmit ? '#00C27C' : '#d1d5db', color: '#ffffff', border: 'none', borderRadius: 8, cursor: canSubmit ? 'pointer' : 'default' }}
            >
              {submitting ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Customer card ─────────────────────────────────────────────────────────────

function CustomerCard({
  customer,
  clientToken,
  businessName,
  onNoteChange,
  onRefresh,
  onDelete,
}: {
  customer: Customer
  clientToken: string
  businessName: string
  onNoteChange: (id: string, note: string) => void
  onRefresh: () => void
  onDelete: (id: string) => void
}) {
  const firstName = customer.name.split(' ')[0]

  const [history, setHistory]         = useState<HistoryEntry[]>([])
  const [histLoading, setHistLoading] = useState(true)
  const [note, setNote]               = useState(customer.notes ?? '')

  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUpTab,  setFollowUpTab]  = useState<'sms' | 'email'>('sms')
  const [smsText,      setSmsText]      = useState(
    `Hi ${firstName}, this is ${businessName}. We noticed it's been a while since your last HVAC service. We'd love to schedule a quick check-up to keep your system running smoothly. Reply here or call us to book.`
  )
  const [emailSubject, setEmailSubject] = useState(`Time for your HVAC check-up, ${firstName}`)
  const [emailBody,    setEmailBody]    = useState(
    `Hi ${firstName},\n\nWe hope you're doing well. We're reaching out because it's been a while since your last HVAC service${customer.address ? ` at ${customer.address}` : ''}.\n\nRegular maintenance keeps your system running efficiently and prevents unexpected breakdowns. We'd love to schedule a check-up at your convenience.\n\nGive us a call or reply to this email to book your appointment.\n\nBest,\n${businessName}`
  )

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [serviceType,  setServiceType]  = useState(SERVICE_TYPES[0])
  const [serviceDate,  setServiceDate]  = useState('')
  const [techName,     setTechName]     = useState('')
  const [serviceCost,  setServiceCost]  = useState('')
  const [schedNotes,   setSchedNotes]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,       setDeleting]       = useState(false)

  const [toast, setToast] = useState('')

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/client/${clientToken}/customers/${customer.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(customer.id)
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    if (!clientToken) { setHistLoading(false); return }
    fetch(`/api/client/${clientToken}/customers/${customer.id}/history`)
      .then((r) => r.json())
      .then((data: { history?: HistoryEntry[] }) => setHistory(data.history ?? []))
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [clientToken, customer.id])

  const handleNoteBlur = async () => {
    if (note === (customer.notes ?? '')) return
    try {
      await fetch(`/api/client/${clientToken}/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note }),
      })
      onNoteChange(customer.id, note)
    } catch {
      // silently ignore — note will re-sync on next render
    }
  }

  const handleScheduleSubmit = async () => {
    if (!serviceDate || !serviceCost || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/client/${clientToken}/customers/${customer.id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_date: serviceDate,
          service_type: serviceType,
          technician: techName || undefined,
          cost: parseFloat(serviceCost),
          notes: schedNotes || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json() as { entry: HistoryEntry }
        setHistory((prev) => [data.entry, ...prev])
        setScheduleOpen(false)
        setServiceDate('')
        setTechName('')
        setServiceCost('')
        setSchedNotes('')
        onRefresh()
        showToast(`Service recorded for ${customer.name}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const installYear   = customer.install_year
  const currentYear   = new Date().getFullYear()
  const age           = installYear ? currentYear - installYear : null
  const ageWarning    = age !== null && age >= 10
  const warrantyExp   = age !== null && age > 10
  const underWarranty = age !== null && age < 5

  const canBook = serviceDate.length > 0 && serviceCost.length > 0 && !submitting

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

      {/* Follow-up modal — UI only */}
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
                  style={{ padding: '9px 12px', fontSize: 13, color: '#111827', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
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
                onClick={() => { setFollowUpOpen(false); showToast(`Follow-up sent to ${customer.name}`) }}
                style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Service modal */}
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
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Date</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Technician</label>
                <input
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="Technician name"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
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
                onClick={handleScheduleSubmit}
                disabled={!canBook}
                style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, backgroundColor: canBook ? '#00C27C' : '#d1d5db', color: '#ffffff', border: 'none', borderRadius: 8, cursor: canBook ? 'pointer' : 'default' }}
              >
                {submitting ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card body */}
      <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 20, backgroundColor: '#ffffff', margin: '8px 0' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{customer.name}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>LTV: ${(customer.lifetime_value ?? 0).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {customer.maintenance_plan && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.1)', borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                On Maintenance Plan
              </span>
            )}
            <span style={STATUS_STYLE[customer.service_status] ?? STATUS_STYLE['Up to Date']}>
              {customer.service_status}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>

          {/* Contact */}
          <div>
            <p style={COL_LABEL}>Contact</p>
            {customer.phone   && <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{customer.phone}</div>}
            {customer.email   && <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{customer.email}</div>}
            {customer.address && <div style={{ fontSize: 13, color: '#374151' }}>{customer.address}</div>}
            {!customer.phone && !customer.email && !customer.address && (
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No contact info</div>
            )}
          </div>

          {/* Equipment */}
          <div>
            <p style={COL_LABEL}>Equipment</p>
            {customer.equipment_type && (
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{customer.equipment_type}</div>
            )}
            {installYear && age !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: ageWarning ? '#F59E0B' : '#374151', fontWeight: ageWarning ? 600 : 400 }}>
                  {installYear} &middot; {age} {age === 1 ? 'year' : 'years'} old
                </span>
                {ageWarning && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>
            )}
            {ageWarning && <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 4 }}>Recommend replacement consult</div>}
            {customer.serial_number && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>SN: {customer.serial_number}</div>}
            {warrantyExp && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 4, padding: '2px 8px' }}>Warranty Expired</span>
            )}
            {underWarranty && !warrantyExp && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.08)', borderRadius: 4, padding: '2px 8px' }}>Under Warranty</span>
            )}
          </div>

          {/* Service History */}
          <div>
            <p style={COL_LABEL}>Service History</p>
            {histLoading ? (
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Loading...</div>
            ) : history.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9ca3af' }}>No service history yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.slice(0, 4).map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: i === 0 ? '#00C27C' : '#d1d5db', marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>{fmtDate(h.service_date)}</div>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{h.service_type}</div>
                      {(h.technician || h.cost) && (
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {h.technician ? `Tech: ${h.technician}` : ''}
                          {h.technician && h.cost ? ' \u00b7 ' : ''}
                          {h.cost ? `$${Number(h.cost).toLocaleString()}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
          <p style={COL_LABEL}>Notes</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add notes..."
            rows={2}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 13, color: '#111827',
              backgroundColor: '#f9fafb', border: '1px solid rgba(0,0,0,0.09)',
              borderRadius: 7, resize: 'vertical', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 10,
            }}
          />

          {customer.service_status === 'Overdue' && customer.last_service_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#00C27C', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#00C27C' }}>
                Automated follow-up SMS scheduled for {addDays(customer.last_service_date, 3)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                border: confirmDelete ? 'none' : '1px solid #ef4444',
                color: confirmDelete ? '#ffffff' : '#ef4444',
                backgroundColor: confirmDelete ? '#ef4444' : 'transparent',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete Customer'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
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
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CRM({ clientToken, businessName }: CRMProps) {
  const [customers, setCustomers]     = useState<Customer[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch]           = useState('')
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    if (!clientToken) { setLoading(false); return }
    try {
      const res = await fetch(`/api/client/${clientToken}/customers`)
      const data = await res.json() as { customers?: Customer[]; error?: string }
      if (res.ok) {
        setCustomers(data.customers ?? [])
      } else {
        setError(data.error ?? 'Failed to load customers')
      }
    } catch {
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [clientToken])

  useEffect(() => { void fetchCustomers() }, [fetchCustomers])

  const stats = [
    { label: 'Total Customers',     value: customers.length,                                                          color: '#111827' },
    { label: 'On Maintenance Plan', value: customers.filter((c) => c.maintenance_plan === true).length,               color: '#00C27C' },
    { label: 'Due for Service',     value: customers.filter((c) => c.service_status === 'Due for Service').length,    color: '#F59E0B' },
    { label: 'Overdue',             value: customers.filter((c) => c.service_status === 'Overdue').length,            color: '#ef4444' },
  ]

  const sortedCustomers = [...customers].sort((a, b) => {
    const lastA = a.name.split(' ').pop()!.toLowerCase()
    const lastB = b.name.split(' ').pop()!.toLowerCase()
    return lastA !== lastB ? lastA.localeCompare(lastB) : a.name.localeCompare(b.name)
  })

  const isSearching = search.trim().length > 0

  const filteredFlat = isSearching
    ? sortedCustomers.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.address ?? '').toLowerCase().includes(q) ||
          (c.phone ?? '').includes(search)
        )
      })
    : []

  const grouped = groupByLetter(sortedCustomers)
  const letters = Object.keys(grouped).sort()

  const handleNoteChange = (id: string, note: string) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, notes: note } : c)))
  }

  const handleCustomerAdded = (customer: Customer) => {
    setCustomers((prev) => [...prev, customer])
    setShowAddModal(false)
  }

  const handleCustomerDeleted = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={LABEL_STYLE}>Customer Relationship Management</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Customers</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{businessName}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, backgroundColor: 'transparent', color: '#00C27C', border: '1.5px solid #00C27C', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Add Customer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map((s) => (
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

      {loading ? (
        <div style={{ ...OUTER_CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>
          Loading customers...
        </div>
      ) : error ? (
        <div style={{ ...OUTER_CARD, textAlign: 'center', padding: '40px 20px', color: '#ef4444', fontSize: 14 }}>
          {error}
        </div>
      ) : isSearching ? (
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
                clientToken={clientToken}
                businessName={businessName}
                onNoteChange={handleNoteChange}
                onRefresh={fetchCustomers}
                onDelete={handleCustomerDeleted}
              />
            ))
          )}
        </div>
      ) : letters.length === 0 ? (
        <div style={{ ...OUTER_CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>
          No customers yet. Add your first customer or wait for a booking to come in.
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
                        <span style={STATUS_STYLE[c.service_status] ?? STATUS_STYLE['Up to Date']}>{c.service_status}</span>
                        <svg
                          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s', flexShrink: 0, marginLeft: 8 }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <CustomerCard
                            customer={c}
                            clientToken={clientToken}
                            businessName={businessName}
                            onNoteChange={handleNoteChange}
                            onRefresh={fetchCustomers}
                            onDelete={handleCustomerDeleted}
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

      {showAddModal && (
        <AddCustomerModal
          clientToken={clientToken}
          onClose={() => setShowAddModal(false)}
          onAdded={handleCustomerAdded}
        />
      )}
    </div>
  )
}
