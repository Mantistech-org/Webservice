'use client'

import CalendarCore from '@/components/calendar/CalendarCore'

export default function CalendarPage({ darkMode }: { darkMode?: boolean }) {
  return <CalendarCore mode="demo" darkMode={darkMode} />
}
