'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'

const links = [
  { label: 'Services', href: '#services' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Try Demo', href: '/demo', isLink: true },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bg/95 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-heading text-xl text-primary group-hover:text-muted transition-colors">
            Mantis Tech
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) =>
            'isLink' in link && link.isLink ? (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-sm text-muted hover:text-primary hover:underline decoration-[#00ff88] underline-offset-4 tracking-wider transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="font-mono text-sm text-muted hover:text-primary hover:underline decoration-[#00ff88] underline-offset-4 tracking-wider transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          <ThemeToggle />
          <Link
            href="/intake"
            className="font-mono text-sm bg-accent text-black px-5 py-2 rounded hover:opacity-90 transition-opacity font-medium tracking-wider"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile right side */}
        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle />
          <button
            className="flex flex-col gap-1.5 p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-primary transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-primary transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-primary transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-card border-b border-border px-6 py-4 flex flex-col gap-4">
          {links.map((link) =>
            'isLink' in link && link.isLink ? (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-sm text-muted hover:text-primary transition-colors tracking-wider"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="font-mono text-sm text-muted hover:text-primary transition-colors tracking-wider"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            )
          )}
          <Link
            href="/intake"
            className="font-mono text-sm bg-accent text-black px-5 py-2 rounded text-center font-medium tracking-wider"
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  )
}
