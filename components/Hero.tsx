import Link from 'next/link'

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-heading text-[clamp(2.75rem,7vw,5.5rem)] leading-tight text-white mb-6">
          Your Business,
          <br />
          Running at Its Best.
        </h1>

        <p className="text-lg md:text-xl text-teal max-w-2xl mx-auto mb-10 leading-relaxed">
          We build and manage everything your business needs online. You focus on your customers.
          We handle the rest.
        </p>

        <Link
          href="/intake"
          className="inline-block font-mono text-base bg-accent text-bg px-8 py-4 rounded font-medium tracking-wider hover:bg-gray-200 transition-colors duration-200"
        >
          Start Your Project
        </Link>
      </div>
    </section>
  )
}
