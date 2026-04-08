import Link from 'next/link'

export default function DashboardAnimation() {
  return (
    <section style={{ backgroundColor: '#0b0b0b', padding: '16px' }}>
      <div style={{ position: 'relative' }}>
        <video
          src="/demo.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', display: 'block', borderRadius: 8 }}
        />

        {/* ── CTA overlay bar ─────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          zIndex: 30,
          background: 'rgba(0,0,0,0.78)',
          padding: '14px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <Link
            href="/demo"
            className="inline-block font-mono text-sm bg-accent text-black px-8 py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
          >
            See It With Your Business Name
          </Link>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#9e9e9e',
            margin: 0,
            letterSpacing: '0.01em',
          }}>
            This is what it looks like when the system activates.
          </p>
        </div>
      </div>
    </section>
  )
}
