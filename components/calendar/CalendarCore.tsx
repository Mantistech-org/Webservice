'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalEvent {
  id: string
  title: string
  event_date: string       // YYYY-MM-DD
  event_time?: string | null
  notes?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  status: 'confirmed' | 'cancelled' | 'pending'
  source: 'manual' | 'website_booking'
  created_at?: string
}

interface EmailAutomation {
  id: string
  trigger: string
  subject: string
  body: string
  enabled: boolean
}

interface DaySetting { enabled: boolean; start: string; end: string }

export interface CalendarCoreProps {
  mode: 'demo' | 'live'
  clientToken?: string
  businessName?: string
  darkMode?: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 8
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})
const TRIGGER_LABELS: Record<string, string> = {
  booking_confirmed:       'Booking Confirmed',
  appointment_cancelled:   'Appointment Cancelled',
  appointment_rescheduled: 'Appointment Rescheduled',
  appointment_reminder:    'Appointment Reminder',
}
const DEFAULT_AUTOMATIONS: Omit<EmailAutomation, 'id'>[] = [
  { trigger: 'booking_confirmed',       subject: 'Your appointment is confirmed',         body: 'Hi [customer_name], your appointment on [date] at [time] is confirmed. We look forward to seeing you.',        enabled: true },
  { trigger: 'appointment_cancelled',   subject: 'Your appointment has been cancelled',   body: 'Hi [customer_name], your appointment on [date] at [time] has been cancelled. Please contact us to reschedule.', enabled: true },
  { trigger: 'appointment_rescheduled', subject: 'Your appointment has been rescheduled', body: 'Hi [customer_name], your appointment has been rescheduled to [date] at [time].',                                  enabled: true },
  { trigger: 'appointment_reminder',    subject: 'Reminder: upcoming appointment',        body: 'Hi [customer_name], this is a reminder that you have an appointment on [date] at [time].',                        enabled: true },
]

// ── Demo mock data ─────────────────────────────────────────────────────────────

function md(day: number, mo = 0): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + mo, Math.min(day, new Date(now.getFullYear(), now.getMonth() + mo + 1, 0).getDate()))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEMO_EVENTS: CalEvent[] = [
  { id: 'h1', title: 'Consultation',     event_date: md(8,  -1), event_time: '09:00', customer_name: 'George Patel',    customer_email: 'gpatel@gmail.com',   customer_phone: '(555) 100-2200', notes: '',                           status: 'confirmed', source: 'manual'          },
  { id: 'h2', title: 'Discovery Call',   event_date: md(15, -1), event_time: '10:30', customer_name: 'Sandra Lin',      customer_email: 'slin@outlook.com',   customer_phone: '(555) 200-3300', notes: '',                           status: 'confirmed', source: 'website_booking' },
  { id: 'h3', title: 'Strategy Session', event_date: md(22, -1), event_time: '13:00', customer_name: 'Felix Morgan',    customer_email: 'fmorgan@yahoo.com',  customer_phone: '(555) 300-4400', notes: '',                           status: 'cancelled', source: 'manual'          },
  { id: '1',  title: 'Consultation',     event_date: md(2),      event_time: '09:00', customer_name: 'Sarah Mitchell',  customer_email: 'sarah@gmail.com',    customer_phone: '(555) 201-3344', notes: 'Referred by a colleague',    status: 'confirmed', source: 'manual'          },
  { id: '2',  title: 'Strategy Session', event_date: md(3),      event_time: '10:30', customer_name: 'Marcus Webb',     customer_email: 'mwebb@outlook.com',  customer_phone: '(555) 389-2211', notes: '',                           status: 'confirmed', source: 'website_booking' },
  { id: '3',  title: 'Discovery Call',   event_date: md(4),      event_time: '08:00', customer_name: 'Priya Sharma',    customer_email: 'priya@yahoo.com',    customer_phone: '(555) 445-6677', notes: 'Interested in full package', status: 'confirmed', source: 'website_booking' },
  { id: '4',  title: 'Follow-up',        event_date: md(4),      event_time: '14:00', customer_name: 'Derek Collins',   customer_email: 'dcollins@email.com', customer_phone: '(555) 512-0099', notes: '',                           status: 'confirmed', source: 'manual'          },
  { id: '5',  title: 'Onboarding',       event_date: md(5),      event_time: '09:00', customer_name: 'Amanda Torres',   customer_email: 'atorres@gmail.com',  customer_phone: '(555) 623-8877', notes: 'First session',             status: 'confirmed', source: 'manual'          },
  { id: '6',  title: 'Consultation',     event_date: md(5),      event_time: '11:00', customer_name: 'Ryan Nguyen',     customer_email: 'ryan@outlook.com',   customer_phone: '(555) 734-9900', notes: '',                           status: 'pending',   source: 'website_booking' },
  { id: '7',  title: 'Check-in',         event_date: md(5),      event_time: '14:30', customer_name: 'Lisa Fernandez',  customer_email: 'lisa@gmail.com',     customer_phone: '(555) 845-1122', notes: '',                           status: 'pending',   source: 'manual'          },
  { id: '8',  title: 'Review Meeting',   event_date: md(6),      event_time: '10:00', customer_name: 'Tom Blackwell',   customer_email: 'tblack@email.com',   customer_phone: '(555) 956-2244', notes: '',                           status: 'confirmed', source: 'manual'          },
  { id: '9',  title: 'Strategy Session', event_date: md(7),      event_time: '09:30', customer_name: 'Keisha Johnson',  customer_email: 'kjohnson@gmail.com', customer_phone: '(555) 677-3355', notes: '',                           status: 'confirmed', source: 'website_booking' },
  { id: '10', title: 'Consultation',     event_date: md(9),      event_time: '08:00', customer_name: 'Nathan Cross',    customer_email: 'ncross@yahoo.com',   customer_phone: '(555) 178-4466', notes: 'Budget discussion first',    status: 'pending',   source: 'manual'          },
  { id: '11', title: 'Onboarding',       event_date: md(10),     event_time: '11:00', customer_name: 'Olivia Park',     customer_email: 'opark@gmail.com',    customer_phone: '(555) 289-5577', notes: '',                           status: 'confirmed', source: 'manual'          },
  { id: '12', title: 'Discovery Call',   event_date: md(11),     event_time: '13:00', customer_name: 'Benjamin Holt',   customer_email: 'bholt@outlook.com',  customer_phone: '(555) 390-6688', notes: '',                           status: 'confirmed', source: 'website_booking' },
  { id: '13', title: 'Follow-up',        event_date: md(12),     event_time: '09:00', customer_name: 'Chloe Rivera',    customer_email: 'crivera@gmail.com',  customer_phone: '(555) 401-7799', notes: '',                           status: 'cancelled', source: 'manual'          },
  { id: '14', title: 'Check-in',         event_date: md(13),     event_time: '10:30', customer_name: 'James Patterson', customer_email: 'jpatterson@email.com', customer_phone: '(555) 512-8800', notes: '',                        status: 'confirmed', source: 'manual'          },
  { id: '15', title: 'Consultation',     event_date: md(14),     event_time: '09:00', customer_name: 'Sofia Chen',      customer_email: 'sofia@gmail.com',    customer_phone: '(555) 623-9911', notes: 'Referred by Priya',          status: 'pending',   source: 'website_booking' },
  { id: '16', title: 'Review Meeting',   event_date: md(16),     event_time: '14:00', customer_name: 'Tyler Marsh',     customer_email: 'tmarsh@yahoo.com',   customer_phone: '(555) 734-0022', notes: '',                           status: 'confirmed', source: 'manual'          },
  { id: '17', title: 'Strategy Session', event_date: md(17),     event_time: '10:00', customer_name: 'Dana Reeves',     customer_email: 'dreeves@gmail.com',  customer_phone: '(555) 845-1133', notes: '',                           status: 'confirmed', source: 'manual'          },
  { id: '18', title: 'Onboarding',       event_date: md(18),     event_time: '08:30', customer_name: 'Carlos Mendez',   customer_email: 'cmendez@outlook.com', customer_phone: '(555) 956-2244', notes: 'Has multiple locations',    status: 'confirmed', source: 'website_booking' },
  { id: '19', title: 'Check-in',         event_date: md(19),     event_time: '11:30', customer_name: 'Rachel Kim',      customer_email: 'rkim@gmail.com',     customer_phone: '(555) 067-3355', notes: '',                           status: 'pending',   source: 'manual'          },
  { id: '20', title: 'Follow-up',        event_date: md(20),     event_time: '13:00', customer_name: 'Aaron Fields',    customer_email: 'afields@email.com',  customer_phone: '(555) 178-4466', notes: '',                           status: 'confirmed', source: 'manual'          },
  { id: '21', title: 'Discovery Call',   event_date: md(21),     event_time: '09:00', customer_name: 'Megan Stone',     customer_email: 'mstone@gmail.com',   customer_phone: '(555) 289-5577', notes: '',                           status: 'cancelled', source: 'website_booking' },
  { id: '22', title: 'Consultation',     event_date: md(23),     event_time: '10:00', customer_name: 'David Wu',        customer_email: 'dwu@yahoo.com',      customer_phone: '(555) 390-6688', notes: 'Prefers afternoons',         status: 'confirmed', source: 'manual'          },
  { id: '23', title: 'Review Meeting',   event_date: md(24),     event_time: '14:00', customer_name: 'Emily Grant',     customer_email: 'egrant@gmail.com',   customer_phone: '(555) 401-7799', notes: '',                           status: 'pending',   source: 'website_booking' },
  { id: '24', title: 'Strategy Session', event_date: md(25),     event_time: '09:30', customer_name: 'Chris Lawson',    customer_email: 'clawson@outlook.com', customer_phone: '(555) 512-8800', notes: '',                         status: 'confirmed', source: 'manual'          },
  { id: '25', title: 'Onboarding',       event_date: md(26),     event_time: '11:00', customer_name: 'Natalie Brooks',  customer_email: 'nbrooks@gmail.com',  customer_phone: '(555) 623-9911', notes: '',                           status: 'confirmed', source: 'website_booking' },
  { id: '26', title: 'Check-in',         event_date: md(27),     event_time: '13:30', customer_name: 'Jason Hall',      customer_email: 'jhall@email.com',    customer_phone: '(555) 734-0022', notes: '',                           status: 'pending',   source: 'manual'          },
  { id: '27', title: 'Consultation',     event_date: md(28),     event_time: '09:00', customer_name: 'Isabel Torres',   customer_email: 'itorres@gmail.com',  customer_phone: '(555) 845-1133', notes: '',                           status: 'confirmed', source: 'manual'          },
  { id: '28', title: 'Follow-up',        event_date: md(29),     event_time: '10:00', customer_name: 'Andrew Mills',    customer_email: 'amills@yahoo.com',   customer_phone: '(555) 956-2244', notes: '',                           status: 'confirmed', source: 'website_booking' },
  { id: '29', title: 'Discovery Call',   event_date: md(30),     event_time: '14:30', customer_name: 'Victoria Lane',   customer_email: 'vlane@gmail.com',    customer_phone: '(555) 067-3355', notes: 'Wants long-term partnership', status: 'pending',  source: 'manual'          },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const cells: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function fmt12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${suffix}`
}

function pillLabel(e: CalEvent): string {
  const time = e.event_time ? fmt12(e.event_time) + ' ' : ''
  const name = e.customer_name?.split(' ')[0] || e.title.slice(0, 12)
  return time + name
}

function eventStyle(status: string, source: string): React.CSSProperties {
  if (status === 'cancelled') return { backgroundColor: 'rgba(200,50,50,0.14)', color: '#cc4444', border: '1px solid rgba(200,50,50,0.3)' }
  if (status === 'pending')   return { backgroundColor: 'rgba(200,150,0,0.14)', color: '#bb8800', border: '1px solid rgba(200,150,0,0.3)' }
  if (source === 'website_booking') return { backgroundColor: 'rgba(50,130,220,0.16)', color: '#5599ee', border: '1px solid rgba(50,130,220,0.3)' }
  return { backgroundColor: 'rgba(0,180,90,0.14)', color: '#00aa55', border: '1px solid rgba(0,180,90,0.3)' }
}

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'cancelled') return { color: '#cc4444', borderColor: 'rgba(200,50,50,0.35)',  backgroundColor: 'rgba(200,50,50,0.08)' }
  if (status === 'pending')   return { color: '#bb8800', borderColor: 'rgba(200,150,0,0.35)',  backgroundColor: 'rgba(200,150,0,0.08)' }
  return                              { color: '#00aa55', borderColor: 'rgba(0,170,85,0.35)',  backgroundColor: 'rgba(0,170,85,0.08)' }
}

// ── CreatePanel ───────────────────────────────────────────────────────────────

function CreatePanel({
  defaultDate, darkMode, onSave, onClose,
}: {
  defaultDate: string
  darkMode?: boolean
  onSave: (data: Omit<CalEvent, 'id' | 'created_at'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: '', event_date: defaultDate, event_time: '09:00',
    customer_name: '', customer_email: '', customer_phone: '', notes: '',
  })
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const inputSt: React.CSSProperties = {
    backgroundColor: darkMode ? '#252525' : '#f0f0f0',
    borderColor:     darkMode ? '#3a3a3a' : '#d0d0d0',
    color:           darkMode ? '#f0f0f0' : '#1a1a1a',
  }
  const btnSt: React.CSSProperties = {
    backgroundColor: darkMode ? '#f0f0f0' : '#1a1a1a',
    color:           darkMode ? '#1a1a1a' : '#ffffff',
  }
  const inputCls = 'w-full rounded px-3 py-2 font-mono text-sm focus:outline-none border transition-colors'

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="font-heading text-lg text-primary">New Appointment</h2>
        <button onClick={onClose} className="font-mono text-xs text-muted hover:text-primary transition-colors px-2 py-1">Close</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} style={inputSt} placeholder="Consultation, service name, etc." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Date</label>
            <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} className={inputCls} style={inputSt} />
          </div>
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Time</label>
            <select value={form.event_time} onChange={e => set('event_time', e.target.value)} className={inputCls} style={inputSt}>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{fmt12(t)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Customer Name</label>
          <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} className={inputCls} style={inputSt} placeholder="Jane Smith" />
        </div>
        <div>
          <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Customer Email</label>
          <input type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} className={inputCls} style={inputSt} placeholder="jane@email.com" />
        </div>
        <div>
          <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Customer Phone</label>
          <input type="tel" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} className={inputCls} style={inputSt} placeholder="(555) 000-0000" />
        </div>
        <div>
          <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} style={inputSt} placeholder="Optional notes..." />
        </div>
      </div>
      <div className="px-5 py-4 border-t border-border shrink-0">
        <button
          onClick={() => {
            if (!form.title.trim() || !form.event_date) return
            onSave({ title: form.title.trim(), event_date: form.event_date, event_time: form.event_time || null, customer_name: form.customer_name.trim() || null, customer_email: form.customer_email.trim() || null, customer_phone: form.customer_phone.trim() || null, notes: form.notes.trim() || null, status: 'confirmed', source: 'manual' })
          }}
          disabled={!form.title.trim() || !form.event_date}
          className="w-full font-mono text-sm py-2.5 rounded tracking-wider transition-opacity disabled:opacity-40"
          style={btnSt}
        >
          Save Appointment
        </button>
      </div>
    </div>
  )
}

// ── DetailPanel ───────────────────────────────────────────────────────────────

function DetailPanel({
  event, darkMode, onClose, onUpdate, onDelete,
}: {
  event: CalEvent
  darkMode?: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<CalEvent>, action?: string, sendEmail?: boolean) => void
  onDelete: (id: string) => void
}) {
  const [sendEmail, setSendEmail]         = useState(true)
  const [rescheduleMode, setReschedule]   = useState(false)
  const [newDate, setNewDate]             = useState(event.event_date)
  const [newTime, setNewTime]             = useState(event.event_time || '09:00')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [notice, setNotice]               = useState('')

  useEffect(() => {
    setReschedule(false)
    setCancelConfirm(false)
    setNotice('')
    setSendEmail(true)
    setNewDate(event.event_date)
    setNewTime(event.event_time || '09:00')
  }, [event.id])

  const inputSt: React.CSSProperties = {
    backgroundColor: darkMode ? '#252525' : '#f5f5f5',
    borderColor:     darkMode ? '#3a3a3a' : '#d0d0d0',
    color:           darkMode ? '#f0f0f0' : '#1a1a1a',
  }
  const btnSt: React.CSSProperties = {
    backgroundColor: darkMode ? '#f0f0f0' : '#1a1a1a',
    color:           darkMode ? '#1a1a1a' : '#ffffff',
  }

  const badge = statusBadgeStyle(event.status)
  const displayDate = event.event_date
    ? new Date(event.event_date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  const handleConfirm = () => {
    onUpdate(event.id, { status: 'confirmed' }, 'confirm', sendEmail)
    setNotice(sendEmail ? 'Confirmation email sent to customer.' : 'Appointment confirmed.')
  }
  const handleReschedule = () => {
    onUpdate(event.id, { event_date: newDate, event_time: newTime }, 'reschedule', sendEmail)
    setReschedule(false)
    setNotice(sendEmail ? 'Appointment rescheduled. Customer notified.' : 'Appointment rescheduled.')
  }
  const handleCancel = () => {
    onUpdate(event.id, { status: 'cancelled' }, 'cancel', sendEmail)
    setCancelConfirm(false)
    setNotice(sendEmail ? 'Appointment cancelled. Customer notified.' : 'Appointment cancelled.')
  }

  const fields = [
    { label: 'Date',     value: displayDate },
    { label: 'Time',     value: event.event_time ? fmt12(event.event_time) : 'No time set' },
    event.customer_name  && { label: 'Customer', value: event.customer_name },
    event.customer_email && { label: 'Email',    value: event.customer_email },
    event.customer_phone && { label: 'Phone',    value: event.customer_phone },
    event.notes          && { label: 'Notes',    value: event.notes },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full border mb-2" style={badge}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            {event.source === 'website_booking' && <span className="opacity-60">via website</span>}
          </div>
          <h2 className="font-heading text-xl text-primary leading-tight">{event.title}</h2>
        </div>
        <button onClick={onClose} className="font-mono text-xs text-muted hover:text-primary transition-colors px-2 py-1 shrink-0">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="space-y-2">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <span className="font-mono text-xs text-muted uppercase tracking-widest w-16 shrink-0 pt-0.5">{label}</span>
              <span className="font-mono text-sm text-primary">{value}</span>
            </div>
          ))}
        </div>

        {/* Send email checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={e => setSendEmail(e.target.checked)}
            className="w-4 h-4 rounded accent-[#00aa55]"
          />
          <span className="font-mono text-xs text-muted">Send automated email</span>
        </label>

        {/* Action notice */}
        {notice && (
          <div className="rounded border px-3 py-2.5 font-mono text-xs" style={{ backgroundColor: 'rgba(0,170,85,0.08)', borderColor: 'rgba(0,170,85,0.25)', color: '#00aa55' }}>
            {notice}
          </div>
        )}

        {/* Reschedule inline form */}
        {rescheduleMode && !notice && (
          <div className="rounded border p-4 space-y-3" style={{ backgroundColor: darkMode ? '#252525' : '#f5f5f5', borderColor: darkMode ? '#3a3a3a' : '#d0d0d0' }}>
            <div className="font-mono text-xs text-muted uppercase tracking-widest">Reschedule To</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-[10px] text-muted block mb-1">Date</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full rounded px-2 py-1.5 font-mono text-xs focus:outline-none border" style={inputSt} />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted block mb-1">Time</label>
                <select value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full rounded px-2 py-1.5 font-mono text-xs focus:outline-none border" style={inputSt}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{fmt12(t)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReschedule} className="font-mono text-xs px-4 py-1.5 rounded transition-opacity hover:opacity-80" style={btnSt}>Confirm</button>
              <button onClick={() => setReschedule(false)} className="font-mono text-xs border border-border text-muted px-4 py-1.5 rounded hover:text-primary transition-colors">Go Back</button>
            </div>
          </div>
        )}

        {/* Cancel confirmation */}
        {cancelConfirm && !notice && (
          <div className="rounded border p-4 space-y-3" style={{ backgroundColor: 'rgba(200,50,50,0.08)', borderColor: 'rgba(200,50,50,0.25)' }}>
            <div className="font-mono text-xs" style={{ color: '#cc4444' }}>Are you sure you want to cancel this appointment?</div>
            <div className="flex gap-2">
              <button onClick={handleCancel} className="font-mono text-xs px-4 py-1.5 rounded text-white" style={{ backgroundColor: '#cc4444' }}>Yes, Cancel It</button>
              <button onClick={() => setCancelConfirm(false)} className="font-mono text-xs border border-border text-muted px-4 py-1.5 rounded hover:text-primary transition-colors">Go Back</button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!notice && !rescheduleMode && !cancelConfirm && (
        <div className="px-5 py-4 border-t border-border space-y-2 shrink-0">
          {event.status === 'cancelled' ? (
            <button onClick={() => setReschedule(true)} className="w-full font-mono text-sm py-2.5 rounded tracking-wider border border-border text-muted hover:text-primary transition-colors">
              Reschedule
            </button>
          ) : (
            <>
              {event.status !== 'confirmed' && (
                <button onClick={handleConfirm} className="w-full font-mono text-sm py-2.5 rounded tracking-wider transition-opacity hover:opacity-90" style={{ backgroundColor: '#00aa55', color: '#ffffff' }}>
                  Confirm Appointment
                </button>
              )}
              <button onClick={() => setReschedule(true)} className="w-full font-mono text-sm py-2.5 rounded tracking-wider border border-border text-muted hover:text-primary transition-colors">
                Reschedule
              </button>
              <button onClick={() => setCancelConfirm(true)} className="w-full font-mono text-sm py-2.5 rounded tracking-wider border transition-colors" style={{ borderColor: 'rgba(200,50,50,0.4)', color: '#cc4444' }}>
                Cancel Appointment
              </button>
            </>
          )}
          <button onClick={() => onDelete(event.id)} className="w-full font-mono text-xs py-1.5 rounded tracking-wider text-dim hover:text-muted transition-colors">
            Delete event
          </button>
        </div>
      )}
    </div>
  )
}

// ── EmailAutomationsTab ───────────────────────────────────────────────────────

function EmailAutomationsTab({
  automations, darkMode, onSave,
}: {
  automations: EmailAutomation[]
  darkMode?: boolean
  onSave: (a: EmailAutomation) => void
}) {
  const [local, setLocal]       = useState<EmailAutomation[]>(automations)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => { setLocal(automations) }, [automations])

  const update = (id: string, patch: Partial<EmailAutomation>) => {
    setLocal(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
    setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }
  const save = (automation: EmailAutomation) => {
    onSave(automation)
    setSavedIds(prev => new Set([...prev, automation.id]))
  }

  const inputSt: React.CSSProperties = {
    backgroundColor: darkMode ? '#252525' : '#f0f0f0',
    borderColor:     darkMode ? '#3a3a3a' : '#d0d0d0',
    color:           darkMode ? '#f0f0f0' : '#1a1a1a',
  }
  const btnSt: React.CSSProperties = {
    backgroundColor: darkMode ? '#f0f0f0' : '#1a1a1a',
    color:           darkMode ? '#1a1a1a' : '#ffffff',
  }

  return (
    <div className="space-y-4">
      {local.map(automation => (
        <div key={automation.id} className="bg-card border border-border rounded p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Trigger</div>
              <div className="font-heading text-base text-primary">{TRIGGER_LABELS[automation.trigger] ?? automation.trigger}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={automation.enabled}
              onClick={() => update(automation.id, { enabled: !automation.enabled })}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${automation.enabled ? 'bg-[#00aa55]' : 'bg-[#555555]'}`}
            >
              <span className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${automation.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Subject</label>
              <input
                value={automation.subject}
                onChange={e => update(automation.id, { subject: e.target.value })}
                className="w-full rounded px-3 py-2 font-mono text-sm focus:outline-none border"
                style={inputSt}
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Body</label>
              <textarea
                value={automation.body}
                onChange={e => update(automation.id, { body: e.target.value })}
                rows={4}
                className="w-full rounded px-3 py-2 font-mono text-sm focus:outline-none border resize-none"
                style={inputSt}
              />
              <p className="font-mono text-[10px] text-dim mt-1">
                Variables: [customer_name] [date] [time] [business_name]
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => save(automation)}
              className="font-mono text-xs px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80"
              style={btnSt}
            >
              Save
            </button>
            {savedIds.has(automation.id) && (
              <span className="font-mono text-xs" style={{ color: '#00aa55' }}>Saved</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── SettingsPanel ─────────────────────────────────────────────────────────────

function SettingsPanel({
  daySettings, onDaySettings, slotDuration, onSlotDuration, blockedDates, onToggleBlocked, viewYear, viewMonth, darkMode,
}: {
  daySettings: Record<number, DaySetting>
  onDaySettings: (dow: number, u: Partial<DaySetting>) => void
  slotDuration: 30 | 45 | 60
  onSlotDuration: (d: 30 | 45 | 60) => void
  blockedDates: Set<string>
  onToggleBlocked: (date: string) => void
  viewYear: number
  viewMonth: number
  darkMode?: boolean
}) {
  const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const miniGrid = getMonthGrid(viewYear, viewMonth)
  const inputSt: React.CSSProperties = {
    backgroundColor: darkMode ? '#252525' : '#f0f0f0',
    borderColor:     darkMode ? '#3a3a3a' : '#d0d0d0',
    color:           darkMode ? '#f0f0f0' : '#1a1a1a',
  }

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Availability</div>
          <h3 className="font-heading text-lg text-primary">Available Days and Hours</h3>
        </div>
        <div className="p-6 space-y-3">
          {DOW_FULL.map((name, dow) => {
            const ds = daySettings[dow]
            return (
              <div key={dow} className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3 w-36">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ds.enabled}
                    onClick={() => onDaySettings(dow, { enabled: !ds.enabled })}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${ds.enabled ? 'bg-[#1a1a1a]' : 'bg-[#555555]'}`}
                  >
                    <span className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${ds.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className={`font-mono text-sm ${ds.enabled ? 'text-primary' : 'text-dim'}`}>{name}</span>
                </div>
                {ds.enabled && (
                  <div className="flex items-center gap-2">
                    <input type="time" value={ds.start} onChange={e => onDaySettings(dow, { start: e.target.value })} className="rounded px-2 py-1 font-mono text-xs focus:outline-none border" style={inputSt} />
                    <span className="font-mono text-xs text-muted">to</span>
                    <input type="time" value={ds.end} onChange={e => onDaySettings(dow, { end: e.target.value })} className="rounded px-2 py-1 font-mono text-xs focus:outline-none border" style={inputSt} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Scheduling</div>
          <h3 className="font-heading text-lg text-primary">Appointment Slot Duration</h3>
        </div>
        <div className="p-6 flex gap-3">
          {([30, 45, 60] as const).map(d => (
            <button key={d} onClick={() => onSlotDuration(d)} className="font-mono text-sm px-5 py-2.5 rounded border transition-all" style={slotDuration === d ? { borderColor: '#1a1a1a', backgroundColor: '#1a1a1a', color: '#ffffff' } : { borderColor: darkMode ? '#3a3a3a' : '#d0d0d0', color: '#888888' }}>
              {d} min
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Unavailable</div>
          <h3 className="font-heading text-lg text-primary">Block Off Dates</h3>
          <p className="font-mono text-xs text-muted mt-1">Click a date to mark it unavailable.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-0.5">
            {DOW_SHORT.map(d => (
              <div key={d} className="text-center font-mono text-[10px] text-muted pb-1">{d}</div>
            ))}
            {miniGrid.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const ds = toDateStr(day)
              const blocked = blockedDates.has(ds)
              return (
                <button key={ds} onClick={() => onToggleBlocked(ds)} className="aspect-square flex items-center justify-center font-mono text-xs rounded transition-colors" style={blocked ? { backgroundColor: '#1a1a1a', color: '#ffffff' } : { color: darkMode ? '#f0f0f0' : '#1a1a1a' }}>
                  {day.getDate()}
                </button>
              )
            })}
          </div>
          {blockedDates.size > 0 && (
            <p className="font-mono text-xs text-muted mt-3">{blockedDates.size} date{blockedDates.size !== 1 ? 's' : ''} blocked</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CalendarCore (main export) ────────────────────────────────────────────────

export default function CalendarCore({ mode, clientToken, darkMode }: CalendarCoreProps) {
  const today = new Date()

  const [events,      setEvents]      = useState<CalEvent[]>([])
  const [automations, setAutomations] = useState<EmailAutomation[]>([])
  const [viewDate,    setViewDate]    = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [activeTab,   setActiveTab]   = useState<'calendar' | 'automations' | 'settings'>('calendar')
  const [panelOpen,   setPanelOpen]   = useState(false)
  const [panelMode,   setPanelMode]   = useState<'view' | 'create'>('view')
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const [createDate,    setCreateDate]    = useState('')
  const [popover,       setPopover]       = useState<{ dateStr: string; events: CalEvent[] } | null>(null)

  const [daySettings, setDaySettings] = useState<Record<number, DaySetting>>(() => {
    const r: Record<number, DaySetting> = {}
    for (let i = 0; i < 7; i++) r[i] = { enabled: i >= 1 && i <= 5, start: '09:00', end: '17:00' }
    return r
  })
  const [slotDuration, setSlotDuration] = useState<30 | 45 | 60>(30)
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())

  const viewYear  = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()
  const todayStr  = toDateStr(today)

  // ── Data loading ──────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    if (!clientToken) return
    try {
      const res = await fetch(`/api/client/${clientToken}/events`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events ?? [])
      }
    } catch { /* silently ignore */ }
  }, [clientToken])

  const fetchAutomations = useCallback(async () => {
    if (!clientToken) return
    try {
      const res = await fetch(`/api/client/${clientToken}/email-automations`)
      if (res.ok) {
        const data = await res.json()
        setAutomations(data.automations ?? DEFAULT_AUTOMATIONS.map((a, i) => ({ ...a, id: `default-${i}` })))
      }
    } catch {
      setAutomations(DEFAULT_AUTOMATIONS.map((a, i) => ({ ...a, id: `default-${i}` })))
    }
  }, [clientToken])

  useEffect(() => {
    if (mode === 'live') {
      fetchEvents()
      fetchAutomations()
    } else {
      setEvents(DEMO_EVENTS)
      setAutomations(DEFAULT_AUTOMATIONS.map((a, i) => ({ ...a, id: `demo-${i}` })))
    }
  }, [mode, fetchEvents, fetchAutomations])

  // ── Panel helpers ─────────────────────────────────────────────────────────

  const closePanel = useCallback(() => {
    setPanelOpen(false)
    setTimeout(() => { setSelectedEvent(null) }, 300)
  }, [])

  const openCreate = (dateStr: string) => {
    setCreateDate(dateStr)
    setPanelMode('create')
    setPanelOpen(true)
  }

  const openDetail = (e: CalEvent) => {
    setSelectedEvent(e)
    setPanelMode('view')
    setPanelOpen(true)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closePanel])

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleCreate = async (data: Omit<CalEvent, 'id' | 'created_at'>) => {
    if (mode === 'demo') {
      setEvents(prev => [...prev, { ...data, id: String(Date.now()) }])
      closePanel()
      return
    }
    try {
      const res = await fetch(`/api/client/${clientToken}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) { await fetchEvents(); closePanel() }
    } catch { /* silently ignore */ }
  }

  const handleUpdate = async (id: string, updates: Partial<CalEvent>, action?: string, sendEmail?: boolean) => {
    if (mode === 'demo') {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
      setSelectedEvent(prev => prev?.id === id ? { ...prev, ...updates } as CalEvent : prev)
      return
    }
    try {
      const res = await fetch(`/api/client/${clientToken}/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, action, send_email: sendEmail }),
      })
      if (res.ok) {
        const data = await res.json()
        const updated = data.event as CalEvent | undefined
        setEvents(prev => prev.map(e => e.id === id ? (updated ?? { ...e, ...updates }) : e))
        setSelectedEvent(prev => prev?.id === id ? (updated ?? { ...prev, ...updates } as CalEvent) : prev)
      }
    } catch { /* silently ignore */ }
  }

  const handleDelete = async (id: string) => {
    if (mode === 'demo') {
      setEvents(prev => prev.filter(e => e.id !== id))
      closePanel()
      return
    }
    try {
      await fetch(`/api/client/${clientToken}/events/${id}`, { method: 'DELETE' })
      setEvents(prev => prev.filter(e => e.id !== id))
      closePanel()
    } catch { /* silently ignore */ }
  }

  const handleSaveAutomation = async (automation: EmailAutomation) => {
    if (mode === 'demo') {
      setAutomations(prev => prev.map(a => a.trigger === automation.trigger ? automation : a))
      return
    }
    try {
      const res = await fetch(`/api/client/${clientToken}/email-automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: automation.trigger, subject: automation.subject, body: automation.body, enabled: automation.enabled }),
      })
      if (res.ok) {
        const data = await res.json()
        const saved = data.automation as EmailAutomation | undefined
        setAutomations(prev => prev.map(a => a.trigger === automation.trigger ? (saved ?? automation) : a))
      }
    } catch { /* silently ignore */ }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const monthEvents = events.filter(e => {
    const d = new Date(e.event_date + 'T12:00')
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
  })
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)
  const weekEvents = events.filter(e => {
    const d = new Date(e.event_date + 'T12:00')
    return d >= today && d < weekEnd && e.status !== 'cancelled'
  })
  const pendingCount = events.filter(e => e.status === 'pending').length

  // ── Calendar grid ─────────────────────────────────────────────────────────

  const grid = getMonthGrid(viewYear, viewMonth)
  const MAX_PILLS = 2

  // Tab style helper
  const tabCls = (tab: string) =>
    `font-mono text-xs px-5 py-3 border-b-2 -mb-px tracking-wider transition-all ${
      activeTab === tab
        ? 'border-[#1a1a1a] text-[#1a1a1a]'
        : 'border-transparent text-muted hover:text-primary'
    }`

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Scheduling</p>
        <h2 className="font-heading text-2xl text-primary">Appointments</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button onClick={() => setActiveTab('calendar')}     className={tabCls('calendar')}>Month View</button>
        <button onClick={() => setActiveTab('automations')}  className={tabCls('automations')}>Email Automations</button>
        <button onClick={() => setActiveTab('settings')}     className={tabCls('settings')}>Settings</button>
      </div>

      {/* ── Calendar tab ── */}
      {activeTab === 'calendar' && (
        <div className="relative overflow-hidden" onClick={() => setPopover(null)}>
          <div className={`transition-all duration-300 ease-in-out ${panelOpen ? 'mr-[396px]' : 'mr-0'}`}>

            {/* Stats */}
            <div className="flex gap-4 mb-6">
              {[
                { label: 'Total This Month',     value: monthEvents.length, sub: 'appointments'      },
                { label: 'Upcoming This Week',   value: weekEvents.length,  sub: 'next 7 days'       },
                { label: 'Pending Confirmation', value: pendingCount,       sub: 'needs response'    },
              ].map(s => (
                <div key={s.label} className="flex-1 min-w-0 bg-card border border-border rounded px-5 py-4">
                  <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{s.label}</div>
                  <div className="font-heading text-3xl text-primary leading-none">{s.value}</div>
                  <div className="font-mono text-xs text-dim mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted hover:text-primary hover:border-[#b0b0b0] transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h3 className="font-heading text-2xl text-primary" style={{ fontWeight: 600 }}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h3>
                <button onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted hover:text-primary hover:border-[#b0b0b0] transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <button onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))} className="font-mono text-xs text-muted hover:text-primary border border-border rounded px-3 py-1 transition-colors">Today</button>
              </div>
              <button onClick={() => openCreate(todayStr)} className="font-mono text-xs px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: darkMode ? '#f0f0f0' : '#1a1a1a', color: darkMode ? '#1a1a1a' : '#ffffff' }}>
                New Appointment
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-l border-t border-border">
              {DOW_SHORT.map(d => (
                <div key={d} className="border-r border-b border-border px-2 py-1.5 text-center font-mono text-xs text-muted tracking-widest uppercase">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-l border-border">
              {grid.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="border-r border-b border-border min-h-[100px]" style={{ backgroundColor: darkMode ? '#181818' : 'transparent' }} />
                const ds       = toDateStr(day)
                const isToday  = ds === todayStr
                const isPast   = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const dayEvts  = events.filter(e => e.event_date === ds).sort((a, b) => (a.event_time ?? '').localeCompare(b.event_time ?? ''))
                const visible  = dayEvts.slice(0, MAX_PILLS)
                const overflow = dayEvts.length - MAX_PILLS
                const cellBg   = isPast ? (darkMode ? '#1a1a1a' : '#fafaf8') : (darkMode ? '#1e1e1e' : '#ffffff')

                return (
                  <div
                    key={ds}
                    className="border-r border-b border-border min-h-[100px] p-1.5 relative cursor-pointer"
                    style={{ backgroundColor: cellBg }}
                    onClick={() => openCreate(ds)}
                  >
                    <div className="flex justify-start mb-1">
                      <span className={`font-mono text-xs leading-none w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'text-white' : isPast ? 'text-dim' : 'text-primary'}`} style={isToday ? { backgroundColor: '#1a1a1a' } : undefined}>
                        {day.getDate()}
                      </span>
                    </div>
                    <div className="space-y-0.5" onClick={e => e.stopPropagation()}>
                      {visible.map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => openDetail(ev)}
                          className="w-full text-left font-mono text-[10px] px-1.5 py-0.5 rounded-full truncate leading-tight transition-opacity hover:opacity-80"
                          style={eventStyle(ev.status, ev.source)}
                        >
                          {pillLabel(ev)}
                        </button>
                      ))}
                      {overflow > 0 && (
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => { e.stopPropagation(); setPopover(popover?.dateStr === ds ? null : { dateStr: ds, events: dayEvts }) }}
                            className="font-mono text-[10px] text-muted pl-1.5 hover:text-primary transition-colors"
                          >
                            +{overflow} more
                          </button>
                          {popover?.dateStr === ds && (
                            <div className="absolute left-0 top-5 z-30 w-52 bg-card border border-border rounded shadow-lg p-2 space-y-1" onClick={e => e.stopPropagation()}>
                              <div className="font-mono text-[10px] text-muted tracking-widest uppercase pb-1 border-b border-border mb-1">
                                {MONTH_NAMES[viewMonth]} {day.getDate()}
                              </div>
                              {dayEvts.map(ev => (
                                <button
                                  key={ev.id}
                                  onClick={() => { setPopover(null); openDetail(ev) }}
                                  className="w-full text-left font-mono text-[10px] px-1.5 py-0.5 rounded-full truncate leading-tight transition-opacity hover:opacity-80"
                                  style={eventStyle(ev.status, ev.source)}
                                >
                                  {pillLabel(ev)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 flex-wrap">
              {[
                { label: 'Manual',         style: eventStyle('confirmed', 'manual') },
                { label: 'Website Booking', style: eventStyle('confirmed', 'website_booking') },
                { label: 'Pending',        style: eventStyle('pending', 'manual') },
                { label: 'Cancelled',      style: eventStyle('cancelled', 'manual') },
              ].map(({ label, style }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: style.color as string }} />
                  <span className="font-mono text-[10px] text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sliding detail/create panel */}
          <div className={`absolute top-0 right-0 bottom-0 w-[380px] border-l border-border shadow-lg transition-transform duration-300 ease-in-out z-10 ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {panelMode === 'create' ? (
              <CreatePanel
                defaultDate={createDate}
                darkMode={darkMode}
                onSave={handleCreate}
                onClose={closePanel}
              />
            ) : selectedEvent ? (
              <DetailPanel
                event={selectedEvent}
                darkMode={darkMode}
                onClose={closePanel}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* ── Email Automations tab ── */}
      {activeTab === 'automations' && (
        <EmailAutomationsTab
          automations={automations}
          darkMode={darkMode}
          onSave={handleSaveAutomation}
        />
      )}

      {/* ── Settings tab ── */}
      {activeTab === 'settings' && (
        <SettingsPanel
          daySettings={daySettings}
          onDaySettings={(dow, u) => setDaySettings(prev => ({ ...prev, [dow]: { ...prev[dow], ...u } }))}
          slotDuration={slotDuration}
          onSlotDuration={setSlotDuration}
          blockedDates={blockedDates}
          onToggleBlocked={date => setBlockedDates(prev => { const n = new Set(prev); n.has(date) ? n.delete(date) : n.add(date); return n })}
          viewYear={viewYear}
          viewMonth={viewMonth}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}
