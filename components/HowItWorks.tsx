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
    <section id="how-it-works" className="py-24 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
            The Process
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            How It Works
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
