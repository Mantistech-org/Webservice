const steps = [
  {
    number: '01',
    title: 'Submit Your Intake Form',
    description:
      'Tell us about your business, goals, and preferred style. Select add-ons that match your needs and choose a plan.',
  },
  {
    number: '02',
    title: 'We Build Your Website',
    description:
      'Our team crafts a fully custom website tailored to your business. No templates, no cookie-cutter designs.',
  },
  {
    number: '03',
    title: 'Review and Approve',
    description:
      'Preview your site in full before committing. Our team reviews it first, then sends it to you for final approval.',
  },
  {
    number: '04',
    title: 'Launch and Scale',
    description:
      'Once you approve and complete checkout, your site goes live. Add more features any time as your business grows.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
            The Process
          </div>
          <h2 className="font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-tight text-white">
            How It Works
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector line (not on last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%_-_1rem)] w-8 h-px bg-border z-10" />
              )}

              <div className="relative bg-bg border border-border rounded p-8 hover:border-accent/40 transition-colors duration-300 overflow-hidden">
                {/* Ghost number */}
                <span className="absolute top-4 right-4 font-heading text-7xl text-white/5 leading-none select-none">
                  {step.number}
                </span>

                {/* Step number badge */}
                <div className="font-mono text-xs text-accent tracking-widest mb-4 relative z-10">
                  STEP {step.number}
                </div>

                <h3 className="font-heading text-2xl tracking-wide text-white mb-3 relative z-10 group-hover:text-accent transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed relative z-10">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
