import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080c10',
        accent: '#00ff88',
        teal: '#8ab8b5',
        card: '#0d1117',
        'card-hover': '#111820',
        border: '#1a2332',
        'border-light': '#243040',
        dim: '#3a4a5a',
        muted: '#5a6a7a',
      },
      fontFamily: {
        heading: ['var(--font-bebas)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        ticker: 'ticker 35s linear infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,255,136,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0,255,136,0.6)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)`,
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,136,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
}

export default config
