'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string
  customerName: string
  email: string
  phone: string
  service: string
  date: string   // YYYY-MM-DD
  time: string   // HH:MM
  notes: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

interface DaySetting { enabled: boolean; start: string; end: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const SERVICES = [
  'Consultation', 'Follow-up', 'Strategy Session',
  'Onboarding', 'Review Meeting', 'Discovery Call', 'Check-in',
]
const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const h = Math.floor(i / 2) + 8
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

// ── Mock data ─────────────────────────────────────────────────────────────────

// Returns a date string relative to today's month (or an offset month)
function md(day: number, monthOffset = 0): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + monthOffset
  const lastDay = new Date(year, month + 1, 0).getDate()
  const d = new Date(year, month, Math.min(day, lastDay))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MOCK_APPOINTMENTS: Appointment[] = [
  // Previous month (for back navigation)
  { id: 'h1', customerName: 'George Patel',    email: 'gpatel@gmail.com',         phone: '(555) 100-2200', service: 'Consultation',    date: md(8,  -1), time: '09:00', notes: '', status: 'confirmed' },
  { id: 'h2', customerName: 'Sandra Lin',      email: 'slin@outlook.com',         phone: '(555) 200-3300', service: 'Discovery Call',  date: md(12, -1), time: '10:30', notes: '', status: 'confirmed' },
  { id: 'h3', customerName: 'Felix Morgan',    email: 'fmorgan@yahoo.com',        phone: '(555) 300-4400', service: 'Strategy Session',date: md(15, -1), time: '13:00', notes: '', status: 'confirmed' },
  { id: 'h4', customerName: 'Theresa Nguyen',  email: 'tnguyen@email.com',        phone: '(555) 400-5500', service: 'Onboarding',      date: md(20, -1), time: '09:30', notes: '', status: 'confirmed' },
  { id: 'h5', customerName: 'Paul Rivera',     email: 'privera@gmail.com',        phone: '(555) 500-6600', service: 'Follow-up',       date: md(24, -1), time: '14:00', notes: '', status: 'cancelled' },
  { id: 'h6', customerName: 'Diana Scott',     email: 'dscott@gmail.com',         phone: '(555) 600-7700', service: 'Check-in',        date: md(28, -1), time: '11:00', notes: '', status: 'confirmed' },
  // Current month
  { id: '1',  customerName: 'Sarah Mitchell',  email: 'sarah.mitchell@gmail.com', phone: '(555) 201-3344', service: 'Consultation',    date: md(2),  time: '09:00', notes: 'Referred by a colleague',   status: 'confirmed' },
  { id: '2',  customerName: 'Marcus Webb',     email: 'mwebb@outlook.com',        phone: '(555) 389-2211', service: 'Strategy Session',date: md(3),  time: '10:30', notes: '',                          status: 'confirmed' },
  { id: '3',  customerName: 'Priya Sharma',    email: 'priya.sharma@yahoo.com',   phone: '(555) 445-6677', service: 'Discovery Call',  date: md(4),  time: '08:00', notes: 'Interested in full package', status: 'confirmed' },
  { id: '4',  customerName: 'Derek Collins',   email: 'dcollins@email.com',       phone: '(555) 512-0099', service: 'Follow-up',       date: md(4),  time: '14:00', notes: '',                          status: 'confirmed' },
  { id: '5',  customerName: 'Amanda Torres',   email: 'atorres@gmail.com',        phone: '(555) 623-8877', service: 'Onboarding',      date: md(5),  time: '09:00', notes: 'First session',             status: 'confirmed' },
  { id: '6',  customerName: 'Ryan Nguyen',     email: 'ryan.nguyen@outlook.com',  phone: '(555) 734-9900', service: 'Consultation',    date: md(5),  time: '11:00', notes: '',                          status: 'pending'   },
  { id: '7',  customerName: 'Lisa Fernandez',  email: 'lisa.f@gmail.com',         phone: '(555) 845-1122', service: 'Check-in',        date: md(5),  time: '14:30', notes: '',                          status: 'pending'   },
  { id: '8',  customerName: 'Tom Blackwell',   email: 'tblack@email.com',         phone: '(555) 956-2244', service: 'Review Meeting',  date: md(6),  time: '10:00', notes: '',                          status: 'confirmed' },
  { id: '9',  customerName: 'Keisha Johnson',  email: 'kjohnson@gmail.com',       phone: '(555) 677-3355', service: 'Strategy Session',date: md(7),  time: '09:30', notes: '',                          status: 'confirmed' },
  { id: '10', customerName: 'Nathan Cross',    email: 'ncross@yahoo.com',         phone: '(555) 178-4466', service: 'Consultation',    date: md(9),  time: '08:00', notes: 'Budget discussion first',   status: 'pending'   },
  { id: '11', customerName: 'Olivia Park',     email: 'opark@gmail.com',          phone: '(555) 289-5577', service: 'Onboarding',      date: md(10), time: '11:00', notes: '',                          status: 'confirmed' },
  { id: '12', customerName: 'Benjamin Holt',   email: 'bholt@outlook.com',        phone: '(555) 390-6688', service: 'Discovery Call',  date: md(11), time: '13:00', notes: '',                          status: 'confirmed' },
  { id: '13', customerName: 'Chloe Rivera',    email: 'crivera@gmail.com',        phone: '(555) 401-7799', service: 'Follow-up',       date: md(12), time: '09:00', notes: '',                          status: 'cancelled' },
  { id: '14', customerName: 'James Patterson', email: 'jpatterson@email.com',     phone: '(555) 512-8800', service: 'Check-in',        date: md(13), time: '10:30', notes: '',                          status: 'confirmed' },
  { id: '15', customerName: 'Sofia Chen',      email: 'sofia.chen@gmail.com',     phone: '(555) 623-9911', service: 'Consultation',    date: md(14), time: '09:00', notes: 'Referred by Priya',         status: 'pending'   },
  { id: '16', customerName: 'Tyler Marsh',     email: 'tmarsh@yahoo.com',         phone: '(555) 734-0022', service: 'Review Meeting',  date: md(16), time: '14:00', notes: '',                          status: 'confirmed' },
  { id: '17', customerName: 'Dana Reeves',     email: 'dreeves@gmail.com',        phone: '(555) 845-1133', service: 'Strategy Session',date: md(17), time: '10:00', notes: '',                          status: 'confirmed' },
  { id: '18', customerName: 'Carlos Mendez',   email: 'cmendez@outlook.com',      phone: '(555) 956-2244', service: 'Onboarding',      date: md(18), time: '08:30', notes: 'Has multiple locations',    status: 'confirmed' },
  { id: '19', customerName: 'Rachel Kim',      email: 'rkim@gmail.com',           phone: '(555) 067-3355', service: 'Check-in',        date: md(19), time: '11:30', notes: '',                          status: 'pending'   },
  { id: '20', customerName: 'Aaron Fields',    email: 'afields@email.com',        phone: '(555) 178-4466', service: 'Follow-up',       date: md(20), time: '13:00', notes: '',                          status: 'confirmed' },
  { id: '21', customerName: 'Megan Stone',     email: 'mstone@gmail.com',         phone: '(555) 289-5577', service: 'Discovery Call',  date: md(21), time: '09:00', notes: '',                          status: 'cancelled' },
  { id: '22', customerName: 'David Wu',        email: 'dwu@yahoo.com',            phone: '(555) 390-6688', service: 'Consultation',    date: md(23), time: '10:00', notes: 'Prefers afternoons',        status: 'confirmed' },
  { id: '23', customerName: 'Emily Grant',     email: 'egrant@gmail.com',         phone: '(555) 401-7799', service: 'Review Meeting',  date: md(24), time: '14:00', notes: '',                          status: 'pending'   },
  { id: '24', customerName: 'Chris Lawson',    email: 'clawson@outlook.com',      phone: '(555) 512-8800', service: 'Strategy Session',date: md(25), time: '09:30', notes: '',                          status: 'confirmed' },
  { id: '25', customerName: 'Natalie Brooks',  email: 'nbrooks@gmail.com',        phone: '(555) 623-9911', service: 'Onboarding',      date: md(26), time: '11:00', notes: '',                          status: 'confirmed' },
  { id: '26', customerName: 'Jason Hall',      email: 'jhall@email.com',          phone: '(555) 734-0022', service: 'Check-in',        date: md(27), time: '13:30', notes: '',                          status: 'pending'   },
  { id: '27', customerName: 'Isabel Torres',   email: 'itorres@gmail.com',        phone: '(555) 845-1133', service: 'Consultation',    date: md(28), time: '09:00', notes: '',                          status: 'confirmed' },
  { id: '28', customerName: 'Andrew Mills',    email: 'amills@yahoo.com',         phone: '(555) 956-2244', service: 'Follow-up',       date: md(29), time: '10:00', notes: '',                          status: 'confirmed' },
  { id: '29', customerName: 'Victoria Lane',   email: 'vlane@gmail.com',          phone: '(555) 067-3355', service: 'Discovery Call',  date: md(30), time: '14:30', notes: 'Wants long-term partnership', status: 'pending' },
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

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${suffix}`
}

// ── Pill colors ───────────────────────────────────────────────────────────────

const PILL_COLORS: Record<Appointment['status'], string> = {
  confirmed: 'bg-green-100 text-green-700 border border-green-200',
  pending:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  cancelled: 'bg-gray-100 text-gray-500 border border-gray-200',
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, trend }: { label: string; value: number; trend: string }) {
  return (
    <div className="bg-card border border-border rounded px-5 py-4 flex-1 min-w-0">
      <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{label}</div>
      <div className="font-heading text-3xl text-primary leading-none">{value}</div>
      <div className="font-mono text-xs text-dim mt-1">{trend}</div>
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  appointment, mode, onClose, onUpdate, onCreate,
}: {
  appointment: Appointment | null
  mode: 'view' | 'create'
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Appointment>) => void
  onCreate: (a: Omit<Appointment, 'id'>) => void
}) {
  const [reschedule, setReschedule] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState<Omit<Appointment, 'id'>>({
    customerName: '', email: '', phone: '', service: SERVICES[0],
    date: '', time: '09:00', notes: '', status: 'pending',
  })

  useEffect(() => {
    setReschedule(false); setCancelConfirm(false); setNotice('')
    if (appointment) { setNewDate(appointment.date); setNewTime(appointment.time) }
  }, [appointment])

  const handleConfirm = () => {
    if (!appointment) return
    onUpdate(appointment.id, { status: 'confirmed' })
    setNotice('Confirmation email sent to customer.')
  }

  const handleReschedule = () => {
    if (!appointment) return
    onUpdate(appointment.id, { date: newDate, time: newTime })
    setReschedule(false)
    setNotice('Appointment rescheduled. Customer notified.')
  }

  const handleCancel = () => {
    if (!appointment) return
    onUpdate(appointment.id, { status: 'cancelled' })
    setCancelConfirm(false)
    setNotice('Appointment cancelled. Customer notified.')
  }

  const handleCreate = () => {
    if (!form.customerName || !form.date) return
    onCreate(form)
    onClose()
  }

  const setF = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const inputCls = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors'

  if (mode === 'create') {
    return (
      <div className="h-full flex flex-col bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="font-heading text-lg text-primary">New Appointment</h2>
          <button onClick={onClose} className="font-mono text-xs text-muted hover:text-primary transition-colors px-2 py-1">Close</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Customer Name</label>
            <input value={form.customerName} onChange={e => setF('customerName', e.target.value)} className={inputCls} placeholder="Jane Smith" />
          </div>
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} className={inputCls} placeholder="jane@email.com" />
          </div>
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setF('phone', e.target.value)} className={inputCls} placeholder="(555) 000-0000" />
          </div>
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Service</label>
            <select value={form.service} onChange={e => setF('service', e.target.value)} className={inputCls}>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Time</label>
              <select value={form.time} onChange={e => setF('time', e.target.value)} className={inputCls}>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{fmt12(t)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Optional notes..." />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border shrink-0">
          <button onClick={handleCreate} disabled={!form.customerName || !form.date} className="w-full font-mono text-sm py-2.5 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
            Save Appointment
          </button>
        </div>
      </div>
    )
  }

  if (!appointment) return null

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between shrink-0">
        <div>
          <div className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded-full mb-2 ${PILL_COLORS[appointment.status]}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </div>
          <h2 className="font-heading text-xl text-primary leading-tight">{appointment.customerName}</h2>
        </div>
        <button onClick={onClose} className="font-mono text-xs text-muted hover:text-primary transition-colors px-2 py-1 shrink-0">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="space-y-2">
          {[
            { label: 'Email',    value: appointment.email },
            { label: 'Phone',    value: appointment.phone },
            { label: 'Service',  value: appointment.service },
            { label: 'Date',     value: new Date(appointment.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) },
            { label: 'Time',     value: fmt12(appointment.time) },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <span className="font-mono text-xs text-muted uppercase tracking-widest w-16 shrink-0 pt-0.5">{label}</span>
              <span className="font-mono text-sm text-primary">{value}</span>
            </div>
          ))}
          {appointment.notes && (
            <div className="flex gap-3">
              <span className="font-mono text-xs text-muted uppercase tracking-widest w-16 shrink-0 pt-0.5">Notes</span>
              <span className="font-mono text-sm text-teal leading-relaxed">{appointment.notes}</span>
            </div>
          )}
        </div>

        {notice && (
          <div className="bg-green-50 border border-green-200 rounded p-3 font-mono text-xs text-green-700">{notice}</div>
        )}

        {reschedule && (
          <div className="bg-[#efefef] border border-[#d0d0d0] rounded p-4 space-y-3">
            <div className="font-mono text-xs text-muted uppercase tracking-widest mb-2">Reschedule To</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-[10px] text-muted block mb-1">Date</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-white border border-[#d0d0d0] text-[#1a1a1a] rounded px-2 py-1.5 font-mono text-xs focus:outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted block mb-1">Time</label>
                <select value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-white border border-[#d0d0d0] text-[#1a1a1a] rounded px-2 py-1.5 font-mono text-xs focus:outline-none">
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{fmt12(t)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleReschedule} className="font-mono text-xs px-4 py-1.5 rounded transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Confirm</button>
              <button onClick={() => setReschedule(false)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-1.5 rounded hover:text-primary transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {cancelConfirm && (
          <div className="bg-red-50 border border-red-200 rounded p-4 space-y-3">
            <div className="font-mono text-xs text-red-700">Cancel this appointment and notify the customer?</div>
            <div className="flex gap-2">
              <button onClick={handleCancel} className="font-mono text-xs px-4 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 transition-colors">Yes, Cancel It</button>
              <button onClick={() => setCancelConfirm(false)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-1.5 rounded hover:text-primary transition-colors">Go Back</button>
            </div>
          </div>
        )}
      </div>

      {!notice && !reschedule && !cancelConfirm && appointment.status !== 'cancelled' && (
        <div className="px-5 py-4 border-t border-border space-y-2 shrink-0">
          {appointment.status !== 'confirmed' && (
            <button onClick={handleConfirm} className="w-full font-mono text-sm py-2.5 rounded tracking-wider transition-opacity hover:opacity-90 bg-green-600 text-white">
              Confirm Appointment
            </button>
          )}
          <button onClick={() => setReschedule(true)} className="w-full font-mono text-sm py-2.5 rounded tracking-wider border border-[#d0d0d0] text-muted hover:text-primary transition-colors">
            Reschedule
          </button>
          <button onClick={() => setCancelConfirm(true)} className="w-full font-mono text-sm py-2.5 rounded tracking-wider border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
            Cancel Appointment
          </button>
        </div>
      )}
    </div>
  )
}

// ── Settings Panel ─────────────────────────────────────────────────────────────

function SettingsPanel({
  daySettings, onDaySettings,
  slotDuration, onSlotDuration,
  blockedDates, onToggleBlocked,
  viewYear, viewMonth,
}: {
  daySettings: Record<number, DaySetting>
  onDaySettings: (dow: number, updates: Partial<DaySetting>) => void
  slotDuration: 30 | 45 | 60
  onSlotDuration: (d: 30 | 45 | 60) => void
  blockedDates: Set<string>
  onToggleBlocked: (date: string) => void
  viewYear: number
  viewMonth: number
}) {
  const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const miniGrid = getMonthGrid(viewYear, viewMonth)

  return (
    <div className="space-y-8">
      {/* Available days */}
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
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${ds.enabled ? 'bg-[#1a1a1a]' : 'bg-[#d0d0d0]'}`}
                  >
                    <span className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${ds.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className={`font-mono text-sm ${ds.enabled ? 'text-primary' : 'text-dim'}`}>{name}</span>
                </div>
                {ds.enabled && (
                  <div className="flex items-center gap-2">
                    <input type="time" value={ds.start} onChange={e => onDaySettings(dow, { start: e.target.value })} className="bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-2 py-1 font-mono text-xs focus:outline-none" />
                    <span className="font-mono text-xs text-muted">to</span>
                    <input type="time" value={ds.end} onChange={e => onDaySettings(dow, { end: e.target.value })} className="bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-2 py-1 font-mono text-xs focus:outline-none" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Slot duration */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Scheduling</div>
          <h3 className="font-heading text-lg text-primary">Appointment Slot Duration</h3>
        </div>
        <div className="p-6 flex gap-3">
          {([30, 45, 60] as const).map(d => (
            <button
              key={d}
              onClick={() => onSlotDuration(d)}
              className={`font-mono text-sm px-5 py-2.5 rounded border transition-all ${slotDuration === d ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-[#d0d0d0] text-muted hover:border-[#b0b0b0] hover:text-primary'}`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Block off dates */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Unavailable</div>
          <h3 className="font-heading text-lg text-primary">Block Off Dates</h3>
          <p className="font-mono text-xs text-muted mt-1">Click a date to mark it unavailable. Blocked dates appear striped on the calendar.</p>
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
                <button
                  key={ds}
                  onClick={() => onToggleBlocked(ds)}
                  className={`aspect-square flex items-center justify-center font-mono text-xs rounded transition-colors ${
                    blocked
                      ? 'bg-[#1a1a1a] text-white'
                      : 'hover:bg-[#efefef] text-primary'
                  }`}
                >
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

// ── Main CalendarPage ──────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [today]      = useState(() => new Date())
  const [viewDate,   setViewDate]   = useState(() => new Date())
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS)
  const [activeTab,  setActiveTab]  = useState<'calendar' | 'settings'>('calendar')
  const [selected,   setSelected]   = useState<Appointment | null>(null)
  const [panelMode,  setPanelMode]  = useState<'view' | 'create'>('view')
  const [panelOpen,  setPanelOpen]  = useState(false)

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

  const prevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1))
  const nextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1))
  const goToday   = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))

  const openAppt = (a: Appointment) => { setSelected(a); setPanelMode('view'); setPanelOpen(true) }
  const openNew  = () => { setSelected(null); setPanelMode('create'); setPanelOpen(true) }
  const closePanel = useCallback(() => { setPanelOpen(false); setTimeout(() => setSelected(null), 300) }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closePanel])

  const updateAppt = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
    setSelected(prev => prev?.id === id ? { ...prev, ...updates } : prev)
  }

  const createAppt = (data: Omit<Appointment, 'id'>) => {
    setAppointments(prev => [...prev, { ...data, id: String(Date.now()) }])
  }

  const toggleBlocked = (date: string) => {
    setBlockedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  // Stats
  const monthAppts = appointments.filter(a => {
    const d = new Date(a.date + 'T12:00')
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
  })
  const weekStart = new Date(today); weekStart.setHours(0, 0, 0, 0)
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
  const weekAppts = appointments.filter(a => {
    const d = new Date(a.date + 'T12:00')
    return d >= weekStart && d < weekEnd && a.status !== 'cancelled'
  })
  const pendingCount = appointments.filter(a => a.status === 'pending').length

  const grid = getMonthGrid(viewYear, viewMonth)

  const MAX_PILLS = 2

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Scheduling</p>
        <h2 className="font-heading text-2xl text-primary">Appointments</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['calendar', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-mono text-xs px-5 py-3 border-b-2 -mb-px tracking-wider transition-all capitalize ${
              activeTab === tab ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab === 'calendar' ? 'Month View' : 'Settings'}
          </button>
        ))}
      </div>

      {activeTab === 'settings' ? (
        <SettingsPanel
          daySettings={daySettings}
          onDaySettings={(dow, updates) => setDaySettings(prev => ({ ...prev, [dow]: { ...prev[dow], ...updates } }))}
          slotDuration={slotDuration}
          onSlotDuration={setSlotDuration}
          blockedDates={blockedDates}
          onToggleBlocked={toggleBlocked}
          viewYear={viewYear}
          viewMonth={viewMonth}
        />
      ) : (
        <div className="relative overflow-hidden">
          {/* Content shifts left when panel opens */}
          <div className={`transition-all duration-300 ease-in-out ${panelOpen ? 'mr-[396px]' : 'mr-0'}`}>

            {/* Stats row */}
            <div className="flex gap-4 mb-6">
              <StatCard label="Total This Month"      value={monthAppts.length} trend="+8 vs last month" />
              <StatCard label="Upcoming This Week"    value={weekAppts.length}  trend="Next 7 days"       />
              <StatCard label="Pending Confirmation"  value={pendingCount}      trend="Needs response"    />
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded border border-[#d0d0d0] text-muted hover:text-primary hover:border-[#b0b0b0] transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h3 className="font-heading text-2xl text-primary" style={{ fontWeight: 600 }}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h3>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded border border-[#d0d0d0] text-muted hover:text-primary hover:border-[#b0b0b0] transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={goToday} className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-2 rounded hover:border-[#b0b0b0] hover:text-primary transition-all">
                  Today
                </button>
                <button onClick={openNew} className="font-mono text-xs px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                  New Appointment
                </button>
              </div>
            </div>

            {/* Day of week labels */}
            <div className="grid grid-cols-7 border-l border-t border-border">
              {DOW_SHORT.map(d => (
                <div key={d} className="border-r border-b border-border px-2 py-1.5 text-center font-mono text-xs text-muted tracking-widest uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-l border-border">
              {grid.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} className="border-r border-b border-border min-h-[100px]" />
                }
                const ds       = toDateStr(day)
                const isToday  = ds === todayStr
                const isBlocked = blockedDates.has(ds)
                const isPast   = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const dayAppts = appointments
                  .filter(a => a.date === ds)
                  .sort((a, b) => a.time.localeCompare(b.time))
                const visible  = dayAppts.slice(0, MAX_PILLS)
                const overflow = dayAppts.length - MAX_PILLS

                return (
                  <div
                    key={ds}
                    className={`border-r border-b border-border min-h-[100px] p-1.5 relative ${isPast ? 'bg-[#fafaf8]' : 'bg-white'}`}
                    style={isBlocked ? {
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.04) 5px, rgba(0,0,0,0.04) 6px)',
                    } : undefined}
                  >
                    {/* Date number */}
                    <div className="flex justify-start mb-1">
                      <span className={`font-mono text-xs leading-none w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-[#1a1a1a] text-white' : isPast ? 'text-dim' : 'text-primary'
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Appointment pills */}
                    <div className="space-y-0.5">
                      {visible.map(a => (
                        <button
                          key={a.id}
                          onClick={() => openAppt(a)}
                          className={`w-full text-left font-mono text-[10px] px-1.5 py-0.5 rounded-full truncate leading-tight transition-opacity hover:opacity-80 ${PILL_COLORS[a.status]}`}
                        >
                          {fmt12(a.time)} {a.customerName.split(' ')[0]}
                        </button>
                      ))}
                      {overflow > 0 && (
                        <div className="font-mono text-[10px] text-muted pl-1.5">+{overflow} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sliding detail panel */}
          <div className={`absolute top-0 right-0 bottom-0 w-[380px] border-l border-border shadow-lg transition-transform duration-300 ease-in-out z-10 ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <DetailPanel
              appointment={selected}
              mode={panelMode}
              onClose={closePanel}
              onUpdate={updateAppt}
              onCreate={createAppt}
            />
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version syncs with Google Calendar and sends automatic confirmation and reminder emails.
      </p>
    </div>
  )
}
