'use client'

import CalendarCore from '@/components/calendar/CalendarCore'

export default function ConsultationsPage() {
  return (
    <div className="flex-1 min-w-0 px-8 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-5xl text-primary mb-2">Consultations</h1>
        <p className="font-mono text-sm text-muted">
          Manage consultation requests and appointments.
        </p>
      </div>
      <CalendarCore mode="live" clientToken="admin-consultations" />
    </div>
  )
}
