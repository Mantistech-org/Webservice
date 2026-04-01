const steps = [
  {
    number: '01',
    title: 'Tell us about your business',
    description:
      'Fill out a quick intake form about your company, your service area, and your goals. Takes less than five minutes.',
  },
  {
    number: '02',
    title: 'We build your platform',
    description:
      'We set up your complete dashboard, connect your tools, and if you are on the Plus plan, build your custom HVAC website. Everything is live within 48 hours.',
  },
  {
    number: '03',
    title: 'We configure your weather zones',
    description:
      'You tell us your service area. We monitor the forecast for sudden temperature events — hard freezes, unexpected heat waves, rapid drops — the moments that overwhelm systems and flood phones. When those conditions appear in your market, your platform activates.',
  },
  {
    number: '04',
    title: 'Your platform runs',
    description:
      'When weather hits, everything activates automatically. Between events, your reviews build, your SEO grows, and your pipeline fills. You focus on the work.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
            Getting Started
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            Up and running before the next weather event.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="bg-card border border-border rounded p-8">
              <div className="font-mono text-xs text-muted tracking-widest mb-4">
                STEP {step.number}
              </div>
              <h3 className="font-heading text-lg text-primary mb-3">{step.title}</h3>
              <p className="text-sm text-teal leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
