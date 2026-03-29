import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import ServicesGrid from '@/components/ServicesGrid'
import HowItWorks from '@/components/HowItWorks'
import DemoPromo from '@/components/DemoPromo'
import Pricing from '@/components/Pricing'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'

// ISR: regenerate every 60 seconds so pricing and promotions stay current.
// Without this the page is statically built at Docker build time when the
// database is unavailable, baking in an empty pricing section permanently.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Mantis Tech | Premium Websites and Digital Services',
  description: 'Mantis Tech builds and manages everything your business needs online. Custom websites, marketing automation, SEO, and more. Get started today.',
  keywords: ['web design', 'web development', 'digital agency', 'Mantis Tech', 'business website', 'marketing automation', 'SEO'],
  openGraph: {
    title: 'Mantis Tech | Premium Websites and Digital Services',
    description: 'Boutique web agency delivering premium websites and digital services for growing businesses.',
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
