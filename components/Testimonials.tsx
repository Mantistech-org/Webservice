const testimonials = [
  {
    quote:
      'We had zero online presence before Mantis Tech. Within a week we had a beautiful website and were showing up in local searches. Our class bookings went up almost immediately.',
    name: 'Rachel Kim',
    business: 'Pilates Studio Owner',
  },
  {
    quote:
      'I was spending hours every week trying to manage our Google reviews and social pages. Now it all runs on its own and I get new leads without doing anything. Honestly wish I had done this sooner.',
    name: 'Marcus Webb',
    business: 'Independent HVAC Contractor',
  },
  {
    quote:
      'The intake process was simple, the site looked exactly how I wanted, and the team was easy to work with. Clients tell me all the time that our website looks more professional than firms ten times our size.',
    name: 'Sandra Torres',
    business: 'Family Law Attorney',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-bg py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 text-center">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
            Client Stories
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            What Our Clients Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-8 flex flex-col"
            >
              <div
                className="font-heading text-4xl leading-none text-accent mb-4 select-none"
                aria-hidden="true"
              >
                &ldquo;
              </div>
              <p className="text-sm text-muted leading-relaxed flex-1">
                {t.quote}
              </p>
              <div className="mt-8 pt-6 border-t border-border">
                <p className="font-heading text-base text-accent leading-tight">
                  {t.name}
                </p>
                <p className="font-mono text-xs text-muted tracking-wider mt-1">
                  {t.business}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
