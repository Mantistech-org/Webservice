import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import BeforeAfter from '@/components/BeforeAfter'
import ServicesGrid from '@/components/ServicesGrid'
import HowItWorks from '@/components/HowItWorks'
import DemoPromo from '@/components/DemoPromo'
import Pricing from '@/components/Pricing'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'

export const metadata: Metadata = {
  title: 'Mantis Tech | HVAC Marketing and Automation Platform',
  description:
    'Mantis Tech is a marketing and automation platform built exclusively for HVAC contractors. Weather-activated ads, automated reviews, SEO, SMS marketing, and more.',
  keywords: [
    'HVAC marketing',
    'HVAC automation',
    'HVAC contractor software',
    'weather activation',
    'HVAC lead generation',
    'Mantis Tech',
    'HVAC SEO',
    'HVAC review management',
  ],
  openGraph: {
    title: 'Mantis Tech | HVAC Marketing and Automation Platform',
    description:
      'A marketing and automation platform built exclusively for HVAC contractors. When weather creates demand, it activates automatically.',
    type: 'website',
    url: 'https://mantistech.io',
  },
  alternates: {
    canonical: 'https://mantistech.io',
  },
}

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <BeforeAfter />
        <ServicesGrid />
        <HowItWorks />
        <DemoPromo />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
      <CookieBanner />
    </>
  )
}
