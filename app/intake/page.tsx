import { Suspense } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import IntakeForm from '@/components/intake/IntakeForm'

export const metadata = {
  title: 'Start Your Project | Mantis Tech',
  description: 'Tell us about your business and get a fully custom website built by our team.',
}

export default function IntakePage() {
  return (
    <>
      <Nav />
      <main className="pt-16">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted font-mono text-sm">Loading...</div>}>
          <IntakeForm />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
