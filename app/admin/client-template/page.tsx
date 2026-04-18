'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DemoView from '@/components/demo/DemoPage'

// Seed sessionStorage at module load time (before any React rendering) so
// DemoView's useEffect finds the value and skips the gate form.
if (typeof window !== 'undefined') {
  if (!sessionStorage.getItem('demo-business-name')) {
    sessionStorage.setItem('demo-business-name', 'Your Business Name')
  }
}

export default function ClientTemplatePage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/projects')
      .then((r) => {
        if (r.ok) {
          setAuthed(true)
        } else {
          setAuthed(false)
          router.push('/admin')
        }
      })
      .catch(() => {
        setAuthed(false)
        router.push('/admin')
      })
  }, [router])

  if (authed === null) return null
  if (!authed) return null

  return (
    <>
      <div className="px-8 py-6 border-b border-border shrink-0">
        <h1 className="font-heading text-5xl text-primary mb-1">Client Dashboard Template</h1>
        <p className="font-mono text-sm text-muted">
          Preview of the client-facing Mantis Tech dashboard.
        </p>
      </div>
      <DemoView />
    </>
  )
}
