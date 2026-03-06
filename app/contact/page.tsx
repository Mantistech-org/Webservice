import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact | Mantis Tech',
  description: 'Get in touch with the Mantis Tech team. We respond to all inquiries within 24 hours.',
  openGraph: {
    title: 'Contact Mantis Tech',
    description: 'Reach out to our team. We are here to help.',
    type: 'website',
  },
}

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 bg-bg min-h-screen">
        <ContactForm />
      </main>
      <Footer />
    </>
  )
}
