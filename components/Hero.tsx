import Link from 'next/link'

export default function Hero() {
  return (
    <section className="flex items-center justify-center px-6 pt-28 pb-24 bg-bg">
      <div className="text-center max-w-2xl">
        <p className="font-mono text-xs text-accent tracking-widest uppercase mb-5">
          Mantis Tech
        </p>
        <h1 className="font-heading text-[clamp(2.2rem,5.5vw,4rem)] leading-tight text-primary mb-6">
          Never miss an HVAC job again.
        </h1>
        <p className="text-lg text-primary leading-relaxed mb-4 max-w-xl mx-auto font-medium">
          While every other contractor scrambles during a heat wave or cold snap, the ones with a system wake up to a full schedule.
        </p>
        <p className="text-base text-teal leading-relaxed mb-10 max-w-xl mx-auto">
          Mantis Tech is a marketing platform built exclusively for HVAC contractors. When weather creates demand, it activates automatically. When it does not, it builds your pipeline. You just run the jobs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/demo"
            className="inline-block font-mono text-sm bg-accent text-black px-8 py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
          >
            Show Me the System
          </Link>
          <Link
            href="/consultation"
            className="inline-block font-mono text-sm border border-border text-teal px-8 py-4 rounded tracking-wider hover:border-accent hover:text-accent transition-colors"
          >
            Schedule a Free Consultation
          </Link>
        </div>
        <p className="mt-4 font-mono text-xs text-muted tracking-wide">
          No signup required. No credit card. Takes 30 seconds.
        </p>
      </div>
    </section>
  )
}
