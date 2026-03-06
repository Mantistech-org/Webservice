import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ClientLoginForm from '@/components/ClientLoginForm'

export const metadata: Metadata = {
  title: 'Client Login | Mantis Tech',
  description: 'Access your Mantis Tech client dashboard.',
}

export default function ClientLoginPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 bg-bg min-h-screen flex items-center justify-center px-6">
        <ClientLoginForm />
      </main>
      <Footer />
    </>
  )
}
