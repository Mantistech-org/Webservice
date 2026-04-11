import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule a Consultation | Mantis Tech',
}

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
