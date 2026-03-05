import type { Metadata } from 'next'
import { Playfair_Display, DM_Mono, Inter } from 'next/font/google'
import './globals.css'

const playfairDisplay = Playfair_Display({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mantis Tech | Your Business, Running at Its Best',
  description:
    'Mantis Tech builds and manages everything your business needs online. Custom websites, marketing automation, SEO, and more.',
  keywords: ['web design', 'web development', 'digital agency', 'Mantis Tech', 'business website'],
  openGraph: {
    title: 'Mantis Tech | Your Business, Running at Its Best',
    description:
      'High-end boutique web agency delivering premium websites and digital services for growing businesses.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${dmMono.variable} ${inter.variable}`}>
      <body className="bg-bg text-white antialiased">{children}</body>
    </html>
  )
}
