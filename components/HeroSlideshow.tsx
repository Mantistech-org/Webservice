'use client'

import { useEffect, useState } from 'react'

const slides = [
  // ── 1. RESTAURANT ─────────────────────────────────────────────────────────
  {
    label: 'Restaurant',
    node: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at 40% 50%, #2a1c0e 0%, #1a1208 100%)',
          color: '#f5ead8',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grain overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.4, pointerEvents: 'none' }} />
        {/* Left / right vertical accent lines */}
        <div style={{ position: 'absolute', left: '7%', top: '18%', width: 1, height: '64%', background: 'linear-gradient(to bottom, transparent, rgba(200,147,63,0.22), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '7%', top: '18%', width: 1, height: '64%', background: 'linear-gradient(to bottom, transparent, rgba(200,147,63,0.22), transparent)', pointerEvents: 'none' }} />
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 3rem', borderBottom: '1px solid rgba(200,147,63,0.14)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8933f' }} />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', letterSpacing: '0.2em', color: '#c8933f' }}>EMBER &amp; OAK</span>
          </div>
          <div style={{ display: 'flex', gap: '2.25rem' }}>
            {['Menu', 'Reservations', 'Private Events', 'Contact'].map(l => (
              <span key={l} style={{ fontSize: '0.62rem', letterSpacing: '0.13em', color: 'rgba(245,234,216,0.45)', textTransform: 'uppercase' }}>{l}</span>
            ))}
          </div>
        </nav>
        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 3rem', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: 520 }}>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.32em', color: '#c8933f', marginBottom: '1.1rem', textTransform: 'uppercase' }}>Fine Dining &nbsp;&middot;&nbsp; Little Rock, Arkansas</p>
            <div style={{ width: 36, height: 1, background: '#c8933f', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(1.6rem, 3.2vw, 2.75rem)', lineHeight: 1.2, color: '#f5ead8', marginBottom: '1.25rem', fontWeight: 400, letterSpacing: '0.01em' }}>
              Where Every Meal<br />Tells a Story
            </h2>
            <p style={{ fontSize: '0.78rem', lineHeight: 1.85, color: 'rgba(245,234,216,0.58)', marginBottom: '2rem' }}>
              Farm-to-table cuisine crafted from locally sourced ingredients.<br />An experience worth savoring, every evening.
            </p>
            <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center' }}>
              <button style={{ background: '#c8933f', color: '#1a1208', padding: '0.72rem 1.875rem', fontSize: '0.62rem', letterSpacing: '0.15em', border: 'none', cursor: 'default', fontWeight: 700, textTransform: 'uppercase' }}>Reserve a Table</button>
              <button style={{ background: 'transparent', color: '#c8933f', padding: '0.72rem 1.875rem', fontSize: '0.62rem', letterSpacing: '0.15em', border: '1px solid rgba(200,147,63,0.32)', cursor: 'default', textTransform: 'uppercase' }}>View Menu</button>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ── 2. SALON / SPA ────────────────────────────────────────────────────────
  {
    label: 'Salon',
    node: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(150deg, #fdf8f3 0%, #f5ede3 100%)',
          color: '#2a2018',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: '-60px', top: '50%', transform: 'translateY(-50%)', width: 380, height: 380, borderRadius: '50%', border: '1px solid rgba(184,132,90,0.18)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '2%', top: '50%', transform: 'translateY(-50%)', width: 260, height: 260, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(184,132,90,0.1) 0%, rgba(196,154,138,0.14) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '11%', top: '50%', transform: 'translateY(-50%)', width: 130, height: 130, borderRadius: '50%', background: 'rgba(184,132,90,0.08)', pointerEvents: 'none' }} />
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 3rem', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '2.25rem' }}>
            {['Services', 'About'].map(l => (
              <span key={l} style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: 'rgba(42,32,24,0.4)', textTransform: 'uppercase' }}>{l}</span>
            ))}
          </div>
          <span style={{ fontFamily: 'Georgia, "Palatino Linotype", serif', fontSize: '1.1rem', letterSpacing: '0.28em', color: '#2a2018' }}>LUMINA</span>
          <div style={{ display: 'flex', gap: '2.25rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: 'rgba(42,32,24,0.4)', textTransform: 'uppercase' }}>Gallery</span>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: '#b8845a', textTransform: 'uppercase', fontWeight: 600 }}>Book Now</span>
          </div>
        </nav>
        <div style={{ height: 1, background: 'rgba(184,132,90,0.18)', margin: '0 3rem' }} />
        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '1.5rem 3rem 1.5rem', zIndex: 1 }}>
          <div style={{ maxWidth: 460 }}>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.28em', color: '#b8845a', marginBottom: '1.25rem', textTransform: 'uppercase' }}>Salon &amp; Day Spa &nbsp;&middot;&nbsp; Nashville, Tennessee</p>
            <h2 style={{ fontFamily: 'Georgia, "Palatino Linotype", serif', fontSize: 'clamp(1.65rem, 3.2vw, 2.75rem)', lineHeight: 1.2, color: '#2a2018', marginBottom: '1.1rem', fontWeight: 400 }}>
              Elevate Your<br />Natural Beauty
            </h2>
            <div style={{ width: 36, height: 2, background: '#b8845a', marginBottom: '1.25rem' }} />
            <p style={{ fontSize: '0.78rem', lineHeight: 1.85, color: 'rgba(42,32,24,0.56)', marginBottom: '2rem', maxWidth: 380 }}>
              Personalized treatments and expert styling in a tranquil, luxurious environment designed entirely around you.
            </p>
            <button style={{ background: '#2a2018', color: '#fdf8f3', padding: '0.8rem 2.25rem', fontSize: '0.62rem', letterSpacing: '0.16em', border: 'none', cursor: 'default', textTransform: 'uppercase', fontWeight: 600 }}>Book Your Appointment</button>
          </div>
        </div>
      </div>
    ),
  },

  // ── 3. LAW FIRM ───────────────────────────────────────────────────────────
  {
    label: 'Law Firm',
    node: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(140deg, #0d1b2a 0%, #112234 100%)',
          color: '#f0ebe2',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Large ghosted word */}
        <div style={{ position: 'absolute', right: '-1rem', bottom: '-1.5rem', fontSize: 'clamp(5rem, 13vw, 10rem)', fontFamily: 'Georgia, serif', fontWeight: 700, color: 'rgba(184,150,62,0.035)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.03em' }}>JUSTICE</div>
        {/* Top gold accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(to right, transparent 0%, #b8963e 40%, #b8963e 60%, transparent 100%)' }} />
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 3rem', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', letterSpacing: '0.12em', color: '#f0ebe2' }}>HARGROVE</span>
            <span style={{ fontSize: '0.52rem', letterSpacing: '0.2em', color: '#b8963e', textTransform: 'uppercase' }}>&amp; Associates</span>
          </div>
          <div style={{ display: 'flex', gap: '2.25rem', alignItems: 'center' }}>
            {['Practice Areas', 'Our Attorneys', 'Case Results', 'Contact'].map(l => (
              <span key={l} style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(240,235,226,0.45)', textTransform: 'uppercase' }}>{l}</span>
            ))}
            <button style={{ background: 'transparent', color: '#b8963e', padding: '0.48rem 1.2rem', fontSize: '0.58rem', letterSpacing: '0.12em', border: '1px solid rgba(184,150,62,0.38)', cursor: 'default', textTransform: 'uppercase' }}>Free Consultation</button>
          </div>
        </nav>
        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '1.5rem 3rem', zIndex: 1 }}>
          {/* Left gold vertical line */}
          <div style={{ width: 2, height: '70%', background: 'linear-gradient(to bottom, transparent, #b8963e, transparent)', marginRight: '2rem', flexShrink: 0 }} />
          <div style={{ maxWidth: 560 }}>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.28em', color: '#b8963e', marginBottom: '1.4rem', textTransform: 'uppercase' }}>Established 1991 &nbsp;&middot;&nbsp; Civil &amp; Criminal Law</p>
            <h2 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(1.6rem, 3.2vw, 2.7rem)', lineHeight: 1.2, color: '#f0ebe2', marginBottom: '1.25rem', fontWeight: 400 }}>
              Trusted Legal Counsel<br />When It Matters Most
            </h2>
            <p style={{ fontSize: '0.78rem', lineHeight: 1.85, color: 'rgba(240,235,226,0.52)', marginBottom: '2rem', maxWidth: 460 }}>
              Three decades of experience protecting the rights and interests of individuals and businesses across the state.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <button style={{ background: '#b8963e', color: '#0d1b2a', padding: '0.75rem 2rem', fontSize: '0.62rem', letterSpacing: '0.14em', border: 'none', cursor: 'default', fontWeight: 700, textTransform: 'uppercase' }}>Schedule a Consultation</button>
              <span style={{ fontSize: '0.7rem', color: 'rgba(240,235,226,0.35)', letterSpacing: '0.04em' }}>or call (501) 800-2200</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ── 4. HVAC / CONTRACTOR ──────────────────────────────────────────────────
  {
    label: 'HVAC',
    node: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#111c27',
          color: '#f0f4f8',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Right-side angled accent panel */}
        <div style={{ position: 'absolute', right: 0, top: 0, width: '38%', height: '100%', background: 'linear-gradient(180deg, rgba(244,96,12,0.09) 0%, rgba(244,96,12,0.04) 100%)', clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, width: '38%', height: '100%', borderLeft: '1px solid rgba(244,96,12,0.12)', clipPath: 'polygon(18% 0, 19% 0, 1% 100%, 0% 100%)', pointerEvents: 'none' }} />
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 3rem', zIndex: 1 }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.06em', color: '#f0f4f8' }}>PEAK <span style={{ color: '#f4600c' }}>HOME</span> SERVICES</span>
          </div>
          <div style={{ display: 'flex', gap: '2.25rem', alignItems: 'center' }}>
            {['HVAC', 'Plumbing', 'Electrical', 'About'].map(l => (
              <span key={l} style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(240,244,248,0.45)', textTransform: 'uppercase' }}>{l}</span>
            ))}
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f4600c', letterSpacing: '0.04em' }}>(501) 444-9100</span>
          </div>
        </nav>
        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '1rem 3rem 1.5rem', zIndex: 1 }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(244,96,12,0.1)', border: '1px solid rgba(244,96,12,0.22)', padding: '0.32rem 0.875rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f4600c' }} />
              <span style={{ fontSize: '0.58rem', letterSpacing: '0.16em', color: '#f4600c', textTransform: 'uppercase' }}>24/7 Emergency Service Available</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.7rem)', lineHeight: 1.15, color: '#f0f4f8', marginBottom: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Comfort You Can Count On,<br />24 Hours a Day.
            </h2>
            <p style={{ fontSize: '0.78rem', lineHeight: 1.85, color: 'rgba(240,244,248,0.52)', marginBottom: '1.75rem', maxWidth: 460 }}>
              Licensed HVAC installation, repair, and maintenance for residential and commercial properties. Serving the greater metro area since 2004.
            </p>
            <button style={{ background: '#f4600c', color: '#fff', padding: '0.8rem 2rem', fontSize: '0.68rem', letterSpacing: '0.1em', border: 'none', cursor: 'default', fontWeight: 700, textTransform: 'uppercase' }}>Get a Free Estimate</button>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(240,244,248,0.08)' }}>
              {[['20+', 'Years in Business'], ['4,800+', 'Jobs Completed'], ['4.9', 'Star Rating']].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f4600c', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: '0.57rem', color: 'rgba(240,244,248,0.4)', letterSpacing: '0.1em', marginTop: '0.3rem', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ── 5. GYM / FITNESS ──────────────────────────────────────────────────────
  {
    label: 'Gym',
    node: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Diagonal red slab */}
        <div style={{ position: 'absolute', right: '-4%', top: '-8%', width: '44%', height: '120%', background: 'linear-gradient(180deg, #c41230 0%, #8b0c22 100%)', transform: 'skewX(-7deg)', transformOrigin: 'top right', pointerEvents: 'none' }} />
        {/* Thin red edge line */}
        <div style={{ position: 'absolute', right: '38%', top: '-8%', width: 2, height: '120%', background: 'rgba(232,25,44,0.5)', transform: 'skewX(-7deg)', transformOrigin: 'top right', pointerEvents: 'none' }} />
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 3rem', zIndex: 1 }}>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase' }}>Iron District</span>
          <div style={{ display: 'flex', gap: '2.25rem', alignItems: 'center' }}>
            {['Training', 'Classes', 'Membership', 'Locations'].map(l => (
              <span key={l} style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{l}</span>
            ))}
          </div>
        </nav>
        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.75rem 3rem 1.5rem', zIndex: 1 }}>
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.28em', color: '#e8192c', marginBottom: '1.1rem', textTransform: 'uppercase', fontWeight: 600 }}>Performance Training &nbsp;&middot;&nbsp; Memphis, Tennessee</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.8vw, 3rem)', lineHeight: 1.05, color: '#ffffff', marginBottom: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              Build the Best<br />Version of Yourself.
            </h2>
            <p style={{ fontSize: '0.78rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.46)', marginBottom: '2rem', maxWidth: 400 }}>
              State-of-the-art equipment, expert coaching, and a community that pushes you further every single day.
            </p>
            <div style={{ display: 'flex', gap: '0.875rem' }}>
              <button style={{ background: '#e8192c', color: '#fff', padding: '0.8rem 2rem', fontSize: '0.65rem', letterSpacing: '0.12em', border: 'none', cursor: 'default', fontWeight: 700, textTransform: 'uppercase' }}>Start Your Free Trial</button>
              <button style={{ background: 'transparent', color: 'rgba(255,255,255,0.65)', padding: '0.8rem 2rem', fontSize: '0.65rem', letterSpacing: '0.12em', border: '1px solid rgba(255,255,255,0.14)', cursor: 'default', textTransform: 'uppercase' }}>View Memberships</button>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ── 6. MEDICAL / DENTAL ───────────────────────────────────────────────────
  {
    label: 'Dental',
    node: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f3f7fa',
          color: '#1e2d3d',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative arcs */}
        <div style={{ position: 'absolute', right: '-100px', bottom: '-100px', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '-60px', top: '-60px', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(13,148,136,0.1)', pointerEvents: 'none' }} />
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 3rem', background: '#ffffff', borderBottom: '1px solid rgba(30,45,61,0.07)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488 0%, #0a7268 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'rgba(255,255,255,0.88)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.03em', color: '#1e2d3d' }}>Clearwater Dental</div>
              <div style={{ fontSize: '0.52rem', color: '#0d9488', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Family &amp; Cosmetic Dentistry</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2.25rem', alignItems: 'center' }}>
            {['Services', 'Our Team', 'Patient Info', 'Contact'].map(l => (
              <span key={l} style={{ fontSize: '0.62rem', color: 'rgba(30,45,61,0.45)', letterSpacing: '0.08em' }}>{l}</span>
            ))}
            <button style={{ background: '#0d9488', color: '#fff', padding: '0.5rem 1.25rem', fontSize: '0.6rem', letterSpacing: '0.1em', border: 'none', cursor: 'default', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' }}>Request Appointment</button>
          </div>
        </nav>
        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 3rem', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: 540 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(13,148,136,0.08)', padding: '0.32rem 1rem', borderRadius: 100, marginBottom: '1.25rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0d9488' }} />
              <span style={{ fontSize: '0.58rem', letterSpacing: '0.14em', color: '#0d9488', textTransform: 'uppercase', fontWeight: 600 }}>Now Accepting New Patients</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.65rem, 3.2vw, 2.75rem)', lineHeight: 1.2, color: '#1e2d3d', marginBottom: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              A Brighter Smile<br />Starts Here
            </h2>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.85, color: 'rgba(30,45,61,0.52)', marginBottom: '2rem', maxWidth: 420, margin: '0 auto 2rem' }}>
              Comprehensive dental care for the entire family, from routine cleanings to complete smile transformations. Gentle, modern, and personalized.
            </p>
            <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center' }}>
              <button style={{ background: '#0d9488', color: '#fff', padding: '0.8rem 2.25rem', fontSize: '0.65rem', letterSpacing: '0.1em', border: 'none', cursor: 'default', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' }}>Book an Appointment</button>
              <button style={{ background: 'transparent', color: 'rgba(30,45,61,0.7)', padding: '0.8rem 2.25rem', fontSize: '0.65rem', letterSpacing: '0.1em', border: '1px solid rgba(30,45,61,0.14)', cursor: 'default', borderRadius: 4, textTransform: 'uppercase' }}>Our Services</button>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => (
        <div
          key={slide.label}
          className="absolute inset-0"
          style={{
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.9s ease',
            pointerEvents: 'none',
          }}
          aria-hidden={i !== current}
        >
          {slide.node}
        </div>
      ))}

      {/* Dot indicators */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 20,
          background: 'rgba(0,0,0,0.22)',
          backdropFilter: 'blur(6px)',
          padding: '0.375rem 0.75rem',
          borderRadius: 100,
        }}
      >
        {slides.map((slide, i) => (
          <button
            key={slide.label}
            onClick={() => setCurrent(i)}
            aria-label={`${slide.label} example`}
            style={{
              width: i === current ? 22 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? '#00ff88' : 'rgba(255,255,255,0.32)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.35s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
