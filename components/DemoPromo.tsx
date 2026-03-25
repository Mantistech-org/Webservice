import Link from 'next/link'

export default function DemoPromo() {
  return (
    <section className="py-24 px-6 bg-bg border-t border-border">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
          Interactive Demo
        </p>
        <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary mb-6">
          See It With Your Own Business Name.
        </h2>
        <p className="text-base text-muted leading-relaxed mb-10 max-w-lg mx-auto">
          Type in your business name and get a live, fully interactive preview of exactly what your
          dashboard and website tools would look like. No signup, no credit card, no commitment.
          Takes 30 seconds.
        </p>
        <Link
          href="/demo"
          className="inline-block font-mono text-sm bg-accent text-black px-10 py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
        >
          Try It Free
        </Link>
      </div>
    </section>
  )
}
