'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DemoView from '@/components/demo/DemoPage'

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

  return <DemoView hideBanner skipGate />
}
