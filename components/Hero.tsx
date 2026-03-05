import Link from 'next/link'

const quadrants = [
  {
    label: 'Social Media',
    src: 'https://images.unsplash.com/photo-4lKFi3KqnD8?w=800&h=600&fit=crop&q=80',
    alt: 'Person using smartphone to view social media analytics',
    position: 'top-left',
  },
  {
    label: 'Web Design',
    src: 'https://images.unsplash.com/photo-YVT21p6pO_g?w=800&h=600&fit=crop&q=80',
    alt: 'Web designer working on a MacBook',
    position: 'top-right',
  },
  {
    label: 'Local Business',
    src: 'https://images.unsplash.com/photo-qOOwO1Z-I68?w=800&h=600&fit=crop&q=80',
    alt: 'Busy people inside a successful local business',
    position: 'bottom-left',
  },
  {
    label: 'Analytics',
    src: 'https://images.unsplash.com/photo-vNcSlvLBHak?w=800&h=600&fit=crop&q=80',
    alt: 'Business analyst reviewing KPI dashboard on a computer',
    position: 'bottom-right',
  },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* 2x2 image grid fills the background */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {quadrants.map((q) => (
          <div key={q.label} className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={q.src}
              alt={q.alt}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/55" />
            {/* Quadrant label */}
            <span className="absolute bottom-4 left-4 font-mono text-xs text-white/70 tracking-widest uppercase">
              {q.label}
            </span>
          </div>
        ))}
      </div>

      {/* Centered content panel */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="bg-bg/90 backdrop-blur-sm border border-border rounded px-10 py-10 text-center w-full max-w-md">
          <h1 className="font-heading text-[clamp(1.8rem,4vw,2.75rem)] leading-tight text-primary mb-5">
            Your Business,
            <br />
            Running at Its Best.
          </h1>
          <p className="text-sm md:text-base text-teal leading-relaxed mb-8">
            We build and manage everything your business needs online. You focus on your
            customers. We handle the rest.
          </p>
          <Link
            href="/intake"
            className="inline-block font-mono text-sm bg-accent text-bg px-8 py-3.5 rounded font-medium tracking-wider hover:opacity-90 transition-opacity"
          >
            Start Your Project
          </Link>
        </div>
      </div>
    </section>
  )
}
