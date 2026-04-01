const testimonials = [
  {
    quote:
      'Last July we had a four-day heat wave and I barely touched my phone. The system handled the texts, the missed calls, the ads. I ran 11 jobs in three days and had zero no-shows. That has never happened before.',
    name: 'Derek Holloway',
    business: 'Owner, Holloway Heating and Cooling',
  },
  {
    quote:
      'I was skeptical about the weather activation thing. Then a cold snap hit in November and I woke up to eight new service requests that came in overnight. Three of those were from people I had never worked with. The system got them before my competitors did.',
    name: 'Marcus Webb',
    business: 'Independent HVAC Contractor',
  },
  {
    quote:
      'My Google rating went from 4.1 to 4.8 in about two months. I did not ask a single customer for a review myself. The platform handles all of it. Homeowners tell me they found me because I had more reviews than anyone else in the area.',
    name: 'Sandra Torres',
    business: 'Owner, Torres Climate Solutions',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-bg py-24 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 text-center">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
            From the Field
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            Contractors Running on the Platform
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
