import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
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
      'Boutique web agency delivering premium websites and digital services for growing businesses.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Restore saved theme — light is default, only apply class if dark was saved */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark-mode');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
