import type { Metadata } from 'next'
import { Bebas_Neue, DM_Mono, Inter } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
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
  title: 'Mantis Tech | Websites That Work For You',
  description:
    'Mantis Tech builds high-performance websites with AI-powered features for growing businesses. AI ads, social automation, e-commerce, and more.',
  keywords: ['web design', 'web development', 'AI', 'digital agency', 'Mantis Tech'],
  openGraph: {
    title: 'Mantis Tech | Websites That Work For You',
    description:
      'High-end web agency delivering intelligent websites powered by AI.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmMono.variable} ${inter.variable}`}>
      <body className="bg-bg text-white antialiased">{children}</body>
    </html>
  )
}
