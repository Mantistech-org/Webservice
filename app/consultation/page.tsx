'use client'

import { useEffect } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export default function ConsultationPage() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-10">
          <div style={{ color: '#00ff88' }} className="text-xs tracking-widest uppercase mb-3">
            Mantis Tech
          </div>
          <h1 className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-primary mb-4">
            Schedule a Free Consultation
          </h1>
          <p className="text-muted max-w-xl leading-relaxed">
            Pick a time that works for you and we will walk you through the platform and answer any questions.
          </p>
        </div>

        <div
          className="calendly-inline-widget"
          data-url="https://calendly.com/mantistech/consultation"
          style={{ minWidth: '320px', height: '700px' }}
        />
      </main>
      <Footer />
    </>
  )
}
